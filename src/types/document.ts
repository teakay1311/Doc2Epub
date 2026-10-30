export type ContentElementType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'image'
  | 'table'
  | 'blockquote'
  | 'code'
  | 'divider';

export interface ContentElement {
  id: string;
  type: ContentElementType;
  level?: 1 | 2 | 3 | 4 | 5 | 6; // for heading
  text?: string;
  listType?: 'ordered' | 'unordered';
  items?: string[];
  src?: string; // base64 or relative image path
  alt?: string;
  caption?: string;
  headers?: string[];
  rows?: string[][];
  pageNumber?: number;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  elements: ContentElement[];
  includedInToc: boolean;
}

export interface BookMetadata {
  title: string;
  author: string;
  language: string; // 'vi' | 'en' | ...
  description?: string;
  publisher?: string;
  coverImage?: {
    dataUrl: string;
    mediaType: string;
    filename: string;
  };
}

export interface CoverCandidate {
  id: string;
  label: string;
  dataUrl: string;
  source: 'page' | 'embedded' | 'generated';
  pageNumber?: number;
}

export interface DocumentStats {
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  imageCount: number;
  pageCount?: number;
}

export interface NormalizedDocument {
  id: string;
  filename: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'html';
  metadata: BookMetadata;
  chapters: Chapter[];
  stats: DocumentStats;
  warnings: string[];
  scannedPagesCount?: number;
  needsOcr?: boolean;
  coverCandidates?: CoverCandidate[];
}

export interface ConversionOptions {
  detectChapters: boolean;
  ocrMode: 'auto' | 'always' | 'never';
  ocrLanguage: 'vie' | 'eng' | 'vie+eng';
  removeHeaderFooter: boolean;
  fixLineBreaks: boolean;
  normalizeUnicode: boolean;
}

export interface ConversionProgress {
  stage: 'idle' | 'parsing' | 'extracting' | 'ocr' | 'normalizing' | 'packaging' | 'validating' | 'done' | 'error';
  currentStep: number;
  totalSteps: number;
  message: string;
  percent?: number;
}

export interface EpubValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileSize: number;
  chapterCount: number;
  assetCount: number;
}

export interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress?: ConversionProgress;
  resultBlob?: Blob;
  resultFilename?: string;
  resultSize?: number;
  error?: string;
  doc?: NormalizedDocument;
}
