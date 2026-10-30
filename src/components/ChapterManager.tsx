import React, { useState } from 'react';
import { Chapter } from '../types/document';
import { ListOrdered, CheckSquare, Square, Edit2, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ChapterManagerProps {
  chapters: Chapter[];
  onUpdateChapters: (chapters: Chapter[]) => void;
  selectedChapterId: string;
  onSelectChapter: (id: string) => void;
}

export const ChapterManager: React.FC<ChapterManagerProps> = ({
  chapters,
  onUpdateChapters,
  selectedChapterId,
  onSelectChapter
}) => {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startRename = (ch: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(ch.id);
    setEditingTitle(ch.title);
  };

  const saveRename = (id: string) => {
    if (!editingTitle.trim()) return;
    const updated = chapters.map((ch) =>
      ch.id === id ? { ...ch, title: editingTitle.trim() } : ch
    );
    onUpdateChapters(updated);
    setEditingId(null);
  };

  const toggleIncludeInToc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = chapters.map((ch) =>
      ch.id === id ? { ...ch, includedInToc: !ch.includedInToc } : ch
    );
    onUpdateChapters(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-900">
            {t.chapters.title} ({chapters.length})
          </h4>
        </div>
        <span className="text-[11px] text-slate-500">
          {t.chapters.subtitle}
        </span>
      </div>

      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
        {chapters.map((ch, index) => {
          const isSelected = ch.id === selectedChapterId;
          const isEditing = ch.id === editingId;

          return (
            <div
              key={ch.id}
              onClick={() => onSelectChapter(ch.id)}
              className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-sm transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium'
                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xs font-mono text-slate-400 shrink-0 w-5 text-right">
                  {index + 1}.
                </span>

                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5 flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(ch.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="px-2 py-1 text-xs border border-indigo-400 rounded-md bg-white w-full outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => saveRename(ch.id)}
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      title={t.chapters.saveRename}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="truncate text-xs font-medium text-slate-900 flex-1">
                    {ch.title}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!isEditing && (
                  <button
                    onClick={(e) => startRename(ch, e)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors cursor-pointer"
                    title={t.chapters.renameHint}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={(e) => toggleIncludeInToc(ch.id, e)}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    ch.includedInToc
                      ? 'text-indigo-600 hover:bg-indigo-100/60'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={t.chapters.tocToggleHint}
                >
                  {ch.includedInToc ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 italic pt-1">
        {t.chapters.tocToggleHelp}
      </p>
    </div>
  );
};
