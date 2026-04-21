"use client";

// The full postcard editor — orchestrates the flip card, style picker,
// generate button, export buttons. Wires through to the server via
// POST /api/ai/generate (mock or real depending on env).

import { useRef, useState } from "react";

import type { PostcardStyle } from "@/lib/ai-provider";
import { exportPostcardPdf } from "@/lib/export/pdf";
import { exportNodeToPng, suggestPostcardFilename } from "@/lib/export/png";
import { getStyleMeta, POSTCARD_STYLES } from "@/lib/palette";
import { useAssetActions, useAssetsByStop } from "@/stores/asset";
import { useProject } from "@/stores/project";
import { usePostcardActions } from "@/stores/postcard";
import type { Asset, Stop } from "@/stores/types";

import { OrientationToggle, type PostcardOrientation } from "./orientation-toggle";
import { PostcardBack } from "./postcard-back";
import { PostcardCard, type PostcardCardHandle } from "./postcard-card";
import { PostcardFront } from "./postcard-front";
import { StylePicker } from "./style-picker";

export interface PostcardEditorProps {
  stop: Stop;
  totalStops: number;
}

type GenerationState =
  | { kind: "idle" }
  | { kind: "generating"; style: PostcardStyle }
  | { kind: "error"; message: string };

export function PostcardEditor({ stop, totalStops }: PostcardEditorProps) {
  const project = useProject();
  const { updatePostcard } = usePostcardActions();
  const { addAsset } = useAssetActions();
  const stopAssets = useAssetsByStop(stop.n);

  const [style, setStyle] = useState<PostcardStyle>(
    stop.postcard.style ?? "illustration",
  );
  const [orientation, setOrientation] = useState<PostcardOrientation>(
    stop.postcard.orientation ?? "landscape",
  );
  const [generation, setGeneration] = useState<GenerationState>({ kind: "idle" });
  const cardRef = useRef<PostcardCardHandle>(null);

  const heroAsset: Asset | null = stop.heroAssetId
    ? stopAssets.find((a) => a.id === stop.heroAssetId) ?? null
    : null;

  const frontAssetId =
    stop.postcard.frontAssetId ??
    stopAssets.find(
      (a) => a.styleId === style && a.stop === stop.n && a.imageUrl,
    )?.id ??
    null;
  const frontAsset: Asset | null = frontAssetId
    ? stopAssets.find((a) => a.id === frontAssetId) ?? null
    : null;

  async function onGenerate() {
    if (!heroAsset?.imageUrl) {
      setGeneration({
        kind: "error",
        message: "Set a hero image first — postcard art is generated from it.",
      });
      return;
    }
    setGeneration({ kind: "generating", style });
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "local",
          sourceImageDataUrl: heroAsset.imageUrl,
          style,
          quality: "low",
        }),
      });
      const json = (await res.json()) as
        | {
            imageDataUrl: string;
            prompt: string;
            costCents: number;
            mock: boolean;
            spendToDateCents: number;
          }
        | { error: string; spendToDateCents?: number };
      if (!res.ok || !("imageDataUrl" in json)) {
        const err = "error" in json ? json.error : "generation failed";
        setGeneration({ kind: "error", message: err });
        return;
      }

      // Save the generated asset to the pool + remember it on the postcard.
      const meta = getStyleMeta(style);
      const newAssetId = `variant-${stop.n}-${style}-${Date.now().toString(36)}`;
      addAsset({
        id: newAssetId,
        stop: stop.n,
        tone: stop.tone,
        imageUrl: json.imageDataUrl,
        generatedAt: Date.now(),
        prompt: json.prompt,
        styleId: style,
        styleLabel: meta.label,
      });
      updatePostcard(stop.n, {
        frontAssetId: newAssetId,
        style,
        orientation,
      });
      setGeneration({ kind: "idle" });
    } catch (err) {
      setGeneration({
        kind: "error",
        message: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  async function onDownloadFrontPng() {
    const node = cardRef.current?.frontNode();
    if (!node) return;
    const filename = suggestPostcardFilename(project.slug, stop.n, "front");
    await exportNodeToPng(node, filename);
  }
  async function onDownloadBackPng() {
    const node = cardRef.current?.backNode();
    if (!node) return;
    const filename = suggestPostcardFilename(project.slug, stop.n, "back");
    await exportNodeToPng(node, filename);
  }
  async function onDownloadPdf() {
    if (!frontAsset?.imageUrl) {
      setGeneration({
        kind: "error",
        message: "Generate a front image first before exporting PDF.",
      });
      return;
    }
    await exportPostcardPdf({
      frontImageUrl: frontAsset.imageUrl,
      backMessage: stop.postcard.message,
      recipient: stop.postcard.recipient,
      orientation,
      filename: `${project.slug}_${stop.n}_postcard.pdf`,
    });
  }

  const variants = stopAssets.filter((a) => a.styleId && a.imageUrl);
  const isGenerating = generation.kind === "generating";

  return (
    <section aria-label="Postcard editor" style={{ marginTop: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div className="eyebrow">Postcard</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* PROMINENT export buttons per F-P004 acceptance */}
          <button
            type="button"
            className="btn btn-sm"
            onClick={onDownloadFrontPng}
            disabled={!frontAsset}
            title="Download front (PNG, 2× pixel density)"
          >
            ↓ PNG front
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onDownloadBackPng}
            title="Download back (PNG, 2× pixel density)"
          >
            ↓ PNG back
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onDownloadPdf}
            disabled={!frontAsset}
            title="Download 2-page PDF (front + back)"
          >
            ↓ PDF
          </button>
          <OrientationToggle value={orientation} onChange={setOrientation} />
        </div>
      </div>

      <PostcardCard
        ref={cardRef}
        orientation={orientation}
        front={
          <PostcardFront
            imageUrl={frontAsset?.imageUrl ?? null}
            stopNumber={stop.n}
            totalStops={totalStops}
            styleLabel={frontAsset?.styleLabel ?? null}
          />
        }
        back={
          <PostcardBack
            postcard={stop.postcard}
            onUpdate={(patch) => updatePostcard(stop.n, patch)}
          />
        }
      />

      <div style={{ marginTop: 24 }}>
        <p
          className="mono-sm"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.55,
            marginBottom: 10,
          }}
        >
          Pick a style
        </p>
        <StylePicker
          value={style}
          onChange={setStyle}
          disabled={isGenerating}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn btn-solid"
          onClick={onGenerate}
          disabled={isGenerating || !heroAsset?.imageUrl}
          title={
            !heroAsset?.imageUrl
              ? "Set a hero image first"
              : isGenerating
                ? "Generating — hold on"
                : `Generate ${getStyleMeta(style).label} from the hero image`
          }
        >
          {isGenerating
            ? `Generating ${getStyleMeta(generation.style).label}…`
            : "Re-imagine"}
        </button>
        <span className="mono-sm" style={{ opacity: 0.55, fontSize: 11 }}>
          {POSTCARD_STYLES.length} styles available · mock mode uses a tinted placeholder
        </span>
      </div>

      {generation.kind === "error" && (
        <div
          role="alert"
          className="mono-sm"
          style={{
            marginTop: 14,
            padding: "10px 14px",
            border: "1px solid var(--mode-accent)",
            color: "var(--mode-accent)",
            fontSize: 12,
          }}
        >
          {generation.message}
        </div>
      )}

      {variants.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Variants ({variants.length})
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() =>
                  updatePostcard(stop.n, {
                    frontAssetId: v.id,
                    style: v.styleId,
                  })
                }
                title={v.styleLabel ?? v.styleId}
                aria-label={`Use ${v.styleLabel} variant`}
                style={{
                  flexShrink: 0,
                  width: 72,
                  height: 72,
                  padding: 0,
                  border:
                    v.id === frontAssetId
                      ? "2px solid var(--mode-accent)"
                      : "1px solid var(--rule)",
                  background: "transparent",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                {v.imageUrl && (
                  <img
                    src={v.imageUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
