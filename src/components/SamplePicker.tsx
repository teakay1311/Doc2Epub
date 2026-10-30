import React from 'react';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../services/sampleDocuments';
import { Sparkles, FileText, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SamplePickerProps {
  onSelectSample: (sample: SampleDocument) => void;
  isLoading: boolean;
}

export const SamplePicker: React.FC<SamplePickerProps> = ({ onSelectSample, isLoading }) => {
  const { language, t } = useLanguage();

  const getSampleDesc = (sampleId: string, defaultDesc: string) => {
    if (language === 'en') {
      if (sampleId === 'sample-kieu') return t.samples.sampleKieuDesc;
      if (sampleId === 'sample-productivity') return t.samples.sampleProdDesc;
      if (sampleId === 'sample-tech') return t.samples.sampleTechDesc;
    }
    return defaultDesc;
  };

  const getSampleTitle = (sample: SampleDocument) => {
    if (language === 'en') {
      if (sample.id === 'sample-kieu') return 'The Tale of Kieu — Nguyen Du (Selected Excerpt)';
      if (sample.id === 'sample-productivity') return 'Personal Productivity & Deep Work Handbook';
      if (sample.id === 'sample-tech') return 'Modern Web Architecture & EPUB 3 Standards';
    }
    return sample.title;
  };

  return (
    <div id="samples" className="w-full mt-6 pt-6 border-t border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-900">
            {t.samples.heading}
          </h4>
        </div>
        <span className="text-xs text-slate-500">{t.samples.subheading}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SAMPLE_DOCUMENTS.map((sample) => (
          <button
            key={sample.id}
            onClick={() => !isLoading && onSelectSample(sample)}
            disabled={isLoading}
            className="flex flex-col text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-150 group cursor-pointer shadow-xs disabled:opacity-50"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                <FileText className="w-3.5 h-3.5" />
                {sample.type.toUpperCase()} · {sample.sizeStr}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <h5 className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
              {getSampleTitle(sample)}
            </h5>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
              {getSampleDesc(sample.id, sample.description)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
