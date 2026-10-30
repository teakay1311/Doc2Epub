import React from 'react';
import { Download, CheckCircle2, RotateCcw, BookCheck } from 'lucide-react';
import { EpubValidationResult } from '../types/document';
import { useLanguage } from '../context/LanguageContext';

interface ConversionResultCardProps {
  filename: string;
  epubBlob: Blob;
  validation: EpubValidationResult;
  onReset: () => void;
}

export const ConversionResultCard: React.FC<ConversionResultCardProps> = ({
  filename,
  epubBlob,
  validation,
  onReset
}) => {
  const { language, t } = useLanguage();
  const epubName = filename.replace(/\.[^/.]+$/, '') + '.epub';

  const downloadEpub = () => {
    const url = URL.createObjectURL(epubBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = epubName;
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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center max-w-xl mx-auto space-y-6">
      {/* Success Badge */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          {t.result.successTitle}
        </h3>
        <p className="text-sm text-slate-500">
          {t.result.successDesc}
        </p>
      </div>

      {/* Book File Details Card */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <BookCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-900 truncate max-w-[280px]">
              {epubName}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
            {formatSize(validation.fileSize)}
          </span>
        </div>

        {/* Verification Checklist */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span>
            <span>{t.result.mimetypeValid}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span>
            <span>
              {language === 'vi'
                ? `Mục lục ${validation.chapterCount} chương`
                : `${validation.chapterCount} Chapters in TOC`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span>
            <span>{t.result.opfValid}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span>
            <span>{t.result.unicodeValid}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={downloadEpub}
          className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-150 shadow-sm shadow-indigo-200 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{t.result.downloadBtn}</span>
        </button>

        <button
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>{t.result.convertAnotherBtn}</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500">
        {t.result.readerHint}
      </p>
    </div>
  );
};
