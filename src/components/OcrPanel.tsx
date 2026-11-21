import { useState } from 'react';
import { ScanText } from 'lucide-react';
import type { OcrLanguage, OcrMode, OcrProgressUpdate } from '../services/ocrService';
import { useLanguage } from '../context/LanguageContext';

interface OcrPanelProps {
  scanPages: number[];
  totalPages: number;
  progress: OcrProgressUpdate | null;
  isProcessing: boolean;
  disabled: boolean;
  onRun: (mode: OcrMode, language: OcrLanguage) => void;
  onCancel: () => void;
}

export function OcrPanel({ scanPages, totalPages, progress, isProcessing, disabled, onRun, onCancel }: OcrPanelProps) {
  const { t, language } = useLanguage();
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>('vie+eng');
  const vi = language === 'vi';
  const percentage = progress?.currentPage
    ? ((progress.currentPage - 1 + progress.pageProgress / 100) / progress.totalPages) * 100 : 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3.5" aria-label={t.ocr.title}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ScanText className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <span className="font-medium text-sm">OCR</span>
        {!!scanPages.length && <span className="text-sm text-amber-800">
          {vi ? `${scanPages.length}/${totalPages} trang nghi là bản scan` : `${scanPages.length}/${totalPages} likely scanned`}
        </span>}
        {isProcessing ? (
          <button type="button" className="ml-auto px-2 py-1 text-sm text-red-700" onClick={onCancel}>
            {t.ocr.cancelBtn}
          </button>
        ) : (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select aria-label={t.ocr.langSelectLabel} value={ocrLanguage}
              onChange={event => setOcrLanguage(event.target.value as OcrLanguage)}
              disabled={disabled} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
              <option value="vie+eng">{vi ? 'Việt + Anh' : 'Vietnamese + English'}</option>
              <option value="vie">{vi ? 'Tiếng Việt' : 'Vietnamese'}</option>
              <option value="eng">English</option>
            </select>
            {!!scanPages.length && <button type="button" disabled={disabled}
              className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm text-indigo-800 disabled:opacity-50"
              onClick={() => onRun('scanned-only', ocrLanguage)}>{t.ocr.btnScannedOnly}</button>}
            <button type="button" disabled={disabled}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
              onClick={() => onRun('all', ocrLanguage)}>{t.ocr.btnAll}</button>
          </div>
        )}
      </div>
      {isProcessing && <div role="status" className="mt-2 flex items-center gap-3 text-sm text-slate-600">
        <progress className="w-36 accent-indigo-600" max={100} value={progress?.currentPage ? percentage : undefined} />
        {progress?.currentPage
          ? `${vi ? 'Trang' : 'Page'} ${progress.currentPage}/${progress.totalPages}`
          : vi ? 'Đang khởi động OCR…' : 'Starting OCR…'}
      </div>}
    </section>
  );
}
