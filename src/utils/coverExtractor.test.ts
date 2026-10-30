import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractEmbeddedCoverCandidates,
  generateStyledCoverCandidate,
  getDocumentCoverSuggestions
} from './coverExtractor';
import { NormalizedDocument } from '../types/document';

test('generateStyledCoverCandidate returns a candidate with label and source', () => {
  const candidateVi = generateStyledCoverCandidate('Truyện Kiều', 'Nguyễn Du', 'vi');
  assert.equal(candidateVi.source, 'generated');
  assert.ok(candidateVi.label.includes('tự động'));

  const candidateEn = generateStyledCoverCandidate('Hamlet', 'Shakespeare', 'en');
  assert.equal(candidateEn.source, 'generated');
  assert.ok(candidateEn.label.includes('Auto-styled'));
});

test('extractEmbeddedCoverCandidates extracts data URL images from chapters', () => {
  const mockDoc: NormalizedDocument = {
    id: 'doc-1',
    filename: 'test.docx',
    fileSize: 1000,
    fileType: 'docx',
    metadata: {
      title: 'Test Doc',
      author: 'Author',
      language: 'vi'
    },
    chapters: [
      {
        id: 'c1',
        title: 'Chương 1',
        order: 1,
        includedInToc: true,
        elements: [
          {
            id: 'e1',
            type: 'image',
            src: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
            alt: 'Hero banner'
          },
          {
            id: 'e2',
            type: 'paragraph',
            text: 'Hello world'
          }
        ]
      }
    ],
    stats: {
      wordCount: 100,
      charCount: 500,
      paragraphCount: 1,
      imageCount: 1
    },
    warnings: []
  };

  const embedded = extractEmbeddedCoverCandidates(mockDoc, 'vi');
  assert.equal(embedded.length, 1);
  assert.equal(embedded[0].source, 'embedded');
  assert.equal(embedded[0].dataUrl, 'data:image/jpeg;base64,/9j/4AAQSkZJRg==');
});

test('getDocumentCoverSuggestions combines embedded and generated candidates', async () => {
  const mockDoc: NormalizedDocument = {
    id: 'doc-2',
    filename: 'test.txt',
    fileSize: 500,
    fileType: 'txt',
    metadata: {
      title: 'Simple Text',
      author: 'Author',
      language: 'en'
    },
    chapters: [
      {
        id: 'c1',
        title: 'Chapter 1',
        order: 1,
        includedInToc: true,
        elements: [
          {
            id: 'p1',
            type: 'paragraph',
            text: 'Plain text content'
          }
        ]
      }
    ],
    stats: {
      wordCount: 50,
      charCount: 200,
      paragraphCount: 1,
      imageCount: 0
    },
    warnings: []
  };

  const suggestions = await getDocumentCoverSuggestions(mockDoc, null, 'en');
  assert.ok(suggestions.length >= 1);
  const generated = suggestions.find((s) => s.source === 'generated');
  assert.ok(generated);
});
