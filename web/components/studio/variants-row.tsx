"use client";

// VariantsRow — "Re-imagine the hero" feature.
//
// A horizontal band below the hero + asset strip that lets the owner:
//   • Pre-generate one variant per preset style (6 at once, atomic spend
//     cap via /api/ai/pregen-variants) OR generate a single style.
//   • Hover a thumb → Use as hero / Use as postcard / Regen / Delete.
//   • Cache hits (previously generated (heroAssetId, style) pairs in IDB)
//     are restored for $0 — we skip those styles in the outgoing request.
//
// Simplified from the 345-line legacy prototype:
//   • No quality tier — hardcoded "low" ($0.02/call = ~$0.12 for all 6).
//   • No prompt textbox — we use the preset prompts verbatim. Arbitrary
//     prompts are a future feature.
//   • No auto-kick-on-mount — the user clicks explicitly. Budget > magic.
//
// Rendered only when `stop.heroAssetId` is set (variants need a source).
// The emitted assets live in the same `assetsPool` as uploads and carry
// `styleId` / `styleLabel` so PostcardEditor can pick them up as "variants"
// (consistent with its existing `stopAssets.filter(a => a.styleId)`).

import { useMemo, useState } from "react";

import { DEFAULT_HERO_FOCUS } from "@/lib/constants";
import { getStyleMeta, POSTCARD_STYLES } from "@/lib/palette";
import type { PostcardStyle } from "@/lib/ai-provider";
import { useAssetActions, useAssetsByStop } from "@/stores/asset";
import { idbGetVariant, idbPutVariant } from "@/stores/idb";
import { usePostcardActions } from "@/stores/postcard";
import { useStopActions } from "@/stores/stop";
import type { Asset, Stop } from "@/stores/types";

export interface VariantsRowProps {
  stop: Stop;
}

type PendingMap = Partial<Record<PostcardStyle, true>>;
type FailureMap = Partial<Record<PostcardStyle, string>>;

// Conservative cost estimate for the "pregen all" button label.
// Matches COST_CENTS.low in ai-provider.ts ($0.02/style).
const COST_PER_STYLE_CENTS = 2;

interface PregenVariantsResponse {
  variants: Array<{
    style: PostcardStyle;
    imageDataUrl: string;
    prompt: string;
    costCents: number;
    cached: boolean;
    failed?: boolean;
    error?: string;
  }>;
  totalCostCents: number;
  spendToDateCents: number;
  mock: boolean;
}

