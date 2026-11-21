import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOcrResultsToDocument, pagesForOcr } from './ocrService';
import { calculateDocumentStats, groupIntoChapters } from '../utils/normalizer';
import type { ContentElement, NormalizedDocument } from '../types/document';

const paragraph = (pageNumber: number, text: string, id: string): ContentElement =>
  ({ pageNumber, text, id, type: 'paragraph' });

function mixedPdf(): NormalizedDocument {
  const pdfPages = [
    [paragraph(1, 'Chapter 1: Original', 'title'), paragraph(1, 'Original PDF text.', 'first')],
    [],
    [paragraph(3, 'Footer', 'third')],
    [paragraph(4, 'Final page.', 'fourth')]
  ];
  const chapters = groupIntoChapters(pdfPages.flat(), 'Book');
  chapters[0].title = 'Edited title';
  chapters[0].includedInToc = false;
  return {
    id: 'sample', filename: 'mixed.pdf', fileSize: 500, fileType: 'pdf', metadata: { title: 'Book', author: '', language: 'en' },
    chapters, pdfPages, scanPages: [2, 3], scannedPagesCount: 2, warnings: [],
    stats: { ...calculateDocumentStats(chapters), pageCount: 4 }
  };
}

test('scanned-only preserves original text, order, and edits when an OCR page returns empty', () => {
  const doc = mixedPdf();
  assert.deepEqual(pagesForOcr(doc, 'scanned-only'), [2, 3]);
  assert.deepEqual(pagesForOcr(doc, 'all'), [1, 2, 3, 4]);
  const result = applyOcrResultsToDocument(doc, new Map([
    [2, [paragraph(2, 'Dòng tiếng Việt từ bản scan.', 'ocr-2')]],
    [3, []]
  ]));
  assert.deepEqual(result.chapters[0].elements.map(element => element.text),
    ['Chapter 1: Original', 'Original PDF text.', 'Dòng tiếng Việt từ bản scan.', 'Footer', 'Final page.']);
  assert.equal(result.chapters[0].title, 'Edited title');
  assert.equal(result.chapters[0].includedInToc, false);
  assert.deepEqual(result.scanPages, [3]);
  assert.deepEqual(result.emptyOcrPages, [3]);
  assert.equal(result.stats.pageCount, 4);
  assert.deepEqual(doc.pdfPages?.[1], []);
  assert.equal(doc.pdfPages?.[0][0].type, 'paragraph');
});

test('successful retry replaces prior OCR instead of duplicating a page', () => {
  const doc = mixedPdf();
  const first = applyOcrResultsToDocument(doc, new Map([[2, [paragraph(2, 'First OCR', 'ocr-2')]], [3, []]]));
  const retry = applyOcrResultsToDocument(first, new Map([
    [2, [paragraph(2, 'Retried OCR', 'ocr-2')]],
    [3, [paragraph(3, 'Recovered page', 'ocr-3')]]
  ]));
  assert.deepEqual(retry.emptyOcrPages, []);
  assert.deepEqual(retry.scanPages, []);
  assert.deepEqual(retry.pdfPages?.[1].map(element => element.text), ['Retried OCR']);
  assert.equal(retry.pdfPages?.[2][0].text, 'Recovered page');
});

test('full OCR preserves a uniquely matched chapter and allocates distinct IDs for new chapters', () => {
  const doc = mixedPdf();
  const before = structuredClone(doc);
  const result = applyOcrResultsToDocument(doc, new Map([
    [1, [paragraph(1, 'Chapter 1: Original', 'ocr-1-0'), paragraph(1, 'OCR body', 'ocr-1-1')]],
    [2, [paragraph(2, 'Chapter 2: New', 'ocr-2-0')]]
  ]));
  assert.equal(result.chapters[0].id, doc.chapters[0].id);
  assert.equal(result.chapters[0].headingId, 'ocr-1-0');
  assert.equal(result.chapters[0].title, 'Edited title');
  assert.equal(result.chapters[0].includedInToc, false);
  assert.equal(result.chapters[0].elements[1].text, 'OCR body');
  assert.notEqual(result.chapters[1].id, doc.chapters[0].id);
  assert.deepEqual(doc, before);
});

test('full OCR fails atomically when an edited chapter is missing or ambiguous', () => {
  const doc = mixedPdf();
  const before = structuredClone(doc);
  for (const headings of [['Chapter 1: Different'], ['Chapter 1: Original', 'Chapter 1: Original']]) {
    assert.throws(() => applyOcrResultsToDocument(doc, new Map([
      [1, headings.map((heading, index) => paragraph(1, heading, `ocr-1-${index}`))]
    ])), { message: 'OCR_CHAPTER_EDITS_UNMATCHED' });
    assert.deepEqual(doc, before);
  }
});

test('OCR keeps the edited single default chapter through empty scans and retries', () => {
  const doc = mixedPdf();
  doc.pdfPages = [[], []];
  doc.chapters = groupIntoChapters([], 'Book');
  const [chapter] = doc.chapters;
  chapter.title = 'Edited scan';
  chapter.includedInToc = false;
  doc.scanPages = [1, 2];
  doc.stats.pageCount = 2;
  const original = structuredClone(doc);

  const first = applyOcrResultsToDocument(doc, new Map([
    [1, [paragraph(1, 'First page.', 'ocr-1-0')]],
    [2, []]
  ]));
  assert.deepEqual(first.chapters[0], { ...chapter, elements: first.pdfPages![0] });
  assert.deepEqual(first.scanPages, [2]);
  assert.deepEqual(first.emptyOcrPages, [2]);
  assert.equal(first.stats.pageCount, 2);
  assert.equal(first.stats.wordCount, 2);

  const retry = applyOcrResultsToDocument(first, new Map([
    [1, []],
    [2, [paragraph(2, 'Second page now reads.', 'ocr-2-0')]]
  ]));
  assert.deepEqual(retry.chapters[0], { ...chapter, elements: retry.pdfPages!.flat() });
  assert.deepEqual(retry.chapters[0].elements.map(el => el.pageNumber), [1, 2]);
  assert.deepEqual(retry.emptyOcrPages, [1]);
  assert.deepEqual(retry.scanPages, []);
  assert.equal(retry.stats.wordCount, 6);
  assert.equal(retry.stats.pageCount, 2);
  assert.deepEqual(doc, original);

  const before = structuredClone(retry);
  assert.throws(() => applyOcrResultsToDocument(retry, new Map([
    [1, [paragraph(1, 'Chapter 1: Detected', 'ocr-1-0')]]
  ])), { message: 'OCR_CHAPTER_EDITS_UNMATCHED' });
  assert.deepEqual(retry, before);
});
