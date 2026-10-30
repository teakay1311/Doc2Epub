import React from 'react';
import { BookOpen, Files, Globe, Command } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  onOpenBatch: () => void;
  onScrollToSamples: () => void;
  batchCount: number;
  modKeySymbol: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBatch,
  onScrollToSamples,
  batchCount,
  modKeySymbol
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a href="/" className="flex items-center gap-2.5 text-slate-900 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight leading-none text-slate-900">
              Doc<span className="text-indigo-600">2</span>EPUB
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-500 font-medium tracking-wide">
              {t.header.subtitle}
            </span>
          </div>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a href="#converter" className="hover:text-indigo-600 transition-colors whitespace-nowrap">
            {t.header.converter}
          </a>
          <button
            onClick={onScrollToSamples}
            className="hover:text-indigo-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.header.samples}
          </button>
          <a href="#features" className="hover:text-indigo-600 transition-colors whitespace-nowrap">
            {t.header.features}
          </a>
          <a href="#privacy" className="hover:text-indigo-600 transition-colors whitespace-nowrap">
            {t.header.privacy}
          </a>
        </nav>

        {/* Zone 3: Primary Actions (Language switcher + Batch Queue) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher Button (VI | EN) */}
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setLanguage('vi')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                language === 'vi'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chuyển sang Tiếng Việt"
            >
              VI
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Switch to English"
            >
              EN
            </button>
          </div>

          {/* Batch Queue Button */}
          <button
            onClick={onOpenBatch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title={language === 'vi' ? 'Hàng đợi nhiều tệp' : 'Batch Queue'}
          >
            <Files className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
            <span>{t.header.batchQueue}</span>
            {batchCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                {batchCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
