"use client";

// Postcard style picker — POC port of the button row from legacy
// archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx (lines 231–250).
// Uses the legacy `.btn .btn-sm` styling (via tokens in globals.css) so it
// drops into any mode (fashion / punk / cinema) without special-casing.

import { POSTCARD_STYLES } from "@/lib/palette";
import type { PostcardStyle } from "@/lib/ai-provider";

export interface StylePickerProps {
  value: PostcardStyle;
  onChange: (style: PostcardStyle) => void;
  disabled?: boolean;
}

export function StylePicker({ value, onChange, disabled = false }: StylePickerProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
      }}
    >
      {POSTCARD_STYLES.map((style) => {
        const active = value === style.id;
        return (
          <button
            key={style.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(style.id)}
            aria-pressed={active}
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "6px 10px",
              // Use explicit tokens rather than `currentColor` — React inline
              // styles don't preserve cascade order, so `background: currentColor`
              // + `color: var(--mode-bg)` resolved to bg-on-bg in both slots.
              border: `1px solid var(--mode-ink, var(--ink))`,
              borderRadius: 999,
              background: active
                ? "var(--mode-ink, var(--ink))"
                : "transparent",
              color: active
                ? "var(--mode-bg, var(--paper))"
                : "var(--mode-ink, var(--ink))",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.45 : 1,
              transition: "background 120ms ease, color 120ms ease",
            }}
          >
            <span aria-hidden="true" style={{ marginRight: 6 }}>
              {style.emoji}
            </span>
            {style.label}
          </button>
        );
      })}
    </div>
  );
}
