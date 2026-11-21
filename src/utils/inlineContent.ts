import type { InlineRun } from '../types/document';

export function parseMarkdownInline(text: string): InlineRun[] {
  return text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|(?<!\w)_[^_]+_(?!\w))/g)
    .map((part, index) => {
      if (index % 2 === 0) return { text: part };
      const width = part.startsWith('***') ? 3 : part.startsWith('**') || part.startsWith('__') ? 2 : 1;
      return { text: part.slice(width, -width), bold: width >= 2, italic: width !== 2 };
    }).filter(run => run.text);
}

export function isEmbeddedImage(src: string): boolean {
  return /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(src);
}
