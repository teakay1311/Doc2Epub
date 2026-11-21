import { useEffect, useRef, useState } from 'react';
import { BookOpen, FileUp, LoaderCircle, Settings2 } from 'lucide-react';
import type { PdfSession } from './services/pdfService';
import type { BatchItem, NormalizedDocument } from './types/document';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { documentErrorCode, formatDocumentNotice, type DocumentNotice } from './i18n/documentMessages';
import { parseDocumentFile } from './services/documentService';
import { chooseDocuments, listenForDrops, readInput, saveEpub, setDesktopMenu } from './services/desktopService';
import type { DocumentInput } from './services/desktopService';
import { SAMPLE_DOCUMENTS } from './services/sampleDocuments';
import { parseHtmlDocument, parseMarkdown, parsePlainText } from './services/textService';
import {
  applyOcrResultsToDocument, pagesForOcr, performPdfOcr,
  type OcrLanguage, type OcrMode, type OcrProgressUpdate
} from './services/ocrService';
import { getDocumentCoverSuggestions } from './utils/coverExtractor';
import { generateEpub } from './utils/epubGenerator';
import { effectiveBookTitle } from './utils/normalizer';
import { BatchQueueModal } from './components/BatchQueueModal';
import { ChapterManager } from './components/ChapterManager';
import { ContentPreview } from './components/ContentPreview';
import { DocumentSettings } from './components/DocumentSettings';
import { OcrPanel } from './components/OcrPanel';

type Task = 'open' | 'parse' | 'ocr' | 'export' | 'queue' | 'save';

