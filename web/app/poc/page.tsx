"use client";

// POC page for F-T000. Mounts the ported StylePicker so the owner can
// verify the porting pipeline end-to-end: legacy JSX → TS component →
// running in web/ at http://localhost:3000/_poc.
//
// This page is temporary and will be deleted once M-fast completes
// (the real picker lives inside the postcard editor — see F-T006).

import { useState } from "react";
import { StylePicker } from "@/components/postcard/style-picker";
import { getStyleMeta } from "@/lib/palette";
import type { PostcardStyle } from "@/lib/ai-provider";

export default function PocPage() {
  const [style, setStyle] = useState<PostcardStyle>("illustration");
  const meta = getStyleMeta(style);

  return (
    <main
      style={{
        padding: "48px 40px",
        maxWidth: 960,
        margin: "0 auto",
        fontFamily:
          "var(--f-body, 'Archivo', system-ui, -apple-system, sans-serif)",
        color: "#111",
        background: "#faf7f0",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: "var(--f-mono, ui-monospace, monospace)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.55,
            margin: 0,
          }}
        >
          M-fast · F-T000 · POC
        </p>
        <h1
          style={{
            fontFamily:
              "var(--f-display, 'Instrument Serif', 'Times New Roman', serif)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 56,
            lineHeight: 1,
            margin: "8px 0 0",
          }}
        >
          Style picker — ported.
        </h1>
        <p style={{ marginTop: 12, opacity: 0.7, fontSize: 15 }}>
          The 6 postcard style presets from the legacy app, rendered in
          Next.js + TypeScript from <code>web/components/postcard/style-picker.tsx</code>.
        </p>
      </header>

      <section style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: "var(--f-mono, ui-monospace, monospace)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.55,
            marginBottom: 12,
          }}
        >
          Pick a style
        </p>
        <StylePicker value={style} onChange={setStyle} />
      </section>

      <section
        style={{
          padding: 24,
          border: "1px solid rgba(0,0,0,0.15)",
          borderRadius: 4,
          background: "rgba(255,255,255,0.6)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--f-mono, ui-monospace, monospace)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.55,
            margin: 0,
          }}
        >
          Selected
        </p>
        <p
          style={{
            fontFamily:
              "var(--f-display, 'Instrument Serif', serif)",
            fontSize: 28,
            margin: "4px 0 12px",
          }}
        >
          {meta.emoji} {meta.label}
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.8, margin: 0 }}>
          <strong>Prompt:</strong> {meta.prompt}
        </p>
        <p
          style={{
            fontFamily: "var(--f-mono, ui-monospace, monospace)",
            fontSize: 11,
            letterSpacing: "0.04em",
            opacity: 0.5,
            marginTop: 12,
          }}
        >
          id: <code>{meta.id}</code>
        </p>
      </section>

      <footer style={{ marginTop: 48, opacity: 0.5, fontSize: 12 }}>
        Source of truth: <code>web/lib/palette.ts</code> · Ported from{" "}
        <code>archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx</code>
      </footer>
    </main>
  );
}
