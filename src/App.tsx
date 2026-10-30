import React, { useState, useRef } from 'react';
import {
  NormalizedDocument,
  ConversionProgress,
  EpubValidationResult,
  BatchItem,
  BookMetadata,
  Chapter
} from './types/document';
import { parseDocumentFile } from './services/documentService';
import { parsePlainText, parseMarkdown, parseHtmlDocument } from './services/textService';
import { generateEpub } from './utils/epubGenerator';
import { performPdfOcr, applyOcrResultsToDocument, OcrProgressUpdate } from './services/ocrService';
import { getDocumentCoverSuggestions } from './utils/coverExtractor';
import { SampleDocument } from './services/sampleDocuments';
import * as pdfjsLib from 'pdfjs-dist';

import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { SamplePicker } from './components/SamplePicker';
import { DocumentSettings } from './components/DocumentSettings';
import { ChapterManager } from './components/ChapterManager';
import { ContentPreview } from './components/ContentPreview';
import { OcrPanel } from './components/OcrPanel';
import { ConversionModal } from './components/ConversionModal';
import { ConversionResultCard } from './components/ConversionResultCard';
import { BatchQueueModal } from './components/BatchQueueModal';
import { Footer } from './components/Footer';

import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  ScanText,
  AlertCircle
} from 'lucide-react';

