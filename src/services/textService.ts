import DOMPurify from 'dompurify';
import { ContentElement, Chapter, NormalizedDocument } from '../types/document';
import { cleanText, groupIntoChapters, stitchBrokenParagraphs, calculateDocumentStats } from '../utils/normalizer';

/**
 * Parses plain text (.txt) file into normalized document.
 */
export function parsePlainText(content: string, filename: string, fileSize: number): NormalizedDocument {
  // Remove UTF-8 BOM if present
  let cleanContent = content;
  if (cleanContent.charCodeAt(0) === 0xFEFF) {
    cleanContent = cleanContent.slice(1);
  }

  const rawLines = cleanContent.split(/\r?\n/);
  const stitchedParagraphs = stitchBrokenParagraphs(rawLines);

  const elements: ContentElement[] = [];
  let idCounter = 1;

  for (const para of stitchedParagraphs) {
    const text = cleanText(para);
    if (!text) continue;

    // Check for markdown-like or bullet prefixes
    if (/^[•\-*]\s+(.*)$/.test(text)) {
      elements.push({
        id: `el-${idCounter++}`,
        type: 'list',
        listType: 'unordered',
        items: [text.replace(/^[•\-*]\s+/, '')]
      });
    } else {
      elements.push({
        id: `el-${idCounter++}`,
        type: 'paragraph',
        text
      });
    }
  }

  const baseTitle = filename.replace(/\.[^/.]+$/, '');
  const chapters = groupIntoChapters(elements, baseTitle);
  const stats = calculateDocumentStats(chapters);

  return {
    id: `doc-${Date.now()}`,
    filename,
    fileSize,
    fileType: 'txt',
    metadata: {
      title: baseTitle,
      author: '',
      language: 'vi'
    },
    chapters,
    stats,
    warnings: []
  };
}

/**
 * Parses Markdown (.md) file into normalized elements and chapters.
 */
export function parseMarkdown(content: string, filename: string, fileSize: number): NormalizedDocument {
  const lines = content.split(/\r?\n/);
  const elements: ContentElement[] = [];
  let idCounter = 1;

  let currentListItems: string[] = [];
  let currentListType: 'ordered' | 'unordered' = 'unordered';

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push({
        id: `el-${idCounter++}`,
        type: 'list',
        listType: currentListType,
        items: [...currentListItems]
      });
      currentListItems = [];
    }
  };

  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      flushList();
      if (inCodeBlock) {
        elements.push({
          id: `el-${idCounter++}`,
          type: 'code',
          text: codeBuffer.join('\n')
        });
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal rule
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      flushList();
      elements.push({ id: `el-${idCounter++}`, type: 'divider' });
      continue;
    }

    // Markdown Heading: # H1, ## H2, etc.
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = Math.min(headingMatch[1].length, 6) as 1 | 2 | 3 | 4 | 5 | 6;
      elements.push({
        id: `el-${idCounter++}`,
        type: 'heading',
        level,
        text: cleanText(headingMatch[2])
      });
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith('>')) {
      flushList();
      elements.push({
        id: `el-${idCounter++}`,
        type: 'blockquote',
        text: cleanText(trimmed.replace(/^>\s*/, ''))
      });
      continue;
    }

    // Unordered list item: - or *
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (currentListItems.length > 0 && currentListType !== 'unordered') {
        flushList();
      }
      currentListType = 'unordered';
      currentListItems.push(cleanText(ulMatch[1]));
      continue;
    }

    // Ordered list item: 1. text
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (currentListItems.length > 0 && currentListType !== 'ordered') {
        flushList();
      }
      currentListType = 'ordered';
      currentListItems.push(cleanText(olMatch[1]));
      continue;
    }

    // Markdown table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      // Parse markdown table
      const headerCells = trimmed.split('|').slice(1, -1).map(c => cleanText(c));
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && /^\|?[\s:\-|]+\|?$/.test(nextLine)) {
        // Table header detected
        i++; // skip separator
        const rows: string[][] = [];
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
          i++;
          const rowCells = lines[i].trim().split('|').slice(1, -1).map(c => cleanText(c));
          rows.push(rowCells);
        }
        elements.push({
          id: `el-${idCounter++}`,
          type: 'table',
          headers: headerCells,
          rows
        });
        continue;
      }
    }

    // Regular paragraph
    flushList();
    elements.push({
      id: `el-${idCounter++}`,
      type: 'paragraph',
      text: cleanText(trimmed)
    });
  }

  flushList();

  const baseTitle = filename.replace(/\.[^/.]+$/, '');
  const chapters = groupIntoChapters(elements, baseTitle);
  const stats = calculateDocumentStats(chapters);

  return {
    id: `doc-${Date.now()}`,
    filename,
    fileSize,
    fileType: 'md',
    metadata: {
      title: baseTitle,
      author: '',
      language: 'vi'
    },
    chapters,
    stats,
    warnings: []
  };
}

