import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { generateEpub } from './epubGenerator';
import { NormalizedDocument } from '../types/document';

test('generateEpub creates valid EPUB 3 zip archive structure', async () => {
  const mockDoc: NormalizedDocument = {
    id: 'test-doc-1',
    filename: 'test-book.txt',
    fileSize: 1024,
    fileType: 'txt',
    metadata: {
      title: 'Cuốn sách thử nghiệm',
      author: 'Nguyễn Văn A',
      language: 'vi'
    },
    chapters: [
      {
        id: 'ch-1',
        title: 'Chương 1: Khởi đầu',
        order: 1,
        includedInToc: true,
        elements: [
          { id: 'e1', type: 'paragraph', text: 'Đây là đoạn văn tiếng Việt mẫu.' }
        ]
      },
      {
        id: 'ch-2',
        title: 'Chương 2: Phát triển',
        order: 2,
        includedInToc: true,
        elements: [
          { id: 'e2', type: 'paragraph', text: 'Nội dung tiếp theo của câu chuyện.' }
        ]
      }
    ],
    stats: {
      wordCount: 15,
      charCount: 80,
      paragraphCount: 2,
      imageCount: 0
    },
    warnings: []
  };

  const { blob, validation } = await generateEpub(mockDoc);

  assert.equal(validation.isValid, true);
  assert.equal(validation.errors.length, 0);
  assert.equal(validation.chapterCount, 2);
  assert.ok(blob.size > 0);

  // Read zip contents and verify structure
  const arrayBuffer = await blob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const files = Object.keys(zip.files);
  assert.ok(files.includes('mimetype'));
  assert.ok(files.includes('META-INF/container.xml'));
  assert.ok(files.includes('OEBPS/content.opf'));
  assert.ok(files.includes('OEBPS/nav.xhtml'));
  assert.ok(files.includes('OEBPS/toc.ncx'));
  assert.ok(files.includes('OEBPS/css/stylesheet.css'));
  assert.ok(files.includes('OEBPS/chapter-1.xhtml'));
  assert.ok(files.includes('OEBPS/chapter-2.xhtml'));

  const mimetypeContent = await zip.file('mimetype')?.async('string');
  assert.equal(mimetypeContent, 'application/epub+zip');

  const containerContent = await zip.file('META-INF/container.xml')?.async('string');
  assert.ok(containerContent?.includes('OEBPS/content.opf'));

  const opfContent = await zip.file('OEBPS/content.opf')?.async('string');
  assert.ok(opfContent?.includes('Cuốn sách thử nghiệm'));
  assert.ok(opfContent?.includes('Nguyễn Văn A'));
  assert.ok(opfContent?.includes('xml:lang="vi"'));
});
