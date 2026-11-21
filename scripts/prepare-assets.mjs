import { cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const target = fileURLToPath(new URL('../public/converter-assets/', import.meta.url));
const pdf = dirname(require.resolve('pdfjs-dist/package.json'));
const ocr = dirname(require.resolve('tesseract.js/package.json'));
const core = dirname(createRequire(join(ocr, 'package.json')).resolve('tesseract.js-core/package.json'));

await rm(target, { recursive: true, force: true });
await mkdir(join(target, 'ocr', 'core'), { recursive: true });
await mkdir(join(target, 'ocr', 'lang'), { recursive: true });
await mkdir(join(target, 'pdf'), { recursive: true });
await mkdir(join(target, 'licenses'), { recursive: true });

for (const resource of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  await cp(join(pdf, resource), join(target, 'pdf', resource), { recursive: true });
}
await cp(join(pdf, 'legacy', 'build', 'pdf.worker.min.mjs'), join(target, 'pdf', 'pdf.worker.min.mjs'));
await cp(join(ocr, 'dist', 'worker.min.js'), join(target, 'ocr', 'worker.min.js'));
const coreFile = 'tesseract-core-lstm.wasm.js';
await cp(join(core, coreFile), join(target, 'ocr', 'core', coreFile));
for (const language of ['vie', 'eng']) {
  const directory = dirname(require.resolve(`@tesseract.js-data/${language}/package.json`));
  const filename = `${language}.traineddata.gz`;
  await cp(join(directory, '4.0.0_best_int', filename), join(target, 'ocr', 'lang', filename));
  await cp(join(directory, 'README.md'), join(target, 'licenses', `tessdata-${language}.md`));
}
for (const [source, name] of [[pdf, 'pdfjs'], [core, 'tesseract']]) {
  await cp(join(source, 'LICENSE'), join(target, 'licenses', `${name}.txt`));
}
