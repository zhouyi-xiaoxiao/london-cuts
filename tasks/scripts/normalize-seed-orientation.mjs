#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

// These seed files have correct pixels but stale iPhone EXIF orientation
// values. Resetting the tag keeps GPS/date metadata intact while preventing
// browsers and vision providers from rotating them sideways.
const files = [
  "web/public/seed-images/IMG_3837.jpg", // old stop 04: Windsor guard
  "web/public/seed-images/IMG_8469.jpg", // old stop 10: King's Cross server
  "web/public/seed-images/IMG_9931.jpg", // 13th photo: Finsbury Park sky
];

for (const rel of files) {
  const file = path.join(repoRoot, rel);
  const buf = fs.readFileSync(file);
  const patched = patchExifOrientation(buf, 1);
  fs.writeFileSync(file, patched);
  console.log(`orientation=1 ${rel}`);
}

function patchExifOrientation(buf, value) {
  const out = Buffer.from(buf);
  for (let i = 2; i < out.length - 4; ) {
    if (out[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = out[i + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const segmentLength = out.readUInt16BE(i + 2);
    const isExif =
      marker === 0xe1 && out.subarray(i + 4, i + 10).toString() === "Exif\0\0";
    if (isExif) {
      const tiff = i + 10;
      const littleEndian = out.subarray(tiff, tiff + 2).toString() === "II";
      const readU16 = (offset) =>
        littleEndian ? out.readUInt16LE(offset) : out.readUInt16BE(offset);
      const readU32 = (offset) =>
        littleEndian ? out.readUInt32LE(offset) : out.readUInt32BE(offset);
      const writeU16 = (offset, n) =>
        littleEndian ? out.writeUInt16LE(n, offset) : out.writeUInt16BE(n, offset);

      const ifd0 = tiff + readU32(tiff + 4);
      const entries = readU16(ifd0);
      for (let entryIndex = 0; entryIndex < entries; entryIndex += 1) {
        const entry = ifd0 + 2 + entryIndex * 12;
        if (readU16(entry) === 0x0112) {
          writeU16(entry + 8, value);
          return out;
        }
      }
    }
    i += 2 + segmentLength;
  }
  throw new Error("No EXIF Orientation tag found");
}
