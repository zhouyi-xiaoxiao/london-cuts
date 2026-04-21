// F-P004 — PNG export utility for postcards (and any other DOM node).
//
// This is a pure utility: it takes an HTMLElement the caller has already
// mounted (e.g. the postcard-front/back face) and hands back a rejectable
// Promise once the browser download has been triggered. Button placement
// and node-ref wiring live in the postcard editor (F-T006) — this module
// only covers the "turn a node into a PNG file on disk" seam.
//
// Why `html-to-image` (already in web/package.json):
//   - Preserves CSS transforms (the postcard 3D flip uses transform3d).
//   - Works with data-URL <img> sources, which is how our legacy
//     seed + AI-variant assets live in IndexedDB.
//   - `pixelRatio: 2` doubles the render resolution → retina-sharp and
//     print-friendly without blowing up the on-screen layout.
"use client";

import { toPng } from "html-to-image";

export interface ExportNodeOptions {
  /** Device-pixel-ratio multiplier passed through to html-to-image. */
  pixelRatio?: number;
}

/**
 * Render `node` as a PNG and trigger a browser download named `filename`.
 *
 * Failure modes bubble out as a rejected Promise so the caller can surface
 * a toast / inline error — we deliberately don't swallow here. `html-to-image`
 * can fail on CORS-tainted <img>s, on detached nodes, or if the node is
 * display:none, and the caller is better placed to recover.
 */
export async function exportNodeToPng(
  node: HTMLElement,
  filename: string,
  opts: ExportNodeOptions = {},
): Promise<void> {
  if (!node) {
    throw new Error("exportNodeToPng: node is required");
  }
  const pixelRatio = opts.pixelRatio ?? 2;

  const dataUrl = await toPng(node, { pixelRatio });

  // Trigger a download via a transient <a> — same technique legacy used.
  // Using body.append() + remove() rather than click() on an orphan node
  // because Firefox historically ignored clicks on unparented anchors.
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    document.body.removeChild(anchor);
  }
}

/**
 * Build a safe filename of the form `<projectSlug>_<stopSlug>_<side>.png`.
 *
 * We sanitise every segment to `[a-z0-9-]` (case-insensitive) so the result
 * survives Windows/macOS/Linux filesystems without escaping. Any character
 * outside that class becomes a `-`; adjacent dashes stay (cosmetic only).
 */
export function suggestPostcardFilename(
  projectSlug: string,
  stopSlug: string,
  side: "front" | "back",
): string {
  const clean = (s: string) => s.replace(/[^a-z0-9-]/gi, "-");
  return `${clean(projectSlug)}_${clean(stopSlug)}_${side}.png`;
}
