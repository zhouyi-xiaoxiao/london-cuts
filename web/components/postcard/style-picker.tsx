"use client";

// Postcard style picker — POC port of the button row from legacy
// archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx (lines 231–250).
// This component alone doesn't generate anything; it just lets the user
// pick one of 6 styles. Generation wiring lands in F-T006.

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
              fontFamily: "var(--f-mono, ui-monospace, monospace)",
              fontSize: 11,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "8px 12px",
              border: "1px solid currentColor",
              borderRadius: 999,
              background: active ? "currentColor" : "transparent",
              color: active ? "var(--page, #fff)" : "inherit",
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
