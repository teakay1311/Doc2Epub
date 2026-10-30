import { createWorker, Worker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { NormalizedDocument, ContentElement } from '../types/document';
import { renderPdfPageToCanvas } from './pdfService';
import { cleanText, groupIntoChapters, calculateDocumentStats } from '../utils/normalizer';

export interface OcrProgressUpdate {
  currentPage: number;
  totalPages: number;
  pageProgress: number; // 0 - 100
  statusText: string;
}

/**
 * Performs OCR on designated PDF pages or all pages using Tesseract.js.
 */
export async function performPdfOcr(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pagesToOcr: number[],
  language: string = 'vie+eng',
  onProgress?: (progress: OcrProgressUpdate) => void,
  abortSignal?: AbortSignal
): Promise<ContentElement[]> {
  const ocrElements: ContentElement[] = [];
  let worker: Worker | null = null;

  try {
    // Initialize worker with designated language
    worker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress({
            currentPage: 0,
            totalPages: pagesToOcr.length,
            pageProgress: Math.round((m.progress || 0) * 100),
            statusText: `Đang nhận diện ký tự: ${Math.round((m.progress || 0) * 100)}%`
          });
        }
      }
    });

    for (let i = 0; i < pagesToOcr.length; i++) {
      if (abortSignal?.aborted) {
        throw new Error('Thao tác OCR đã bị người dùng hủy');
      }

      const pageNum = pagesToOcr[i];
      if (onProgress) {
        onProgress({
          currentPage: i + 1,
          totalPages: pagesToOcr.length,
          pageProgress: 0,
          statusText: `Đang render trang ${pageNum}/${pdfDoc.numPages} để OCR...`
        });
      }

      // Render page to canvas at high resolution (scale 2.0)
      const canvas = await renderPdfPageToCanvas(pdfDoc, pageNum, 2.0);

      if (abortSignal?.aborted) {
        throw new Error('Thao tác OCR đã bị người dùng hủy');
      }

      const { data } = await worker.recognize(canvas);

      // Split OCR text by double newlines into paragraphs
      const rawParas = (data.text || '').split(/\n\s*\n/);
      for (const p of rawParas) {
        const text = cleanText(p);
        if (text) {
          ocrElements.push({
            id: `ocr-p-${pageNum}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'paragraph',
            text,
            pageNumber: pageNum
          });
        }
      }

      // Clean up canvas memory
      canvas.width = 0;
      canvas.height = 0;
    }

    return ocrElements;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Replaces or merges OCR-extracted elements into document chapters.
 */
export function applyOcrResultsToDocument(
  doc: NormalizedDocument,
  ocrElements: ContentElement[]
): NormalizedDocument {
  // Combine existing non-scanned elements or replace with OCR elements
  const allElements = [...ocrElements];
  const chapters = groupIntoChapters(allElements, doc.metadata.title);
  const stats = calculateDocumentStats(chapters);
  stats.pageCount = doc.stats.pageCount;

  return {
    ...doc,
    chapters,
    stats,
    warnings: doc.warnings.filter(w => !w.includes('bản scan')),
    needsOcr: false,
    scannedPagesCount: 0
  };
}
