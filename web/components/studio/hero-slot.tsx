"use client";

// Hero image slot — drop a photo or pick one from the asset pool.
// Uses F-T001 `prepareImage` to auto-rotate (EXIF) and resize to a 1600px
// max-edge JPEG data URL before writing to the asset pool + stop.heroAssetId.

import { useRef, useState } from "react";

import { useAssetActions, useAssetsByStop } from "@/stores/asset";
import { useStopActions } from "@/stores/stop";
import type { Stop } from "@/stores/types";

export interface HeroSlotProps {
  stop: Stop;
}

export function HeroSlot({ stop }: HeroSlotProps) {
  const { updateStop } = useStopActions();
  const { addAsset, updateAsset } = useAssetActions();
  const stopAssets = useAssetsByStop(stop.n);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const heroAsset = stop.heroAssetId
    ? stopAssets.find((a) => a.id === stop.heroAssetId) ?? null
    : null;

  async function onFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
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
        status: { ...stop.status, upload: true, hero: true },
      });
      setUploadState("idle");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "upload failed — try a JPEG",
      );
      setUploadState("error");
    }
  }

  return (
    <figure
      style={{
        marginTop: 32,
        position: "relative",
        aspectRatio: "7 / 5",
        border: heroAsset ? "1px solid var(--rule)" : "1px dashed var(--rule)",
        background: "var(--paper-2)",
        overflow: "hidden",
      }}
      aria-label={heroAsset ? `Hero image for stop ${stop.n}` : "Empty hero slot"}
    >
      {heroAsset?.imageUrl ? (
        <img
          src={heroAsset.imageUrl}
          alt={stop.label || stop.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
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
            (empty — upload a photo below)
          </div>
        </div>
      )}

      {/* Overlay actions */}
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
            top: 12,
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
