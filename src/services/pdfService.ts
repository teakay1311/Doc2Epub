import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ContentElement, NormalizedDocument } from '../types/document';
import { cleanText, groupIntoChapters, stitchBrokenParagraphs, calculateDocumentStats } from '../utils/normalizer';

export interface PdfSession {
  proxy: PDFDocumentProxy;
  dispose: () => Promise<void>;
}

export function converterAsset(path: string): string {
  return new URL(`converter-assets/${path}`, document.baseURI).href;
}

export async function fetchConverterAsset(path: string): Promise<Response> {
  const response = await fetch(converterAsset(path));
  if (!response.ok) throw new Error(`Missing converter resource: ${path}`);
  return response;
}

async function startPdfWorker(): Promise<Worker> {
  // Load the module in the window so WebKit never has to fetch a tauri: URL from inside a worker.
  const source = await (await fetchConverterAsset('pdf/pdf.worker.min.mjs')).text();
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  const worker = new Worker(url, { type: 'module' });
  const listeners = new AbortController();
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('PDF worker did not start')), 10000);
      listeners.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });
      worker.addEventListener('message', event => {
        if (event.data?.action === 'ready') resolve();
      }, { signal: listeners.signal });
      worker.addEventListener('error', event => reject(new Error(event.message || 'PDF worker failed')), {
        signal: listeners.signal, once: true
      });
    });
    return worker;
  } catch (error) {
    worker.terminate();
    throw error;
  } finally {
    listeners.abort();
    URL.revokeObjectURL(url);
  }
}

export async function renderPdfPageToCanvas(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNumber);
  try {
    const unscaled = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(scale, 4096 / Math.max(unscaled.width, unscaled.height)) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    try {
      await page.render({ canvas, viewport, intent: 'print', background: '#ffffff' }).promise;
      return canvas;
    } catch (error) {
      canvas.width = canvas.height = 0;
      throw error;
    }
  } finally {
    page.cleanup();
  }
}

export async function parsePdfDocument(file: File, onProgress?: (current: number, total: number) => void) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(await file.arrayBuffer());
  const port = await startPdfWorker();
  const worker = pdfjs.PDFWorker.create({ port });
  const task = pdfjs.getDocument({
    data,
    worker,
    cMapUrl: converterAsset('pdf/cmaps/'),
    cMapPacked: true,
    standardFontDataUrl: converterAsset('pdf/standard_fonts/'),
    wasmUrl: converterAsset('pdf/wasm/'),
    iccUrl: converterAsset('pdf/iccs/'),
    useWorkerFetch: false
  });

  const dispose = async () => {
    try {
      await task.destroy();
    } finally {
      worker.destroy();
      port.terminate();
    }
  };
  try {
    const pdfProxy = await task.promise;
    const pdfPages: ContentElement[][] = [];
    const scanPages: number[] = [];
    for (let number = 1; number <= pdfProxy.numPages; number++) {
      onProgress?.(number, pdfProxy.numPages);
      const page = await pdfProxy.getPage(number);
      try {
        const { items } = await page.getTextContent();
        const positioned = items.filter(item => 'str' in item && item.str.trim()).map(item => {
          if (!('str' in item)) throw new Error('Invalid PDF text item');
          return { text: item.str, x: item.transform[4], y: item.transform[5] };
        });
        if (positioned.reduce((total, item) => total + item.text.trim().length, 0) < 25) {
          scanPages.push(number);
        }
        positioned.sort((left, right) => right.y - left.y);
        const lines: Array<{ y: number; items: typeof positioned }> = [];
        for (const item of positioned) {
          const last = lines.at(-1);
          if (last && last.y - item.y <= 4) last.items.push(item);
          else lines.push({ y: item.y, items: [item] });
        }
        const paragraphs = stitchBrokenParagraphs(lines.map(line =>
          line.items.sort((left, right) => left.x - right.x).map(item => item.text).join(' ')
        ));
        pdfPages.push(paragraphs.map(cleanText).filter(Boolean).map((text, index) => ({
          id: `pdf-${number}-${index}`,
          type: 'paragraph',
          text,
          pageNumber: number
        })));
      } finally {
        page.cleanup();
      }
    }

    const title = file.name.replace(/\.[^/.]+$/, '');
    const chapters = groupIntoChapters(pdfPages.flat(), title);
    const doc: NormalizedDocument = {
      id: crypto.randomUUID(),
      filename: file.name,
      fileSize: file.size,
      fileType: 'pdf',
      metadata: { title, author: '', language: 'vi' },
      chapters,
      stats: { ...calculateDocumentStats(chapters), pageCount: pdfProxy.numPages },
      warnings: [],
      scannedPagesCount: scanPages.length,
      pdfPages,
      scanPages
    };
    return { doc, pdf: { proxy: pdfProxy, dispose } };
  } catch (error) {
    await dispose().catch(() => {});
    throw error;
  }
}
