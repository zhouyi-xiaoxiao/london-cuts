"use client";

// Postcard front — mode-aware grammar.
// Restored from legacy `PostcardFrontView` (archive postcard-editor.jsx
// ~292-397). Switches layout at runtime via `useMode()`. Colour and type
// pull from the --mode-* CSS vars in app/globals.css so a mode swap
// anywhere in the tree updates the front without re-rendering the parent.
//
//   • Fashion — italic Bodoni eyebrow, photographic crop, soft vignette,
//                 white "Postcard" word-mark in the bottom-right.
//   • Punk    — black bg, ALL-CAPS Archivo Black "GREETINGS FROM …" with
//                 offset accent shadow, taped chip rotated -3°, halftone.
//   • Cinema  — letterbox bands top + bottom, yellow EXT. <PLACE> subtitle
//                 bar, Instrument Serif scene slug.
//
// Wrapper fills parent (`inset:0`); aspect-ratio is owned by PostcardCard.

import type { CSSProperties } from "react";

import type { NarrativeMode } from "@/lib/storage";
import { useMode } from "@/stores/mode";

export interface PostcardFrontProps {
  imageUrl: string | null;
  /** Stop ordinal, e.g. "01"…"12". */
  stopNumber: string;
  totalStops: number;
  /** AI-generation style label ("Watercolour", "Polaroid", …). */
  styleLabel: string | null;
  /**
   * Optional human-readable place ("Borough Market"). Used by punk +
   * cinema to anchor their grammars; falls back to "Stop <n>" so the
   * existing 4-prop callers don't break.
   */
  placeLabel?: string | null;
}

export function PostcardFront(props: PostcardFrontProps) {
  const mode = useMode();
  if (mode === "punk") return <PunkFront {...props} />;
  if (mode === "cinema") return <CinemaFront {...props} />;
  return <FashionFront {...props} />;
}

// ─── shared ──────────────────────────────────────────────────────────────

const wrap: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
};

const monoChip: CSSProperties = {
  fontFamily: "var(--f-mono)",
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "4px 10px",
};

function ImageOrPlaceholder({
  imageUrl,
  styleLabel,
  mode,
}: {
  imageUrl: string | null;
  styleLabel: string | null;
  mode: NarrativeMode;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={styleLabel ?? "postcard art"}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background:
          mode === "cinema"
            ? "var(--mode-bg, #11151c)"
            : "var(--mode-surface, var(--paper-2))",
        color: "var(--mode-ink, var(--ink))",
      }}
    >
      <div className="mono-sm" style={{ opacity: 0.45, letterSpacing: "0.2em" }}>
        NO POSTCARD ART YET
      </div>
      <div className="mono-sm" style={{ opacity: 0.3, fontSize: 10 }}>
        Pick a style + click Generate
      </div>
    </div>
  );
}

// ─── FASHION ─────────────────────────────────────────────────────────────

function FashionFront({ imageUrl, stopNumber, totalStops, styleLabel }: PostcardFrontProps) {
  return (
    <div style={{ ...wrap, background: "var(--mode-bg, var(--paper))" }}>
      <ImageOrPlaceholder imageUrl={imageUrl} styleLabel={styleLabel} mode="fashion" />
      {imageUrl && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, transparent 22%, transparent 70%, rgba(0,0,0,0.22) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Editorial eyebrow */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          right: 16,
          fontFamily: "var(--mode-display-font, var(--f-fashion))",
          fontStyle: "italic",
          fontSize: 12,
          letterSpacing: "0.04em",
          color: imageUrl ? "white" : "var(--mode-ink, var(--ink))",
          mixBlendMode: imageUrl ? "difference" : "normal",
          opacity: 0.92,
        }}
      >
        Édition · {stopNumber} of {String(totalStops).padStart(2, "0")}
      </div>

      {/* "Postcard" word-mark */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          ...monoChip,
          background: "var(--paper)",
          color: "var(--mode-ink, var(--ink))",
          border: "1px solid var(--mode-ink, var(--ink))",
        }}
      >
        Postcard · {stopNumber}/{totalStops}
      </div>

      {imageUrl && styleLabel && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            ...monoChip,
            background: "var(--paper)",
            color: "var(--mode-ink, var(--ink))",
            border: "1px solid var(--mode-ink, var(--ink))",
          }}
        >
          {styleLabel}
        </div>
      )}
    </div>
  );
}

