"use client";

// Asset picker modal — lets the user choose an image for a body block
// (heroImage / inlineImage) from the project's asset pool, or upload a new
// one. Ported from archive/app-html-prototype-2026-04-20/src/workspace.jsx
// L1673-1813 (AssetPicker / InlinePickerPopover), trimmed to the buckets
// listed in F-T005 scope:
//   - Current hero   (the stop's heroAsset, if any)
//   - Other photos on this stop
//   - Other photos in this project
//   - Upload new
// AI variant / "generated" tone splitting is deferred until postcard AI
// lands — variants will fall into the matching bucket based on `.stop`.

import { useRef, useState } from "react";

import { useAssetActions, useAssets, useAssetsByStop } from "@/stores/asset";
import type { Asset, Stop } from "@/stores/types";

export interface AssetPickerProps {
  stop: Stop;
  currentAssetId?: string | null;
  onPick: (assetId: string) => void;
  onClose: () => void;
}

export function AssetPicker({
  stop,
  currentAssetId,
  onPick,
  onClose,
}: AssetPickerProps) {
  const allAssets = useAssets();
  const stopAssets = useAssetsByStop(stop.n);
  const { addAsset } = useAssetActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bucket the assets.
  const heroId = stop.heroAssetId;
  const currentHero = heroId
    ? stopAssets.filter((a) => a.id === heroId)
    : [];
  const otherStopAssets = stopAssets.filter((a) => a.id !== heroId);
  const otherProjectAssets = allAssets.filter(
    (a) => a.stop !== stop.n && a.id !== heroId,
  );

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
      setUploadState("idle");
      onPick(assetId);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "upload failed — try a JPEG",
      );
      setUploadState("error");
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Pick an image"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper)",
          border: "1px solid var(--rule)",
          boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
          width: "min(560px, 92vw)",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 14px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <span className="mono-sm" style={{ letterSpacing: "0.08em" }}>
            Pick image · stop {stop.n}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="mono-sm"
            aria-label="Close picker"
            style={{
              border: "1px solid var(--rule)",
              background: "var(--paper)",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            Close ×
          </button>
        </header>

        <div
          style={{
            padding: 14,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Upload new */}
          <div>
            <div
              className="eyebrow"
              style={{ marginBottom: 6, fontSize: 10, opacity: 0.7 }}
            >
              Upload new
            </div>
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
              style={{ width: "100%" }}
            >
              {uploadState === "uploading"
                ? "Uploading…"
                : "↑ Upload a new image"}
            </button>
            {errorMsg && (
              <div
                role="alert"
                className="mono-sm"
                style={{
                  marginTop: 8,
                  padding: "6px 10px",
                  background: "var(--mode-accent)",
                  color: "var(--paper)",
                  fontSize: 11,
                }}
              >
                {errorMsg}
              </div>
            )}
          </div>

          <PickerSection
            label="Current hero"
            assets={currentHero}
            currentAssetId={currentAssetId ?? null}
            onPick={onPick}
          />
          <PickerSection
            label="Other photos on this stop"
            assets={otherStopAssets}
            currentAssetId={currentAssetId ?? null}
            onPick={onPick}
          />
          <PickerSection
            label="Other photos in this project"
            assets={otherProjectAssets}
            currentAssetId={currentAssetId ?? null}
            onPick={onPick}
          />

          {currentHero.length === 0 &&
            otherStopAssets.length === 0 &&
            otherProjectAssets.length === 0 && (
              <div
                className="mono-sm"
                style={{
                  opacity: 0.55,
                  padding: 18,
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                No photos yet. Upload one above to get started.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ─── Section of the picker grid ────────────────────────────────────────

interface PickerSectionProps {
  label: string;
  assets: readonly Asset[];
  currentAssetId: string | null;
  onPick: (assetId: string) => void;
}

function PickerSection({
  label,
  assets,
  currentAssetId,
  onPick,
}: PickerSectionProps) {
  if (assets.length === 0) return null;
  return (
    <div>
      <div
        className="eyebrow"
        style={{ marginBottom: 6, fontSize: 10, opacity: 0.7 }}
      >
        {label} <span style={{ opacity: 0.55 }}>· {assets.length}</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(82px, 1fr))",
          gap: 6,
        }}
      >
        {assets.map((a) => {
          const isCurrent = currentAssetId === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a.id)}
              title={a.id}
              aria-label={`Pick ${a.id}`}
              aria-pressed={isCurrent}
              style={{
                cursor: "pointer",
                border: isCurrent
                  ? "2px solid var(--mode-accent, currentColor)"
                  : "1px solid var(--rule)",
                padding: 0,
                background: "var(--paper-2)",
                position: "relative",
                aspectRatio: "1 / 1",
                overflow: "hidden",
              }}
            >
              {a.imageUrl ? (
                <img
                  src={a.imageUrl}
                  alt={a.id}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  className="mono-sm"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    opacity: 0.55,
                    padding: 4,
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                >
                  {a.id}
                </div>
              )}
              {isCurrent && (
                <span
                  className="mono-sm"
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "var(--mode-accent, currentColor)",
                    color: "var(--paper)",
                    fontSize: 8,
                    padding: "1px 4px",
                    letterSpacing: "0.05em",
                  }}
                >
                  CURRENT
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
