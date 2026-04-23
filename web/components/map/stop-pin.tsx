"use client";

// F-P002 — Custom map marker used by the MapLibre Atlas.
//
// MapLibre markers are imperative: you hand it an HTMLElement, not JSX.
// So we expose a plain function that builds the element rather than a
// React component. Styling pulls the mode accent colour from the live
// CSS custom property (--mode-accent) via `currentColor` so the pin
// follows whatever narrative mode is active without needing React
// re-renders on every mode swap.
//
// ─── Nested-element architecture (2026-04-23 dogfood round 3) ────────
//
// MapLibre positions each marker by WRITING `element.style.transform`
// to something like `translate(-50%, -50%) translate3d(Xpx, Ypx, 0)`.
// Earlier iterations applied our own `scale(1.15)` on hover by calling
// `el.style.transform = "..."` — which CLOBBERED MapLibre's position
// string, teleporting the pin to (0, 0). Owner reported this as
// "鼠标移动到地图那里 那个点就会划走".
//
// Fix: split into an outer WRAP (what MapLibre positions; we never
// write to its transform) and an inner BADGE (what we scale on hover).
// The wrap is a zero-overhead sizing box; the badge carries all the
// visual chrome.

import type { NarrativeMode } from "@/lib/storage";

export interface PinDescriptor {
  stopId: string;
  label: string; // short number/badge shown in the pin ("01".."12")
  mode: NarrativeMode;
}

/**
 * Build an HTMLElement suitable for `new maplibregl.Marker({ element })`.
 * The returned element is the OUTER WRAP. MapLibre owns its `transform`
 * style. Hover scaling happens on a nested badge. Click handlers should
 * be attached to the returned wrap by the caller — they bubble up from
 * the inner badge automatically.
 *
 * Mouseenter / mouseleave listeners attached by the caller to the wrap
 * also fire correctly because the wrap's physical area equals the
 * badge's (the badge `inset: 0`s the wrap).
 */
export function createStopPin(desc: PinDescriptor): HTMLElement {
  // ─── Outer wrap — MapLibre's handle ─────────────────────────────
  // No background, no transform. MapLibre writes `style.transform`
  // to position us; we never overwrite it.
  const wrap = document.createElement("div");
  wrap.className = "atlas-marker";
  wrap.dataset.mode = desc.mode;
  wrap.dataset.stopId = desc.stopId;
  wrap.setAttribute("role", "button");
  wrap.setAttribute("aria-label", `Stop ${desc.label}`);
  wrap.setAttribute("tabindex", "0");
  Object.assign(wrap.style, {
    width: "22px",
    height: "22px",
    position: "relative",
    cursor: "pointer",
    // Mouse events pass through to the badge child — the wrap itself
    // has no chrome.
    pointerEvents: "auto",
  } satisfies Partial<CSSStyleDeclaration>);

  // ─── Inner badge — our hover target ─────────────────────────────
  // Fills the wrap exactly so mouseenter on either fires the same way
  // and the click surface matches the visible circle.
  const badge = document.createElement("div");
  Object.assign(badge.style, {
    position: "absolute",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "var(--paper, #fff)",
    color: "var(--mode-ink, #1a1a1a)",
    border: "1px solid var(--mode-accent, #b8360a)",
    fontFamily: "var(--f-mono, monospace)",
    fontSize: "10px",
    fontWeight: "500",
    lineHeight: "1",
    boxShadow: "0 2px 6px rgba(17, 14, 11, 0.14)",
    transition: "transform 120ms ease, box-shadow 120ms ease",
    transform: "scale(1)",
    transformOrigin: "center center",
    // Important: badge owns pointer events so mouseleave/mouseenter
    // track the VISIBLE circle, not a square wrap.
    pointerEvents: "auto",
  } satisfies Partial<CSSStyleDeclaration>);

  const span = document.createElement("span");
  span.textContent = desc.label;
  badge.appendChild(span);
  wrap.appendChild(badge);

  // Hover scale goes on BADGE, never on WRAP. Keeps MapLibre's
  // transform on the wrap untouched.
  wrap.addEventListener("mouseenter", () => {
    badge.style.transform = "scale(1.15)";
    badge.style.boxShadow = "0 4px 12px rgba(17, 14, 11, 0.22)";
  });
  wrap.addEventListener("mouseleave", () => {
    badge.style.transform = "scale(1)";
    badge.style.boxShadow = "0 2px 6px rgba(17, 14, 11, 0.14)";
  });

  return wrap;
}
