import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';

const xhtmlNamespace = 'http://www.w3.org/1999/xhtml';
const epubNamespace = 'http://www.idpf.org/2007/ops';

export async function validateEpubArchive(bytes: ArrayBuffer, expectedSpine: string[]): Promise<string[]> {
  const errors: string[] = [];
  const header = new DataView(bytes);
  const decoder = new TextDecoder();
  if (header.byteLength < 38 || header.getUint32(0, true) !== 0x04034b50 ||
      header.getUint16(8, true) !== 0 || header.getUint16(26, true) !== 8 ||
      header.getUint16(28, true) !== 0 || decoder.decode(bytes.slice(30, 38)) !== 'mimetype') {
    errors.push('Invalid EPUB mimetype entry');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    return [...errors, 'Invalid EPUB ZIP'];
  }
  if (await zip.file('mimetype')?.async('string') !== 'application/epub+zip') errors.push('Invalid mimetype value');

  async function readXml(path: string) {
    const file = zip.file(path);
    if (!file) {
      errors.push(`Missing file: ${path}`);
      return;
    }
    try {
      const xml = await file.async('string');
      return new DOMParser({ errorHandler: () => { throw new Error('Invalid XML'); } }).parseFromString(xml, 'text/xml');
    } catch {
      errors.push(`Invalid XML: ${path}`);
    }
  }

  const container = await readXml('META-INF/container.xml');
  if (container?.getElementsByTagName('rootfile')[0]?.getAttribute('full-path') !== 'OEBPS/content.opf') {
    errors.push('Invalid container rootfile');
  }
  const opf = await readXml('OEBPS/content.opf');
  if (!opf) return errors;
  const titles = Array.from(opf.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', 'title'));
  if (!titles.length || titles.some(title => !title.textContent?.trim())) errors.push('EPUB_TITLE_EMPTY');
  const manifest = Array.from(opf.getElementsByTagName('item'));
  const itemsById = new Map(manifest.map(item => [item.getAttribute('id'), item]));
  const paths = new Set(manifest.map(item => item.getAttribute('href')));
  if (manifest.length !== itemsById.size || manifest.length !== paths.size ||
      !manifest.some(item => item.getAttribute('properties') === 'nav' && item.getAttribute('href') === 'nav.xhtml')) {
    errors.push('Invalid EPUB manifest');
  }
  for (const item of manifest) {
    const href = item.getAttribute('href') || '';
    const media = item.getAttribute('media-type');
    if (!href || !zip.file(`OEBPS/${href}`)) {
      errors.push(`Missing manifest resource: ${href}`);
      continue;
    }
    if (media !== 'application/xhtml+xml' && media !== 'application/x-dtbncx+xml') continue;
    const document = await readXml(`OEBPS/${href}`);
    if (!document) continue;
    if (href === 'nav.xhtml') {
      const toc = Array.from(document.getElementsByTagNameNS(xhtmlNamespace, 'nav'))
        .find(nav => nav.getAttributeNS(epubNamespace, 'type') === 'toc');
      const labels = Array.from(toc?.getElementsByTagNameNS(xhtmlNamespace, 'a') ?? []);
      if (!labels.length || labels.some(label => !label.textContent?.trim())) {
        errors.push('EPUB_TOC_LABEL_EMPTY');
      }
    }
    if (media === 'application/xhtml+xml' && /^chapter-\d+\.xhtml$/.test(href) &&
        !document.getElementsByTagNameNS(xhtmlNamespace, 'title')[0]?.textContent?.trim()) {
      errors.push('EPUB_CHAPTER_TITLE_EMPTY');
    }
    for (const element of Array.from(document.getElementsByTagName('*'))) {
      const link = element.getAttribute('href') || element.getAttribute('src');
      if (link && !paths.has(link.split('#')[0] || href)) {
        errors.push(`Unlisted resource in ${href}: ${link}`);
      }
    }
  }
  const spine = Array.from(opf.getElementsByTagName('itemref')).map(item => item.getAttribute('idref') || '');
  if (!spine.length || spine.length !== expectedSpine.length ||
      spine.some((id, index) => id !== expectedSpine[index] || itemsById.get(id)?.getAttribute('media-type') !== 'application/xhtml+xml')) {
    errors.push('Invalid EPUB reading order');
  }
  return errors;
}
