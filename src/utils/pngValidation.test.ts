import test from 'node:test';
import assert from 'node:assert/strict';
import { crc32, deflateSync, inflateSync } from 'node:zlib';
import { validatePng } from './pngValidation';

const good = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgkYwAAACyAH5m6g6iAAAAAElFTkSuQmCC', 'base64'
);

function pngChunk(name: string, data: Uint8Array): Buffer<ArrayBuffer> {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length);
  out.write(name, 4, 'ascii');
  out.set(data, 8);
  out.writeUInt32BE(crc32(out.subarray(4, data.length + 8)), data.length + 8);
  return out;
}

const idatLength = good.readUInt32BE(33);
const compressed = good.subarray(41, 41 + idatLength);
const pixels = inflateSync(compressed);
const signature = good.subarray(0, 8);
const header = good.subarray(16, 29);
const end = good.subarray(45 + idatLength);

function withIdat(...data: Uint8Array[]): Buffer<ArrayBuffer> {
  return Buffer.concat([good.subarray(0, 33), ...data.map(part => pngChunk('IDAT', part)), end]);
}

function withRows(width: number, height: number, interlace: number, scanlines: Buffer) {
  const dimensions = Buffer.from(header);
  dimensions.writeUInt32BE(width);
  dimensions.writeUInt32BE(height, 4);
  dimensions[12] = interlace;
  return Buffer.concat([signature, pngChunk('IHDR', dimensions), pngChunk('IDAT', deflateSync(scanlines)), end]);
}

test('PNG requires a complete IDAT stream with a valid checksum and the expected rows', () => {
  const badCrc = Buffer.from(good);
  badCrc[41 + idatLength] ^= 1;
  const badAdler = Buffer.from(compressed);
  badAdler[badAdler.length - 1] ^= 1;

  assert.equal(validatePng(good), true);
  assert.equal(validatePng(badCrc), false);
  assert.equal(validatePng(withIdat(badAdler)), false);
  assert.equal(validatePng(withIdat(compressed.subarray(0, -1))), false);
  assert.equal(validatePng(withIdat(deflateSync(pixels.subarray(0, -1)))), false);
  assert.equal(validatePng(withIdat(deflateSync(Buffer.concat([pixels, pixels])))), false);
});

test('PNG accepts split Adler-32, empty IDAT chunks and padding confined to the last IDAT', () => {
  const empty = Buffer.alloc(0);
  const padding = Buffer.alloc(8);
  const prefix = compressed.subarray(0, -2);
  const suffix = compressed.subarray(-2);
  const padded = Buffer.concat([compressed, padding]);
  assert.equal(validatePng(withIdat(empty, prefix, empty, suffix, empty)), true);
  assert.equal(validatePng(withIdat(padded)), true);
  assert.equal(validatePng(withIdat(prefix, Buffer.concat([suffix, padding]), empty)), true);
  assert.equal(validatePng(withIdat(compressed, empty, padding)), true);
  assert.equal(validatePng(withIdat(empty, empty)), false);
  assert.equal(validatePng(withIdat(padded, padding)), false);
  assert.equal(validatePng(withIdat(compressed, padding, padding)), false);
  const badPaddedCrc = withIdat(padded);
  badPaddedCrc[41 + padded.length] ^= 1;
  assert.equal(validatePng(badPaddedCrc), false);
  assert.equal(validatePng(withIdat(prefix, suffix.subarray(0, 1), empty)), false);
});

test('PNG checks scanline filters across the 16 KiB output boundary and within a long row', () => {
  const width = 5461; // An RGB scanline including its filter is exactly 16 KiB.
  const stride = width * 3 + 1;
  const rows = Buffer.alloc(stride * 2);
  rows[0] = 4;
  assert.equal(validatePng(withRows(width, 2, 0, rows)), true);
  const firstBad = Buffer.from(rows);
  firstBad[0] = 5;
  assert.equal(validatePng(withRows(width, 2, 0, firstBad)), false);
  rows[stride] = 5;
  assert.equal(validatePng(withRows(width, 2, 0, rows)), false);

  const wide = Buffer.alloc((5462 * 3 + 1) * 2);
  wide[16384] = 255; // Pixel data inside a row, rather than a filter byte.
  assert.equal(validatePng(withRows(5462, 2, 0, wide)), true);
});

test('PNG checks filter bytes across Adam7 passes with empty passes omitted', () => {
  // 2x2 RGB has one row in each of passes 1, 6 and 7, with 1, 1 and 2 pixels.
  const rows = Buffer.alloc(4 + 4 + 7);
  rows[4] = 4;
  rows[8] = 3;
  assert.equal(validatePng(withRows(2, 2, 1, rows)), true);
  rows[8] = 5;
  assert.equal(validatePng(withRows(2, 2, 1, rows)), false);
});
