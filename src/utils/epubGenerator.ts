import JSZip from 'jszip';
import { NormalizedDocument, Chapter, ContentElement, EpubValidationResult } from '../types/document';
import { escapeXml } from './normalizer';

/**
 * Generates a standard UUID v4 for EPUB unique-identifier.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Converts a data URL to binary data (Uint8Array) and mime type.
 */
function dataUrlToBinary(dataUrl: string): { data: Uint8Array; mime: string } {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binaryString = atob(parts[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { data: bytes, mime };
}

/**
 * Returns extension for a given MIME type.
 */
function getExtensionForMime(mime: string): string {
  switch (mime.toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    case 'image/svg+xml':
      return 'svg';
    case 'image/jpeg':
    case 'image/jpg':
    default:
      return 'jpg';
  }
}

/**
 * Renders ContentElement into valid XHTML.
 */
function renderElementToXhtml(el: ContentElement): string {
  switch (el.type) {
    case 'heading': {
      const level = el.level || 2;
      const tag = `h${level}`;
      return `<${tag}>${escapeXml(el.text || '')}</${tag}>`;
    }
    case 'paragraph': {
      if (!el.text) return '';
      return `<p>${escapeXml(el.text)}</p>`;
    }
    case 'list': {
      const tag = el.listType === 'ordered' ? 'ol' : 'ul';
      const items = (el.items || [])
        .map((item) => `<li>${escapeXml(item)}</li>`)
        .join('\n');
      return `<${tag}>\n${items}\n</${tag}>`;
    }
    case 'blockquote': {
      return `<blockquote><p>${escapeXml(el.text || '')}</p></blockquote>`;
    }
    case 'code': {
      return `<pre><code>${escapeXml(el.text || '')}</code></pre>`;
    }
    case 'divider': {
      return `<hr class="section-divider"/>`;
    }
    case 'table': {
      let html = '<div class="table-wrapper"><table class="doc-table">\n';
      if (el.headers && el.headers.length > 0) {
        html += '<thead><tr>\n';
        for (const th of el.headers) {
          html += `<th>${escapeXml(th)}</th>\n`;
        }
        html += '</tr></thead>\n';
      }
      if (el.rows && el.rows.length > 0) {
        html += '<tbody>\n';
        for (const row of el.rows) {
          html += '<tr>\n';
          for (const cell of row) {
            html += `<td>${escapeXml(cell)}</td>\n`;
          }
          html += '</tr>\n';
        }
        html += '</tbody>\n';
      }
      html += '</table></div>';
      return html;
    }
    case 'image': {
      if (!el.src) return '';
      const alt = escapeXml(el.alt || 'Hình ảnh');
      const caption = el.caption ? `<figcaption>${escapeXml(el.caption)}</figcaption>` : '';
      return `<figure class="doc-figure">\n<img src="${el.src}" alt="${alt}"/>\n${caption}</figure>`;
    }
    default:
      return el.text ? `<p>${escapeXml(el.text)}</p>` : '';
  }
}

/**
 * Standard EPUB stylesheet with refined typography for Vietnamese & reflowable screens.
 */
export const EPUB_STYLESHEET = `
@charset "utf-8";
body {
  margin: 5% 6%;
  padding: 0;
  font-family: serif, "Times New Roman", "Palatino", "Georgia";
  line-height: 1.6;
  text-align: justify;
  color: #111;
  background-color: #fff;
}
h1, h2, h3, h4, h5, h6 {
  font-family: sans-serif, "Helvetica Neue", "Arial";
  font-weight: 700;
  line-height: 1.3;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  page-break-after: avoid;
  break-after: avoid;
  text-align: left;
}
h1 { font-size: 1.8em; text-align: center; margin-top: 2em; margin-bottom: 1.2em; }
h2 { font-size: 1.4em; }
h3 { font-size: 1.2em; }
h4 { font-size: 1.05em; }
p {
  margin-top: 0;
  margin-bottom: 0.9em;
  text-indent: 1.2em;
}
p.no-indent, figure + p, h1 + p, h2 + p, h3 + p {
  text-indent: 0;
}
blockquote {
  margin: 1.2em 1.5em;
  padding: 0.4em 1em;
  font-style: italic;
  border-left: 2px solid #888;
  color: #444;
}
blockquote p { text-indent: 0; }
ul, ol {
  margin: 0.8em 0 1em 1.8em;
  padding: 0;
}
li { margin-bottom: 0.4em; }
hr.section-divider {
  border: 0;
  height: 1px;
  background: #ccc;
  margin: 2em auto;
  width: 40%;
}
figure.doc-figure {
  margin: 1.5em 0;
  text-align: center;
}
figure.doc-figure img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}
figcaption {
  font-size: 0.85em;
  color: #666;
  margin-top: 0.5em;
  font-style: italic;
}
.table-wrapper {
  overflow-x: auto;
  margin: 1.5em 0;
}
table.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}
table.doc-table th, table.doc-table td {
  border: 1px solid #ddd;
  padding: 6px 10px;
  text-align: left;
}
table.doc-table th {
  background-color: #f2f2f2;
  font-weight: 600;
}
pre {
  background: #f7f7f7;
  padding: 0.8em;
  font-family: monospace;
  font-size: 0.85em;
  white-space: pre-wrap;
  word-break: break-all;
  border-radius: 4px;
}
.cover-container {
  text-align: center;
  padding: 0;
  margin: 0;
  height: 100%;
}
.cover-container img {
  max-width: 100%;
  max-height: 100vh;
  object-fit: contain;
}
`;

/**
 * Builds and returns a valid EPUB 3 Reflowable archive.
 */
export async function generateEpub(doc: NormalizedDocument): Promise<{ blob: Blob; validation: EpubValidationResult }> {
  const zip = new JSZip();
  const uuid = `urn:uuid:${generateUUID()}`;
  const modifiedDate = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const lang = doc.metadata.language || 'vi';
  const title = doc.metadata.title || doc.filename.replace(/\.[^/.]+$/, '');
  const author = doc.metadata.author || 'Tác giả khuyết danh';

  // 1. mimetype: MUST be first entry, uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. Stylesheet
  zip.file('OEBPS/css/stylesheet.css', EPUB_STYLESHEET);

  const manifestItems: Array<{ id: string; href: string; mediaType: string; properties?: string }> = [
    { id: 'nav', href: 'nav.xhtml', mediaType: 'application/xhtml+xml', properties: 'nav' },
    { id: 'ncx', href: 'toc.ncx', mediaType: 'application/x-dtbncx+xml' },
    { id: 'css', href: 'css/stylesheet.css', mediaType: 'text/css' }
  ];

  const spineItems: Array<{ idref: string; linear?: string }> = [];

  // 4. Handle Cover Image if present
  let hasCover = false;
  if (doc.metadata.coverImage && doc.metadata.coverImage.dataUrl) {
    try {
      const { data, mime } = dataUrlToBinary(doc.metadata.coverImage.dataUrl);
      const ext = getExtensionForMime(mime);
      const coverImgHref = `images/cover.${ext}`;
      zip.file(`OEBPS/${coverImgHref}`, data);

      manifestItems.push({
        id: 'cover-image',
        href: coverImgHref,
        mediaType: mime,
        properties: 'cover-image'
      });

      // Cover XHTML page
      const coverXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
  <title>Bìa sách - ${escapeXml(title)}</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" type="text/css" href="css/stylesheet.css"/>
  <style type="text/css">
    body { margin: 0; padding: 0; text-align: center; }
    .cover-img { max-width: 100%; max-height: 100vh; height: auto; object-fit: contain; }
  </style>
</head>
<body class="cover-page" epub:type="cover">
  <section epub:type="cover" class="cover-container">
    <img src="${coverImgHref}" alt="Bìa sách ${escapeXml(title)}" class="cover-img"/>
  </section>
</body>
</html>`;
      zip.file('OEBPS/cover.xhtml', coverXhtml);
      manifestItems.push({
        id: 'cover-page',
        href: 'cover.xhtml',
        mediaType: 'application/xhtml+xml'
      });
      spineItems.push({ idref: 'cover-page', linear: 'no' });
      hasCover = true;
    } catch (err) {
      console.warn('Failed to encode cover image:', err);
    }
  }

  // 5. Chapters and embedded images
  let imageCounter = 1;
  const processedChapters = doc.chapters.length > 0 ? doc.chapters : [
    {
      id: 'ch-1',
      title: title,
      order: 1,
      elements: [{ id: 'el-1', type: 'paragraph' as const, text: 'Nội dung sách.' }],
      includedInToc: true
    }
  ];

  const tocEntries: Array<{ title: string; href: string }> = [];

  processedChapters.forEach((chapter, index) => {
    const chapterNum = index + 1;
    const chapterId = `chapter-${chapterNum}`;
    const chapterHref = `${chapterId}.xhtml`;

    manifestItems.push({
      id: chapterId,
      href: chapterHref,
      mediaType: 'application/xhtml+xml'
    });

    spineItems.push({ idref: chapterId });

    if (chapter.includedInToc) {
      tocEntries.push({
        title: chapter.title || `Chương ${chapterNum}`,
        href: chapterHref
      });
    }

    // Process elements in chapter & extract images if base64
    const filteredElements = chapter.elements.filter(
      (el, idx) => !(idx === 0 && el.type === 'heading' && el.text === chapter.title)
    );

    const renderedElements: string[] = [];
    for (const el of filteredElements) {
      if (el.type === 'image' && el.src && el.src.startsWith('data:')) {
        try {
          const { data, mime } = dataUrlToBinary(el.src);
          const ext = getExtensionForMime(mime);
          const imgFilename = `img_${imageCounter++}.${ext}`;
          const imgPath = `images/${imgFilename}`;
          zip.file(`OEBPS/${imgPath}`, data);

          const imgId = `image-${imageCounter}`;
          manifestItems.push({
            id: imgId,
            href: imgPath,
            mediaType: mime
          });

          // Replace src with relative path
          const modifiedEl = { ...el, src: imgPath };
          renderedElements.push(renderElementToXhtml(modifiedEl));
          continue;
        } catch {
          // ignore corrupted image
        }
      }
      renderedElements.push(renderElementToXhtml(el));
    }

    const chapterXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
  <title>${escapeXml(chapter.title)}</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" type="text/css" href="css/stylesheet.css"/>
</head>
<body class="chapter-body">
  <section epub:type="chapter" role="doc-chapter">
    <h1 class="chapter-title">${escapeXml(chapter.title)}</h1>
    ${renderedElements.join('\n    ')}
  </section>
</body>
</html>`;

    zip.file(`OEBPS/${chapterHref}`, chapterXhtml);
  });

  // 6. Navigation Document (nav.xhtml - EPUB 3 requirement)
  const navListItems = tocEntries
    .map((toc) => `      <li><a href="${toc.href}">${escapeXml(toc.title)}</a></li>`)
    .join('\n');

  const navXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
  <title>Mục lục</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" type="text/css" href="css/stylesheet.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc" role="doc-toc">
    <h1>Mục lục</h1>
    <ol>
${navListItems || '      <li><a href="chapter-1.xhtml">Nội dung</a></li>'}
    </ol>
  </nav>
  <nav epub:type="landmarks" hidden="">
    <h2>Landmarks</h2>
    <ol>
      ${hasCover ? '<li><a epub:type="cover" href="cover.xhtml">Bìa sách</a></li>' : ''}
      <li><a epub:type="toc" href="nav.xhtml#toc">Mục lục</a></li>
      <li><a epub:type="bodymatter" href="chapter-1.xhtml">Nội dung chính</a></li>
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navXhtml);

  // 7. EPUB 2 NCX file (toc.ncx for legacy reader compatibility)
  const ncxNavPoints = tocEntries
    .map((toc, idx) => {
      const order = idx + 1;
      return `    <navPoint id="navpoint-${order}" playOrder="${order}">
      <navLabel><text>${escapeXml(toc.title)}</text></navLabel>
      <content src="${toc.href}"/>
    </navPoint>`;
    })
    .join('\n');

  const ncxXml = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <docAuthor><text>${escapeXml(author)}</text></docAuthor>
  <navMap>
${ncxNavPoints}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', ncxXml);

  // 8. Package Document (OEBPS/content.opf)
  const manifestXml = manifestItems
    .map((item) => {
      const propAttr = item.properties ? ` properties="${item.properties}"` : '';
      return `    <item id="${item.id}" href="${item.href}" media-type="${item.mediaType}"${propAttr}/>`;
    })
    .join('\n');

  const spineXml = spineItems
    .map((item) => {
      const linearAttr = item.linear ? ` linear="${item.linear}"` : '';
      return `    <itemref idref="${item.idref}"${linearAttr}/>`;
    })
    .join('\n');

  const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="${lang}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${uuid}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>${lang}</dc:language>
    <dc:creator id="creator">${escapeXml(author)}</dc:creator>
    <meta refines="#creator" property="role" scheme="marc:relators">aut</meta>
    <meta property="dcterms:modified">${modifiedDate}</meta>
    ${hasCover ? '<meta name="cover" content="cover-image"/>' : ''}
    ${doc.metadata.description ? `<dc:description>${escapeXml(doc.metadata.description)}</dc:description>` : ''}
    ${doc.metadata.publisher ? `<dc:publisher>${escapeXml(doc.metadata.publisher)}</dc:publisher>` : ''}
  </metadata>
  <manifest>
${manifestXml}
  </manifest>
  <spine toc="ncx">
${spineXml}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', contentOpf);

  // 9. Generate the zip Blob
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  // 10. Self-Validation
  const validation: EpubValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    fileSize: blob.size,
    chapterCount: processedChapters.length,
    assetCount: manifestItems.length
  };

  // Inspect generated files
  const fileKeys = Object.keys(zip.files);
  if (fileKeys[0] !== 'mimetype') {
    validation.warnings.push('Mimetype file is not the first file in archive');
  }
  if (!fileKeys.includes('META-INF/container.xml')) {
    validation.errors.push('Thiếu file META-INF/container.xml');
    validation.isValid = false;
  }
  if (!fileKeys.includes('OEBPS/content.opf')) {
    validation.errors.push('Thiếu file OEBPS/content.opf');
    validation.isValid = false;
  }
  if (!fileKeys.includes('OEBPS/nav.xhtml')) {
    validation.errors.push('Thiếu navigation document (OEBPS/nav.xhtml)');
    validation.isValid = false;
  }

  return { blob, validation };
}
