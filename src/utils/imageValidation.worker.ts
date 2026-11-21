import { decode } from 'virtual:doc2epub-jpeg-decoder';
import { validatePng } from './pngValidation';

type Request = { mime: 'image/jpeg' | 'image/png'; bytes: Uint8Array<ArrayBuffer> };

function validateJpeg(bytes: Uint8Array): 'valid' | 'invalid' | 'limit' {
  try {
    const { width, height } = decode(bytes, {
      tolerantDecoding: false, useTArray: true, formatAsRGBA: false,
      maxResolutionInMP: 100, maxMemoryUsageInMB: 512
    });
    return width > 0 && height > 0 ? 'valid' : 'invalid';
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return /^(maxResolutionInMP|maxMemoryUsageInMB) limit exceeded|^Could not allocate enough memory/.test(message)
      ? 'limit' : 'invalid';
  }
}

self.onmessage = ({ data }: MessageEvent<Request>) => {
  try {
    if (data.mime === 'image/png') {
      self.postMessage(validatePng(data.bytes) ? 'valid' : 'invalid');
    } else {
      self.postMessage(validateJpeg(data.bytes));
    }
  } catch {
    self.postMessage('failed');
  }
};
