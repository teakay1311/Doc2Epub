import { useRef, useState } from 'react';
import type { BookMetadata, CoverCandidate } from '../types/document';
import { useLanguage } from '../context/LanguageContext';
import { isEmbeddedImage } from '../utils/inlineContent';

interface DocumentSettingsProps {
  metadata: BookMetadata;
  coverCandidates?: CoverCandidate[];
  onUpdateMetadata: (updated: Partial<BookMetadata>) => void;
}

export function DocumentSettings({ metadata, coverCandidates = [], onUpdateMetadata }: DocumentSettingsProps) {
  const { t, language } = useLanguage();
  const fileInput = useRef<HTMLInputElement>(null);
  const [coverError, setCoverError] = useState(false);

  async function uploadCover(file?: File) {
    if (!file) return;
    setCoverError(false);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      if (!isEmbeddedImage(dataUrl)) throw new Error('Invalid cover');
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      onUpdateMetadata({ coverImage: { dataUrl, mediaType: file.type, filename: file.name } });
    } catch {
      setCoverError(true);
    }
  }

  const inputClass = 'mt-1 block w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm';
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4" aria-label={t.settings.title}>
      <div className="grid gap-3">
        <label className="text-sm font-medium">{t.settings.bookTitleLabel}
          <input className={inputClass} value={metadata.title}
            onChange={event => onUpdateMetadata({ title: event.target.value })} />
        </label>
        <label className="text-sm font-medium">{t.settings.authorLabel}
          <input className={inputClass} value={metadata.author}
            onChange={event => onUpdateMetadata({ author: event.target.value })} />
        </label>
        <label className="text-sm font-medium">{t.settings.langLabel}
          <select className={inputClass} value={metadata.language}
            onChange={event => onUpdateMetadata({ language: event.target.value })}>
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>
        </label>
      </div>
      <div className="space-y-2 border-t border-slate-200 pt-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {metadata.coverImage && <img className="h-12 w-10 rounded object-cover" src={metadata.coverImage.dataUrl} alt={t.settings.coverLabel} />}
          <button type="button" onClick={() => fileInput.current?.click()}
            className="rounded-md border border-slate-300 px-2 py-1">{language === 'vi' ? 'Chọn ảnh bìa…' : 'Choose cover…'}</button>
          {metadata.coverImage && <button type="button" className="px-1 py-1 text-red-700"
            onClick={() => onUpdateMetadata({ coverImage: undefined })}>{t.settings.coverRemove}</button>}
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={event => { void uploadCover(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />
        </div>
        {coverError && <p role="alert" className="text-sm text-red-800">
          {language === 'vi' ? 'Không đọc được ảnh bìa.' : 'The cover image could not be read.'}
        </p>}
        {coverCandidates.some(cover => cover.dataUrl) && (
          <div className="grid grid-cols-3 gap-2" aria-label={t.settings.coverSuggestionsHeading}>
            {coverCandidates.filter(cover => cover.dataUrl).map(cover => {
              const active = metadata.coverImage?.dataUrl === cover.dataUrl;
              return <button key={cover.id} type="button" aria-pressed={active} aria-label={cover.label} title={cover.label}
                className={`overflow-hidden rounded-md border p-1 ${active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                onClick={() => onUpdateMetadata({ coverImage: {
                  dataUrl: cover.dataUrl, mediaType: cover.dataUrl.slice(5, cover.dataUrl.indexOf(';')),
                  filename: cover.label
                } })}>
                <img src={cover.dataUrl} alt="" className="aspect-[3/4] w-full rounded object-cover" />
                <span className="mt-1 block truncate text-xs">{cover.label}</span>
              </button>;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