/**
 * Parses raw HTML string, sanitizes it safely with DOMPurify, and extracts structure.
 */
export function parseHtmlDocument(htmlContent: string, filename: string, fileSize: number): NormalizedDocument {
  // Sanitize HTML strictly
  const sanitized = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'b', 'i', 'strong', 'em',
      'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote',
      'pre', 'code', 'hr', 'img', 'figure', 'figcaption', 'div', 'section', 'article'
    ],
    ALLOWED_ATTR: ['src', 'alt', 'title', 'class', 'colspan', 'rowspan']
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, 'text/html');

  // Extract meta title if available
  const docTitle = doc.querySelector('title')?.textContent?.trim() || filename.replace(/\.[^/.]+$/, '');
  const elements: ContentElement[] = [];
  let idCounter = 1;

  const walker = doc.createTreeWalker(doc.body || doc.documentElement, NodeFilter.SHOW_ELEMENT);
  let currentNode = walker.currentNode as HTMLElement;

  while (currentNode) {
    const tagName = currentNode.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
      const text = cleanText(currentNode.textContent || '');
      if (text) {
        elements.push({ id: `el-${idCounter++}`, type: 'heading', level, text });
      }
    } else if (tagName === 'p') {
      const text = cleanText(currentNode.textContent || '');
      if (text) {
        elements.push({ id: `el-${idCounter++}`, type: 'paragraph', text });
      }
    } else if (tagName === 'blockquote') {
      const text = cleanText(currentNode.textContent || '');
      if (text) {
        elements.push({ id: `el-${idCounter++}`, type: 'blockquote', text });
      }
    } else if (tagName === 'ul' || tagName === 'ol') {
      const items = Array.from(currentNode.querySelectorAll(':scope > li'))
        .map(li => cleanText(li.textContent || ''))
        .filter(Boolean);
      if (items.length > 0) {
        elements.push({
          id: `el-${idCounter++}`,
          type: 'list',
          listType: tagName === 'ol' ? 'ordered' : 'unordered',
          items
        });
      }
    } else if (tagName === 'table') {
      const headers = Array.from(currentNode.querySelectorAll('th')).map(th => cleanText(th.textContent || ''));
      const rows = Array.from(currentNode.querySelectorAll('tbody tr, tr:not(:has(th))')).map(tr =>
        Array.from(tr.querySelectorAll('td')).map(td => cleanText(td.textContent || ''))
      ).filter(r => r.length > 0);

      if (headers.length > 0 || rows.length > 0) {
        elements.push({
          id: `el-${idCounter++}`,
          type: 'table',
          headers: headers.length > 0 ? headers : undefined,
          rows
        });
      }
    } else if (tagName === 'img') {
      const src = currentNode.getAttribute('src');
      if (src && (src.startsWith('data:') || src.startsWith('blob:'))) {
        elements.push({
          id: `el-${idCounter++}`,
          type: 'image',
          src,
          alt: currentNode.getAttribute('alt') || 'Hình ảnh'
        });
      }
    } else if (tagName === 'hr') {
      elements.push({ id: `el-${idCounter++}`, type: 'divider' });
    }

    const nextNode = walker.nextNode() as HTMLElement;
    if (!nextNode) break;
    currentNode = nextNode;
  }

  const chapters = groupIntoChapters(elements, docTitle);
  const stats = calculateDocumentStats(chapters);

  return {
    id: `doc-${Date.now()}`,
    filename,
    fileSize,
    fileType: 'html',
    metadata: {
      title: docTitle,
      author: '',
      language: 'vi'
    },
    chapters,
    stats,
    warnings: []
  };
}
