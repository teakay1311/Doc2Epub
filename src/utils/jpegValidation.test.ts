import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { patchedJpegDecoder } from '../../scripts/jpeg-decoder-plugin';

test('patched worker decoder accepts a partial restart interval and rejects an incomplete scan', async () => {
  const url = `data:text/javascript;base64,${Buffer.from(patchedJpegDecoder()).toString('base64')}`;
  const { decode }: typeof import('jpeg-js') = await import(url);
  const original = await readFile(new URL('./fixtures/progressive-restart.jpg', import.meta.url));
  const options = { useTArray: true, tolerantDecoding: false, formatAsRGBA: false } as const;
  const image = decode(original, options);
  assert.deepEqual([image.width, image.height], [67, 53]);
  assert.equal(image.data.length, 67 * 53 * 3);

  const restart = original.indexOf(Buffer.from([0xff, 0xd0]));
  assert.ok(restart > 0);
  const truncatedScan = Buffer.concat([original.subarray(0, restart), Buffer.from([0xff, 0xd9])]);
  assert.throws(() => decode(truncatedScan, options), { message: 'Incomplete JPEG scan' });
});
