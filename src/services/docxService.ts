import mammoth from 'mammoth';
import { NormalizedDocument } from '../types/document';
import { parseHtmlDocument } from './textService';

/**
 * Extracts Word (.docx) document using Mammoth into normalized document model,
 * preserving headings, paragraphs, lists, tables, bold/italic, and inline images as data URIs.
 */
export async function parseDocxDocument(
  file: File | ArrayBuffer,
  filename: string,
  fileSize: number
): Promise<NormalizedDocument> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;

  // Options for mammoth to extract inline images as base64 data URIs
  const options = {
    convertImage: mammoth.images.imgElement((image) => {
      return image.read('base64').then((imageBuffer) => {
        return {
          src: `data:${image.contentType};base64,${imageBuffer}`
        };
      });
    })
  };

  const result = await mammoth.convertToHtml({ arrayBuffer }, options);
  const html = result.value;

  const doc = parseHtmlDocument(html, filename, fileSize);
  doc.fileType = 'docx';

  if (result.messages && result.messages.length > 0) {
    for (const msg of result.messages) {
      if (msg.type === 'warning') {
        doc.warnings.push(msg.message);
      }
    }
  }

  return doc;
}
