import DOMPurify from 'dompurify';
import { isEmbeddedImage, parseMarkdownInline } from '../utils/inlineContent';
import { ContentElement, InlineRun, NormalizedDocument } from '../types/document';
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
  let currentListStart: number | undefined;

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push({
        id: `el-${idCounter++}`,
        type: 'list',
        listType: currentListType,
        listStart: currentListStart,
        items: [...currentListItems]
      });
      currentListItems = [];
      currentListStart = undefined;
    }
  };

  const tableCells = (line: string) => {
    const cells = line.split('|');
    if (line.startsWith('|')) cells.shift();
    if (line.endsWith('|')) cells.pop();
    return cells.map(cleanText);
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
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (currentListItems.length > 0 && currentListType !== 'ordered') {
        flushList();
      }
      currentListType = 'ordered';
      if (currentListItems.length === 0) {
        const start = Number(olMatch[1]);
        if (Number.isSafeInteger(start)) currentListStart = start;
      }
      currentListItems.push(cleanText(olMatch[2]));
      continue;
    }

    // Markdown table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      // Parse markdown table
      const headerCells = tableCells(trimmed);
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && /^\|?[\s:\-|]+\|?$/.test(nextLine)) {
        // Table header detected
        i++; // skip separator
        const rows: string[][] = [];
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
          i++;
          const rowCells = tableCells(lines[i].trim());
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

  if (inCodeBlock && codeBuffer.length) {
    elements.push({ id: `el-${idCounter++}`, type: 'code', text: codeBuffer.join('\n') });
  }
  flushList();
  const plainText = (runs: InlineRun[]) => runs.map(run => run.text).join('');
  for (const element of elements) {
    if (element.text && element.type !== 'code') {
      element.inline = parseMarkdownInline(element.text);
      element.text = plainText(element.inline);
    }
    if (element.items) {
      element.itemInline = element.items.map(parseMarkdownInline);
      element.items = element.itemInline.map(plainText);
    }
    if (element.headers) {
      element.headerInline = element.headers.map(parseMarkdownInline);
      element.headers = element.headerInline.map(plainText);
    }
    if (element.rows) {
      element.rowInline = element.rows.map(row => row.map(parseMarkdownInline));
      element.rows = element.rowInline.map(row => row.map(plainText));
    }
  }

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

function htmlInline(node: Node, bold = false, italic = false): InlineRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    return [{ text: (node.textContent || '').normalize('NFC').replace(/\s+/gu, ' '), bold, italic }];
  }
  if (!(node instanceof Element)) return [];
  if (node.tagName === 'BR') return [{ text: ' ', bold, italic }];
  return Array.from(node.childNodes).flatMap(child =>
    htmlInline(child, bold || ['B', 'STRONG'].includes(node.tagName), italic || ['I', 'EM'].includes(node.tagName))
  );
}

export function parseHtmlDocument(htmlContent: string, filename: string, fileSize: number): NormalizedDocument {
  const sanitized = DOMPurify.sanitize(htmlContent, {
    WHOLE_DOCUMENT: true,
    ALLOWED_TAGS: [
      'html', 'head', 'body', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'table', 'thead',
      'tbody', 'tfoot', 'tr', 'th', 'td', 'blockquote', 'pre', 'code', 'hr',
      'img', 'figure', 'figcaption', 'div', 'section', 'article', 'br'
    ],
    ALLOWED_ATTR: ['src', 'alt'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false
  });
  const dom = new DOMParser().parseFromString(sanitized, 'text/html');
  const title = cleanText(dom.title) || filename.replace(/\.[^/.]+$/, '');
  const elements: ContentElement[] = [];
  const add = (element: Omit<ContentElement, 'id'>) => elements.push({ ...element, id: `el-${elements.length + 1}` });
  const getText = (runs: InlineRun[]) => cleanText(runs.map(run => run.text).join(''));
  const addImage = (element: Element, caption?: string) => {
    const src = element.getAttribute('src') || '';
    if (isEmbeddedImage(src)) add({ type: 'image', src, alt: element.getAttribute('alt') || undefined, caption });
  };

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = cleanText(node.textContent || '');
      if (text) add({ type: 'paragraph', text });
      return;
    }
    if (!(node instanceof Element)) return;

    const tag = node.tagName;
    if (/^H[1-6]$/.test(tag) || ['P', 'BLOCKQUOTE'].includes(tag)) {
      const type = tag === 'P' ? 'paragraph' : tag === 'BLOCKQUOTE' ? 'blockquote' : 'heading';
      const level = type === 'heading' ? Number(tag[1]) as ContentElement['level'] : undefined;
      let inline: InlineRun[] = [];
      const flush = () => {
        const text = getText(inline);
        if (text) add({ type, level, text, inline });
        inline = [];
      };
      function visit(child: Node, bold = false, italic = false) {
        if (child instanceof Element && child.querySelector('img')) {
          for (const next of child.childNodes) {
            visit(next, bold || ['B', 'STRONG'].includes(child.tagName), italic || ['I', 'EM'].includes(child.tagName));
          }
        } else if (child instanceof Element && child.tagName === 'IMG') {
          flush();
          addImage(child);
        } else {
          inline.push(...htmlInline(child, bold, italic));
        }
      }
      for (const child of node.childNodes) visit(child);
      flush();
    } else if (tag === 'OL' || tag === 'UL') {
      const items = Array.from(node.children).filter(child => child.tagName === 'LI');
      const itemInline = items.map(item => htmlInline(item));
      if (itemInline.length) add({ type: 'list', listType: tag === 'OL' ? 'ordered' : 'unordered',
        items: itemInline.map(getText), itemInline });
      for (const image of node.querySelectorAll('img')) addImage(image);
    } else if (tag === 'TABLE') {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.rows);
      const header = rows[0]?.cells.length && Array.from(rows[0].cells).every(cell => cell.tagName === 'TH')
        ? rows.shift() : undefined;
      const headerInline = header && Array.from(header.cells).map(cell => htmlInline(cell));
      const rowInline = rows.map(row => Array.from(row.cells).map(cell => htmlInline(cell)));
      if (headerInline || rowInline.length) add({
        type: 'table', headers: headerInline?.map(getText), headerInline,
        rows: rowInline.map(row => row.map(getText)), rowInline
      });
      for (const image of node.querySelectorAll('img')) addImage(image);
    } else if (tag === 'IMG') {
      addImage(node);
    } else if (tag === 'FIGURE') {
      const caption = cleanText(node.querySelector('figcaption')?.textContent || '');
      for (const image of node.querySelectorAll('img')) addImage(image, caption);
    } else if (tag === 'PRE') {
      add({ type: 'code', text: (node.textContent || '').normalize('NFC') });
    } else if (tag === 'HR') {
      add({ type: 'divider' });
    } else if (['B', 'I', 'STRONG', 'EM', 'SPAN', 'CODE'].includes(tag) && !node.querySelector('img')) {
      const inline = htmlInline(node);
      const text = getText(inline);
      if (text) add({ type: 'paragraph', text, inline });
    } else {
      for (const child of node.childNodes) walk(child);
    }
  }

  for (const child of dom.body.childNodes) walk(child);
  const chapters = groupIntoChapters(elements, title);
  return {
    id: `doc-${Date.now()}`,
    filename, fileSize, fileType: 'html',
    metadata: { title, author: '', language: 'vi' },
    chapters,
    stats: calculateDocumentStats(chapters),
    warnings: []
  };
}
