import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);
const moduleId = 'virtual:doc2epub-jpeg-decoder';
const patches = [
  [
    'for (n = 0; n < resetInterval; n++) {\n          decodeBlock(component, decodeFn, mcu);',
    'for (n = 0; n < resetInterval && mcu < mcuExpected; n++) {\n          decodeBlock(component, decodeFn, mcu);'
  ],
  [
    '      else\n        break;\n    }\n\n    return offset - startOffset;',
    '      else {\n        if (mcu < mcuExpected && !opts.tolerantDecoding)\n          throw new Error("Incomplete JPEG scan");\n        break;\n      }\n    }\n\n    return offset - startOffset;'
  ],
  [
    "if (typeof module !== 'undefined') {\n\tmodule.exports = decode;\n} else if (typeof window !== 'undefined') {\n\twindow['jpeg-js'] = window['jpeg-js'] || {};\n\twindow['jpeg-js'].decode = decode;\n}",
    'export { decode };'
  ]
];

export function patchedJpegDecoder(): string {
  const version = require('jpeg-js/package.json').version;
  if (version !== '0.4.4') throw new Error(`JPEG decoder patch expects jpeg-js 0.4.4, found ${version}`);
  const source = readFileSync(require.resolve('jpeg-js/lib/decoder.js'), 'utf8');
  return patches.reduce((code, [before, after], index) => {
    if (code.split(before).length !== 2) {
      throw new Error(`JPEG decoder patch ${index + 1} does not match jpeg-js ${version}`);
    }
    return code.replace(before, after);
  }, source);
}

export function jpegDecoderPlugin(): Plugin {
  return {
    name: 'doc2epub-jpeg-decoder',
    resolveId(id) {
      if (id === moduleId) return '\0' + moduleId;
    },
    load(id) {
      if (id === '\0' + moduleId) return patchedJpegDecoder();
    }
  };
}
