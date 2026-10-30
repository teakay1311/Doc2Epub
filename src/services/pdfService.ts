import * as pdfjsLib from 'pdfjs-dist';
import { NormalizedDocument, ContentElement, Chapter } from '../types/document';
import { cleanText, groupIntoChapters, stitchBrokenParagraphs, calculateDocumentStats } from '../utils/normalizer';

// Configure PDF.js worker in Vite/browser environment (local bundled asset first, fallback to CDN)
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
}

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

export interface PdfAnalysis {
  totalPages: number;
  scannedPages: number[];
  isMostlyScanned: boolean;
}

/**
 * Renders a PDF page to a canvas element at a target scale (DPI) for OCR or preview.
 */
export async function renderPdfPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 2.0
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context is not available');
  }

  // White background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport,
    canvas
  } as any).promise;

  return canvas;
}

/**
 * Analyzes and extracts text from a PDF file using PDF.js.
 */
export async function parsePdfDocument(
  file: File | ArrayBuffer,
  filename: string,
  fileSize: number,
  onProgress?: (current: number, total: number) => void
): Promise<{ doc: NormalizedDocument; analysis: PdfAnalysis; pdfProxy: pdfjsLib.PDFDocumentProxy }> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  const scannedPages: number[] = [];
  const allElements: ContentElement[] = [];
  let elementId = 1;

  // Track font sizes to determine body vs heading
  const fontSizes: number[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, totalPages);
    }

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<any>;

    let pageCharCount = 0;
    const pageTextItems: PdfTextItem[] = [];

    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;
      const str = item.str;
      pageCharCount += str.length;

      // Extract transform geometry: [scaleX, skewY, skewX, scaleY, transX, transY]
      const tx = item.transform;
      const fontSize = Math.abs(tx[0] || tx[3] || 12);
      fontSizes.push(fontSize);

      pageTextItems.push({
        str,
        x: tx[4] || 0,
        y: tx[5] || 0,
        width: item.width || 0,
        height: item.height || fontSize,
        fontSize,
        fontName: item.fontName || ''
      });
    }

    // If page has fewer than 25 characters, it's likely scanned or an image page
    if (pageCharCount < 25) {
      scannedPages.push(pageNum);
      continue;
    }

    // Sort items by reading order: Top-to-bottom (Y descending), Left-to-right (X ascending)
    pageTextItems.sort((a, b) => {
      // If Y difference is small (<= 4), treat as same line
      if (Math.abs(b.y - a.y) <= 4) {
        return a.x - b.x;
      }
      return b.y - a.y;
    });

    // Group items into lines
    const lines: Array<{ text: string; fontSize: number }> = [];
    let currentLineText = '';
    let currentLineFontSize = 12;
    let currentLineY: number | null = null;

    for (const item of pageTextItems) {
      if (currentLineY === null || Math.abs(currentLineY - item.y) > 4) {
        if (currentLineText.trim()) {
          lines.push({ text: currentLineText.trim(), fontSize: currentLineFontSize });
        }
        currentLineText = item.str;
        currentLineFontSize = item.fontSize;
        currentLineY = item.y;
      } else {
        // Space separation if gap exists
        currentLineText += ' ' + item.str;
        if (item.fontSize > currentLineFontSize) {
          currentLineFontSize = item.fontSize;
        }
      }
    }
    if (currentLineText.trim()) {
      lines.push({ text: currentLineText.trim(), fontSize: currentLineFontSize });
    }

    // Median/average line processing
    const rawLineTexts = lines.map(l => l.text);
    const stitched = stitchBrokenParagraphs(rawLineTexts);

    for (const para of stitched) {
      const cleaned = cleanText(para);
      if (!cleaned) continue;

      // Check if line is a header by font size or title
      // We'll mark as heading if length <= 80 and starts with chapter pattern
      allElements.push({
        id: `pdf-el-${elementId++}`,
        type: 'paragraph',
        text: cleaned,
        pageNumber: pageNum
      });
    }
  }

  // Determine median font size
  fontSizes.sort((a, b) => a - b);
  const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] || 12;

  const baseTitle = filename.replace(/\.[^/.]+$/, '');
  const chapters = groupIntoChapters(allElements, baseTitle);
  const stats = calculateDocumentStats(chapters);
  stats.pageCount = totalPages;

  const isMostlyScanned = scannedPages.length >= Math.ceil(totalPages * 0.4);
  const warnings: string[] = [];
  if (scannedPages.length > 0) {
    warnings.push(
      `Phát hiện ${scannedPages.length}/${totalPages} trang có thể là bản scan dạng hình ảnh (trang ${scannedPages.slice(0, 5).join(', ')}${scannedPages.length > 5 ? '...' : ''}).`
    );
  }

  const doc: NormalizedDocument = {
    id: `doc-${Date.now()}`,
    filename,
    fileSize,
    fileType: 'pdf',
    metadata: {
      title: baseTitle,
      author: '',
      language: 'vi'
    },
    chapters,
    stats,
    warnings,
    scannedPagesCount: scannedPages.length,
    needsOcr: scannedPages.length > 0
  };

  const analysis: PdfAnalysis = {
    totalPages,
    scannedPages,
    isMostlyScanned
  };

  return { doc, analysis, pdfProxy: pdfDoc };
}
