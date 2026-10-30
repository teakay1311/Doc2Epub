import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, FileCode, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  error?: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  isLoading,
  error
}) => {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSelect(file);
    }
  };

  const validateAndSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'txt', 'md', 'markdown', 'html', 'htm'];
    if (!ext || !allowed.includes(ext)) {
      alert(t.uploader.unsupportedAlert);
      return;
    }
    onFileSelected(file);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.005] shadow-lg shadow-indigo-100'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50 shadow-sm'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm"
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              isDragOver ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-lg font-semibold text-slate-900">
              {t.uploader.titleDrop}{' '}
              <span className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                {t.uploader.titleSelect}
              </span>
            </h3>
            <p className="text-sm text-slate-500">
              {t.uploader.desc}
            </p>
          </div>

          {/* Supported Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md font-medium">
              <FileText className="w-3.5 h-3.5 text-red-500" /> {t.uploader.pdfBadge}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md font-medium">
              <FileText className="w-3.5 h-3.5 text-blue-500" /> {t.uploader.docxBadge}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md font-medium">
              <FileCode className="w-3.5 h-3.5 text-emerald-600" /> {t.uploader.txtBadge}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md font-medium">
              <FileCode className="w-3.5 h-3.5 text-amber-600" /> {t.uploader.htmlBadge}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="font-semibold">{t.uploader.errorTitle}</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
