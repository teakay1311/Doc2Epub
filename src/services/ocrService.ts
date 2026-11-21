import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Chapter, ContentElement, NormalizedDocument } from '../types/document';
import { converterAsset, fetchConverterAsset, renderPdfPageToCanvas } from './pdfService';
import { cleanText, stitchBrokenParagraphs, groupIntoChapters, calculateDocumentStats, effectiveBookTitle } from '../utils/normalizer';

export interface OcrProgressUpdate {
  currentPage: number;
  totalPages: number;
  pageProgress: number;
}

export type OcrMode = 'scanned-only' | 'all';
export type OcrLanguage = 'vie+eng' | 'vie' | 'eng';

export function pagesForOcr(doc: NormalizedDocument, mode: OcrMode): number[] {
  return mode === 'all' ? (doc.pdfPages || []).map((_, index) => index + 1) : [...(doc.scanPages || [])];
}

export async function performPdfOcr(
  pdf: PDFDocumentProxy,
  pages: number[],
  language: OcrLanguage,
  progress?: (update: OcrProgressUpdate) => void,
  signal?: AbortSignal
): Promise<Map<number, ContentElement[]>> {
  signal?.throwIfAborted();
  const { createWorker } = await import('tesseract.js');
  signal?.throwIfAborted();
  const result = new Map<number, ContentElement[]>();
  let currentPage = 0;
  const report = (pageProgress: number) => progress?.({ currentPage, totalPages: pages.length, pageProgress });
  report(0);
  const codes = language.split('+');
  const [core, script, ...data] = await Promise.all([
    fetchConverterAsset('ocr/core/tesseract-core-lstm.wasm.js').then(response => response.blob()),
    fetchConverterAsset('ocr/worker.min.js').then(response => response.blob()),
    ...codes.map(code => fetchConverterAsset(`ocr/lang/${code}.traineddata.gz`).then(response => response.blob()))
  ]);
  signal?.throwIfAborted();
  const langPath = converterAsset('ocr/lang');
  const modelUrls = data.map(model => URL.createObjectURL(model));
  const assets = codes.map((code, index) => [`${langPath}/${code}.traineddata.gz`, modelUrls[index]]);
  // WebKit workers cannot load the main window's custom-protocol assets directly.
  // Load the core into the worker script and serve its model requests from local blobs.
  const localFetch = `
    const doc2epubModels = new Map(${JSON.stringify(assets)});
    const doc2epubFetch = self.fetch.bind(self);
    self.fetch = (input, options) => {
      const blob = doc2epubModels.get(String(input));
      if (!blob) return Promise.reject(new Error('Unavailable offline OCR resource'));
      return doc2epubFetch(blob, options);
    };

  `;
  const workerUrl = URL.createObjectURL(new Blob([localFetch, core, '\n;', script], { type: 'text/javascript' }));
  let startupTimer: ReturnType<typeof setTimeout> | undefined;
  let failStartup: ((error: Error) => void) | undefined;
  const startupError = new Promise<never>((_, reject) => {
    failStartup = reject;
    startupTimer = setTimeout(() => reject(new Error('OCR worker did not start')), 30000);
  });
  const startingWorker = createWorker(language, 1, {
    workerPath: workerUrl,
    langPath,
    workerBlobURL: false,
    cacheMethod: 'none',
    errorHandler: error => failStartup?.(new Error(String(error))),
    logger: message => {
      if (currentPage && message.status === 'recognizing text' && !signal?.aborted) {
        report(Math.round(message.progress * 100));
      }
    }
  });
  const worker = await Promise.race([startingWorker, startupError]).catch(error => {
    void startingWorker.then(worker => worker.terminate()).catch(() => {});
    throw error;
  }).finally(() => {
    clearTimeout(startupTimer);
    failStartup = undefined;
    URL.revokeObjectURL(workerUrl);
    modelUrls.forEach(url => URL.revokeObjectURL(url));
  });

  try {
    for (const [index, page] of pages.entries()) {
      signal?.throwIfAborted();
      currentPage = index + 1;
      report(0);
      const canvas = await renderPdfPageToCanvas(pdf, page, 2);
      try {
        signal?.throwIfAborted();
        const { data } = await worker.recognize(canvas);
        signal?.throwIfAborted();
        const paragraphs = stitchBrokenParagraphs((data.text || '').split(/\r?\n/));
        result.set(page, paragraphs.map(cleanText).filter(Boolean).map((text, block) => ({
          id: `ocr-${page}-${block}`,
          type: 'paragraph',
          pageNumber: page,
          text
        })));
        report(100);
      } finally {
        canvas.width = canvas.height = 0;
      }
    }
    signal?.throwIfAborted();
    return result;
  } finally {
    await worker.terminate();
  }
}

