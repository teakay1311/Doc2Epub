import React from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { ConversionProgress } from '../types/document';
import { useLanguage } from '../context/LanguageContext';

interface ConversionModalProps {
  isOpen: boolean;
  progress: ConversionProgress;
  onCancel: () => void;
}

export const ConversionModal: React.FC<ConversionModalProps> = ({
  isOpen,
  progress,
  onCancel
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const getStepMessage = () => {
    if (progress.stage === 'packaging' && progress.currentStep === 1) return t.conversion.step1;
    if (progress.stage === 'packaging' && progress.currentStep === 2) return t.conversion.step2;
    if (progress.stage === 'validating') return t.conversion.step3;
    return progress.message || t.conversion.step1;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-xl space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>

        <div className="space-y-1">
          <h4 className="text-lg font-bold text-slate-900">
            {t.conversion.modalTitle}
          </h4>
          <p className="text-xs text-slate-500">
            {t.conversion.modalSubtitle}
          </p>
        </div>

        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="truncate max-w-[240px]">{getStepMessage()}</span>
            <span className="font-mono text-indigo-600 shrink-0">
              {progress.percent ? `${progress.percent}%` : `${progress.currentStep}/${progress.totalSteps}`}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percent || (progress.currentStep / progress.totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>{t.conversion.cancelBtn}</span>
            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-500">
              Esc
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
