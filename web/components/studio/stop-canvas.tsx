"use client";

// Center column of the workspace.
// F-T005: wires the real HeroSlot, StopMetadataForm, StopBodyEditor.
// Postcard slot is still a placeholder until F-T006 brings the 3D flip
// card + AI generation.

import { useStopActions } from "@/stores/stop";
import type { Stop } from "@/stores/types";

import { HeroSlot } from "./hero-slot";
import { StopBodyEditor } from "./stop-body-editor";
import { StopMetadataForm } from "./stop-metadata-form";

export interface StopCanvasProps {
  stop: Stop | undefined;
}

export function StopCanvas({ stop }: StopCanvasProps) {
  const { updateStop } = useStopActions();

  if (!stop) {
    return (
      <section
        style={{
          padding: "48px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <div
          className="mono-sm"
          style={{ opacity: 0.5, fontStyle: "italic" }}
        >
          Select a stop from the spine to start editing.
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        padding: "32px 48px",
        overflow: "auto",
        minHeight: 0,
      }}
      aria-label={`Editing stop ${stop.n}`}
    >
      <div className="eyebrow">
        STOP {stop.n} · {stop.code} · {stop.time} · {stop.mood.toUpperCase()}
      </div>
      <h1
        style={{
          fontFamily: "var(--f-display, 'Archivo Black', sans-serif)",
          fontSize: "clamp(36px, 6vw, 72px)",
          lineHeight: 1,
          margin: "14px 0 0",
          letterSpacing: "-0.02em",
        }}
      >
        {stop.title || "(untitled stop)"}
      </h1>
      <label
        style={{
          display: "block",
          marginTop: 16,
        }}
      >
        <span
          className="mono-sm"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: 0.55,
          }}
        >
          Title
        </span>
        <input
          type="text"
          value={stop.title}
          onChange={(e) => updateStop(stop.n, { title: e.target.value })}
          placeholder="Give this stop a title…"
          style={{
            marginTop: 6,
            width: "100%",
            fontSize: 16,
            padding: "8px 0",
            borderBottom: "1px solid var(--rule)",
            background: "transparent",
            fontFamily: "var(--f-sans)",
          }}
        />
      </label>

      {/* Hero image slot — F-T005 real impl */}
      <HeroSlot stop={stop} />

      {/* Stop metadata form — F-T005 */}
      <StopMetadataForm stop={stop} />

      {/* Story body editor — F-T005 */}
      <StopBodyEditor stop={stop} />

      {/* Postcard slot — placeholder until F-T006 */}
      <aside
        style={{
          marginTop: 40,
          padding: 24,
          border: "1px solid var(--rule)",
          background: "var(--paper-2)",
        }}
        aria-label="Postcard (feature coming in F-T006)"
      >
        <div className="eyebrow">Postcard</div>
        <p
          style={{
            fontFamily: "var(--f-fashion, var(--mode-display-font))",
            fontStyle: "italic",
            fontSize: 20,
            marginTop: 8,
          }}
        >
          {stop.postcard.message || "No message yet."}
        </p>
        {stop.postcard.recipient.name && (
          <p className="mono-sm" style={{ marginTop: 8, opacity: 0.6 }}>
            → {stop.postcard.recipient.name},{" "}
            {stop.postcard.recipient.line1}
          </p>
        )}
        <p
          className="mono-sm"
          style={{ marginTop: 12, opacity: 0.45 }}
        >
          Rich editor lands in F-T006 (6 AI styles, 3D flip card, PDF/PNG export).
        </p>
      </aside>
    </section>
  );
}
