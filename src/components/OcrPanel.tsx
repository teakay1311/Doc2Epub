import React, { useState } from 'react';
import { ScanText, Loader2 } from 'lucide-react';
import { OcrProgressUpdate } from '../services/ocrService';
import { useLanguage } from '../context/LanguageContext';

interface OcrPanelProps {
  scannedPagesCount?: number;
  totalPages?: number;
  isProcessing: boolean;
  ocrProgress?: OcrProgressUpdate | null;
  onRunOcr: (mode: 'scanned-only' | 'all', language: string) => void;
  onCancelOcr: () => void;
}

export const OcrPanel: React.FC<OcrPanelProps> = ({
  scannedPagesCount = 0,
  totalPages = 0,
  isProcessing,
  ocrProgress,
  onRunOcr,
  onCancelOcr
}) => {
  const { t, language: uiLang } = useLanguage();
  const [language, setLanguage] = useState<'vie+eng' | 'vie' | 'eng'>('vie+eng');

  return (
    <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <ScanText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-950">
              {t.ocr.title}
            </h4>
            <p className="text-xs text-amber-800">
              {scannedPagesCount > 0
                ? uiLang === 'vi'
                  ? `Phát hiện ${scannedPagesCount}/${totalPages} ${t.ocr.detectedScan}`
                  : `Detected ${scannedPagesCount}/${totalPages} ${t.ocr.detectedScan}`
                : t.ocr.improveHint}
            </p>
          </div>
        </div>
      </div>

      {isProcessing && ocrProgress ? (
        <div className="p-3 bg-white/90 rounded-xl border border-amber-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-amber-950">
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>{ocrProgress.statusText}</span>
            </div>
            {ocrProgress.totalPages > 0 && (
              <span className="font-mono">
                {uiLang === 'vi' ? 'Trang' : 'Page'} {ocrProgress.currentPage}/{ocrProgress.totalPages}
              </span>
            )}
          </div>

          <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-600 h-1.5 rounded-full transition-all duration-200"
              style={{
                width: `${
                  ocrProgress.totalPages > 0
                    ? Math.round(
                        ((ocrProgress.currentPage - 1) / ocrProgress.totalPages) * 100 +
                          (ocrProgress.pageProgress / ocrProgress.totalPages)
                      )
                    : ocrProgress.pageProgress
                }%`
              }}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={onCancelOcr}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <span>{t.ocr.cancelBtn}</span>
              <kbd className="px-1 py-0.2 text-[10px] font-mono bg-red-100 rounded border border-red-200">
                Esc
              </kbd>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-amber-900">{t.ocr.langSelectLabel}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-amber-300 bg-white text-slate-800 outline-none cursor-pointer"
            >
              <option value="vie+eng">{t.ocr.langBoth}</option>
              <option value="vie">{t.ocr.langVi}</option>
              <option value="eng">{t.ocr.langEn}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {scannedPagesCount > 0 && (
              <button
                onClick={() => onRunOcr('scanned-only', language)}
                className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                {t.ocr.btnScannedOnly} ({scannedPagesCount})
              </button>
            )}

            <button
              onClick={() => onRunOcr('all', language)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {t.ocr.btnAll} ({totalPages})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
