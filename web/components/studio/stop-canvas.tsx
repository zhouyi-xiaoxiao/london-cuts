"use client";

// Center column of the workspace.
// F-T005 wired the real HeroSlot, StopMetadataForm, StopBodyEditor.
// F-T006 adds the real PostcardEditor.
// M-iter F-I018 adds back the legacy CanvasHeader map links + the
// per-stop AssetStrip (horizontal thumbnails under the hero) — these
// were dropped in the scaffold port per tasks/AUDIT-WORKSPACE.md #7 + #11.
// F-I032 adds the "✨ Describe from hero" assist button next to the
// title input — owner dogfood round 3: seed text never matches the
// seed images. This button reads the current hero with vision + fills
// in title + mood + tone + a seed paragraph in the body.

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { PostcardEditor } from "@/components/postcard/postcard-editor";
import { useAssetActions, useAssetsByStop } from "@/stores/asset";
import { usePostcardActions } from "@/stores/postcard";
import { useStops, useStopActions } from "@/stores/stop";
import type { Asset, BodyBlock, Stop, StopTone } from "@/stores/types";

import { MIME_ASSET_ID } from "@/lib/constants";
import { HeroSlot } from "./hero-slot";
import { StopBodyEditor } from "./stop-body-editor";
import { StopMetadataForm } from "./stop-metadata-form";
import { VariantsRow } from "./variants-row";

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

      <TitleWithVisionAssist stop={stop} />

      {/* Hero image slot */}
      <HeroSlot stop={stop} />

      {/* Per-stop horizontal asset strip under the hero. F-I018 */}
      <AssetStrip stop={stop} />

      {/* Re-imagine the hero — 6-style variants row. Only renders if a
          hero is set (VariantsRow internally also guards, but we skip
          the whole section visually if there's nothing to start from). */}
      {stop.heroAssetId && <VariantsRow stop={stop} />}

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
  const { updatePostcard } = usePostcardActions();
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

  const setAsPostcardFront = (assetId: string) => {
    updatePostcard(stop.n, {
      frontAssetId: assetId,
      style: null,
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
    if (stop.postcard.frontAssetId === assetId) {
      updatePostcard(stop.n, { frontAssetId: null });
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
          isPostcard={asset.id === stop.postcard.frontAssetId}
          onSetHero={() => setAsHero(asset.id)}
          onSetPostcard={() => setAsPostcardFront(asset.id)}
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
  isPostcard: boolean;
  onSetHero: () => void;
  onSetPostcard: () => void;
  onDetach: () => void;
}

function AssetCell({
  asset,
  isHero,
  isPostcard,
  onSetHero,
  onSetPostcard,
  onDetach,
}: AssetCellProps) {
  const [hovered, setHovered] = useState(false);
  const canUseOriginalAsPostcard =
    !isPostcard && Boolean(asset.imageUrl) && !asset.styleId;

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(MIME_ASSET_ID, asset.id);
    e.dataTransfer.effectAllowed = "copyMove";
  };

  return (
    <div
      draggable
      data-testid={`asset-cell-${asset.id}`}
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isHero ? undefined : onSetHero}
      title="Click to make this the hero · hover for postcard / detach actions · drag to move between stops"
      style={{
        flexShrink: 0,
        width: 72,
        height: 72,
        position: "relative",
        border: isHero
          ? "2px solid var(--mode-accent, #b8360a)"
          : "1px solid var(--rule)",
        background: "var(--paper-2)",
        cursor: "pointer",
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

      {isPostcard && (
        <div
          style={{
            position: "absolute",
            bottom: 3,
            left: 3,
            padding: "1px 5px",
            background: "var(--ink)",
            color: "var(--paper)",
            fontFamily: "var(--f-mono)",
            fontSize: 8,
            letterSpacing: "0.1em",
          }}
        >
          CARD
        </div>
      )}

      {hovered && (
        <div
          role="group"
          aria-label={`Actions for asset ${asset.id}`}
          style={{
            position: "absolute",
            top: 3,
            right: 3,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {canUseOriginalAsPostcard && (
            <AssetHoverButton
              onClick={(e) => {
                e.stopPropagation();
                onSetPostcard();
              }}
              testId={`asset-card-${asset.id}`}
              title="Use this original photo on the postcard front"
            >
              Card
            </AssetHoverButton>
          )}
          <AssetHoverButton
            onClick={(e) => {
              e.stopPropagation();
              onDetach();
            }}
            title="Detach from stop (keeps the photo in your library)"
            ariaLabel="Detach asset from this stop"
            destructive
          >
            ×
          </AssetHoverButton>
        </div>
      )}
    </div>
  );
}

function AssetHoverButton({
  children,
  onClick,
  title,
  testId,
  ariaLabel,
  destructive = false,
}: {
  children: ReactNode;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  title: string;
  testId?: string;
  ariaLabel?: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className="mono-sm"
      style={{
        minWidth: 28,
        height: 20,
        padding: "0 5px",
        border: "1px solid var(--rule)",
        background: destructive ? "var(--mode-accent)" : "var(--paper)",
        color: destructive ? "var(--paper)" : "var(--ink)",
        fontSize: 9,
        lineHeight: 1,
        cursor: "pointer",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </button>
  );
}

// ─── Title + vision-assist (F-I032) ────────────────────────────────────

interface TitleWithVisionAssistProps {
  stop: Stop;
}

type VisionState =
  | { kind: "idle" }
  | { kind: "asking" } // awaiting owner to type an optional hint
  | { kind: "running" }
  | { kind: "error"; message: string };

function TitleWithVisionAssist({ stop }: TitleWithVisionAssistProps) {
  const { updateStop } = useStopActions();
  const stopAssets = useAssetsByStop(stop.n);
  const [state, setState] = useState<VisionState>({ kind: "idle" });
  const [hint, setHint] = useState("");
  const [lastMock, setLastMock] = useState<boolean | null>(null);

  const heroAsset = stop.heroAssetId
    ? stopAssets.find((a) => a.id === stop.heroAssetId) ?? null
    : null;

  const canAssist = Boolean(heroAsset?.imageUrl);

  async function runVision() {
    if (!heroAsset?.imageUrl) {
      setState({ kind: "error", message: "Set a hero photo first." });
      return;
    }
    setState({ kind: "running" });
    try {
      const res = await fetch("/api/vision/describe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: heroAsset.imageUrl,
          hint: hint.trim() || undefined,
        }),
      });
      const body = (await res.json()) as
        | {
            title: string;
            paragraph: string;
            pullQuote: string;
            postcardMessage: string;
            mood: string;
            tone: StopTone;
            locationHint: string;
            mock: boolean;
            costCents: number;
            spendToDateCents: number;
          }
        | { error: string };
      if (!res.ok || !("title" in body)) {
        const msg = "error" in body ? body.error : "vision failed";
        setState({ kind: "error", message: msg });
        return;
      }
      // Merge into the stop. Never CLOBBER a title the user has already
      // written unless it looks like a placeholder ("Untitled stop" or
      // empty). Same rule for mood/tone.
      const titleIsPlaceholder =
        !stop.title ||
        stop.title === "Untitled stop" ||
        stop.title === "(untitled stop)";
      const patch: Partial<Stop> = {};
      if (titleIsPlaceholder) patch.title = body.title;
      if (!stop.mood) patch.mood = body.mood;
      if (!stop.tone || stop.tone === "warm") patch.tone = body.tone;

      // Body paragraph: only prepend if body currently has nothing
      // paragraph-like. Don't stomp real writing.
      const hasAnyProse = stop.body.some(
        (b) => b.type === "paragraph" || b.type === "pullQuote",
      );
      if (!hasAnyProse && body.paragraph) {
        const newBlocks: BodyBlock[] = [
          { type: "paragraph", content: body.paragraph },
          ...(body.pullQuote
            ? [{ type: "pullQuote" as const, content: body.pullQuote }]
            : []),
          ...stop.body,
        ];
        patch.body = newBlocks;
        patch.status = { ...stop.status, body: true };
      }
      updateStop(stop.n, patch);
      setLastMock(body.mock);
      setState({ kind: "idle" });
      setHint("");
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "vision failed",
      });
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <label style={{ flex: 1, minWidth: 240 }}>
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
            onChange={(e) =>
              updateStop(stop.n, { title: e.target.value })
            }
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
        <button
          type="button"
          className="mono-sm"
          onClick={() => {
            if (state.kind === "asking") setState({ kind: "idle" });
            else setState({ kind: "asking" });
          }}
          disabled={!canAssist || state.kind === "running"}
          title={
            !canAssist
              ? "Upload a hero photo first"
              : "Let AI read the hero and fill title / mood / paragraph"
          }
          style={{
            padding: "8px 14px",
            border: "1px solid var(--mode-accent, var(--accent))",
            background:
              !canAssist || state.kind === "running"
                ? "var(--paper-2)"
                : state.kind === "asking"
                  ? "var(--paper-3)"
                  : "var(--mode-accent, var(--accent))",
            color:
              !canAssist || state.kind === "running"
                ? "var(--ink)"
                : state.kind === "asking"
                  ? "var(--ink)"
                  : "var(--paper)",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: !canAssist ? "not-allowed" : "pointer",
            opacity: !canAssist ? 0.5 : 1,
            whiteSpace: "nowrap",
            alignSelf: "flex-end",
          }}
        >
          {state.kind === "running"
            ? "✨ reading…"
            : state.kind === "asking"
              ? "× cancel"
              : "✨ Describe from hero"}
        </button>
      </div>

      {state.kind === "asking" && (
        <div
          style={{
            marginTop: 10,
            padding: 12,
            border: "1px solid var(--mode-accent, var(--accent))",
            background: "var(--paper-2)",
          }}
        >
          <label
            className="mono-sm"
            style={{
              display: "block",
              fontSize: 10,
              letterSpacing: "0.12em",
              opacity: 0.7,
              marginBottom: 6,
            }}
          >
            Optional context (what was going on, who, why)
          </label>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g. early morning walk, first time in this market…"
            style={{
              width: "100%",
              fontSize: 14,
              padding: "8px 10px",
              border: "1px solid var(--rule)",
              background: "var(--paper)",
              fontFamily: "var(--f-sans)",
              marginBottom: 10,
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="mono-sm"
              onClick={runVision}
              style={{
                padding: "6px 14px",
                border: "1px solid var(--mode-accent, var(--accent))",
                background: "var(--mode-accent, var(--accent))",
                color: "var(--paper)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              ✨ Run · ~1¢
            </button>
            <button
              type="button"
              className="mono-sm"
              onClick={() => {
                setState({ kind: "idle" });
                setHint("");
              }}
              style={{
                padding: "6px 14px",
                border: "1px solid var(--rule)",
                background: "transparent",
                color: "var(--ink)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
          <p
            className="mono-sm"
            style={{
              marginTop: 8,
              fontSize: 9,
              opacity: 0.55,
              letterSpacing: "0.06em",
              textTransform: "none",
            }}
          >
            Will only fill title / mood if empty, and only add a paragraph
            if you haven&apos;t written any prose yet — so running this won&apos;t
            overwrite your work.
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <div
          role="alert"
          className="mono-sm"
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "var(--mode-accent, #b8360a)",
            color: "var(--paper)",
            fontSize: 11,
          }}
        >
          {state.message}
          <button
            type="button"
            onClick={() => setState({ kind: "idle" })}
            aria-label="Dismiss"
            style={{
              marginLeft: 10,
              border: "none",
              background: "transparent",
              color: "var(--paper)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ×
          </button>
        </div>
      )}

      {lastMock !== null && state.kind === "idle" && (
        <div
          className="mono-sm"
          style={{
            marginTop: 8,
            fontSize: 9,
            opacity: 0.55,
            letterSpacing: "0.06em",
            textTransform: "none",
          }}
        >
          {lastMock
            ? "Filled from MOCK vision — flip AI_PROVIDER_MOCK=false for a real read."
            : "Filled from GPT-4o-mini vision."}
        </div>
      )}
    </div>
  );
}