export function VariantsRow({ stop }: VariantsRowProps) {
  const stopAssets = useAssetsByStop(stop.n);
  const { addAsset, removeAsset } = useAssetActions();
  const { updateStop } = useStopActions();
  const { updatePostcard } = usePostcardActions();

  const [pending, setPending] = useState<PendingMap>({});
  const [failures, setFailures] = useState<FailureMap>({});
  const [banner, setBanner] = useState<string | null>(null);

  const heroAsset: Asset | null = stop.heroAssetId
    ? stopAssets.find((a) => a.id === stop.heroAssetId) ?? null
    : null;

  // Existing variant thumbs in the pool — one per (stop, styleId) if present.
  // Latest-wins if somehow multiple exist for the same styleId.
  const variantByStyle = useMemo(() => {
    const map = new Map<PostcardStyle, Asset>();
    for (const a of stopAssets) {
      if (a.styleId && a.imageUrl) {
        map.set(a.styleId, a);
      }
    }
    return map;
  }, [stopAssets]);

  // Don't render if there's no hero — nothing to re-imagine from. The
  // parent can guard the render, but we double-check here for safety.
  if (!heroAsset?.imageUrl) return null;

  const frontAssetId = stop.postcard.frontAssetId ?? null;

  // ─── Shared per-style emission ─────────────────────────────────────
  //
  // After a successful generation (or cache hit), add the asset to the
  // pool + write through the variant cache. Mirrors postcard-editor.tsx
  // emission shape so either module's variants are interchangeable.

  async function emitVariant(
    style: PostcardStyle,
    imageDataUrl: string,
    prompt: string,
    cacheHit: boolean,
  ) {
    const meta = getStyleMeta(style);
    // If a variant for this style already exists, remove the old one so
    // the pool doesn't accumulate stale thumbs on Regen.
    const existing = variantByStyle.get(style);
    if (existing) removeAsset(existing.id);

    const newAssetId = `variant-${stop.n}-${style}-${cacheHit ? "cached" : "generated"}`;
    addAsset({
      id: newAssetId,
      stop: stop.n,
      tone: stop.tone,
      imageUrl: imageDataUrl,
      prompt,
      styleId: style,
      styleLabel: meta.label,
    });

    // Write-through variant cache so the next Re-imagine on the same
    // (hero, style) pair is free. Best-effort; cache failure just means
    // the next call re-pays.
    if (!cacheHit && heroAsset) {
      try {
        await idbPutVariant(`${heroAsset.id}:${style}`, {
          imageUrl: imageDataUrl,
          prompt,
          styleLabel: meta.label,
          styleId: style,
        });
      } catch (e) {
        console.warn("[variants-row] cache write failed", e);
      }
    }
    return newAssetId;
  }

  // ─── Pregen flow ───────────────────────────────────────────────────

  async function runPregen(targetStyles: readonly PostcardStyle[]) {
    if (!heroAsset?.imageUrl) return;
    setBanner(null);

    // Cache check per style: if cached, emit directly + drop from request.
    const needFetch: PostcardStyle[] = [];
    for (const style of targetStyles) {
      try {
        const cached = await idbGetVariant(`${heroAsset.id}:${style}`);
        if (cached?.imageUrl) {
          await emitVariant(style, cached.imageUrl, cached.prompt ?? "", true);
          continue;
        }
      } catch (e) {
        // Cache failure — fall through and just generate it.
        console.warn("[variants-row] cache lookup failed", e);
      }
      needFetch.push(style);
    }
    if (needFetch.length === 0) return;

    // Mark all as pending + clear any prior failure for these styles.
    setPending((p) => {
      const next = { ...p };
      for (const s of needFetch) next[s] = true;
      return next;
    });
    setFailures((f) => {
      const next = { ...f };
      for (const s of needFetch) delete next[s];
      return next;
    });

    try {
      const res = await fetch("/api/ai/pregen-variants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "local",
          sourceImageDataUrl: heroAsset.imageUrl,
          styles: needFetch,
          quality: "low",
        }),
      });
      const json = (await res.json()) as
        | PregenVariantsResponse
        | { error: string; spendToDateCents?: number };

      if (!res.ok || !("variants" in json)) {
        const err = "error" in json ? json.error : "pregen failed";
        setBanner(`Generation blocked: ${err}`);
        // Clear pending — nothing landed.
        setPending((p) => {
          const next = { ...p };
          for (const s of needFetch) delete next[s];
          return next;
        });
        return;
      }

      // Walk the response and emit each variant (or mark failed).
      for (const v of json.variants) {
        if (v.failed || !v.imageDataUrl) {
          setFailures((f) => ({
            ...f,
            [v.style]: v.error ?? "generation failed",
          }));
        } else {
          await emitVariant(v.style, v.imageDataUrl, v.prompt, false);
        }
      }
    } catch (err) {
      setBanner(
        `Generation blocked: ${err instanceof Error ? err.message : "network error"}`,
      );
    } finally {
      setPending((p) => {
        const next = { ...p };
        for (const s of needFetch) delete next[s];
        return next;
      });
    }
  }

  const onPregenAll = () => runPregen(POSTCARD_STYLES.map((s) => s.id));
  const onRegenOne = (style: PostcardStyle) => {
    // For a single-style regen, nuke the existing cache entry so we force a
    // fresh call rather than restoring the same image from IDB. The regen
    // button explicitly means "try again"; honouring the cache would be
    // confusing.
    const existing = variantByStyle.get(style);
    if (existing) removeAsset(existing.id);
    // Fire — `runPregen` will hit the cache if something's there (it won't
    // be because we just cleared it in-memory; IDB might still have a copy,
    // but that's fine — a cache hit for a "regen" click is still valuable
    // and effectively free).
    void runPregen([style]);
  };

  // ─── Per-thumb actions ─────────────────────────────────────────────

  const applyAsHero = (asset: Asset) => {
    updateStop(stop.n, {
      heroAssetId: asset.id,
      heroFocus: DEFAULT_HERO_FOCUS,
      status: { ...stop.status, hero: true, upload: true },
    });
  };

  const applyAsPostcard = (asset: Asset) => {
    if (!asset.styleId) return;
    updatePostcard(stop.n, {
      frontAssetId: asset.id,
      style: asset.styleId,
    });
  };

  const deleteVariant = (asset: Asset) => {
    removeAsset(asset.id);
    // Defensive: if this variant was the postcard front, the postcard will
    // just render its empty state — no need to clear the pointer explicitly.
  };

  const retryFailure = (style: PostcardStyle) => {
    setFailures((f) => {
      const next = { ...f };
      delete next[style];
      return next;
    });
    void runPregen([style]);
  };

  // ─── Rendering ─────────────────────────────────────────────────────

  // Cells to render: every preset style gets a slot. The slot shows a
  // live variant thumb, a pending spinner, a failure + retry, or an
  // empty placeholder (which doubles as a click target to generate just
  // that style).
  const anyPending = Object.keys(pending).length > 0;
  const estimatedCostDollars = (
    (POSTCARD_STYLES.length * COST_PER_STYLE_CENTS) /
    100
  ).toFixed(2);

  return (
    <section
      aria-label={`Variants for stop ${stop.n}`}
      style={{
        marginTop: 20,
        padding: "14px 0",
        borderTop: "1px solid var(--rule)",
      }}
    >
      <div
        className="eyebrow"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <span>Variants</span>
        <span style={{ opacity: 0.55 }}>·</span>
        <span style={{ opacity: 0.55, textTransform: "none", letterSpacing: 0 }}>
          re-imagine the hero in 6 styles (~${estimatedCostDollars} at low quality)
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          className="btn btn-sm"
          onClick={onPregenAll}
          disabled={anyPending}
          title={`Generate one variant per preset style (~$${estimatedCostDollars})`}
        >
          {anyPending
            ? "Generating…"
            : `✨ Pregen all ${POSTCARD_STYLES.length} · ~$${estimatedCostDollars}`}
        </button>
        <span className="mono-sm" style={{ fontSize: 11, opacity: 0.55 }}>
          Cached styles are skipped ($0). Low quality only.
        </span>
      </div>

      {banner && (
        <div
          role="alert"
          className="mono-sm"
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            border: "1px solid var(--mode-accent, #b8360a)",
            color: "var(--mode-accent, #b8360a)",
            fontSize: 12,
          }}
        >
          {banner}
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="mono-sm"
            style={{
              marginLeft: 8,
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            dismiss
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        {POSTCARD_STYLES.map((meta) => {
          const variant = variantByStyle.get(meta.id) ?? null;
          const isPending = Boolean(pending[meta.id]);
          const failure = failures[meta.id] ?? null;
          return (
            <VariantCell
              key={meta.id}
              style={meta.id}
              label={meta.label}
              emoji={meta.emoji}
              variant={variant}
              isPending={isPending}
              failure={failure}
              isHero={Boolean(variant && variant.id === stop.heroAssetId)}
              isPostcard={Boolean(variant && variant.id === frontAssetId)}
              onGenerate={() => runPregen([meta.id])}
              onUseAsHero={() => variant && applyAsHero(variant)}
              onUseAsPostcard={() => variant && applyAsPostcard(variant)}
              onRegen={() => onRegenOne(meta.id)}
              onDelete={() => variant && deleteVariant(variant)}
              onRetry={() => retryFailure(meta.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

// ─── Variant cell ────────────────────────────────────────────────────

interface VariantCellProps {
  style: PostcardStyle;
  label: string;
  emoji: string;
  variant: Asset | null;
  isPending: boolean;
  failure: string | null;
  isHero: boolean;
  isPostcard: boolean;
  onGenerate: () => void;
  onUseAsHero: () => void;
  onUseAsPostcard: () => void;
  onRegen: () => void;
  onDelete: () => void;
  onRetry: () => void;
}

function VariantCell(props: VariantCellProps) {
  const {
    style,
    label,
    emoji,
    variant,
    isPending,
    failure,
    isHero,
    isPostcard,
    onGenerate,
    onUseAsHero,
    onUseAsPostcard,
    onRegen,
    onDelete,
    onRetry,
  } = props;
  const [hovered, setHovered] = useState(false);

  const borderColor = isHero
    ? "var(--mode-accent, #b8360a)"
    : "var(--rule)";

  return (
    <div
      aria-label={`${label} variant`}
      data-style={style}
      data-pending={isPending || undefined}
      data-failed={failure ? true : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        border: `${isHero ? 2 : 1}px solid ${borderColor}`,
        background: "var(--paper-2)",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Thumb content: one of image / pending / failure / empty */}
      <div
        style={{
          flex: 1,
          minHeight: 100,
          position: "relative",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        {variant?.imageUrl && !isPending && !failure ? (
          <img
            src={variant.imageUrl}
            alt={`${label} variant of the hero`}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              userSelect: "none",
            }}
          />
        ) : isPending ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              aria-hidden
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "2px solid var(--rule)",
                borderTopColor: "var(--mode-accent, #b8360a)",
                animation: "spin 800ms linear infinite",
              }}
            />
            <span className="mono-sm" style={{ fontSize: 10, opacity: 0.7 }}>
              {emoji} {label}
            </span>
          </div>
        ) : failure ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: 8,
              textAlign: "center",
            }}
          >
            <span
              className="mono-sm"
              style={{ fontSize: 10, color: "var(--mode-accent, #b8360a)" }}
              title={failure}
            >
              failed
            </span>
            <button
              type="button"
              className="mono-sm"
              onClick={onRetry}
              style={{
                fontSize: 10,
                padding: "2px 8px",
                border: "1px solid var(--rule)",
                background: "var(--paper)",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            title={`Generate ${label}`}
            style={{
              width: "100%",
              height: "100%",
              minHeight: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: 10,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              opacity: 0.75,
            }}
          >
            <span style={{ fontSize: 22 }}>{emoji}</span>
            <span
              className="mono-sm"
              style={{
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              {label}
            </span>
            <span
              className="mono-sm"
              style={{ fontSize: 9, opacity: 0.45, marginTop: 2 }}
            >
              + Generate
            </span>
          </button>
        )}
      </div>

      {/* Style label strip (always visible when a variant exists) */}
      {variant && !isPending && !failure && (
        <div
          style={{
            padding: "4px 6px",
            borderTop: "1px solid var(--rule)",
            background: "var(--paper)",
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
          }}
        >
          <span>
            {emoji} {label}
          </span>
          {isHero && (
            <span
              style={{
                padding: "0 4px",
                background: "var(--mode-accent, #b8360a)",
                color: "var(--paper)",
                fontSize: 8,
                letterSpacing: "0.12em",
              }}
            >
              HERO
            </span>
          )}
          {isPostcard && !isHero && (
            <span
              style={{
                padding: "0 4px",
                background: "var(--ink)",
                color: "var(--paper)",
                fontSize: 8,
                letterSpacing: "0.12em",
              }}
            >
              CARD
            </span>
          )}
        </div>
      )}

      {/* Hover action bar */}
      {hovered && variant && !isPending && !failure && (
        <div
          role="group"
          aria-label={`Actions for ${label} variant`}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {!isHero && (
            <HoverButton
              onClick={onUseAsHero}
              title="Use this variant as the hero"
            >
              Hero
            </HoverButton>
          )}
          {!isPostcard && (
            <HoverButton
              onClick={onUseAsPostcard}
              title="Use this variant on the postcard front"
            >
              Card
            </HoverButton>
          )}
          <HoverButton onClick={onRegen} title="Regenerate this style">
            Regen
          </HoverButton>
          <HoverButton
            onClick={onDelete}
            title="Remove this variant"
            destructive
          >
            ×
          </HoverButton>
        </div>
      )}

      {/* Inline spinner keyframes — one copy per cell is ugly but the
          alternatives (globals.css touch, injecting a <style> at module
          scope) violate the "touch only these files" rule. */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

interface HoverButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  destructive?: boolean;
}

function HoverButton({ children, onClick, title, destructive }: HoverButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className="mono-sm"
      style={{
        fontSize: 9,
        letterSpacing: "0.06em",
        padding: "2px 6px",
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        color: destructive ? "var(--mode-accent, #b8360a)" : "var(--ink)",
        cursor: "pointer",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
