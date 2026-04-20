// EXIF reader — thin wrapper over exifr.
// Ported from archive/app-html-prototype-2026-04-20/src/vision-pipeline.jsx
// (vpReadExif, lines 119–137). We expose only the fields the app actually uses:
// orientation (for rotating the image), lat/lng (for map pins), and the capture
// timestamp (for stop ordering + mood labels).
"use client";

import exifr from "exifr";

export interface ExifMeta {
  /** EXIF Orientation flag. 1 = upright, 3 = 180°, 6 = 90° CW, 8 = 90° CCW. */
  orientation: 1 | 3 | 6 | 8;
  lat: number | null;
  lng: number | null;
  dateOriginal: Date | null;
}

const DEFAULT: ExifMeta = {
  orientation: 1,
  lat: null,
  lng: null,
  dateOriginal: null,
};

/**
 * Read EXIF metadata we care about from a File/Blob.
 * Returns safe defaults on failure — never throws.
 */
export async function readExif(file: Blob | File): Promise<ExifMeta> {
  try {
    const meta = await exifr.parse(file, {
      gps: true,
      exif: true,
      // ifd0 is on by default in exifr (cannot be disabled per its types)
      // — we just need Orientation from it, no further config needed.
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    });
    if (!meta) return DEFAULT;

    const lat =
      typeof meta.latitude === "number"
        ? meta.latitude
        : typeof meta.GPSLatitude === "number"
          ? meta.GPSLatitude
          : null;
    const lng =
      typeof meta.longitude === "number"
        ? meta.longitude
        : typeof meta.GPSLongitude === "number"
          ? meta.GPSLongitude
          : null;

    const rawDate: unknown =
      meta.DateTimeOriginal ?? meta.CreateDate ?? meta.DateTime ?? null;
    let dateOriginal: Date | null = null;
    if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
      dateOriginal = rawDate;
    } else if (typeof rawDate === "string") {
      const d = new Date(rawDate);
      if (!Number.isNaN(d.getTime())) dateOriginal = d;
    }

    const rawOrient = typeof meta.Orientation === "number" ? meta.Orientation : 1;
    const orientation: ExifMeta["orientation"] =
      rawOrient === 3 || rawOrient === 6 || rawOrient === 8 ? rawOrient : 1;

    return { orientation, lat, lng, dateOriginal };
  } catch {
    return DEFAULT;
  }
}

/** Returns true if the orientation swaps the logical width/height (side-lying). */
export function orientationSwapsAxes(o: ExifMeta["orientation"]): boolean {
  return o === 6 || o === 8;
}
