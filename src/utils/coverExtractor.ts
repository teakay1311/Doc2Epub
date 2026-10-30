import * as pdfjsLib from 'pdfjs-dist';
import { NormalizedDocument, CoverCandidate } from '../types/document';
import { renderPdfPageToCanvas } from '../services/pdfService';

/**
 * Generates an automatic minimalist book cover using HTML5 Canvas (3:4 ratio, 600x800).
 */
export function generateStyledCoverCandidate(
  title: string,
  author: string,
  lang: string = 'vi'
): CoverCandidate {
  if (typeof document === 'undefined') {
    return {
      id: 'gen-cover-1',
      label: lang === 'vi' ? 'Bìa thiết kế tự động' : 'Auto-styled Cover',
      dataUrl: '',
      source: 'generated'
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      id: 'gen-cover-1',
      label: lang === 'vi' ? 'Bìa thiết kế tự động' : 'Auto-styled Cover',
      dataUrl: '',
      source: 'generated'
    };
  }

  // Elegant dark slate gradient background
  const grad = ctx.createLinearGradient(0, 0, 600, 800);
  grad.addColorStop(0, '#1e1b4b'); // deep indigo
  grad.addColorStop(0.5, '#0f172a'); // slate 900
  grad.addColorStop(1, '#020617'); // slate 950
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 800);

  // Subtle interior gold/indigo border
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, 528, 728);

  // Geometric accent top icon
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(300, 140, 24, 0, Math.PI * 2);
  ctx.fill();

  // Book Category / Top Tag
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText(lang === 'vi' ? 'SÁCH ĐIỆN TỬ EPUB' : 'EPUB EDITION', 300, 200);

  // Title with auto word wrapping
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px serif';
  ctx.letterSpacing = '0px';

  const cleanTitle = title || (lang === 'vi' ? 'Tác Phẩm Mới' : 'Untitled Book');
  const words = cleanTitle.split(/\s+/);
  let line = '';
  let y = 340;
  const maxWidth = 460;
  const lineHeight = 46;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), 300, y);
      line = words[n] + ' ';
      y += lineHeight;
      if (y > 480) {
        line = '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), 300, y);

  // Decorative divider
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(250, y + 40);
  ctx.lineTo(350, y + 40);
  ctx.stroke();

  // Author
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 20px sans-serif';
  const cleanAuthor = author || (lang === 'vi' ? 'Tác giả' : 'Author');
  ctx.fillText(cleanAuthor, 300, y + 90);

  // Bottom Publisher Mark
  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.fillText('DOC2EPUB DIGITAL PRESS', 300, 720);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  canvas.width = 0;
  canvas.height = 0;

  return {
    id: 'gen-cover-1',
    label: lang === 'vi' ? 'Bìa thiết kế tự động' : 'Auto-styled Cover',
    dataUrl,
    source: 'generated'
  };
}

/**
 * Extracts potential cover images from the first few pages of a PDF.
 */
export async function extractPdfCoverCandidates(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  lang: string = 'vi'
): Promise<CoverCandidate[]> {
  const candidates: CoverCandidate[] = [];
  const maxPages = Math.min(3, pdfDoc.numPages);

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    try {
      const canvas = await renderPdfPageToCanvas(pdfDoc, pageNum, 1.2);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      candidates.push({
        id: `pdf-page-${pageNum}`,
        label:
          pageNum === 1
            ? lang === 'vi'
              ? 'Trang bìa 1 (PDF)'
              : 'Page 1 Cover (PDF)'
            : lang === 'vi'
            ? `Trang ${pageNum} (PDF)`
            : `Page ${pageNum} (PDF)`,
        dataUrl,
        source: 'page',
        pageNumber: pageNum
      });
      canvas.width = 0;
      canvas.height = 0;
    } catch (err) {
      console.warn(`Failed to render PDF page ${pageNum} for cover preview:`, err);
    }
  }

  return candidates;
}

/**
 * Extracts embedded images from the first chapters of a document.
 */
export function extractEmbeddedCoverCandidates(
  doc: NormalizedDocument,
  lang: string = 'vi'
): CoverCandidate[] {
  const candidates: CoverCandidate[] = [];
  let counter = 1;

  for (const ch of doc.chapters) {
    for (const el of ch.elements) {
      if (el.type === 'image' && el.src && el.src.startsWith('data:')) {
        candidates.push({
          id: `embedded-img-${counter}`,
          label:
            lang === 'vi'
              ? `Ảnh tài liệu ${counter}`
              : `Extracted Image ${counter}`,
          dataUrl: el.src,
          source: 'embedded'
        });
        counter++;
        if (candidates.length >= 3) return candidates;
      }
    }
  }

  return candidates;
}

/**
 * Aggregates all potential cover candidates for an uploaded document.
 */
export async function getDocumentCoverSuggestions(
  doc: NormalizedDocument,
  pdfProxy?: pdfjsLib.PDFDocumentProxy | null,
  lang: string = 'vi'
): Promise<CoverCandidate[]> {
  const candidates: CoverCandidate[] = [];

  // 1. If PDF, extract first 1-3 pages as cover candidates
  if (pdfProxy && doc.fileType === 'pdf') {
    const pdfCandidates = await extractPdfCoverCandidates(pdfProxy, lang);
    candidates.push(...pdfCandidates);
  }

  // 2. Extract embedded images from early content (e.g. DOCX, HTML, MD)
  const embedded = extractEmbeddedCoverCandidates(doc, lang);
  candidates.push(...embedded);

  // 3. Always include an auto-styled book cover candidate
  const styledCover = generateStyledCoverCandidate(
    doc.metadata.title,
    doc.metadata.author,
    lang
  );
  candidates.push(styledCover);

  return candidates;
}
