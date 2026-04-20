// Stable hashes + cache keys.
// Ported from archive/app-html-prototype-2026-04-20/src/vision-pipeline.jsx
// (vpCacheKeyForFile / vpCacheKeyForUrl / lcVariantCacheKey logic).
//
// Two flavours:
//   - `stableFileKey` — cheap, non-cryptographic identity used for localStorage
//     cache lookups. Key shape matches legacy: `file:<name>:<size>` or `url:<href>`.
//   - `sha256Hex`     — real SHA-256 via SubtleCrypto, used when we need to key
//     an AI cache on actual image bytes (M2+).

/** Cheap identity for a File or URL. Not a hash — just a stable key. */
export function stableFileKey(input: File | Blob | string): string {
  if (typeof input === "string") return `url:${input}`;
  if (input instanceof File) {
    return `file:${input.name || "unknown"}:${input.size ?? 0}`;
  }
  return `blob:${input.size ?? 0}:${input.type || "unknown"}`;
}

/** SHA-256 hex of a buffer (client-only — uses SubtleCrypto). */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 hex of a File/Blob's bytes. */
export async function sha256HexOfFile(file: Blob): Promise<string> {
  return sha256Hex(await file.arrayBuffer());
}

/**
 * Variant cache key — legacy `lcVariantCacheKey(sourceIdentity, styleId)`.
 * Identifies a (sourceImage, style) pair for the postcard-generation cache.
 */
export function variantCacheKey(
  sourceIdentity: string,
  styleId: string,
): string {
  return `variant:${sourceIdentity}:${styleId}`;
}
