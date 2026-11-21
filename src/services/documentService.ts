import type { NormalizedDocument } from '../types/document';
import { parsePlainText, parseMarkdown, parseHtmlDocument } from './textService';
import { parsePdfDocument, type PdfSession } from './pdfService';

export const documentExtensions = ['pdf', 'docx', 'txt', 'md', 'markdown', 'html', 'htm'];
export const maxDocumentBytes = 80 * 1024 * 1024;

export interface DocumentParseResult {
  doc: NormalizedDocument;
  pdf?: PdfSession;
}

export async function parseDocumentFile(
  file: File,
  onPdfPage?: (current: number, total: number) => void
): Promise<DocumentParseResult> {
  if (!file.size) throw new Error('EMPTY_FILE');
  if (file.size > maxDocumentBytes) throw new Error('FILE_TOO_LARGE');
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return await parsePdfDocument(file, onPdfPage);
    case 'docx': {
      const { parseDocxDocument } = await import('./docxService');
      return { doc: await parseDocxDocument(file, file.name, file.size) };
    }
    case 'txt':
      return { doc: parsePlainText(await file.text(), file.name, file.size) };
    case 'md':
    case 'markdown':
      return { doc: parseMarkdown(await file.text(), file.name, file.size) };
    case 'html':
    case 'htm':
      return { doc: parseHtmlDocument(await file.text(), file.name, file.size) };
    default:
      throw new Error('UNSUPPORTED_FILE');
  }
}
