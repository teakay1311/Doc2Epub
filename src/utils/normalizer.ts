import { ContentElement, Chapter, DocumentStats, NormalizedDocument } from '../types/document';

/**
 * Normalizes unicode text to NFC form, preserving Vietnamese accents & characters.
 */
export function normalizeUnicode(text: string): string {
  if (!text) return '';
  return text.normalize('NFC');
}

/**
 * Escapes characters for strict XML/XHTML compliance.
 */
const invalidXmlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

export function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(invalidXmlCharacters, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function trimTitle(title: string): string {
  return title.replace(invalidXmlCharacters, '').trim();
}

export function effectiveBookTitle(doc: Pick<NormalizedDocument, 'metadata' | 'filename'>): string {
  return trimTitle(doc.metadata.title) || effectiveChapterTitle(doc.filename.replace(/\.[^/.]+$/, ''));
}

export function effectiveChapterTitle(title: string, fallback = 'Doc2EPUB'): string {
  return trimTitle(title) || fallback;
}

/**
 * Clean up extra spaces, non-breaking spaces and fix broken paragraph lines.
 */
export function cleanText(text: string): string {
  if (!text) return '';
  return normalizeUnicode(text)
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Regex patterns to detect chapters in Vietnamese and English.
 */
const CHAPTER_REGEX_PATTERNS = [
  // Chapter 1 / Chương 1 / Hồi 1 / Phần 1 / Bài 1 / Mục 1
  /^(?:chương|hồi|phần|bài|mục|tiết|tập|chapter|part|section|book|act)\s+([0-9ivxlcdm]+|[a-z0-9]+)[\s:.\-–—]*(.*)$/i,
  // Roman numerals alone on a line: I. Giới thiệu, II. Tổng quan
  /^([ivxlcdm]{1,6})\.\s+(.+)$/i,
  // "Chương thứ nhất", "Chương một"
  /^(?:chương|phần)\s+(thứ\s+[a-z0-9]+|nhất|nhì|ba|tư|bốn|năm|sáu|bảy|tám|chín|mười)[\s:.\-–—]*(.*)$/i,
  // Lời mở đầu, Mở đầu, Kết luận, Lời cảm ơn, Lời bạt, Lời tựa, Phụ lục, Epilogue, Prologue, Preface
  /^(?:lời\s+mở\s+đầu|mở\s+đầu|lời\s+nói\s+đầu|lời\s+tựa|lời\s+bạt|lời\s+cảm\s+ơn|kết\s+luận|phụ\s+lục|giới\s+thiệu|prologue|epilogue|preface|foreword|introduction|conclusion|appendix)$/i
];

/**
 * Checks if a string looks like a chapter header.
 */
export function isChapterHeader(text: string): { isChapter: boolean; title: string } {
  const cleaned = cleanText(text);
  if (!cleaned || cleaned.length > 120) {
    return { isChapter: false, title: '' };
  }

  for (const pattern of CHAPTER_REGEX_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      return { isChapter: true, title: cleaned };
    }
  }

  return { isChapter: false, title: '' };
}

/**
 * Groups raw content elements into chapters based on headings and detected chapter patterns.
 */
export function groupIntoChapters(
  elements: ContentElement[],
  defaultBookTitle: string = 'Nội dung chính'
): Chapter[] {
  const defaultTitle = effectiveChapterTitle(defaultBookTitle);
  if (elements.length === 0) {
    return [
      {
        id: 'ch-default',
        title: defaultTitle,
        sourceTitle: defaultTitle,
        order: 1,
        elements: [],
        includedInToc: true
      }
    ];
  }

  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  let chapterIndex = 1;

  for (let el of elements) {
    let startNewChapter = false;
    let newChapterTitle = '';

    // Check if element is a top-level heading (h1 or h2)
    if (el.type === 'heading' && (el.level === 1 || el.level === 2) && el.text) {
      startNewChapter = true;
      newChapterTitle = cleanText(el.text);
    } else if (el.type === 'paragraph' && el.text) {
      const check = isChapterHeader(el.text);
      if (check.isChapter) {
        startNewChapter = true;
        newChapterTitle = check.title;
        // Upgrade this paragraph to a heading
        el = { ...el, type: 'heading', level: 2 };
      }
    }

    if (startNewChapter && newChapterTitle) {
      if (currentChapter && currentChapter.elements.length > 0) {
        chapters.push(currentChapter);
      }
      currentChapter = {
        id: `ch-${chapterIndex++}`,
        title: newChapterTitle,
        headingId: el.id,
        order: chapterIndex,
        elements: [el],
        includedInToc: true
      };
    } else {
      if (!currentChapter) {
        // Pre-chapter text (introduction or prologue)
        currentChapter = {
          id: `ch-${chapterIndex++}`,
          title: 'Mở đầu',
          order: 1,
          elements: [el],
          includedInToc: true
        };
      } else {
        currentChapter.elements.push(el);
      }
    }
  }

  if (currentChapter && currentChapter.elements.length > 0) {
    chapters.push(currentChapter);
  }

  if (chapters.length === 1 && chapters[0].headingId === undefined) {
    chapters[0].title = defaultTitle;
  }

  // Re-index orders
  chapters.forEach((ch, idx) => {
    ch.order = idx + 1;
    ch.sourceTitle = ch.title;
  });

  return chapters;
}

/**
 * Calculates word, character, and image statistics.
 */
export function calculateDocumentStats(chapters: Chapter[]): DocumentStats {
  let wordCount = 0;
  let charCount = 0;
  let paragraphCount = 0;
  let imageCount = 0;

  for (const chapter of chapters) {
    for (const el of chapter.elements) {
      if (el.type === 'image') {
        imageCount++;
      } else if (el.type === 'paragraph' || el.type === 'heading' || el.type === 'blockquote') {
        paragraphCount++;
        const text = el.text || '';
        charCount += text.length;
        const words = text.trim().split(/\s+/).filter(Boolean);
        wordCount += words.length;
      } else if (el.type === 'list' && el.items) {
        paragraphCount += el.items.length;
        for (const item of el.items) {
          charCount += item.length;
          const words = item.trim().split(/\s+/).filter(Boolean);
          wordCount += words.length;
        }
      }
    }
  }

  return { wordCount, charCount, paragraphCount, imageCount };
}

/**
 * Smart paragraph line-break stitcher for extracted PDF/TXT text.
 * When lines in a paragraph are broken without ending punctuation (. ? ! : " »), stitch them.
 */
export function stitchBrokenParagraphs(lines: string[]): string[] {
  const paragraphs: string[] = [];
  let currentBuffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentBuffer) {
        paragraphs.push(currentBuffer);
        currentBuffer = '';
      }
      continue;
    }

    // Standalone chapter header or markdown heading must not be stitched
    if (isChapterHeader(line).isChapter || /^#{1,6}\s+/.test(line)) {
      if (currentBuffer) {
        paragraphs.push(currentBuffer);
        currentBuffer = '';
      }
      paragraphs.push(line);
      continue;
    }

    if (!currentBuffer) {
      currentBuffer = line;
    } else {
      // Check if previous buffer was a header
      if (isChapterHeader(currentBuffer).isChapter) {
        paragraphs.push(currentBuffer);
        currentBuffer = line;
        continue;
      }

      // Check if previous buffer ended with punctuation
      const lastChar = currentBuffer.slice(-1);
      const isEndPunctuation = /[.?!:;"'»…”]/.test(lastChar);
      const startsWithCapital = /^[A-ZÀ-Ỹ0-9]/.test(line);

      // Check if line looks like a header or list bullet
      const isBulletOrHeader = /^([•\-*–—]|\d+\.|\([a-z0-9]+\))/i.test(line);

      if (isBulletOrHeader) {
        paragraphs.push(currentBuffer);
        currentBuffer = line;
      } else if (!isEndPunctuation) {
        // Stitch with space
        currentBuffer += ' ' + line;
      } else if (isEndPunctuation && startsWithCapital && currentBuffer.length > 80) {
        paragraphs.push(currentBuffer);
        currentBuffer = line;
      } else {
        currentBuffer += ' ' + line;
      }
    }
  }

  if (currentBuffer) {
    paragraphs.push(currentBuffer);
  }

  return paragraphs;
}
