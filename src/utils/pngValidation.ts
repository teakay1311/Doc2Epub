import { Inflate } from 'pako/lib/inflate.js';

const outputChunkSize = 16 * 1024;
const invalidScanline = Symbol('Invalid PNG scanline');
const channelsByColor: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const depthsByColor: Record<number, readonly number[]> = {
  0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16]
};
const adam7Passes = [
  [0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4],
  [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]
];
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) {
    value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return value;
});

function scanlinePasses(header: DataView): { rowBytes: number; rows: number }[] {
  const width = header.getUint32(0);
  const height = header.getUint32(4);
  const depth = header.getUint8(8);
  const color = header.getUint8(9);
  const interlace = header.getUint8(12);
  if (!width || !height || width > 0x7fffffff || height > 0x7fffffff ||
      !depthsByColor[color]?.includes(depth) ||
      header.getUint8(10) !== 0 || header.getUint8(11) !== 0 || interlace > 1) return [];

  const bitsPerPixel = depth * channelsByColor[color];
  const pass = (columns: number, rows: number) => ({
    rowBytes: Math.ceil(columns * bitsPerPixel / 8) + 1, rows
  });
  if (interlace === 0) return [pass(width, height)];
  return adam7Passes
    .map(([x, y, dx, dy]) => pass(Math.ceil((width - x) / dx), Math.ceil((height - y) / dy)))
    .filter(({ rowBytes, rows }) => rowBytes > 1 && rows > 0);
}

export function validatePng(bytes: Uint8Array): boolean {
  if (bytes.length < 33) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a ||
      view.getUint32(8) !== 13 || view.getUint32(12) !== 0x49484452) return false;
  const passes = scanlinePasses(new DataView(bytes.buffer, bytes.byteOffset + 16, 13));
  const expected = passes.reduce((sum, { rowBytes, rows }) => sum + rowBytes * rows, 0);
  if (expected === 0 || !Number.isSafeInteger(expected)) return false;

  const idat: Uint8Array[] = [];
  let complete = false;
  let idatSeen = false;
  let idatEnded = false;
  for (let offset = 8; offset <= bytes.length - 12;) {
    const length = view.getUint32(offset);
    const type = view.getUint32(offset + 4);
    const start = offset + 8;
    const crcOffset = start + length;
    if (crcOffset > bytes.length - 4) return false;
    let crc = 0xffffffff;
    for (let index = offset + 4; index < crcOffset; index++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[index]) & 0xff];
    }
    if (((crc ^ 0xffffffff) >>> 0) !== view.getUint32(crcOffset)) return false;
    if (type === 0x49454e44) {
      complete = length === 0 && crcOffset + 4 === bytes.length;
      break;
    }
    if (type === 0x49444154) {
      if (idatEnded) return false;
      idatSeen = true;
      if (length > 0) idat.push(bytes.subarray(start, crcOffset));
    } else if (idatSeen) {
      idatEnded = true;
    }
    offset = crcOffset + 4;
  }
  if (!complete || idat.length === 0) return false;

  const inflater = new Inflate({ windowBits: 15, chunkSize: outputChunkSize });
  let passIndex = 0;
  let rowsRead = 0;
  let rowRemaining = 0;
  inflater.onData = (output) => {
    for (let offset = 0; offset < output.length;) {
      const pass = passes[passIndex];
      if (!pass) throw invalidScanline;
      if (rowRemaining === 0) {
        if (output[offset] > 4) throw invalidScanline;
        rowRemaining = pass.rowBytes;
      }
      const count = Math.min(rowRemaining, output.length - offset);
      rowRemaining -= count;
      offset += count;
      if (rowRemaining === 0 && ++rowsRead === pass.rows) {
        passIndex++;
        rowsRead = 0;
      }
    }
  };

  try {
    for (const [index, chunk] of idat.entries()) {
      // Finishing manually in pako 1 can report success without reaching the zlib checksum.
      if (!inflater.push(chunk, false) || inflater.err !== 0) return false;
      if (inflater.ended) {
        const finalIndex = idat.length - 1;
        // Allow unused bytes in the final IDAT, including a chunk containing only padding.
        const paddingIsFinal = index === finalIndex ||
          (index === finalIndex - 1 && inflater.strm.avail_in === 0);
        return paddingIsFinal && passIndex === passes.length;
      }
    }
  } catch (error) {
    if (error !== invalidScanline) throw error;
  }
  return false;
}
