// Mode switcher — three-button pill group that toggles the narrative
// mode (punk / fashion / cinema). Ported from the legacy prototype's
// `ModePill` in archive/app-html-prototype-2026-04-20/src/shared.jsx (L33–50).
//
// Styling comes from the existing `.mode-pill` rules in
// web/app/globals.css (merged in F-P005). The active state is toggled
// via `data-active="true|false"` on each button, matching the legacy
// CSS selectors exactly.
//
// Clicks update the Zustand `mode` slice (F-T002). The sibling
// HtmlModeAttr hook in web/app/layout.tsx mirrors the value onto
// <html data-mode=…> so the mode-specific CSS in globals.css takes
// effect across the whole document.
"use client";

import { useEffect } from "react";

import { useT } from "@/components/i18n-provider";
import { NARRATIVE_MODES, useMode, useSetMode } from "@/stores/mode";

// Legacy order is punk / fashion / cinema on the top bar — preserve it.
const DISPLAY_ORDER = ["punk", "fashion", "cinema"] as const;

export function ModeSwitcher() {
  const mode = useMode();
  const setMode = useSetMode();
  const t = useT();

  return (
    <div
      className="mode-pill"
      role="group"
      aria-label={t("mode.label")}
    >
      {DISPLAY_ORDER.map((id) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            data-active={active ? "true" : "false"}
            aria-pressed={active}
            onClick={() => setMode(id)}
          >
            {t(`mode.${id}` as Parameters<typeof t>[0])}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Tiny client-only effect component. Mirrors the current `mode` onto
 * `<html data-mode={mode}>` so the existing
 * `[data-mode="punk"] { ... }` CSS in globals.css applies globally.
 *
 * Mounted inside `<body>` from web/app/layout.tsx because the <html>
 * element is rendered by the server component and can't be reactive
 * via props. Setting the attribute in a useEffect keeps SSR output
 * stable (no hydration mismatch) and flips on every mode change.
 */
export function HtmlModeAttr() {
  const mode = useMode();
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);
  return null;
}
