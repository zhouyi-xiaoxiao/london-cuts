"use client";

// Hero image slot — port of legacy `HeroSlot` + `HeroDraggable`.
// Features:
//   • Drag-pan focus (pointer drag on landscape photos sets objectPosition).
//   • EXIF-aware portrait letterbox: portrait photos render with a blurred
//     cover backdrop + a contained foreground so nothing is cropped.
//   • Double-click to recenter focus.
//   • ↺ / ↻ rotate 90° buttons that re-encode the asset's imageUrl.
//   • File drop from the OS (Finder, Files).
//   • Asset drag-source drops (expects `text/lc-asset-id` MIME once the
//     assets drawer becomes a drag source; no-op until then).
//   • Upload button for explicit file pickers.
//   • Clear button to detach the hero asset.
//
// Focus state persists on `stop.heroFocus`. Existing stops without a focus
// value default to the center (50, 50).

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { useAssetActions, useAssetsByStop } from "@/stores/asset";
import { useStopActions } from "@/stores/stop";
import type { HeroFocus, Stop } from "@/stores/types";

export interface HeroSlotProps {
  stop: Stop;
}

// Shared drag-drop contract. Once the AssetsPoolDrawer starts setting this on
// dragstart, the hero slot will accept its drops for free.
export const MIME_ASSET_ID = "text/lc-asset-id";
const DEFAULT_FOCUS: HeroFocus = { x: 50, y: 50 };

export function HeroSlot({ stop }: HeroSlotProps) {
  const { updateStop } = useStopActions();
  const { addAsset, updateAsset } = useAssetActions();
  const stopAssets = useAssetsByStop(stop.n);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [dropActive, setDropActive] = useState(false);

  const heroAsset = stop.heroAssetId
    ? stopAssets.find((a) => a.id === stop.heroAssetId) ?? null
    : null;
  const heroSrc = heroAsset?.imageUrl ?? null;
  const focus: HeroFocus = stop.heroFocus ?? DEFAULT_FOCUS;

  const attachUploadedFile = useCallback(
    async (file: File) => {
      setUploadState("uploading");
      setErrorMsg(null);
      try {
        const { prepareImage } = await import("@/lib/utils/image");
        const { dataUrl } = await prepareImage(file, { maxEdge: 1600 });
        const assetId = `upload-${stop.n}-${Date.now().toString(36)}`;
        addAsset({
          id: assetId,
          stop: stop.n,
          tone: stop.tone,
          imageUrl: dataUrl,
        });
        updateStop(stop.n, {
          heroAssetId: assetId,
          heroFocus: DEFAULT_FOCUS,
          status: { ...stop.status, upload: true, hero: true },
        });
        setUploadState("idle");
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "upload failed — try a JPEG",
        );
        setUploadState("error");
      }
    },
    [addAsset, stop, updateStop],
  );

  async function onFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return;
    await attachUploadedFile(files[0]);
  }

  const setFocus = useCallback(
    (next: HeroFocus) => {
      updateStop(stop.n, { heroFocus: next });
    },
    [stop.n, updateStop],
  );

  async function onRotate(degrees: 90 | -90) {
    if (!heroAsset || !heroSrc || rotating) return;
    setRotating(true);
    setErrorMsg(null);
    try {
      const { rotateImageDataUrl } = await import("@/lib/utils/image");
      const rotated = await rotateImageDataUrl(heroSrc, degrees);
      updateAsset(heroAsset.id, { imageUrl: rotated });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "rotate failed");
    } finally {
      setRotating(false);
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (
      e.dataTransfer.types.includes(MIME_ASSET_ID) ||
      e.dataTransfer.types.includes("Files")
    ) {
      e.preventDefault();
      setDropActive(true);
    }
  }

  function onDragLeave() {
    setDropActive(false);
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    setDropActive(false);
    const assetId = e.dataTransfer.getData(MIME_ASSET_ID);
    if (assetId) {
      e.preventDefault();
      updateStop(stop.n, {
        heroAssetId: assetId,
        heroFocus: DEFAULT_FOCUS,
        status: { ...stop.status, upload: true, hero: true },
      });
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      e.preventDefault();
      await attachUploadedFile(file);
    }
  }

  return (
    <figure
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        marginTop: 32,
        position: "relative",
        aspectRatio: "7 / 5",
        border: heroAsset
          ? dropActive
            ? "1px solid var(--mode-accent)"
            : "1px solid var(--rule)"
          : dropActive
            ? "1px dashed var(--mode-accent)"
            : "1px dashed var(--rule)",
        background: "var(--paper-2)",
        overflow: "hidden",
      }}
      aria-label={heroAsset ? `Hero image for stop ${stop.n}` : "Empty hero slot"}
    >
      {heroSrc ? (
        <HeroDraggable
          src={heroSrc}
          alt={stop.label || stop.title || "hero"}
          focus={focus}
          onFocusChange={setFocus}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            className="mono-sm"
            style={{ opacity: 0.45, letterSpacing: "0.2em" }}
          >
            HERO IMAGE
          </div>
          <div
            className="mono-sm"
            style={{ opacity: 0.35, fontSize: 10 }}
          >
            (drop a photo, or upload below)
          </div>
        </div>
      )}

      {/* Right-side rotate stack — only visible with a hero */}
      {heroSrc && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "flex",
            gap: 6,
          }}
        >
          <IconBtn
            onClick={() => onRotate(-90)}
            disabled={rotating}
            label="Rotate 90° counter-clockwise"
            title="Rotate 90° counter-clockwise"
          >
            ↺
          </IconBtn>
          <IconBtn
            onClick={() => onRotate(90)}
            disabled={rotating}
            label="Rotate 90° clockwise"
            title="Rotate 90° clockwise"
          >
            ↻
          </IconBtn>
        </div>
      )}

      {rotating && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "4px 8px",
            background: "rgba(0,0,0,0.65)",
            color: "white",
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.08em",
          }}
        >
          Rotating…
        </div>
      )}

      {/* Bottom-bar: Upload / Replace / Clear */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          right: 12,
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onFilesPicked(e.target.files)}
        />
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadState === "uploading"}
          style={{
            background: "var(--paper)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {heroAsset
            ? uploadState === "uploading"
              ? "Uploading…"
              : "Replace hero"
            : uploadState === "uploading"
              ? "Uploading…"
              : "Upload photo"}
        </button>
        {heroAsset && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              updateStop(stop.n, {
                heroAssetId: null,
                heroFocus: null,
                status: { ...stop.status, hero: false },
              })
            }
            style={{
              background: "var(--paper)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mono-sm"
          style={{
            position: "absolute",
            top: 48,
            left: 12,
            right: 12,
            padding: "6px 10px",
            background: "var(--mode-accent)",
            color: "var(--paper)",
            fontSize: 11,
          }}
        >
          {errorMsg}
        </div>
      )}
    </figure>
  );
}

