export type ContentElementType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'image'
  | 'table'
  | 'blockquote'
  | 'code'
  | 'divider';

export interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface ContentElement {
  id: string;
  type: ContentElementType;
  level?: 1 | 2 | 3 | 4 | 5 | 6; // for heading
  text?: string;
  inline?: InlineRun[];
  itemInline?: InlineRun[][];
  listType?: 'ordered' | 'unordered';
  listStart?: number;
  items?: string[];
  src?: string; // base64 or relative image path
  alt?: string;
  caption?: string;
  headers?: string[];
  headerInline?: InlineRun[][];
  rows?: string[][];
  rowInline?: InlineRun[][][];
  pageNumber?: number;
}

export interface Chapter {
  id: string;
  title: string;
  sourceTitle?: string;
  order: number;
  elements: ContentElement[];
  includedInToc: boolean;
  headingId?: string;
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
  pdfPages?: ContentElement[][];
  scanPages?: number[];
  emptyOcrPages?: number[];
  coverCandidates?: CoverCandidate[];
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
  input: { path: string; name: string };
  status: 'pending' | 'processing' | 'done' | 'error';
  resultBlob?: Blob;
  error?: string;
  emptyOcrPages?: number[];
  warnings?: string[];
  exportWarningCodes?: string[];
}