// ─── PUNK ────────────────────────────────────────────────────────────────

function PunkFront({ imageUrl, stopNumber, totalStops, styleLabel, placeLabel }: PostcardFrontProps) {
  const place = (placeLabel ?? `Stop ${stopNumber}`).toUpperCase();
  const firstWord = place.split(/[\s,]+/)[0] ?? place;
  const accent = "var(--mode-accent, oklch(0.62 0.24 25))";

  return (
    <div style={{ ...wrap, background: "black", color: "white" }}>
      <ImageOrPlaceholder imageUrl={imageUrl} styleLabel={styleLabel} mode="punk" />

      {/* Halftone overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 0.7px, transparent 0.7px)",
          backgroundSize: "4px 4px",
          mixBlendMode: "overlay",
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />

      {/* Taped chip */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          background: accent,
          color: "white",
          fontFamily: "var(--mode-display-font, var(--f-display))",
          fontSize: 13,
          letterSpacing: "0.04em",
          padding: "5px 9px",
          transform: "rotate(-3deg)",
          lineHeight: 1,
          boxShadow: "2px 2px 0 rgba(0,0,0,0.55)",
        }}
      >
        STOP {stopNumber}!!
      </div>

      {/* GREETINGS FROM … */}
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 18,
          fontFamily: "var(--mode-display-font, var(--f-display))",
          textTransform: "uppercase",
          color: "white",
          fontSize: "clamp(22px, 7cqw, 56px)",
          lineHeight: 0.9,
          textShadow: `4px 4px 0 ${accent}`,
          overflowWrap: "break-word",
          wordBreak: "break-word",
        }}
      >
        Greetings<br />from<br />{firstWord}
      </div>

      {imageUrl && styleLabel && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            ...monoChip,
            background: "white",
            color: "black",
            border: "1px solid black",
            transform: "rotate(2deg)",
            boxShadow: `1px 1px 0 ${accent}`,
          }}
        >
          {styleLabel} · {stopNumber}/{totalStops}
        </div>
      )}
    </div>
  );
}

// ─── CINEMA ──────────────────────────────────────────────────────────────

function CinemaFront({ imageUrl, stopNumber, totalStops, styleLabel, placeLabel }: PostcardFrontProps) {
  const place = (placeLabel ?? `Stop ${stopNumber}`).toUpperCase();
  const accent = "var(--mode-accent, oklch(0.88 0.14 90))";
  const band: CSSProperties = { position: "absolute", left: 0, right: 0, background: "black" };

  return (
    <div style={{ ...wrap, background: "var(--mode-bg, oklch(0.1 0.015 250))", color: "white" }}>
      <ImageOrPlaceholder imageUrl={imageUrl} styleLabel={styleLabel} mode="cinema" />

      {/* Letterbox bands */}
      <div aria-hidden style={{ ...band, top: 0, height: "7%" }} />
      <div aria-hidden style={{ ...band, bottom: 0, height: "10%" }} />

      {/* Scene slug */}
      <div
        style={{
          position: "absolute",
          top: "8.5%",
          left: 16,
          right: 16,
          fontFamily: "var(--mode-display-font, var(--f-serif))",
          fontSize: 14,
          letterSpacing: "0.18em",
          color: accent,
          textTransform: "uppercase",
        }}
      >
        Scene {stopNumber} · of {totalStops}
      </div>

      {/* EXT. <PLACE> subtitle bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "12%",
          display: "flex",
          justifyContent: "center",
          padding: "0 12px",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.62)",
            color: accent,
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            padding: "5px 12px",
            textTransform: "uppercase",
            maxWidth: "90%",
            overflowWrap: "break-word",
            wordBreak: "break-word",
            textAlign: "center",
          }}
        >
          — EXT. {place} —
        </div>
      </div>

      {imageUrl && styleLabel && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            ...monoChip,
            background: "rgba(0,0,0,0.6)",
            color: accent,
            border: `1px solid ${accent}`,
          }}
        >
          {styleLabel}
        </div>
      )}
    </div>
  );
}
