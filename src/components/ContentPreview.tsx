import React, { useState } from 'react';
import { Chapter, ContentElement } from '../types/document';
import { BookOpen, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ContentPreviewProps {
  chapters: Chapter[];
  currentChapterId: string;
  onSelectChapter: (id: string) => void;
  bookTitle: string;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  chapters,
  currentChapterId,
  onSelectChapter,
  bookTitle
}) => {
  const { t } = useLanguage();
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [fontSize, setFontSize] = useState<number>(16);

  const currentChapterIndex = chapters.findIndex((c) => c.id === currentChapterId);
  const currentChapter = chapters[currentChapterIndex] || chapters[0];

  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  // Calculate chapter stats
  const chapterWords = (currentChapter?.elements || []).reduce((acc, el) => {
    if (el.text) return acc + el.text.trim().split(/\s+/).filter(Boolean).length;
    if (el.items) {
      return acc + el.items.reduce((s, it) => s + it.trim().split(/\s+/).filter(Boolean).length, 0);
    }
    return acc;
  }, 0);

  const readingMinutes = Math.max(1, Math.round(chapterWords / 200));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full min-h-[580px] overflow-hidden">
      {/* Top Preview Toolbar */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-800">
              {t.preview.title}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Chapter Selector Dropdown */}
          <select
            value={currentChapter?.id || ''}
            onChange={(e) => onSelectChapter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 max-w-[200px] truncate outline-none cursor-pointer"
          >
            {chapters.map((ch, idx) => (
              <option key={ch.id} value={ch.id}>
                {idx + 1}. {ch.title}
              </option>
            ))}
          </select>
        </div>

        {/* Reader Customization Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>~{readingMinutes} {t.preview.readingTime}</span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Font Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-2 py-0.5 rounded font-serif transition-colors cursor-pointer ${
                fontFamily === 'serif' ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Serif font"
            >
              {t.preview.serif}
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-2 py-0.5 rounded font-sans transition-colors cursor-pointer ${
                fontFamily === 'sans' ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Sans font"
            >
              {t.preview.sans}
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFontSize((prev) => Math.max(13, prev - 1))}
              className="px-2 py-0.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold"
              title={t.preview.decreaseFont}
            >
              A-
            </button>
            <span className="px-1 text-[11px] font-mono text-slate-400">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((prev) => Math.min(22, prev + 1))}
              className="px-2 py-0.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold"
              title={t.preview.increaseFont}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Book Reading Page Container */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-[#FAF9F5] selection:bg-indigo-100">
        <div
          className={`max-w-2xl mx-auto ${
            fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {/* Chapter Heading Banner */}
          <div className="mb-8 pb-4 border-b border-stone-200 text-center">
            <span className="text-xs uppercase tracking-widest text-stone-600 font-sans font-semibold">
              {t.preview.chapterNumber} {currentChapterIndex + 1} / {chapters.length}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2 font-sans tracking-tight">
              {currentChapter?.title || bookTitle}
            </h2>
          </div>

          {/* Render Elements */}
          {currentChapter?.elements && currentChapter.elements.length > 0 ? (
            <div className="space-y-4 text-stone-800 leading-relaxed text-justify">
              {currentChapter.elements
                .filter((el, idx) => !(idx === 0 && el.type === 'heading' && el.text === currentChapter?.title))
                .map((el) => (
                  <RenderElement key={el.id} el={el} />
                ))}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-600 italic">
              {t.preview.noContent}
            </div>
          )}

          {/* Bottom Chapter Pager */}
          <div className="mt-12 pt-6 border-t border-stone-200 flex items-center justify-between text-xs font-sans text-stone-600">
            {prevChapter ? (
              <button
                onClick={() => onSelectChapter(prevChapter.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="truncate max-w-[140px]">{prevChapter.title}</span>
              </button>
            ) : <div />}

            {nextChapter ? (
              <button
                onClick={() => onSelectChapter(nextChapter.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <span className="truncate max-w-[140px]">{nextChapter.title}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatInlineText(text: string): React.ReactNode {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="italic text-stone-700">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

const RenderElement: React.FC<{ el: ContentElement }> = ({ el }) => {
  switch (el.type) {
    case 'heading': {
      const level = el.level || 2;
      if (level === 1) {
        return <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 mt-6 mb-3">{el.text}</h1>;
      }
      if (level === 2) {
        return <h2 className="text-lg sm:text-xl font-bold font-sans text-stone-900 mt-5 mb-2">{el.text}</h2>;
      }
      return <h3 className="text-base sm:text-lg font-semibold font-sans text-stone-900 mt-4 mb-2">{el.text}</h3>;
    }
    case 'paragraph': {
      return <p className="indent-6 leading-relaxed my-2">{formatInlineText(el.text || '')}</p>;
    }
    case 'list': {
      const isOrdered = el.listType === 'ordered';
      const Tag = isOrdered ? 'ol' : 'ul';
      return (
        <Tag className={`my-3 pl-6 space-y-1 ${isOrdered ? 'list-decimal' : 'list-disc'}`}>
          {(el.items || []).map((item, idx) => (
            <li key={idx} className="leading-normal">{item}</li>
          ))}
        </Tag>
      );
    }
    case 'blockquote': {
      return (
        <blockquote className="my-4 pl-4 border-l-2 border-stone-400 italic text-stone-600">
          {el.text}
        </blockquote>
      );
    }
    case 'code': {
      return (
        <pre className="my-3 p-3 bg-stone-100 rounded-lg text-xs font-mono text-stone-800 overflow-x-auto whitespace-pre-wrap">
          {el.text}
        </pre>
      );
    }
    case 'divider': {
      return <hr className="my-6 border-stone-300 w-1/3 mx-auto" />;
    }
    case 'table': {
      return (
        <div className="overflow-x-auto my-4 border border-stone-200 rounded-lg">
          <table className="w-full text-xs text-left">
            {el.headers && (
              <thead className="bg-stone-100 font-sans font-semibold text-stone-900 border-b border-stone-200">
                <tr>
                  {el.headers.map((h, i) => (
                    <th key={i} className="p-2 border-r border-stone-200 last:border-0">{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(el.rows || []).map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-stone-100 last:border-0">
                  {row.map((c, cIdx) => (
                    <td key={cIdx} className="p-2 border-r border-stone-100 last:border-0">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'image': {
      return (
        <figure className="my-4 text-center">
          <img src={el.src} alt={el.alt || 'Illustration'} className="max-w-full h-auto mx-auto rounded-lg shadow-xs" />
          {el.caption && (
            <figcaption className="text-xs text-stone-500 mt-1.5 italic">{el.caption}</figcaption>
          )}
        </figure>
      );
    }
    default:
      return <p className="my-2">{el.text}</p>;
  }
};
