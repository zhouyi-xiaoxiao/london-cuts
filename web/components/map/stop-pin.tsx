"use client";

// F-P002 — Custom map marker used by the MapLibre Atlas.
// MapLibre markers are imperative: you hand it an HTMLElement, not JSX.
// So we expose a plain function that builds the element rather than a
// React component. Styling pulls the mode accent colour from the live
// CSS custom property (--mode-accent) via `currentColor` so the pin
// follows whatever narrative mode is active without needing React
// re-renders on every mode swap.

import type { NarrativeMode } from "@/lib/storage";

export interface PinDescriptor {
  stopId: string;
  label: string; // short number/badge shown in the pin ("01".."12")
  mode: NarrativeMode;
}

/**
 * Build an HTMLElement suitable for `new maplibregl.Marker({ element })`.
 * The element includes an inline click handler hook via `onClick`. We
 * don't attach it here — the caller wires it up so the React-side
 * `onStopClick` prop can stay closure-friendly.
 *
 * Visuals use `var(--mode-accent)` so the pin follows the active narrative
 * mode via the `data-mode` attribute on <html>. Because MapLibre mounts
 * markers into its own container (outside the React tree) we need the
 * token to cascade from :root; CSS custom props do that automatically.
 */
export function createStopPin(desc: PinDescriptor): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "atlas-marker";
  el.dataset.mode = desc.mode;
  el.dataset.stopId = desc.stopId;
  el.setAttribute("aria-label", `Stop ${desc.label}`);

  // Pin chrome — circular badge with the stop number. Kept minimal so
  // the three modes all read cleanly. Tokens come from globals.css.
  Object.assign(el.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "var(--mode-bg, #fff)",
    color: "var(--mode-accent, #b8360a)",
    border: "2.5px solid var(--mode-accent, #b8360a)",
    fontFamily: "var(--f-mono, monospace)",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.02em",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(17, 14, 11, 0.18)",
    transition: "transform 120ms ease",
    transform: "translate(-50%, -50%) translate(0, 0)",
  } satisfies Partial<CSSStyleDeclaration>);

  const span = document.createElement("span");
  span.textContent = desc.label;
  el.appendChild(span);

  el.addEventListener("mouseenter", () => {
    el.style.transform = "translate(-50%, -50%) scale(1.08)";
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "translate(-50%, -50%) translate(0, 0)";
  });

  return el;
}
