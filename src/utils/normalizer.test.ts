import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUnicode,
  cleanText,
  escapeXml,
  isChapterHeader,
  groupIntoChapters,
  stitchBrokenParagraphs,
  calculateDocumentStats
} from './normalizer';
import { ContentElement } from '../types/document';

test('normalizeUnicode preserves Vietnamese diacritics', () => {
  const original = 'Tiếng Việt giàu đẹp và trong sáng';
  assert.equal(normalizeUnicode(original), original);
  // Decomposed form normalized to NFC
  const decomposed = 'Tiê\u0301ng Viê\u0323t';
  assert.equal(normalizeUnicode(decomposed), 'Tiếng Việt');
});

test('cleanText collapses whitespace and normalizes text', () => {
  const input = '  Đoạn   văn \u00A0 có   nhiều  khoảng   trắng  \n';
  assert.equal(cleanText(input), 'Đoạn văn có nhiều khoảng trắng');
});

test('escapeXml escapes dangerous characters properly', () => {
  const input = 'A < B & C > D with "quotes" and \'apostrophes\'';
  assert.equal(
    escapeXml(input),
    'A &lt; B &amp; C &gt; D with &quot;quotes&quot; and &apos;apostrophes&apos;'
  );
});

test('isChapterHeader detects Vietnamese and English chapter titles', () => {
  assert.equal(isChapterHeader('Chương 1: Khởi đầu mới').isChapter, true);
  assert.equal(isChapterHeader('Chương II. Nhân vật chính').isChapter, true);
  assert.equal(isChapterHeader('Chapter 3: The Journey Begins').isChapter, true);
  assert.equal(isChapterHeader('Hồi 1: Tiếng đàn Thúy Kiều').isChapter, true);
  assert.equal(isChapterHeader('Phần I: Cơ sở lý thuyết').isChapter, true);
  assert.equal(isChapterHeader('Lời mở đầu').isChapter, true);
  assert.equal(isChapterHeader('Kết luận').isChapter, true);

  // Normal text should not be a chapter
  assert.equal(isChapterHeader('Hôm nay trời rất đẹp và chúng tôi đi dạo quanh hồ.').isChapter, false);
});

test('groupIntoChapters splits elements by detected headings', () => {
  const elements: ContentElement[] = [
    { id: '1', type: 'paragraph', text: 'Đây là đoạn mở đầu câu chuyện.' },
    { id: '2', type: 'heading', level: 1, text: 'Chương 1: Gặp gỡ' },
    { id: '3', type: 'paragraph', text: 'Nội dung của chương 1.' },
    { id: '4', type: 'paragraph', text: 'Chương 2: Thử thách' },
    { id: '5', type: 'paragraph', text: 'Nội dung của chương 2.' }
  ];

  const chapters = groupIntoChapters(elements, 'Tiểu thuyết mẫu');
  assert.equal(chapters.length, 3);
  assert.equal(chapters[0].title, 'Mở đầu');
  assert.equal(chapters[1].title, 'Chương 1: Gặp gỡ');
  assert.equal(chapters[2].title, 'Chương 2: Thử thách');
});

test('stitchBrokenParagraphs handles hyphenation and unbroken sentences', () => {
  const lines = [
    'Đây là một câu văn dài',
    'được nối liền với nhau.',
    '',
    'Đoạn văn thứ hai',
    'tiếp tục ở dòng này.'
  ];

  const paragraphs = stitchBrokenParagraphs(lines);
  assert.equal(paragraphs.length, 2);
  assert.equal(paragraphs[0], 'Đây là một câu văn dài được nối liền với nhau.');
  assert.equal(paragraphs[1], 'Đoạn văn thứ hai tiếp tục ở dòng này.');
});

test('calculateDocumentStats computes words, characters and images', () => {
  const chapters = [
    {
      id: 'c1',
      title: 'Chương 1',
      order: 1,
      includedInToc: true,
      elements: [
        { id: 'e1', type: 'paragraph' as const, text: 'Xin chào thế giới!' },
        { id: 'e2', type: 'image' as const, src: 'data:image/png;base64,...' }
      ]
    }
  ];

  const stats = calculateDocumentStats(chapters);
  assert.equal(stats.imageCount, 1);
  assert.equal(stats.paragraphCount, 1);
  assert.equal(stats.wordCount, 4); // 'Xin', 'chào', 'thế', 'giới!'
});
