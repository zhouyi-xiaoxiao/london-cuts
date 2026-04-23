"use client";

// Center column of the workspace.
// F-T005 wired the real HeroSlot, StopMetadataForm, StopBodyEditor.
// F-T006 adds the real PostcardEditor.
// M-iter F-I018 adds back the legacy CanvasHeader map links + the
// per-stop AssetStrip (horizontal thumbnails under the hero) — these
// were dropped in the scaffold port per tasks/AUDIT-WORKSPACE.md #7 + #11.

import { useMemo, useRef, useState, type CSSProperties } from "react";

import { PostcardEditor } from "@/components/postcard/postcard-editor";
import { useAssetActions, useAssetsByStop } from "@/stores/asset";
import { useStops, useStopActions } from "@/stores/stop";
import type { Asset, Stop } from "@/stores/types";

import { MIME_ASSET_ID } from "@/lib/constants";
import { HeroSlot } from "./hero-slot";
import { StopBodyEditor } from "./stop-body-editor";
import { StopMetadataForm } from "./stop-metadata-form";

export interface StopCanvasProps {
  stop: Stop | undefined;
}

export function StopCanvas({ stop }: StopCanvasProps) {
  const { updateStop } = useStopActions();
  const stops = useStops();

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
      {/* Eyebrow + title + maps deep-links + counters. F-I018 */}
      <CanvasHeader stop={stop} />

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

      {/* Hero image slot */}
      <HeroSlot stop={stop} />

      {/* Per-stop horizontal asset strip under the hero. F-I018 */}
      <AssetStrip stop={stop} />

      {/* Stop metadata form */}
      <StopMetadataForm stop={stop} />

      {/* Story body editor */}
      <StopBodyEditor stop={stop} />

      {/* Postcard editor */}
      <PostcardEditor stop={stop} totalStops={stops.length} />
    </section>
  );
}

// ─── CanvasHeader: title + maps deep-links + counters ──────────────────

interface CanvasHeaderProps {
  stop: Stop;
}

