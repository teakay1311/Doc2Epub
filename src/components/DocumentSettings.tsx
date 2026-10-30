import React, { useRef } from 'react';
import { BookMetadata, DocumentStats, CoverCandidate } from '../types/document';
import { Image as ImageIcon, Trash2, Globe, User, Book, Sparkles, Check, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DocumentSettingsProps {
  metadata: BookMetadata;
  stats: DocumentStats;
  filename: string;
  fileType: string;
  coverCandidates?: CoverCandidate[];
  onUpdateMetadata: (updated: Partial<BookMetadata>) => void;
  onResetFile: () => void;
}

export const DocumentSettings: React.FC<DocumentSettingsProps> = ({
  metadata,
  stats,
  filename,
  fileType,
  coverCandidates = [],
  onUpdateMetadata,
  onResetFile
}) => {
  const { t } = useLanguage();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateMetadata({
            coverImage: {
              dataUrl: reader.result,
              mediaType: file.type || 'image/jpeg',
              filename: file.name
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectCandidate = (candidate: CoverCandidate) => {
    // If already active, clicking toggles or re-affirms
    if (metadata.coverImage?.dataUrl === candidate.dataUrl) {
      return;
    }
    onUpdateMetadata({
      coverImage: {
        dataUrl: candidate.dataUrl,
        mediaType: 'image/jpeg',
        filename: `${candidate.id}.jpg`
      }
    });
  };

  const removeCover = () => {
    onUpdateMetadata({ coverImage: undefined });
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* File info banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 truncate">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase shrink-0">
            {fileType}
          </div>
          <div className="truncate">
            <h4 className="text-sm font-semibold text-slate-900 truncate" title={filename}>
              {filename}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>{stats.wordCount.toLocaleString()} {t.settings.words}</span>
              <span>·</span>
              <span>{stats.charCount.toLocaleString()} {t.settings.characters}</span>
              {stats.pageCount && (
                <>
                  <span>·</span>
                  <span>{stats.pageCount} {t.settings.pages}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onResetFile}
          className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors px-2 py-1 hover:bg-slate-50 rounded-lg cursor-pointer"
        >
          {t.settings.changeFile}
        </button>
      </div>

      {/* Inputs Form */}
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
            <Book className="w-3.5 h-3.5 text-slate-400" />
            {t.settings.bookTitleLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => onUpdateMetadata({ title: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
            placeholder={t.settings.bookTitlePlaceholder}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {t.settings.authorLabel}
            </label>
            <input
              type="text"
              value={metadata.author}
              onChange={(e) => onUpdateMetadata({ author: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400"
              placeholder={t.settings.authorPlaceholder}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {t.settings.langLabel}
            </label>
            <select
              value={metadata.language}
              onChange={(e) => onUpdateMetadata({ language: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-900 outline-none transition-all bg-white cursor-pointer"
            >
              <option value="vi">Tiếng Việt (vi)</option>
              <option value="en">English (en)</option>
              <option value="fr">Français (fr)</option>
              <option value="ja">日本語 (ja)</option>
              <option value="zh">中文 (zh)</option>
            </select>
          </div>
        </div>

        {/* Cover Suggestions from Document Scanning */}
        {coverCandidates.length > 0 && (
          <div className="pt-2">
            <div className="mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">
                  {t.settings.coverSuggestionsHeading}
                </span>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full border border-indigo-100">
                  {coverCandidates.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t.settings.coverSuggestionsSub}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {coverCandidates.map((c) => {
                const isActive = metadata.coverImage?.dataUrl === c.dataUrl;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCandidate(c)}
                    className={`relative group rounded-xl p-2 text-left transition-all border flex flex-col items-center cursor-pointer ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Active Badge */}
                    {isActive && (
                      <div className="absolute top-1 right-1 z-10 bg-indigo-600 text-white rounded-full p-1 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className="w-full aspect-[3/4] bg-slate-200 rounded-lg overflow-hidden border border-slate-200/80 mb-2 relative flex items-center justify-center">
                      {c.dataUrl ? (
                        <img
                          src={c.dataUrl}
                          alt={c.label}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                        />
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center gap-1 text-[11px]">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}

                      {/* Source tag badge */}
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-900/75 text-white backdrop-blur-xs">
                        {c.source === 'page'
                          ? `P.${c.pageNumber || 1}`
                          : c.source === 'embedded'
                          ? 'IMG'
                          : 'AUTO'}
                      </span>
                    </div>

                    {/* Label & Status */}
                    <div className="w-full text-center">
                      <p className="text-[11px] font-semibold text-slate-800 truncate" title={c.label}>
                        {c.label}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {isActive ? (
                          <span className="text-indigo-600 font-semibold">{t.settings.activeCoverBadge}</span>
                        ) : (
                          <span className="group-hover:text-indigo-600 transition-colors">
                            {t.settings.useAsCoverBtn}
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Cover Image Uploader / Details */}
        <div className="pt-1">
          <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              {coverCandidates.length > 0 ? t.settings.customCoverUpload : t.settings.coverLabel}
            </span>
            <span className="text-[11px] text-slate-400 font-normal">{t.settings.coverFormat}</span>
          </label>

          {metadata.coverImage ? (
            <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <img
                src={metadata.coverImage.dataUrl}
                alt="Book cover"
                className="w-16 h-22 object-cover rounded-lg shadow-xs border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {metadata.coverImage.filename}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  {t.settings.coverReady}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                  >
                    {t.settings.changeFile}
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={removeCover}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t.settings.coverRemove}
                  </button>
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div
              onClick={() => coverInputRef.current?.click()}
              className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20"
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span>{t.settings.coverPrompt}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {t.settings.coverRatioHint}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
