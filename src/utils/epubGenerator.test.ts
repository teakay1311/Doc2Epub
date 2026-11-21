import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { generateEpub } from './epubGenerator';
import { NormalizedDocument } from '../types/document';
import { parseMarkdown } from '../services/textService';
import { validateEpubArchive } from './validateEpub';

const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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

test('exports styled text, cover and hidden chapter body and validates the real ZIP header', async (t) => {
  // WebKit's real image decode is also exercised against the packaged app.
  const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: class {
      naturalWidth = 1;
      naturalHeight = 1;
      async decode() {}
    }
  });
  t.after(() => {
    if (originalImage) Object.defineProperty(globalThis, 'Image', originalImage);
    else Reflect.deleteProperty(globalThis, 'Image');
  });
  const doc: NormalizedDocument = {
    id: 'book', filename: 'styled.md', fileSize: 50, fileType: 'md',
    metadata: {
      title: 'Tiếng Việt & EPUB', author: 'Nguyễn', language: 'vi',
      coverImage: { dataUrl: gif, mediaType: 'image/gif', filename: 'cover.gif' }
    },
    chapters: [
      { id: 'c1', title: 'Visible', order: 1, includedInToc: true, elements: [
        { id: 'e1', type: 'paragraph', text: 'Chữ đậm và nghiêng', inline: [
          { text: 'Chữ đậm', bold: true }, { text: ' và ' }, { text: 'nghiêng', italic: true }
        ] },
        { id: 'e3', type: 'image', src: gif, alt: 'Pixel minh họa' }
      ] },
      { id: 'c2', title: 'Hidden', order: 2, includedInToc: false,
        elements: [{ id: 'e2', type: 'paragraph', text: 'Retained body text' }] }
    ],
    stats: { wordCount: 8, charCount: 37, paragraphCount: 2, imageCount: 1 },
    warnings: []
  };
  const { blob, validation } = await generateEpub(doc);
  assert.deepEqual(validation.errors, []);
  const bytes = await blob.arrayBuffer();
  assert.equal(new DataView(bytes).getUint16(8, true), 0);
  assert.equal(new TextDecoder().decode(bytes.slice(30, 38)), 'mimetype');
  const zip = await JSZip.loadAsync(bytes);
  assert.ok(zip.file('OEBPS/images/cover.gif'));
  assert.ok(zip.file('OEBPS/images/img_1.gif'));
  assert.doesNotMatch(await zip.file('OEBPS/nav.xhtml')!.async('string'), />Hidden</);
  assert.match(await zip.file('OEBPS/chapter-2.xhtml')!.async('string'), /Retained body text/);
  assert.match(await zip.file('OEBPS/chapter-1.xhtml')!.async('string'), /<strong>Chữ đậm<\/strong> và <em>nghiêng<\/em>/);
});

test('exports effective EPUB titles, complete table cells and retained list numbering', async () => {
  const markdown = '| A | B |\n| --- | --- |\n| One | Two\n\n3. First\n4. Second';
  const doc = parseMarkdown(markdown, 'Nguồn & sách.md', markdown.length);
  doc.metadata.title = '   ';
  const { blob, validation } = await generateEpub(doc);
  assert.equal(validation.isValid, true);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const opf = await zip.file('OEBPS/content.opf')!.async('string');
  const chapter = await zip.file('OEBPS/chapter-1.xhtml')!.async('string');
  assert.match(opf, /<dc:title>Nguồn &amp; sách<\/dc:title>/);
  assert.match(chapter, /<td>One<\/td>\s*<td>Two<\/td>/);
  assert.match(chapter, /<ol start="3">\s*<li>First<\/li>/);
  zip.file('OEBPS/content.opf', opf.replace(/<dc:title>.*?<\/dc:title>/, '<dc:title>   </dc:title>'));
  const invalid = await zip.generateAsync({ type: 'arraybuffer' });
  assert.ok((await validateEpubArchive(invalid, ['chapter-1'])).includes('EPUB_TITLE_EMPTY'));

  const blankSource = parseMarkdown(markdown, '   .md', markdown.length);
  assert.equal(blankSource.chapters[0].title, 'Doc2EPUB');
  const fallback = await generateEpub(blankSource);
  const fallbackZip = await JSZip.loadAsync(await fallback.blob.arrayBuffer());
  assert.equal(fallback.validation.isValid, true);
  assert.match(await fallbackZip.file('OEBPS/content.opf')!.async('string'), /<dc:title>Doc2EPUB<\/dc:title>/);
  const fallbackChapter = await fallbackZip.file('OEBPS/chapter-1.xhtml')!.async('string');
  const fallbackNav = await fallbackZip.file('OEBPS/nav.xhtml')!.async('string');
  assert.match(fallbackChapter, /<title>Doc2EPUB<\/title>/);
  assert.match(fallbackChapter, /<h1 class="chapter-title">Doc2EPUB<\/h1>/);
  assert.match(fallbackNav, /href="chapter-1.xhtml">Doc2EPUB<\/a>/);
  assert.match(await fallbackZip.file('OEBPS/toc.ncx')!.async('string'), /<navLabel><text>Doc2EPUB<\/text><\/navLabel>/);
  fallbackZip.file('OEBPS/chapter-1.xhtml', fallbackChapter.replace('<title>Doc2EPUB</title>', '<title> </title>'));
  fallbackZip.file('OEBPS/nav.xhtml', fallbackNav.replace('href="chapter-1.xhtml">Doc2EPUB', 'href="chapter-1.xhtml"> '));
  const blankLabels = await validateEpubArchive(await fallbackZip.generateAsync({ type: 'arraybuffer' }), ['chapter-1']);
  assert.deepEqual(blankLabels, ['EPUB_TOC_LABEL_EMPTY', 'EPUB_CHAPTER_TITLE_EMPTY']);
});

test('invalid image resources are omitted and an invalid image-only document cannot be saved', async () => {
  const invalidImage = { id: 'bad', type: 'image' as const, src: 'data:image/png;base64,aGVsbG8=' };
  const doc = parseMarkdown('Readable text', 'book.md', 13);
  doc.metadata.coverImage = { dataUrl: invalidImage.src, mediaType: 'image/png', filename: 'broken.png' };
  doc.chapters[0].elements.push(invalidImage);
  const { blob, validation } = await generateEpub(doc);
  assert.equal(validation.isValid, true);
  assert.deepEqual(validation.warnings, ['INVALID_COVER', 'INVALID_EMBEDDED_IMAGE']);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  assert.equal(Object.keys(zip.files).some(path => path.startsWith('OEBPS/images/')), false);
  doc.chapters[0].elements = [invalidImage];
  await assert.rejects(() => generateEpub(doc), { message: 'NO_CONTENT' });
});
