import { NormalizedDocument, ConversionProgress } from '../types/document';
import { parsePlainText, parseMarkdown, parseHtmlDocument } from './textService';
import { parseDocxDocument } from './docxService';
import { parsePdfDocument, PdfAnalysis } from './pdfService';
import * as pdfjsLib from 'pdfjs-dist';

export interface DocumentParseResult {
  doc: NormalizedDocument;
  pdfProxy?: pdfjsLib.PDFDocumentProxy;
  pdfAnalysis?: PdfAnalysis;
}

/**
 * Parses any supported document file into the unified NormalizedDocument representation.
 */
export async function parseDocumentFile(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<DocumentParseResult> {
  const filename = file.name;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const fileSize = file.size;

  if (fileSize === 0) {
    throw new Error('Tệp tin rỗng (0 bytes). Vui lòng chọn tệp tin có nội dung.');
  }

  // Max recommended browser file size: 80 MB
  if (fileSize > 80 * 1024 * 1024) {
    throw new Error('Dung lượng tệp vượt quá giới hạn khuyến nghị (80 MB) của trình duyệt.');
  }

  onProgress?.({
    stage: 'parsing',
    currentStep: 1,
    totalSteps: 3,
    message: 'Đang đọc và phân tích cấu trúc tệp...',
    percent: 30
  });

  if (ext === 'pdf') {
    onProgress?.({
      stage: 'extracting',
      currentStep: 2,
      totalSteps: 3,
      message: 'Đang trích xuất văn bản từ các trang PDF...',
      percent: 60
    });

    const { doc, analysis, pdfProxy } = await parsePdfDocument(file, filename, fileSize, (cur, total) => {
      onProgress?.({
        stage: 'extracting',
        currentStep: 2,
        totalSteps: 3,
        message: `Đang đọc trang ${cur}/${total}...`,
        percent: Math.round(30 + (cur / total) * 50)
      });
    });

    onProgress?.({
      stage: 'normalizing',
      currentStep: 3,
      totalSteps: 3,
      message: 'Đang chuẩn hóa mục lục và nội dung...',
      percent: 95
    });

    return { doc, pdfProxy, pdfAnalysis: analysis };
  }

  if (ext === 'docx') {
    onProgress?.({
      stage: 'extracting',
      currentStep: 2,
      totalSteps: 3,
      message: 'Đang trích xuất văn bản và hình ảnh Word (.docx)...',
      percent: 60
    });

    const doc = await parseDocxDocument(file, filename, fileSize);

    onProgress?.({
      stage: 'normalizing',
      currentStep: 3,
      totalSteps: 3,
      message: 'Đang chuẩn hóa mục lục và nội dung...',
      percent: 95
    });

    return { doc };
  }

  if (ext === 'txt') {
    const text = await file.text();
    const doc = parsePlainText(text, filename, fileSize);
    return { doc };
  }

  if (ext === 'md' || ext === 'markdown') {
    const text = await file.text();
    const doc = parseMarkdown(text, filename, fileSize);
    return { doc };
  }

  if (ext === 'html' || ext === 'htm') {
    const text = await file.text();
    const doc = parseHtmlDocument(text, filename, fileSize);
    return { doc };
  }

  throw new Error(
    `Định dạng .${ext} chưa được hỗ trợ. Vui lòng sử dụng tệp PDF, Word (.docx), TXT, Markdown (.md) hoặc HTML.`
  );
}
