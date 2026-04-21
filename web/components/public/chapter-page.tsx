"use client";

// F-T009 — single-stop "chapter" reader view.
//
// Layout:
//   Eyebrow — STOP N · code · time · mood
//   H1      — stop title (display font, mode-reactive)
//   Hero    — full-width image (if hero asset set)
//   Body    — read-only render of body blocks (paragraph / pullQuote /
//             metaRow; inlineImage / heroImage / mediaEmbed get a
//             labelled placeholder because image blocks don't have
//             reader-side rendering in M-fast).
//   Footer  — Prev / Open postcard / Next nav.

import Link from "next/link";

import { ModeSwitcher } from "@/components/mode-switcher";
import { NotFoundCard } from "./not-found-card";
import {
  findStopBySlug,
  stopSlugFrom,
  usePublicProjectLookup,
} from "./use-public-project";
import type { Asset, BodyBlock, Stop } from "@/stores/types";

export interface ChapterPageProps {
  authorHandle: string;
  slug: string;
  stopSlug: string;
}

export function ChapterPage({
  authorHandle,
  slug,
  stopSlug,
}: ChapterPageProps) {
  const lookup = usePublicProjectLookup(authorHandle, slug);

  if (!lookup) {
    return (
      <NotFoundCard what="This chapter" hint={`slug=${slug}`} />
    );
  }

  const { project, stops, assets } = lookup;
  const stop = findStopBySlug(stops, stopSlug);
  if (!stop) {
    return (
      <NotFoundCard
        what="This stop"
        hint={`project=${slug} · stop=${stopSlug}`}
      />
    );
  }

  const index = stops.findIndex((s) => s.n === stop.n);
  const prev = index > 0 ? stops[index - 1] : null;
  const next = index < stops.length - 1 ? stops[index + 1] : null;

  const hero = stop.heroAssetId
    ? assets.find((a) => a.id === stop.heroAssetId) ?? null
    : null;

  return (
    <main
      style={{ minHeight: "100vh", background: "var(--mode-bg, var(--paper))" }}
    >
      {/* Top bar — project title + mode switcher */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--mode-bg, var(--paper))",
          borderBottom:
            "1px solid color-mix(in oklab, currentColor 15%, transparent)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "14px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/${authorHandle}/${project.slug}`}
            style={{
              fontFamily: "var(--mode-display-font, var(--f-serif, serif))",
              fontStyle: "italic",
              fontSize: 22,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            ← {project.title}
          </Link>
          <ModeSwitcher />
        </div>
      </header>

      <article
        style={{
          maxWidth: 920,
          margin: "0 auto",
          padding: "56px 40px 80px",
        }}
      >
        <div
          className="eyebrow"
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.72,
            marginBottom: 14,
          }}
        >
          Stop {stop.n} · {stop.code} · {stop.time} · {stop.mood}
        </div>

        <h1
          style={{
            fontFamily: "var(--mode-display-font, var(--f-serif, serif))",
            fontSize: "clamp(40px, 7vw, 80px)",
            lineHeight: 1.0,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          {stop.title}
        </h1>

        {/* Hero image (if available) */}
        {hero?.imageUrl ? (
          <figure style={{ margin: "40px 0 28px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.imageUrl}
              alt={stop.label ?? stop.title}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: 520,
                objectFit: "cover",
                display: "block",
              }}
            />
            <figcaption
              className="mono-sm"
              style={{
                marginTop: 8,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              {stop.label}
            </figcaption>
          </figure>
        ) : (
          <div style={{ height: 40 }} />
        )}

        {/* Body blocks */}
        <BodyBlocks blocks={stop.body} assets={assets} />

        {/* Postcard CTA */}
        <div style={{ marginTop: 40 }}>
          <Link
            href={`/${authorHandle}/${project.slug}/p/${stopSlugFrom(stop.title)}`}
            className="btn btn-solid"
          >
            Open postcard →
          </Link>
        </div>

        {/* Prev / next nav */}
        <nav
          aria-label="Stop navigation"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
            marginTop: 56,
            paddingTop: 28,
            borderTop:
              "1px solid color-mix(in oklab, currentColor 15%, transparent)",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            {prev ? (
              <Link
                href={`/${authorHandle}/${project.slug}/chapter/${stopSlugFrom(prev.title)}`}
                className="mono-sm"
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                ← Stop {prev.n} · {prev.title}
              </Link>
            ) : (
              <Link
                href={`/${authorHandle}/${project.slug}`}
                className="mono-sm"
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  color: "inherit",
                  opacity: 0.72,
                }}
              >
                ← Back to project
              </Link>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1, textAlign: "right" }}>
            {next ? (
              <Link
                href={`/${authorHandle}/${project.slug}/chapter/${stopSlugFrom(next.title)}`}
                className="mono-sm"
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                Stop {next.n} · {next.title} →
              </Link>
            ) : (
              <span
                className="mono-sm"
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  opacity: 0.5,
                }}
              >
                Last stop
              </span>
            )}
          </div>
        </nav>
      </article>
    </main>
  );
}

// ─── Body blocks (read-only) ───────────────────────────────────────────

function BodyBlocks({
  blocks,
  assets,
}: {
  blocks: readonly BodyBlock[];
  assets: readonly Asset[];
}) {
  if (!blocks || blocks.length === 0) {
    return (
      <p
        style={{
          marginTop: 36,
          fontStyle: "italic",
          opacity: 0.6,
          lineHeight: 1.6,
        }}
      >
        This chapter is still in draft.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} assets={assets} />
      ))}
    </div>
  );
}

function BlockView({
  block,
  assets,
}: {
  block: BodyBlock;
  assets: readonly Asset[];
}) {
  if (block.type === "paragraph") {
    return (
      <p
        style={{
          fontFamily: "var(--f-serif)",
          fontSize: 18,
          lineHeight: 1.7,
          margin: "0 0 20px",
        }}
      >
        {block.content}
      </p>
    );
  }

  if (block.type === "pullQuote") {
    return (
      <blockquote
        style={{
          margin: "28px 0",
          paddingLeft: 18,
          borderLeft: "3px solid var(--mode-accent, currentColor)",
          fontFamily: "var(--f-fashion, var(--f-serif, serif))",
          fontStyle: "italic",
          fontSize: "clamp(22px, 3vw, 30px)",
          lineHeight: 1.3,
        }}
      >
        {block.content}
      </blockquote>
    );
  }

  if (block.type === "metaRow") {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          margin: "0 0 24px",
        }}
      >
        {block.content.map((cell, i) => (
          <span
            key={i}
            className="mono-sm"
            style={{
              padding: "4px 10px",
              border:
                "1px solid color-mix(in oklab, currentColor 25%, transparent)",
              fontSize: 11,
              letterSpacing: "0.08em",
            }}
          >
            {cell}
          </span>
        ))}
      </div>
    );
  }

  if (block.type === "heroImage" || block.type === "inlineImage") {
    const asset = assets.find((a) => a.id === block.assetId);
    const url = asset?.imageUrl ?? null;
    const isHero = block.type === "heroImage";
    if (url) {
      return (
        <figure
          style={{
            margin: isHero ? "28px 0" : "20px 0",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={block.caption}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: isHero ? 520 : 360,
              objectFit: "cover",
              display: "block",
            }}
          />
          {block.caption && (
            <figcaption
              className="mono-sm"
              style={{
                marginTop: 8,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    return (
      <BlockPlaceholder
        label={isHero ? "Hero image" : "Inline image"}
        caption={block.caption}
      />
    );
  }

  if (block.type === "mediaEmbed") {
    return (
      <BlockPlaceholder label="Media embed" caption={block.caption} />
    );
  }

  return null;
}

function BlockPlaceholder({
  label,
  caption,
}: {
  label: string;
  caption?: string;
}) {
  return (
    <div
      style={{
        margin: "24px 0",
        padding: "20px 24px",
        border:
          "1px dashed color-mix(in oklab, currentColor 30%, transparent)",
        background: "var(--paper-2, #f6f1ea)",
      }}
    >
      <div
        className="mono-sm"
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.55,
          marginBottom: 6,
        }}
      >
        {label} placeholder
      </div>
      {caption && (
        <div style={{ fontStyle: "italic", opacity: 0.8 }}>{caption}</div>
      )}
    </div>
  );
}