export function applyOcrResultsToDocument(
  doc: NormalizedDocument,
  results: ReadonlyMap<number, ContentElement[]>
): NormalizedDocument {
  if (!doc.pdfPages) return doc;
  const emptyPages = new Set(doc.emptyOcrPages);
  const pdfPages = doc.pdfPages.map((original, index) => {
    const page = index + 1;
    const replacement = results.get(page);
    if (!replacement) return original;
    if (!replacement.length) {
      emptyPages.add(page);
      return original;
    }
    emptyPages.delete(page);
    return replacement;
  });
  const chapters = groupIntoChapters(pdfPages.flat(), effectiveBookTitle(doc));
  const oldDefault = doc.chapters[0];
  const keepDefault = doc.chapters.length === 1 && chapters.length === 1 &&
    oldDefault.headingId === undefined && chapters[0].headingId === undefined;
  const replacedPages = new Set([...results].filter(([, elements]) => elements.length).map(([page]) => page));
  const keyFor = (chapter: Chapter) => {
    const anchor = chapter.elements[0];
    if (anchor?.pageNumber === undefined) return;
    if (!replacedPages.has(anchor.pageNumber)) return JSON.stringify(['original', anchor.pageNumber, anchor.id]);
    if (chapter.headingId === anchor.id && anchor.text) {
      return JSON.stringify(['heading', anchor.pageNumber, cleanText(anchor.text)]);
    }
  };
  const groupByKey = (items: Chapter[]) => {
    const group = new Map<string, Chapter[]>();
    for (const chapter of items) {
      const key = keyFor(chapter);
      if (key === undefined) continue;
      const matches = group.get(key) || [];
      matches.push(chapter);
      group.set(key, matches);
    }
    return group;
  };
  const previous = groupByKey(doc.chapters);
  const current = groupByKey(chapters);
  const keptIds = new Set<string>();
  const reservedIds = new Set(doc.chapters.map(chapter => chapter.id));
  let nextId = 1;
  for (const chapter of chapters) {
    const key = keyFor(chapter);
    const matches = key === undefined ? undefined : previous.get(key);
    let old = keepDefault ? oldDefault : undefined;
    if (!old && key !== undefined && matches?.length === 1 && current.get(key)?.length === 1) {
      old = matches[0];
    }
    if (old) {
      chapter.id = old.id;
      keptIds.add(old.id);
      if (old.title !== old.sourceTitle) chapter.title = old.title;
      chapter.includedInToc = old.includedInToc;
    } else {
      while (reservedIds.has(`ch-${nextId}`)) nextId++;
      chapter.id = `ch-${nextId++}`;
      reservedIds.add(chapter.id);
    }
  }
  if (doc.chapters.some(chapter => !keptIds.has(chapter.id) &&
    (!chapter.includedInToc || (chapter.sourceTitle !== undefined && chapter.title !== chapter.sourceTitle)))) {
    throw new Error('OCR_CHAPTER_EDITS_UNMATCHED');
  }
  const scanPages = (doc.scanPages || []).filter(page => !results.get(page)?.length);
  return {
    ...doc,
    pdfPages,
    chapters,
    scanPages,
    scannedPagesCount: scanPages.length,
    emptyOcrPages: [...emptyPages].sort((a, b) => a - b),
    stats: { ...calculateDocumentStats(chapters), pageCount: doc.stats.pageCount }
  };
}