function AppContent() {
  const { language, setLanguage, t } = useLanguage();
  const vi = language === 'vi';
  const [doc, setDoc] = useState<NormalizedDocument | null>(null);
  const [chapterId, setChapterId] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useDropStyle, setUseDropStyle] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [progressText, setProgressText] = useState('');
  const [ocrProgress, setOcrProgress] = useState<OcrProgressUpdate | null>(null);
  const [notice, setNotice] = useState<DocumentNotice | null>(null);
  const pdf = useRef<PdfSession | undefined>(undefined);
  const taskRef = useRef<Task | null>(null);
  const cancellation = useRef<AbortController | null>(null);

  function start(next: Task) {
    if (taskRef.current) return false;
    taskRef.current = next;
    setTask(next);
    setProgressText('');
    setNotice(null);
    return true;
  }

  function finish() {
    taskRef.current = null;
    setTask(null);
    setProgressText('');
  }

  function reportError(error: unknown) {
    setNotice({ kind: 'error', message: documentErrorCode(error) });
  }

  function addBatch(inputs: DocumentInput[]) {
    setBatchItems(items => [...items, ...inputs.map(input => ({
      id: crypto.randomUUID(), input, status: 'pending' as const
    }))]);
    setQueueOpen(true);
  }

  async function showDocument(next: NormalizedDocument, proxy?: PdfSession) {
    const candidates = await getDocumentCoverSuggestions(next, proxy?.proxy, language);
    next.coverCandidates = candidates;
    const cover = candidates.find(candidate => candidate.id === 'pdf-page-1');
    if (cover?.dataUrl) {
      next.metadata.coverImage = { dataUrl: cover.dataUrl, mediaType: 'image/jpeg', filename: 'cover-page-1.jpg' };
    }
    const previous = pdf.current;
    pdf.current = proxy;
    if (previous) void previous.dispose().catch(console.warn);
    setDoc(next);
    setChapterId(next.chapters[0]?.id || '');
    setSettingsOpen(false);
  }

  async function receive(inputs: DocumentInput[], toQueue = false) {
    if (inputs.length === 0 || taskRef.current) return;
    if (toQueue || inputs.length > 1) {
      addBatch(inputs);
      return;
    }
    if (!start('parse')) return;
    let proxy: PdfSession | undefined;
    try {
      const parsed = await parseDocumentFile(await readInput(inputs[0]), (current, total) =>
        setProgressText(`${vi ? 'Đang đọc trang' : 'Reading page'} ${current}/${total}`));
      proxy = parsed.pdf;
      await showDocument(parsed.doc, proxy);
    } catch (error) {
      if (proxy && pdf.current !== proxy) void proxy.dispose().catch(console.warn);
      reportError(error);
    } finally {
      finish();
    }
  }

  async function openFiles(toQueue = false) {
    if (!start('open')) return;
    let inputs: DocumentInput[];
    try {
      inputs = await chooseDocuments(language);
    } catch (error) {
      reportError(error);
      return;
    } finally {
      finish();
    }
    await receive(inputs, toQueue);
  }

  async function showSample(index: number) {
    if (!start('parse')) return;
    try {
      const sample = SAMPLE_DOCUMENTS[index];
      const parse = { txt: parsePlainText, md: parseMarkdown, html: parseHtmlDocument }[sample.type];
      await showDocument(parse(sample.content, sample.filename, new Blob([sample.content]).size));
    } catch (error) {
      reportError(error);
    } finally {
      finish();
    }
  }

  async function runOcr(mode: OcrMode, lang: OcrLanguage) {
    if (!doc || !pdf.current || !start('ocr')) return;
    const controller = new AbortController();
    cancellation.current = controller;
    try {
      const results = await performPdfOcr(pdf.current.proxy, pagesForOcr(doc, mode), lang, setOcrProgress, controller.signal);
      controller.signal.throwIfAborted();
      const updated = applyOcrResultsToDocument(doc, results);
      setChapterId(current => updated.chapters.some(chapter => chapter.id === current)
        ? current : (updated.chapters[0]?.id || ''));
      setDoc(updated);
    } catch (error) {
      if (!controller.signal.aborted) reportError(error);
    } finally {
      cancellation.current = null;
      setOcrProgress(null);
      finish();
    }
  }

  async function packageDocument(document: NormalizedDocument, signal?: AbortSignal) {
    const { blob, validation } = await generateEpub(document, signal);
    if (!validation.isValid) throw new Error(validation.errors.join('\n'));
    return { blob, warnings: validation.warnings };
  }

  async function exportDocument() {
    if (!doc || queueOpen || !start('export')) return;
    const controller = new AbortController();
    cancellation.current = controller;
    try {
      const { blob, warnings } = await packageDocument(doc, controller.signal);
      controller.signal.throwIfAborted();
      cancellation.current = null;
      const saved = await saveEpub(blob, doc.filename, language);
      if (saved) setNotice({ kind: 'saved', warnings });
    } catch (error) {
      if (!controller.signal.aborted) reportError(error);
    } finally {
      cancellation.current = null;
      finish();
    }
  }

  async function processBatch() {
    if (!start('queue')) return;
    const update = (id: string, changes: Partial<BatchItem>) =>
      setBatchItems(items => items.map(item => item.id === id ? { ...item, ...changes } : item));
    try {
      for (const item of batchItems) {
        if (item.status === 'done') continue;
        update(item.id, { status: 'processing', error: undefined, emptyOcrPages: undefined });
        let proxy: PdfSession | undefined;
        try {
          const parsed = await parseDocumentFile(await readInput(item.input));
          proxy = parsed.pdf;
          const pages = pagesForOcr(parsed.doc, 'scanned-only');
          const converted = proxy && pages.length > 0
            ? applyOcrResultsToDocument(parsed.doc, await performPdfOcr(proxy.proxy, pages, 'vie+eng'))
            : parsed.doc;
          const result = await packageDocument(converted);
          update(item.id, {
            status: 'done', resultBlob: result.blob, emptyOcrPages: converted.emptyOcrPages,
            warnings: converted.warnings, exportWarningCodes: result.warnings
          });
        } catch (error) {
          update(item.id, { status: 'error', error: documentErrorCode(error) });
        } finally {
          await proxy?.dispose().catch(console.warn);
        }
      }
    } finally {
      finish();
    }
  }

  async function saveBatchItem(item: BatchItem) {
    if (!item.resultBlob || !start('save')) return;
    try {
      if (await saveEpub(item.resultBlob, item.input.name, language)) {
        setNotice({ kind: 'saved', warnings: [] });
      }
    } catch (error) {
      reportError(error);
    } finally {
      finish();
    }
  }

  const currentActions = useRef({ receive, openFiles, exportDocument, showSample, reportError, queueOpen });
  currentActions.current = { receive, openFiles, exportDocument, showSample, reportError, queueOpen };
  useEffect(() => {
    let active = true;
    const listener = listenForDrops(inputs => {
      if (active) void currentActions.current.receive(inputs, currentActions.current.queueOpen);
    }, over => { if (active) setUseDropStyle(over); });
    listener.catch(error => { if (active) currentActions.current.reportError(error); });
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancellation.current?.abort();
    };
    window.addEventListener('keydown', escape);
    return () => {
      active = false;
      window.removeEventListener('keydown', escape);
      void listener.then(unlisten => unlisten()).catch(console.warn);
    };
  }, []);
  useEffect(() => {
    void setDesktopMenu(language, {
      open: () => void currentActions.current.openFiles(),
      export: () => void currentActions.current.exportDocument(),
      queue: () => setQueueOpen(true),
      sample: index => void currentActions.current.showSample(index),
      language: setLanguage
    }).catch(error => currentActions.current.reportError(error));
  }, [language]);

  const openLabel = vi ? 'Mở tài liệu…' : 'Open documents…';
  const exportLabel = vi ? 'Xuất EPUB…' : 'Export EPUB…';
  const taskMessage = progressText || (task === 'parse' ? vi ? 'Đang đọc tài liệu…' : 'Reading document…'
    : task === 'export' ? vi ? 'Đang tạo EPUB…' : 'Preparing EPUB…' : '');
  const renderedNotice = notice && { text: formatDocumentNotice(notice, language), error: notice.kind === 'error' };
  const noticeBanner = renderedNotice && (
    <p className={`rounded-lg border p-3 text-sm whitespace-pre-line ${renderedNotice.error ? 'border-red-200 bg-red-50 text-red-900' : 'border-slate-200 bg-white'}`}
      role={renderedNotice.error ? 'alert' : 'status'}>{renderedNotice.text}</p>
  );

  return (
    <main className={`mx-auto flex min-h-screen max-w-[87rem] flex-col p-4 sm:p-6 ${useDropStyle ? 'bg-indigo-50/70' : ''}`}>
      {doc ? (
        <div className="space-y-4">
          <header className="flex flex-wrap items-center gap-2">
            <div className="mr-auto min-w-0">
              <h1 title={doc.filename} className="truncate text-lg font-semibold">{effectiveBookTitle(doc)}</h1>
              <p className="truncate text-xs text-slate-500">{doc.filename}</p>
            </div>
            <button type="button" disabled={!!task} onClick={() => openFiles()}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50">{openLabel}</button>
            <button type="button" disabled={!!task} onClick={() => setSettingsOpen(open => !open)}
              aria-expanded={settingsOpen} aria-controls="book-settings"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50">
              <Settings2 size={15} aria-hidden="true" />{vi ? 'Tùy chọn sách' : 'Book options'}
            </button>
            <button type="button" disabled={!!task} onClick={exportDocument}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {exportLabel}
            </button>
          </header>
          {noticeBanner}
          {taskMessage && <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />{taskMessage}
            {task === 'export' && cancellation.current && <button type="button"
              className="ml-2 underline" onClick={() => cancellation.current?.abort()}>{t.conversion.cancelBtn}</button>}
          </p>}
          {doc.warnings.map(warning => <p key={warning} className="text-sm text-amber-800">{warning}</p>)}
          {!!doc.emptyOcrPages?.length && <p className="text-sm text-amber-800" role="status">
            {vi ? 'OCR không đọc được chữ ở trang' : 'OCR found no text on pages'} {doc.emptyOcrPages.join(', ')}
          </p>}
          {doc.fileType === 'pdf' && <OcrPanel key={doc.id} scanPages={doc.scanPages || []}
            totalPages={doc.stats.pageCount || 0} progress={ocrProgress} isProcessing={task === 'ocr'}
            disabled={!!task} onRun={runOcr} onCancel={() => cancellation.current?.abort()} />}
          <div className={`grid items-start gap-4 ${settingsOpen ? 'lg:grid-cols-[minmax(0,1fr)_21rem]' : ''}`}>
            <ContentPreview chapters={doc.chapters} onSelectChapter={setChapterId}
              currentChapterId={chapterId} bookTitle={effectiveBookTitle(doc)} />
            {settingsOpen && <aside id="book-settings" className="space-y-3">
              <fieldset disabled={!!task} className="space-y-3">
                <p className="px-1 text-xs text-slate-600">
                  {doc.stats.wordCount.toLocaleString(language)} {t.settings.words} · {doc.stats.charCount.toLocaleString(language)} {t.settings.characters}
                  {doc.stats.pageCount ? ` · ${doc.stats.pageCount} ${t.settings.pages}` : ''}
                </p>
                <DocumentSettings key={doc.id} metadata={doc.metadata} coverCandidates={doc.coverCandidates}
                  onUpdateMetadata={metadata => setDoc(current => current?.id === doc.id
                    ? { ...current, metadata: { ...current.metadata, ...metadata } } : current)} />
                <ChapterManager chapters={doc.chapters} selectedChapterId={chapterId}
                  onSelectChapter={setChapterId} onUpdateChapters={chapters => setDoc({ ...doc, chapters })} />
              </fieldset>
            </aside>}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4">
          {noticeBanner}
          <section className={`flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center ${useDropStyle ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white'}`}>
            <BookOpen size={34} className="text-indigo-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold">{vi ? 'Kéo thả tài liệu vào đây' : 'Drop documents here'}</h1>
            <button type="button" onClick={() => openFiles()} disabled={!!task}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              <FileUp size={16} aria-hidden="true" />{openLabel}
            </button>
            <p className="text-xs text-slate-600">PDF, DOCX, TXT, Markdown, HTML</p>
            {taskMessage && <p role="status" className="text-sm text-slate-600">{taskMessage}</p>}
          </section>
        </div>
      )}
      <BatchQueueModal items={batchItems} isOpen={queueOpen} isBusy={!!task} isProcessing={task === 'queue'}
        onClose={() => setQueueOpen(false)} onAdd={() => openFiles(true)}
        onRemove={id => setBatchItems(items => items.filter(item => item.id !== id))}
        onRun={processBatch} onSave={saveBatchItem} notice={renderedNotice} />
    </main>
  );
}

export default function App() {
  return <LanguageProvider><AppContent /></LanguageProvider>;
}