function AppContent() {
  const { t, language } = useLanguage();
  const [doc, setDoc] = useState<NormalizedDocument | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [pdfProxy, setPdfProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  // Loading & Progress states
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress>({
    stage: 'idle',
    currentStep: 0,
    totalSteps: 4,
    message: ''
  });

  // OCR state
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgressUpdate | null>(null);
  const ocrAbortControllerRef = useRef<AbortController | null>(null);

  // Result state
  const [convertedEpub, setConvertedEpub] = useState<{
    blob: Blob;
    validation: EpubValidationResult;
  } | null>(null);

  // Batch Queue state
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  const converterSectionRef = useRef<HTMLDivElement>(null);

  // Run Conversion to EPUB
  const handleConvertToEpub = async () => {
    if (!doc || isConverting) return;
    setIsConverting(true);
    setConversionProgress({
      stage: 'packaging',
      currentStep: 1,
      totalSteps: 3,
      message: t.conversion.step1,
      percent: 30
    });

    try {
      await new Promise((res) => setTimeout(res, 200));

      setConversionProgress({
        stage: 'packaging',
        currentStep: 2,
        totalSteps: 3,
        message: t.conversion.step2,
        percent: 65
      });

      const { blob, validation } = await generateEpub(doc);

      setConversionProgress({
        stage: 'validating',
        currentStep: 3,
        totalSteps: 3,
        message: t.conversion.step3,
        percent: 90
      });

      await new Promise((res) => setTimeout(res, 250));

      setConvertedEpub({ blob, validation });
    } catch (err: any) {
      alert(`Error converting to EPUB: ${err.message || 'Failed to generate EPUB'}`);
    } finally {
      setIsConverting(false);
    }
  };

  // Keyboard Shortcuts Hook
  const { modKeySymbol, enterKeySymbol } = useKeyboardShortcuts({
    onTriggerConvert: () => {
      if (doc && !isConverting && !convertedEpub) {
        handleConvertToEpub();
      }
    },
    onEscape: () => {
      if (isConverting) {
        setIsConverting(false);
      } else if (isBatchOpen) {
        setIsBatchOpen(false);
      } else if (isOcrProcessing) {
        handleCancelOcr();
      }
    },
    isConvertEnabled: !!doc && !isConverting && !convertedEpub
  });

  // Handle uploaded file
  const handleFileSelected = async (file: File) => {
    setExtractionError(null);
    setIsExtracting(true);
    setConvertedEpub(null);

    try {
      const result = await parseDocumentFile(file, (p) => {
        setConversionProgress(p);
      });

      // Scan initial pages & embedded images for cover candidates
      try {
        const candidates = await getDocumentCoverSuggestions(
          result.doc,
          result.pdfProxy,
          language
        );
        result.doc.coverCandidates = candidates;
        if (result.doc.fileType === 'pdf' && candidates.length > 0 && !result.doc.metadata.coverImage) {
          const p1 = candidates.find((c) => c.id === 'pdf-page-1');
          if (p1 && p1.dataUrl) {
            result.doc.metadata.coverImage = {
              dataUrl: p1.dataUrl,
              mediaType: 'image/jpeg',
              filename: 'cover-page-1.jpg'
            };
          }
        }
      } catch (covErr) {
        console.warn('Cover candidate extraction failed:', covErr);
      }

      setDoc(result.doc);
      if (result.doc.chapters.length > 0) {
        setSelectedChapterId(result.doc.chapters[0].id);
      }
      if (result.pdfProxy) {
        setPdfProxy(result.pdfProxy);
      } else {
        setPdfProxy(null);
      }
    } catch (err: any) {
      console.error(err);
      setExtractionError(err.message || 'Failed to extract document');
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle sample document load
  const handleSelectSample = (sample: SampleDocument) => {
    setExtractionError(null);
    setConvertedEpub(null);
    setPdfProxy(null);

    let parsedDoc: NormalizedDocument;
    const fakeSize = sample.content.length;

    if (sample.type === 'txt') {
      parsedDoc = parsePlainText(sample.content, sample.filename, fakeSize);
    } else if (sample.type === 'md') {
      parsedDoc = parseMarkdown(sample.content, sample.filename, fakeSize);
    } else {
      parsedDoc = parseHtmlDocument(sample.content, sample.filename, fakeSize);
    }

    setDoc(parsedDoc);
    if (parsedDoc.chapters.length > 0) {
      setSelectedChapterId(parsedDoc.chapters[0].id);
    }

    // Extract cover candidates for sample document
    getDocumentCoverSuggestions(parsedDoc, null, language)
      .then((candidates) => {
        setDoc((prev) => (prev ? { ...prev, coverCandidates: candidates } : prev));
      })
      .catch((err) => console.warn('Sample cover extraction failed:', err));

    converterSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Metadata update
  const handleUpdateMetadata = (updated: Partial<BookMetadata>) => {
    if (!doc) return;
    setDoc({
      ...doc,
      metadata: {
        ...doc.metadata,
        ...updated
      }
    });
  };

  // Chapters update
  const handleUpdateChapters = (updatedChapters: Chapter[]) => {
    if (!doc) return;
    setDoc({
      ...doc,
      chapters: updatedChapters
    });
  };

  // OCR Execution
  const handleRunOcr = async (mode: 'scanned-only' | 'all', language: string) => {
    if (!pdfProxy || !doc) return;

    const totalPages = pdfProxy.numPages;
    let pagesToOcr: number[] = [];

    for (let p = 1; p <= totalPages; p++) {
      pagesToOcr.push(p);
    }

    const abortController = new AbortController();
    ocrAbortControllerRef.current = abortController;
    setIsOcrProcessing(true);

    try {
      const ocrElements = await performPdfOcr(
        pdfProxy,
        pagesToOcr,
        language,
        (p) => setOcrProgress(p),
        abortController.signal
      );

      const updatedDoc = applyOcrResultsToDocument(doc, ocrElements);
      setDoc(updatedDoc);
      if (updatedDoc.chapters.length > 0) {
        setSelectedChapterId(updatedDoc.chapters[0].id);
      }
    } catch (err: any) {
      if (err.message?.includes('hủy') || err.message?.includes('cancel')) {
        console.log('OCR cancelled by user');
      } else {
        alert(`OCR Error: ${err.message}`);
      }
    } finally {
      setIsOcrProcessing(false);
      setOcrProgress(null);
      ocrAbortControllerRef.current = null;
    }
  };

  const handleCancelOcr = () => {
    if (ocrAbortControllerRef.current) {
      ocrAbortControllerRef.current.abort();
    }
  };

  const handleReset = () => {
    setDoc(null);
    setConvertedEpub(null);
    setPdfProxy(null);
    setSelectedChapterId('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <Header
        onOpenBatch={() => setIsBatchOpen(true)}
        onScrollToSamples={() => {
          const el = document.getElementById('samples');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        batchCount={batchItems.length}
        modKeySymbol={modKeySymbol}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t.hero.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Main Converter Card Area */}
        <div ref={converterSectionRef} id="converter" className="scroll-mt-20">
          {convertedEpub && doc ? (
            <ConversionResultCard
              filename={doc.filename}
              epubBlob={convertedEpub.blob}
              validation={convertedEpub.validation}
              onReset={handleReset}
            />
          ) : !doc ? (
            <div className="max-w-3xl mx-auto">
              <FileUploader
                onFileSelected={handleFileSelected}
                isLoading={isExtracting}
                error={extractionError}
              />
              <SamplePicker
                onSelectSample={handleSelectSample}
                isLoading={isExtracting}
              />
            </div>
          ) : (
            /* Document Loaded: 2-Column Split Workspace */
            <div className="space-y-6">
              {/* Warnings Banner if any */}
              {doc.warnings.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Lưu ý về cấu trúc tài liệu / Document Notice:</span>
                  </div>
                  {doc.warnings.map((w, idx) => (
                    <p key={idx} className="pl-5 text-amber-800">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* OCR Panel if PDF with scanned pages */}
              {doc.fileType === 'pdf' && (
                <OcrPanel
                  scannedPagesCount={doc.scannedPagesCount}
                  totalPages={doc.stats.pageCount}
                  isProcessing={isOcrProcessing}
                  ocrProgress={ocrProgress}
                  onRunOcr={handleRunOcr}
                  onCancelOcr={handleCancelOcr}
                />
              )}

              {/* 2-Column Workspace Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Settings, Chapters & Convert CTA (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <DocumentSettings
                    metadata={doc.metadata}
                    stats={doc.stats}
                    filename={doc.filename}
                    fileType={doc.fileType}
                    coverCandidates={doc.coverCandidates}
                    onUpdateMetadata={handleUpdateMetadata}
                    onResetFile={handleReset}
                  />

                  <ChapterManager
                    chapters={doc.chapters}
                    onUpdateChapters={handleUpdateChapters}
                    selectedChapterId={selectedChapterId}
                    onSelectChapter={setSelectedChapterId}
                  />

                  {/* Primary Convert Button with Keyboard Shortcut Badge */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                    <button
                      onClick={handleConvertToEpub}
                      disabled={isConverting || isOcrProcessing}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50 group"
                      title={`${t.conversion.convertBtn} (${modKeySymbol}${enterKeySymbol})`}
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>{t.conversion.convertBtn}</span>
                      <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-700/90 border border-indigo-400/40 text-indigo-100">
                        {modKeySymbol}{enterKeySymbol}
                      </kbd>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>{t.conversion.standardHint}</span>
                      <span className="font-mono text-slate-400">Esc để hủy</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Book-like Preview (7 cols) */}
                <div className="lg:col-span-7 sticky top-20">
                  <ContentPreview
                    chapters={doc.chapters}
                    currentChapterId={selectedChapterId}
                    onSelectChapter={setSelectedChapterId}
                    bookTitle={doc.metadata.title}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div id="features" className="pt-12 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t.features.sectionTitle}
            </h2>
            <p className="text-sm text-slate-500">
              {t.features.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {t.features.f1Title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.features.f1Desc}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ScanText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {t.features.f2Title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.features.f2Desc}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {t.features.f3Title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.features.f3Desc}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Progress & Cancel Modal */}
      <ConversionModal
        isOpen={isConverting}
        progress={conversionProgress}
        onCancel={() => setIsConverting(false)}
      />

      {/* Batch Processing Queue Modal */}
      <BatchQueueModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        batchItems={batchItems}
        onUpdateBatchItems={setBatchItems}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