// ─── HeroDraggable: pointer-drag pan + portrait letterbox ──────────────

interface HeroDraggableProps {
  src: string;
  alt: string;
  focus: HeroFocus;
  onFocusChange: (next: HeroFocus) => void;
}

function HeroDraggable({ src, alt, focus, onFocusChange }: HeroDraggableProps) {
  const [isPortrait, setIsPortrait] = useState<boolean | null>(null);
  const [local, setLocal] = useState<HeroFocus>(focus);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    fx: number;
    fy: number;
    w: number;
    h: number;
  } | null>(null);

  // Keep local in sync with the store's value when it changes from outside
  // (switching stops, another tab, rotate action). Skipped while the user is
  // actively dragging so their in-flight pan doesn't get clobbered.
  useEffect(() => {
    if (!dragging) setLocal(focus);
    // We intentionally depend on focus.x/focus.y only to avoid
    // referential-identity re-runs when the store returns a new object.
  }, [focus, dragging]);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setIsPortrait(img.naturalHeight > img.naturalWidth * 1.05);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPortrait) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      fx: local.x,
      fy: local.y,
      w: rect.width,
      h: rect.height,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragRef.current) return;
    const d = dragRef.current;
    // Moving the pointer RIGHT should shift focus LEFT (the image pans
    // right in the frame), so we subtract. Scale 2× for responsive feel.
    const dx = ((e.clientX - d.startX) / d.w) * 200;
    const dy = ((e.clientY - d.startY) / d.h) * 200;
    const nx = Math.max(0, Math.min(100, d.fx - dx));
    const ny = Math.max(0, Math.min(100, d.fy - dy));
    setLocal({ x: nx, y: ny });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer may have already released */
    }
    dragRef.current = null;
    if (local.x !== focus.x || local.y !== focus.y) {
      onFocusChange(local);
    }
  };

  const recenter = () => {
    setLocal(DEFAULT_FOCUS);
    onFocusChange(DEFAULT_FOCUS);
  };

  if (isPortrait) {
    const backdropStyle: CSSProperties = {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "50% 50%",
      filter: "blur(40px) brightness(0.7) saturate(1.3)",
      transform: "scale(1.15)",
      userSelect: "none",
      pointerEvents: "none",
    };
    const foregroundStyle: CSSProperties = {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "contain",
      objectPosition: `${local.x}% ${local.y}%`,
      userSelect: "none",
      pointerEvents: "none",
    };
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: "#000",
          cursor: "default",
        }}
        title="Portrait photo — shown in full"
      >
        <img src={src} alt="" aria-hidden draggable={false} style={backdropStyle} />
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={onImgLoad}
          style={foregroundStyle}
        />
      </div>
    );
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={recenter}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      title="Drag to reposition · double-click to recenter"
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={onImgLoad}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${local.x}% ${local.y}%`,
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
      {dragging && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            padding: "4px 8px",
            background: "rgba(0,0,0,0.55)",
            color: "white",
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.08em",
          }}
        >
          FOCUS · {Math.round(local.x)}% × {Math.round(local.y)}%
        </div>
      )}
    </div>
  );
}

// ─── Small icon button used for rotate controls ────────────────────────

function IconBtn({
  onClick,
  disabled,
  label,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title}
      disabled={disabled}
      className="mono-sm"
      style={{
        width: 32,
        height: 32,
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
      }}
    >
      {children}
    </button>
  );
}