function CanvasHeader({ stop }: CanvasHeaderProps) {
  const [coordsCopied, setCoordsCopied] = useState(false);

  const hasCoords =
    typeof stop.lat === "number" &&
    typeof stop.lng === "number" &&
    !Number.isNaN(stop.lat) &&
    !Number.isNaN(stop.lng);

  const coordsText = hasCoords
    ? `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`
    : null;

  // Counter: how many body-block paragraphs / pull quotes exist — matches
  // the legacy "<N body blocks>" chip. Image blocks count too.
  const bodyCount = stop.body.length;
  const mediaLabel =
    stop.status.media === "running"
      ? "media running"
      : stop.status.media === "done"
        ? "media done"
        : stop.status.media === "failed"
          ? "media failed"
          : null;

  const onCopyCoords = async () => {
    if (!coordsText) return;
    try {
      await navigator.clipboard.writeText(coordsText);
      setCoordsCopied(true);
      setTimeout(() => setCoordsCopied(false), 1400);
    } catch {
      // Clipboard permission can fail silently — fallback via textarea.
      const ta = document.createElement("textarea");
      ta.value = coordsText;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCoordsCopied(true);
        setTimeout(() => setCoordsCopied(false), 1400);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  return (
    <header>
      <div
        className="eyebrow"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span>STOP {stop.n}</span>
        <Sep />
        <span>{stop.code || "—"}</span>
        <Sep />
        <span>{stop.time || "—"}</span>
        <Sep />
        <span>{(stop.mood || "").toUpperCase() || "—"}</span>
        {bodyCount > 0 && (
          <>
            <Sep />
            <span title="Body blocks in this stop">
              {bodyCount} {bodyCount === 1 ? "block" : "blocks"}
            </span>
          </>
        )}
        {mediaLabel && (
          <>
            <Sep />
            <span
              style={{
                color:
                  stop.status.media === "failed"
                    ? "var(--mode-accent, #b8360a)"
                    : undefined,
              }}
            >
              {mediaLabel}
            </span>
          </>
        )}
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

      {hasCoords && coordsText && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <a
            className="mono-sm"
            href={`https://www.google.com/maps?q=${stop.lat},${stop.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={linkChipStyle}
            title="Open in Google Maps"
          >
            Google Maps ↗
          </a>
          <a
            className="mono-sm"
            href={`https://maps.apple.com/?ll=${stop.lat},${stop.lng}&q=${encodeURIComponent(
              stop.title || `Stop ${stop.n}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={linkChipStyle}
            title="Open in Apple Maps"
          >
            Apple Maps ↗
          </a>
          <button
            type="button"
            onClick={onCopyCoords}
            className="mono-sm"
            style={linkChipStyle}
            title="Copy coordinates"
            aria-live="polite"
          >
            {coordsCopied ? "✓ Copied" : `📋 ${coordsText}`}
          </button>
        </div>
      )}
    </header>
  );
}

const linkChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  border: "1px solid var(--rule)",
  background: "var(--paper)",
  fontSize: 11,
  letterSpacing: "0.04em",
  color: "var(--ink)",
  textDecoration: "none",
  cursor: "pointer",
  lineHeight: 1.4,
};

function Sep() {
  return (
    <span aria-hidden style={{ opacity: 0.35 }}>
      ·
    </span>
  );
}

// ─── AssetStrip: horizontal thumbnails under the hero ──────────────────

interface AssetStripProps {
  stop: Stop;
}

function AssetStrip({ stop }: AssetStripProps) {
  const stopAssets = useAssetsByStop(stop.n);
  const { updateStop } = useStopActions();
  const { addAsset, updateAsset } = useAssetActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Sort: current hero first, then by id (stable).
  const cells = useMemo(() => {
    const sorted = [...stopAssets];
    sorted.sort((a, b) => {
      if (a.id === stop.heroAssetId) return -1;
      if (b.id === stop.heroAssetId) return 1;
      return a.id.localeCompare(b.id);
    });
    return sorted;
  }, [stopAssets, stop.heroAssetId]);

  const setAsHero = (assetId: string) => {
    updateStop(stop.n, {
      heroAssetId: assetId,
      status: { ...stop.status, hero: true, upload: true },
    });
  };

  const detachFromStop = (assetId: string) => {
    if (
      !confirm(
        "Move this photo to the Loose pool? It stays in your library but won't belong to this stop.",
      )
    ) {
      return;
    }
    updateAsset(assetId, { stop: null });
    // If it was the hero, also clear hero.
    if (stop.heroAssetId === assetId) {
      updateStop(stop.n, {
        heroAssetId: null,
        status: { ...stop.status, hero: false },
      });
    }
  };

  const onFilesPicked = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { prepareImage } = await import("@/lib/utils/image");
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const { dataUrl } = await prepareImage(file, { maxEdge: 1600 });
          const id = `upload-${stop.n}-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 6)}`;
          addAsset({
            id,
            stop: stop.n,
            tone: stop.tone,
            imageUrl: dataUrl,
          });
          if (!stop.heroAssetId) {
            // First upload becomes the hero automatically.
            updateStop(stop.n, {
              heroAssetId: id,
              status: { ...stop.status, hero: true, upload: true },
            });
          }
        } catch (err) {
          console.warn("[asset-strip] upload failed for", file.name, err);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const hasAny = cells.length > 0;

  return (
    <div
      style={{
        marginTop: 16,
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 6,
      }}
      aria-label={`Assets on stop ${stop.n}`}
    >
      {cells.map((asset) => (
        <AssetCell
          key={asset.id}
          asset={asset}
          isHero={asset.id === stop.heroAssetId}
          onSetHero={() => setAsHero(asset.id)}
          onDetach={() => detachFromStop(asset.id)}
        />
      ))}

      {/* Upload cell (always last) */}
      <label
        style={{
          flexShrink: 0,
          width: 72,
          height: 72,
          border: "1px dashed var(--rule)",
          display: "grid",
          placeItems: "center",
          cursor: uploading ? "wait" : "pointer",
          background: "var(--paper-2)",
          opacity: uploading ? 0.6 : 1,
        }}
        title="Add another photo to this stop"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFilesPicked(e.target.files)}
          disabled={uploading}
        />
        <span
          className="mono-sm"
          style={{ fontSize: 10, opacity: 0.7, letterSpacing: "0.08em" }}
        >
          {uploading ? "…" : hasAny ? "+ ADD" : "+ PHOTO"}
        </span>
      </label>
    </div>
  );
}

interface AssetCellProps {
  asset: Asset;
  isHero: boolean;
  onSetHero: () => void;
  onDetach: () => void;
}

function AssetCell({ asset, isHero, onSetHero, onDetach }: AssetCellProps) {
  const [hovered, setHovered] = useState(false);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(MIME_ASSET_ID, asset.id);
    e.dataTransfer.effectAllowed = "copyMove";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isHero ? undefined : onSetHero}
      title={
        isHero
          ? "Current hero"
          : "Click to make this the hero · drag to move between stops"
      }
      style={{
        flexShrink: 0,
        width: 72,
        height: 72,
        position: "relative",
        border: isHero
          ? "2px solid var(--mode-accent, #b8360a)"
          : "1px solid var(--rule)",
        background: "var(--paper-2)",
        cursor: isHero ? "default" : "pointer",
        overflow: "hidden",
      }}
    >
      {asset.imageUrl ? (
        <img
          src={asset.imageUrl}
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            userSelect: "none",
          }}
        />
      ) : (
        <div
          className="mono-sm"
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            fontSize: 9,
            opacity: 0.55,
          }}
        >
          {asset.id.slice(-6)}
        </div>
      )}

      {isHero && (
        <div
          style={{
            position: "absolute",
            top: 3,
            left: 3,
            padding: "1px 5px",
            background: "var(--mode-accent, #b8360a)",
            color: "var(--paper)",
            fontFamily: "var(--f-mono)",
            fontSize: 8,
            letterSpacing: "0.1em",
          }}
        >
          HERO
        </div>
      )}

      {hovered && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDetach();
          }}
          aria-label="Detach asset from this stop"
          title="Detach from stop (keeps the photo in your library)"
          style={{
            position: "absolute",
            top: 3,
            right: 3,
            width: 18,
            height: 18,
            padding: 0,
            border: "1px solid var(--rule)",
            background: "var(--paper)",
            fontSize: 10,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
