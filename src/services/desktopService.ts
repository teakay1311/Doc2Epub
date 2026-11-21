import { invoke } from '@tauri-apps/api/core';
import { Menu } from '@tauri-apps/api/menu';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, stat } from '@tauri-apps/plugin-fs';
import { documentExtensions, maxDocumentBytes } from './documentService';
import { SAMPLE_DOCUMENTS } from './sampleDocuments';
import type { Language } from '../i18n/translations';
import type { BatchItem } from '../types/document';

export type DocumentInput = BatchItem['input'];

export function inputAtPath(path: string): DocumentInput {
  return { path, name: path.split('/').pop() || path };
}

export async function chooseDocuments(language: Language): Promise<DocumentInput[]> {
  const paths = await open({
    title: language === 'vi' ? 'Mở tài liệu' : 'Open documents',
    multiple: true,
    filters: [{ name: 'PDF, DOCX, TXT, Markdown, HTML', extensions: documentExtensions }]
  });
  return (paths || []).map(inputAtPath);
}

export async function readInput(input: DocumentInput): Promise<File> {
  const extension = input.name.split('.').pop()?.toLowerCase();
  if (!extension || !documentExtensions.includes(extension)) throw new Error('UNSUPPORTED_FILE');
  const metadata = await stat(input.path);
  if (!metadata.isFile) throw new Error('UNSUPPORTED_FILE');
  if (metadata.size === 0) throw new Error('EMPTY_FILE');
  if (metadata.size > maxDocumentBytes) throw new Error('FILE_TOO_LARGE');
  const bytes = await readFile(input.path);
  return new File([bytes], input.name);
}

export function listenForDrops(
  onDrop: (inputs: DocumentInput[]) => void,
  onHover: (isOver: boolean) => void
) {
  return getCurrentWebview().onDragDropEvent(({ payload }) => {
    onHover(payload.type === 'enter' || payload.type === 'over');
    if (payload.type === 'drop') onDrop(payload.paths.map(inputAtPath));
  });
}

export async function saveEpub(blob: Blob, filename: string, language: Language): Promise<boolean> {
  const name = filename.replace(/\.[^/.]+$/, '').replace(/[/:\u0000-\u001f]/g, '_').trim() || 'Doc2EPUB';
  return invoke<boolean>('save_epub', await blob.arrayBuffer(), {
    headers: { 'x-epub-filename': encodeURIComponent(`${name}.epub`), 'x-app-language': language }
  });
}

interface MenuActions {
  open: () => void;
  export: () => void;
  queue: () => void;
  language: (language: Language) => void;
  sample: (index: number) => void;
}

export async function setDesktopMenu(language: Language, actions: MenuActions) {
  const vi = language === 'vi';
  const menu = await Menu.new({ items: [
    { text: 'Doc2EPUB', items: [
      { item: { About: { name: 'Doc2EPUB', version: '1.0.0' } } },
      { text: vi ? 'Cài đặt' : 'Settings', items: [
        { text: 'Tiếng Việt', checked: vi, action: () => actions.language('vi') },
        { text: 'English', checked: !vi, action: () => actions.language('en') }
      ] },
      { item: 'Separator' },
      { item: 'Quit' }
    ] },
    { text: vi ? 'Tệp' : 'File', items: [
      { text: vi ? 'Mở tài liệu…' : 'Open documents…', accelerator: 'Cmd+O', action: actions.open },
      { text: vi ? 'Xuất EPUB…' : 'Export EPUB…', accelerator: 'Cmd+Enter', action: actions.export },
      { item: 'Separator' },
      { text: vi ? 'Hàng đợi' : 'Batch queue', action: actions.queue }
    ] },
    { text: vi ? 'Sửa' : 'Edit', items: [
      { item: 'Undo' }, { item: 'Redo' }, { item: 'Separator' },
      { item: 'Cut' }, { item: 'Copy' }, { item: 'Paste' }, { item: 'SelectAll' }
    ] },
    { text: vi ? 'Xem' : 'View', items: [{ item: 'Fullscreen' }] },
    { text: vi ? 'Trợ giúp' : 'Help', items: SAMPLE_DOCUMENTS.map((sample, index) => ({
      text: sample.title, action: () => actions.sample(index)
    })) }
  ] });
  const previous = await menu.setAsAppMenu();
  void previous?.close().catch(() => {});
}
