import { isEmbeddedImage } from './inlineContent';

const imageTimeout = 30_000;

async function openImageWorker(): Promise<Worker> {
  const { default: ImageWorker } = await import('./imageValidation.worker?worker&inline');
  return new ImageWorker();
}

export function createEpubImageReader(signal?: AbortSignal, openWorker = openImageWorker) {
  let worker: Worker | undefined;
  const dispose = () => {
    worker?.terminate();
    worker = undefined;
  };

  function checkImage(mime: 'image/jpeg' | 'image/png', bytes: Uint8Array): Promise<boolean> {
    const code = mime === 'image/jpeg' ? 'JPEG' : 'PNG';
    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (code: string) => finish(undefined, new Error(code));
      const abort = () => finish(undefined, signal!.reason);
      const timeout = setTimeout(() => fail(`${code}_CHECK_TIMEOUT`), imageTimeout);
      function finish(result: boolean | undefined, error?: unknown) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
        if (worker) {
          worker.onmessage = worker.onerror = worker.onmessageerror = null;
        }
        if (result !== undefined) {
          resolve(result);
        } else {
          dispose();
          reject(error);
        }
      }

      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) {
        abort();
        return;
      }
      void (async () => {
        const pending = worker ?? await openWorker();
        if (settled) {
          pending.terminate();
          return;
        }
        worker = pending;
        pending.onmessage = ({ data }: MessageEvent) => {
          switch (data) {
            case 'valid': finish(true); break;
            case 'invalid': finish(false); break;
            case 'limit': fail('JPEG_CHECK_LIMIT'); break;
            default: fail(`${code}_CHECK_FAILED`);
          }
        };
        pending.onerror = pending.onmessageerror = () => fail(`${code}_CHECK_FAILED`);
        // The ZIP still needs the original bytes, so do not transfer their buffer.
        pending.postMessage({ mime, bytes });
      })().catch(() => fail(`${code}_CHECK_FAILED`));
    });
  }

  async function read(dataUrl: string): Promise<{ data: Uint8Array; mime: string } | null> {
    signal?.throwIfAborted();
    if (!isEmbeddedImage(dataUrl)) return null;
    const separator = dataUrl.indexOf(',');
    const mime = dataUrl.slice(5, dataUrl.indexOf(';')).toLowerCase();
    const body = dataUrl.slice(separator + 1);
    let binary: string;
    try {
      binary = atob(body);
    } catch {
      return null;
    }
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    switch (mime) {
      case 'image/png':
        if (!binary.startsWith('\x89PNG\r\n\x1a\n') || !await checkImage(mime, bytes)) return null;
        break;
      case 'image/jpeg':
        if (!binary.startsWith('\xff\xd8\xff') || !binary.includes('\xff\xd9', 3)) return null;
        if (!await checkImage(mime, bytes)) return null;
        break;
      case 'image/gif':
        if (!/^GIF8[79]a/.test(binary) || !binary.endsWith(';')) return null;
        break;
      case 'image/webp':
        if (bytes.length < 12 || !binary.startsWith('RIFF') || binary.slice(8, 12) !== 'WEBP' ||
            new DataView(bytes.buffer).getUint32(4, true) + 8 !== bytes.length) return null;
        break;
      default:
        return null;
    }

    const image = new Image();
    image.src = `data:${mime};base64,${body}`;
    try {
      await image.decode();
    } catch {
      signal?.throwIfAborted();
      return null;
    }
    signal?.throwIfAborted();
    return image.naturalWidth > 0 && image.naturalHeight > 0 ? { data: bytes, mime } : null;
  }
  return { read, dispose };
}
