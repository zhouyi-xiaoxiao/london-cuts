// Image loading + rotation + resize utilities.
// Ported from archive/app-html-prototype-2026-04-20/src/vision-pipeline.jsx
// (vpLoadToJpegDataUrl, lines 55–117). Same two-tier fallback:
//   1. createImageBitmap (handles HEIC on Safari)
//   2. HTMLImageElement via objectURL (fails on HEIC in Chrome — caller shows a warning)
// Rotation logic derives "logical" post-rotation dimensions from the EXIF orientation
// flag, scales the long edge to `maxEdge`, then draws onto a canvas with the
// appropriate transform. Output is a JPEG data URL (quality 0.88 = legacy parity).
"use client";

import { orientationSwapsAxes, type ExifMeta } from "./exif";

export interface ResizeResult {
  dataUrl: string;
  width: number;
  height: number;
}

export class ImageDecodeError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ImageDecodeError";
  }
}

async function decodeBitmap(
  file: Blob | File,
): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback path (Chrome can't decode HEIC this way).
    const url = URL.createObjectURL(file);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(
            new ImageDecodeError(
              "image decode failed (HEIC requires Safari or pre-converted JPEG)",
            ),
          );
        img.src = url;
      });
    } finally {
      // Keep the URL briefly so the caller can finish drawing; revoke after a beat.
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
      }, 2000);
    }
  }
}

function bitmapDims(b: ImageBitmap | HTMLImageElement): [number, number] {
  const w =
    (b as ImageBitmap).width || (b as HTMLImageElement).naturalWidth || 0;
  const h =
    (b as ImageBitmap).height || (b as HTMLImageElement).naturalHeight || 0;
  return [w, h];
}

/**
 * Resize a file to a JPEG data URL, applying EXIF rotation.
 * @param file       Source image
 * @param orientation EXIF orientation (1/3/6/8) — see `readExif`
 * @param maxEdge    Max pixels on the long edge (legacy default: 1600)
 * @param quality    JPEG quality (legacy default: 0.88)
 */
export async function resizeToDataUrl(
  file: Blob | File,
  orientation: ExifMeta["orientation"] = 1,
  maxEdge = 1600,
  quality = 0.88,
): Promise<ResizeResult> {
  const bitmap = await decodeBitmap(file);
  const [srcW, srcH] = bitmapDims(bitmap);
  if (!srcW || !srcH) throw new ImageDecodeError("zero-size image");

  const swap = orientationSwapsAxes(orientation);
  const logicalW = swap ? srcH : srcW;
  const logicalH = swap ? srcW : srcH;

  const scale = Math.min(1, maxEdge / Math.max(logicalW, logicalH));
  const outW = Math.max(1, Math.round(logicalW * scale));
  const outH = Math.max(1, Math.round(logicalH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageDecodeError("canvas 2D context unavailable");

  ctx.save();
  if (orientation === 3) {
    ctx.translate(outW, outH);
    ctx.rotate(Math.PI);
  } else if (orientation === 6) {
    ctx.translate(outW, 0);
    ctx.rotate(Math.PI / 2);
  } else if (orientation === 8) {
    ctx.translate(0, outH);
    ctx.rotate(-Math.PI / 2);
  }
  const drawW = swap ? outH : outW;
  const drawH = swap ? outW : outH;
  ctx.drawImage(bitmap, 0, 0, drawW, drawH);
  ctx.restore();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl, width: outW, height: outH };
}

/**
 * Convenience: read EXIF + resize in one call.
 * Prefer this from app code — the separate helpers are exposed for tests.
 */
export async function prepareImage(
  file: File,
  opts: { maxEdge?: number; quality?: number } = {},
): Promise<ResizeResult & { orientation: ExifMeta["orientation"] }> {
  const { readExif } = await import("./exif");
  const { orientation } = await readExif(file);
  const result = await resizeToDataUrl(
    file,
    orientation,
    opts.maxEdge,
    opts.quality,
  );
  return { ...result, orientation };
}
