import type { VisionAnalysisResult } from "./ai-provider";

export interface PhotoGrounding {
  lat: number | null;
  lng: number | null;
  capturedAtIso: string | null;
}

export interface GroundedPhoto<TDescription = VisionAnalysisResult> {
  id: string;
  fileName: string;
  description: TDescription;
  grounding: PhotoGrounding;
}

function validCoord(lat: number | null, lng: number | null): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function coordinateForPhoto(
  photo: Pick<GroundedPhoto, "grounding">,
): { lat: number; lng: number } | null {
  const { lat, lng } = photo.grounding;
  if (!validCoord(lat, lng) || lng === null) return null;
  return { lat, lng };
}

export function coordinateForPhotos(
  photos: readonly Pick<GroundedPhoto, "grounding">[],
): { lat: number; lng: number } | null {
  const coords = photos.map(coordinateForPhoto).filter(Boolean) as Array<{
    lat: number;
    lng: number;
  }>;
  if (coords.length === 0) return null;
  const sum = coords.reduce(
    (acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / coords.length, lng: sum.lng / coords.length };
}

export function timeLabelFromCapture(
  capturedAtIso: string | null,
  fallback = "",
): string {
  if (!capturedAtIso) return fallback;
  const d = new Date(capturedAtIso);
  if (Number.isNaN(d.getTime())) return fallback;
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

export function earliestCaptureIso(
  photos: readonly Pick<GroundedPhoto, "grounding">[],
): string | null {
  const times = photos
    .map((p) => p.grounding.capturedAtIso)
    .filter((v): v is string => Boolean(v))
    .map((v) => new Date(v).getTime())
    .filter((v) => !Number.isNaN(v));
  if (times.length === 0) return null;
  return new Date(Math.min(...times)).toISOString();
}

export function sortPhotosByCapture<T extends Pick<GroundedPhoto, "grounding">>(
  photos: readonly T[],
): T[] {
  return [...photos].sort((a, b) => {
    const at = a.grounding.capturedAtIso
      ? new Date(a.grounding.capturedAtIso).getTime()
      : Number.POSITIVE_INFINITY;
    const bt = b.grounding.capturedAtIso
      ? new Date(b.grounding.capturedAtIso).getTime()
      : Number.POSITIVE_INFINITY;
    if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
    if (Number.isNaN(at)) return 1;
    if (Number.isNaN(bt)) return -1;
    return at - bt;
  });
}

export function codeFromLocationHint(
  locationHint: string | null | undefined,
): string {
  const cleaned = (locationHint ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
  return cleaned.slice(0, 8).trim() || "-";
}
