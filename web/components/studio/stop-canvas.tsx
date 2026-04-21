"use client";

// Center column of the workspace. Shows the active stop's header info,
// body preview, and postcard slot. This is the SHELL only — the hero image
// slot, variants row, drag-drop, and rich body editor land in F-T005/F-T006.

import { useStopActions } from "@/stores/stop";
import type { Stop } from "@/stores/types";

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
      <input
        type="text"
        aria-label="Stop title"
        value={stop.title}
        onChange={(e) => updateStop(stop.n, { title: e.target.value })}
        placeholder="Give this stop a title…"
        style={{
          marginTop: 16,
          width: "100%",
          fontSize: 14,
          padding: "8px 0",
          borderBottom: "1px solid var(--rule)",
          background: "transparent",
          fontFamily: "var(--f-sans)",
        }}
      />

      {/* Hero slot placeholder — F-T005 will render the real hero image
          + EXIF orientation + drag-drop. For now just an empty frame so
          the layout doesn't collapse. */}
      <figure
        style={{
          marginTop: 32,
          aspectRatio: "7 / 5",
          border: "1px dashed var(--rule)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--paper-2)",
        }}
        aria-label="Hero image slot (feature coming in F-T005)"
      >
        <div
          className="mono-sm"
          style={{ opacity: 0.45, letterSpacing: "0.2em" }}
        >
          HERO IMAGE · F-T005
        </div>
      </figure>

      {/* Body preview. F-T005 will add a real paragraph editor; here we
          just render what's in the store as read-only paragraphs. */}
      <div style={{ marginTop: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Body ({stop.body.length} blocks)
        </div>
        {stop.body.length === 0 ? (
          <p
            className="mono-sm"
            style={{ opacity: 0.5, fontStyle: "italic" }}
          >
            No body yet. Paragraph editor lands in F-T005.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 720,
            }}
          >
            {stop.body.map((block, i) => (
              <BodyBlockPreview key={i} block={block} />
            ))}
          </div>
        )}
      </div>

      {/* Postcard slot placeholder — F-T006. */}
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

function BodyBlockPreview({
  block,
}: {
  block: Stop["body"][number];
}) {
  if (block.type === "paragraph") {
    return <p style={{ lineHeight: 1.6 }}>{block.content}</p>;
  }
  if (block.type === "pullQuote") {
    return (
      <blockquote
        style={{
          fontFamily: "var(--f-fashion, var(--mode-display-font))",
          fontSize: 22,
          fontStyle: "italic",
          borderLeft: "3px solid var(--mode-accent)",
          paddingLeft: 16,
          margin: 0,
        }}
      >
        “{block.content}”
      </blockquote>
    );
  }
  if (block.type === "metaRow") {
    return (
      <div
        className="mono-sm"
        style={{
          display: "flex",
          gap: 16,
          opacity: 0.6,
          flexWrap: "wrap",
        }}
      >
        {block.content.map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
    );
  }
  return (
    <div
      className="mono-sm"
      style={{ opacity: 0.4, fontStyle: "italic" }}
    >
      [{block.type}] — rendered in F-T005
    </div>
  );
}
