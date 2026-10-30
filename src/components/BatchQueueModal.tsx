import React, { useRef, useState } from 'react';
import { X, UploadCloud, Play, CheckCircle2, AlertCircle, Loader2, Download, Trash2, Files } from 'lucide-react';
import { BatchItem } from '../types/document';
import { parseDocumentFile } from '../services/documentService';
import { generateEpub } from '../utils/epubGenerator';
import { useLanguage } from '../context/LanguageContext';

interface BatchQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchItems: BatchItem[];
  onUpdateBatchItems: (items: BatchItem[]) => void;
}

export const BatchQueueModal: React.FC<BatchQueueModalProps> = ({
  isOpen,
  onClose,
  batchItems,
  onUpdateBatchItems
}) => {
  const { t } = useLanguage();
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: BatchItem[] = Array.from(e.target.files).map((f) => ({
        id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file: f,
        status: 'pending'
      }));
      onUpdateBatchItems([...batchItems, ...newItems]);
    }
  };

  const removeBatchItem = (id: string) => {
    onUpdateBatchItems(batchItems.filter((item) => item.id !== id));
  };

  const runBatchProcessing = async () => {
    if (isProcessingQueue) return;
    setIsProcessingQueue(true);

    const items = [...batchItems];

    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue;

      items[i].status = 'processing';
      onUpdateBatchItems([...items]);

      try {
        const { doc } = await parseDocumentFile(items[i].file);
        const { blob } = await generateEpub(doc);

        items[i].status = 'done';
        items[i].resultBlob = blob;
        items[i].resultSize = blob.size;
        items[i].resultFilename = items[i].file.name.replace(/\.[^/.]+$/, '') + '.epub';
        items[i].doc = doc;
      } catch (err: any) {
        items[i].status = 'error';
        items[i].error = err.message || 'Error processing document';
      }

      onUpdateBatchItems([...items]);
    }

    setIsProcessingQueue(false);
  };

  const downloadItemResult = (item: BatchItem) => {
    if (!item.resultBlob || !item.resultFilename) return;
    const url = URL.createObjectURL(item.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.resultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Files className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.batch.title}
              </h3>
              <p className="text-xs text-slate-500">
                {t.batch.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-500">
              Esc
            </kbd>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm"
            onChange={handleAddFiles}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingQueue}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{t.batch.addFiles}</span>
          </button>

          <button
            onClick={runBatchProcessing}
            disabled={isProcessingQueue || batchItems.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isProcessingQueue ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t.batch.processing}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{t.batch.startAll} ({batchItems.length})</span>
              </>
            )}
          </button>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {batchItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Files className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-sm font-medium text-slate-700">{t.batch.emptyTitle}</p>
              <p className="text-xs text-slate-500">{t.batch.emptyDesc}</p>
            </div>
          ) : (
            batchItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors text-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-mono text-slate-400 w-4 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate text-xs">
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatSize(item.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'pending' && (
                    <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md">
                      {t.batch.pending}
                    </span>
                  )}
                  {item.status === 'processing' && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t.batch.inProgress}
                    </span>
                  )}
                  {item.status === 'done' && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-md font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.batch.done} ({formatSize(item.resultSize || 0)})
                      </span>
                      <button
                        onClick={() => downloadItemResult(item)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold cursor-pointer"
                        title={t.batch.download}
                      >
                        <Download className="w-3 h-3" />
                        {t.batch.download}
                      </button>
                    </div>
                  )}
                  {item.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 px-2 py-0.5 bg-red-50 rounded-md" title={item.error}>
                      <AlertCircle className="w-3 h-3" />
                      {t.batch.error}
                    </span>
                  )}

                  {!isProcessingQueue && (
                    <button
                      onClick={() => removeBatchItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      title={t.batch.remove}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
