"use client";

// POC page for F-T000. Temporary — deleted when M-fast wraps.
// Matches legacy visual language via design tokens from globals.css.

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
        minHeight: "100vh",
        padding: "clamp(32px, 5vw, 64px) clamp(20px, 4vw, 48px)",
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "var(--f-sans)",
        color: "var(--mode-ink, var(--ink))",
      }}
    >
      <header style={{ marginBottom: 40 }}>
        <p
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.55,
            margin: 0,
          }}
        >
          M-fast · F-T000 · POC
        </p>
        <h1
          style={{
            fontFamily: "var(--f-serif)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(40px, 7vw, 72px)",
            lineHeight: 1,
            margin: "12px 0 0",
            letterSpacing: "-0.01em",
          }}
        >
          Style picker — ported.
        </h1>
        <p
          style={{
            marginTop: 16,
            opacity: 0.7,
            fontSize: 15,
            maxWidth: 640,
          }}
        >
          The 6 postcard style presets from the legacy app, rendered in
          Next.js + TypeScript from{" "}
          <code style={{ fontFamily: "var(--f-mono)", fontSize: 12 }}>
            web/components/postcard/style-picker.tsx
          </code>
          . Compare this page with{" "}
          <a
            href="http://localhost:8000/#workspace"
            target="_blank"
            rel="noreferrer"
            style={{ borderBottom: "1px solid currentColor" }}
          >
            the legacy app
          </a>{" "}
          to verify visual parity.
        </p>
      </header>

      <section style={{ marginBottom: 40 }}>
        <p
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.55,
            marginBottom: 14,
          }}
        >
          Pick a style
        </p>
        <StylePicker value={style} onChange={setStyle} />
      </section>

      <section
        style={{
          padding: "clamp(20px, 3vw, 32px)",
          border: "1px solid var(--rule)",
          background: "var(--paper-2)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.55,
            margin: 0,
          }}
        >
          Selected
        </p>
        <p
          style={{
            fontFamily: "var(--f-serif)",
            fontStyle: "italic",
            fontSize: "clamp(28px, 4vw, 36px)",
            margin: "8px 0 16px",
            letterSpacing: "-0.01em",
          }}
        >
          {meta.emoji} {meta.label}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, margin: 0 }}>
          <strong style={{ fontWeight: 600 }}>Prompt: </strong>
          {meta.prompt}
        </p>
        <p
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.08em",
            opacity: 0.5,
            marginTop: 16,
          }}
        >
          id: <code>{meta.id}</code>
        </p>
      </section>

      <footer
        style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: "1px solid var(--rule)",
          opacity: 0.5,
          fontFamily: "var(--f-mono)",
          fontSize: 11,
          letterSpacing: "0.04em",
          lineHeight: 1.6,
        }}
      >
        Source of truth: <code>web/lib/palette.ts</code>
        <br />
        Ported from{" "}
        <code>
          archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx
        </code>
      </footer>
    </main>
  );
}
