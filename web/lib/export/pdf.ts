// Pure-utility PDF export for a single postcard (F-P003).
//
// Given a front image (as a data URL), a back message, a recipient block,
// and an orientation, this module produces a 2-page A6 PDF:
//
//   page 1 — postcard front, full-bleed image at 148×105mm (landscape) or
//            105×148mm (portrait).
//   page 2 — postcard back, message on the left half, recipient + stamp box
//            on the right half (landscape); for portrait we stack message on
//            top, recipient + stamp box on the bottom.
//
// This is intentionally framework-agnostic: no React, no Zustand, no DOM
// rendering. The postcard editor will convert its front preview to a data
// URL before calling us (so we stay pure + testable in jsdom).
//
// Legacy reference: archive/app-html-prototype-2026-04-20/src/publish.jsx
// (renderStopPages + downloadStopPdf). We keep the A6 dimensions, the
// helvetica default (no Caveat embed in this pass), and the save() contract,
// but drop the mode-specific front variants — those belong in the editor.

import { jsPDF } from "jspdf";

// ─── Public types ─────────────────────────────────────────────────────────

export interface PdfRecipient {
  name: string;
  line1: string;
  line2?: string;
  country: string;
}

export interface ExportPostcardPdfOptions {
  /** Data URL (preferred) or remote URL of the front-side image. */
  frontImageUrl: string;
  /** Plain-text message for the back of the postcard. */
  backMessage: string;
  /** Recipient block — rendered as stacked lines on the back. */
  recipient: PdfRecipient;
  /** A6 orientation — also dictates the card dimensions. */
  orientation: "portrait" | "landscape";
  /** Suggested download filename (including `.pdf` extension). */
  filename: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────

// A6 postcard in millimetres. These match the print-shop standard and the
// legacy editor's 148×105 / 105×148 render surface. We keep them as module
// constants so the tests (and any future caller) can verify them.
const A6_LONG_EDGE_MM = 148;
const A6_SHORT_EDGE_MM = 105;

// Best-guess format tag for addImage. jsPDF accepts "JPEG" | "PNG" | "WEBP"
// etc.; passing the wrong tag is only a performance issue (it will sniff
// the magic bytes from the data URL), so we err on the safe "JPEG" side
// since the editor's toCanvas export is a JPEG. The caller could override in
// a future pass if needed.
const DEFAULT_IMAGE_FORMAT = "JPEG";

// Render the back-of-postcard layout onto the current page. Factored out
// so the landscape/portrait branches both read cleanly. All measurements
// are in mm — matches the jsPDF constructor unit we chose ("mm").
function drawBackPage(
  doc: jsPDF,
  message: string,
  recipient: PdfRecipient,
  width: number,
  height: number,
): void {
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);

  const isPortrait = height > width;

  if (isPortrait) {
    // Horizontal divider: top 3/5 = message, bottom 2/5 = recipient + stamp.
    const divY = Math.round(height * 0.6);
    doc.line(10, divY, width - 10, divY);

    // Message block (top).
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    const msgLines = doc.splitTextToSize(message || "", width - 20);
    doc.text(msgLines, 10, 20);

    // Recipient block (bottom-left).
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    const rY = divY + 10;
    doc.text(recipient.name || "", 10, rY);
    doc.text(recipient.line1 || "", 10, rY + 8);
    if (recipient.line2) doc.text(recipient.line2, 10, rY + 16);
    doc.text(recipient.country || "", 10, rY + 24);

    // Stamp box (bottom-right).
    doc.setDrawColor(120);
    doc.setLineWidth(0.3);
    doc.rect(width - 30, divY + 6, 20, 25);
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text("1ST CLASS", width - 28, divY + 14);
  } else {
    // Vertical divider at w/2: left = message, right = recipient + stamp.
    const divX = Math.round(width / 2);
    doc.line(divX, 10, divX, height - 10);

    // Message block (left).
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    const msgLines = doc.splitTextToSize(message || "", divX - 18);
    doc.text(msgLines, 10, 20);

    // Recipient block (right).
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(recipient.name || "", divX + 6, 30);
    doc.text(recipient.line1 || "", divX + 6, 40);
    if (recipient.line2) doc.text(recipient.line2, divX + 6, 50);
    doc.text(recipient.country || "", divX + 6, 60);

    // Stamp box (top-right).
    doc.setDrawColor(120);
    doc.setLineWidth(0.3);
    doc.rect(width - 28, 15, 20, 25);
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text("1ST CLASS", width - 26, 23);
  }
}

// Coerce a URL into a data URL suitable for jsPDF's addImage.
// - data: URLs are returned as-is.
// - http(s) URLs are fetched + converted through FileReader.
// Returns null on any failure so the caller can decide what to do (we
// currently fall back to a plain-text placeholder page).
async function resolveImageDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Export a postcard as a 2-page A6 PDF and trigger a browser download.
 *
 * Page 1 = front image (full-bleed at card dimensions).
 * Page 2 = back layout (message block + recipient block + stamp box).
 *
 * The function intentionally resolves with `void` — jsPDF's `save()` invokes
 * the browser's download mechanism as a side-effect, so there's no artefact
 * to return. Callers that need a Blob/ArrayBuffer should use `doc.output()`
 * directly (we'll expose that variant if the UI ever needs server upload).
 */
export async function exportPostcardPdf(
  opts: ExportPostcardPdfOptions,
): Promise<void> {
  const { frontImageUrl, backMessage, recipient, orientation, filename } =
    opts;

  const isPortrait = orientation === "portrait";
  const width = isPortrait ? A6_SHORT_EDGE_MM : A6_LONG_EDGE_MM;
  const height = isPortrait ? A6_LONG_EDGE_MM : A6_SHORT_EDGE_MM;

  // Open the doc with the correct orientation so page 1 inherits it. A6 is
  // a jsPDF-recognised format tag so we don't need to pass explicit [w, h].
  const doc = new jsPDF({
    orientation: isPortrait ? "portrait" : "landscape",
    unit: "mm",
    format: "a6",
  });

  // ── Page 1: front image ─────────────────────────────────────────────
  const imageData = await resolveImageDataUrl(frontImageUrl);
  if (imageData) {
    // Full-bleed: no margins. The editor is responsible for any cover/crop
    // pre-processing; we take the bytes as-is and stretch to card dims.
    doc.addImage(imageData, DEFAULT_IMAGE_FORMAT, 0, 0, width, height);
  } else {
    // Graceful fallback if the image couldn't be resolved — print a label
    // so the user gets a valid PDF instead of a crash.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("(postcard front unavailable)", 10, 20);
  }

  // ── Page 2: back layout ─────────────────────────────────────────────
  doc.addPage("a6", isPortrait ? "portrait" : "landscape");
  drawBackPage(doc, backMessage, recipient, width, height);

  // Trigger browser download. jsPDF's non-promise `save(filename)` overload
  // returns the doc; the promise overload requires an options object. We
  // want the fire-and-forget download, so we take the sync overload.
  doc.save(filename);
}
