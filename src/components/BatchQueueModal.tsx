import { useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { BatchItem } from '../types/document';
import { useLanguage } from '../context/LanguageContext';
import { formatDocumentMessage } from '../i18n/documentMessages';

interface BatchQueueProps {
  items: BatchItem[];
  isOpen: boolean;
  isBusy: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRun: () => void;
  onSave: (item: BatchItem) => void;
  notice: { text: string; error?: boolean } | null;
}

export function BatchQueueModal({ items, isOpen, isBusy, isProcessing, onClose, onAdd, onRemove, onRun, onSave, notice }: BatchQueueProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { t, language } = useLanguage();
  const vi = language === 'vi';
  const nameCounts = new Map<string, number>();
  const pathCounts = new Map<string, number>();
  for (const { input } of items) {
    nameCounts.set(input.name, (nameCounts.get(input.name) || 0) + 1);
    pathCounts.set(input.path, (pathCounts.get(input.path) || 0) + 1);
  }
  const occurrences = new Map<string, number>();
  const saveLabel = vi ? 'Lưu EPUB…' : 'Save EPUB…';
  useEffect(() => {
    if (isOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [isOpen]);

  return (
    <dialog ref={dialog} aria-labelledby="batch-title" onCancel={onClose}
      className="m-auto max-h-[85vh] w-[min(40rem,calc(100%-2rem))] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/35">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h2 id="batch-title" className="font-semibold">{t.header.batchQueue}</h2>
        <button type="button" onClick={onClose} aria-label={vi ? 'Đóng' : 'Close'} className="rounded-md p-2 hover:bg-slate-100"><X size={18} /></button>
      </header>
      <div className="flex gap-2 border-b border-slate-200 p-4">
        <button type="button" disabled={isBusy} onClick={onAdd}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">{t.batch.addFiles}</button>
        <button type="button" disabled={isBusy || items.every(item => item.status === 'done')} onClick={onRun}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          {isProcessing ? t.batch.processing : t.batch.startAll}
        </button>
      </div>
      {notice && <p className={`px-4 pt-3 text-sm ${notice.error ? "text-red-800" : "text-slate-600"}`} role={notice.error ? "alert" : "status"}>{notice.text}</p>}
      {items.length === 0 && <p className="p-5 text-sm text-slate-600">{t.batch.emptyDesc}</p>}
      <ul className="divide-y divide-slate-100 px-4">
        {items.map(item => {
          const { name, path } = item.input;
          const occurrence = (occurrences.get(path) || 0) + 1;
          occurrences.set(path, occurrence);
          const folder = path.slice(0, path.lastIndexOf('/')) || '/';
          const origin = (nameCounts.get(name) || 0) > 1
            ? folder + ((pathCounts.get(path) || 0) > 1 ? ` · #${occurrence}` : '') : '';
          const source = origin ? `${name} — ${origin}` : name;
          return <li key={item.id} className="flex items-start gap-3 py-3 text-sm">
            <div className="min-w-0 grow">
              <p className="break-all font-medium">{name}</p>
              {origin && <p className="break-all text-xs text-slate-600">{origin}</p>}
              <p role="status" className={item.status === 'error' ? 'text-red-700' : 'text-slate-600'}>
                {item.status === 'processing' ? t.batch.inProgress
                  : item.status === 'error' ? formatDocumentMessage(item.error ?? '', language) : t.batch[item.status]}
              </p>
              {item.warnings?.map(warning => <p key={warning} className="text-amber-800">{warning}</p>)}
              {item.exportWarningCodes?.map(code =>
                <p key={code} className="text-amber-800">{formatDocumentMessage(code, language)}</p>)}
              {!!item.emptyOcrPages?.length && <p className="text-amber-800">
                {vi ? 'OCR không đọc được chữ ở trang' : 'OCR found no text on pages'} {item.emptyOcrPages.join(', ')}
              </p>}
            </div>
            {item.resultBlob && <button type="button" disabled={isBusy} onClick={() => onSave(item)}
              aria-label={`${saveLabel} ${source}`}
              className="rounded-md border border-slate-300 px-2.5 py-1 disabled:opacity-50">{saveLabel}</button>}
            {!isProcessing && <button type="button" disabled={isBusy} onClick={() => onRemove(item.id)}
              aria-label={`${t.batch.remove}: ${source}`} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100">
              <Trash2 size={16} />
            </button>}
          </li>;
        })}
      </ul>
    </dialog>
  );
}
