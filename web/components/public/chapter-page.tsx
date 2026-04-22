"use client";

// F-T009 — single-stop "chapter" reader view, with three mode-specific
// grammars restored (Fashion / Punk / Cinema). The three legacy
// prototype `StopFashion` / `StopPunk` / `StopCinema` shapes
// (web/prototype/src/public-stop.jsx) and the `StopDetail` reference
// in archive/app-html-prototype-2026-04-20/src/public-project.jsx are
// the source of truth for rhythm + typography.
//
// Switching grammars at runtime via useMode() — *not* hardcoded
// constants. Inline styles read the mode CSS vars from globals.css
// (--mode-display-font, --mode-bg, --mode-ink, --mode-accent,
//  --mode-italic, --mode-uppercase, --mode-h1-scale, --mode-body-font)
// so a mode flip in the top-bar switcher visually re-skins this page
// without re-rendering structurally.
//
// Per-mode grammar choices:
//   Fashion — italic Bodoni h1, narrow body column (~640px), generous
//             whitespace, 16:9 hero, centered header.
//   Punk    — ALL CAPS Archivo Black h1 (large, banner-like), full-width
//             body, asymmetric padding, hero with slight rotate + heavy
//             border. Two-column body on wide viewports.
//   Cinema  — Instrument Serif h1 (scene-title size), letterboxed 21:9
//             hero, monospace body column (centered, ~720px).
//
// Body block rendering (paragraph / pullQuote / metaRow / heroImage /
// inlineImage / mediaEmbed) keeps the same logic — only the wrapper
// styling shifts per mode.

import Link from "next/link";

import { ModeSwitcher } from "@/components/mode-switcher";
import { useMode } from "@/stores/mode";
import { NotFoundCard } from "./not-found-card";
import {
  findStopBySlug,
  stopSlugFrom,
  usePublicProjectLookup,
  type PublicProjectLookup,
} from "./use-public-project";
import type { Asset, BodyBlock, NarrativeMode, Stop } from "@/stores/types";

export interface ChapterPageProps {
  authorHandle: string;
  slug: string;
  stopSlug: string;
}

// ─── Per-mode grammar table ───────────────────────────────────────────
// Pure data — keeps the JSX below readable and makes it cheap to add a
// fourth mode later without re-shaping the component.

interface ModeGrammar {
  /** Outer max-width of the article column (px). */
  articleMaxWidth: number;
  /** Padding around the article (CSS shorthand). */
  articlePadding: string;
  /** Hero aspect-ratio (CSS aspect-ratio value). */
  heroAspect: string;
  /** Decoration applied to the hero <figure> wrapper. */
  heroFigureStyle: React.CSSProperties;
  /** H1 inline style — font, transform, scale, etc. */
  h1Style: React.CSSProperties;
  /** Eyebrow inline style above the title. */
  eyebrowStyle: React.CSSProperties;
  /** Whether the header block (eyebrow + h1) is centered. */
  headerCentered: boolean;
  /** Body-block container width (px). */
  bodyMaxWidth: number;
  /** Whether to render paragraphs in a two-column grid (Punk). */
  bodyTwoColumn: boolean;
  /** Paragraph font + rhythm. */
  paragraphStyle: React.CSSProperties;
  /** Pull-quote chrome. */
  pullQuoteStyle: React.CSSProperties;
  /** Meta-row chip style. */
  metaCellStyle: React.CSSProperties;
}

function grammarFor(mode: NarrativeMode): ModeGrammar {
  if (mode === "fashion") {
    return {
      articleMaxWidth: 1080,
      articlePadding: "80px 40px 96px",
      heroAspect: "16 / 9",
      heroFigureStyle: {
        margin: "48px 0 28px",
        // Fashion: clean full-bleed photograph, no border decoration.
      },
      h1Style: {
        fontFamily: "var(--mode-display-font, var(--f-fashion, serif))",
        fontStyle: "var(--mode-italic, italic)",
        fontWeight: 300,
        fontSize: "clamp(48px, 8vw, 96px)",
        lineHeight: 1.0,
        letterSpacing: "-0.02em",
        margin: "12px 0 0",
        textAlign: "center",
        textTransform: "var(--mode-uppercase, none)" as React.CSSProperties["textTransform"],
      },
      eyebrowStyle: {
        fontFamily: "var(--f-mono)",
        fontSize: 11,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        opacity: 0.6,
        textAlign: "center",
        marginBottom: 18,
      },
      headerCentered: true,
      bodyMaxWidth: 640,
      bodyTwoColumn: false,
      paragraphStyle: {
        fontFamily: "var(--mode-body-font, var(--f-sans))",
        fontSize: 16,
        lineHeight: 1.7,
        margin: "0 0 22px",
      },
      pullQuoteStyle: {
        margin: "32px 0",
        fontFamily: "var(--f-fashion, var(--f-serif, serif))",
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: "clamp(22px, 2.6vw, 30px)",
        lineHeight: 1.4,
        color: "color-mix(in oklab, var(--mode-ink) 80%, transparent)",
        // No border bar in Fashion — the italic itself is the quote signal.
        paddingLeft: 0,
        border: "none",
      },
      metaCellStyle: {
        padding: "4px 0",
        border: "none",
        opacity: 0.7,
      },
    };
  }
  if (mode === "punk") {
    return {
      articleMaxWidth: 1240,
      articlePadding: "32px 40px 80px",
      heroAspect: "16 / 9",
      heroFigureStyle: {
        margin: "32px 0",
        transform: "rotate(-0.5deg)",
        boxShadow: "0 6px 12px rgba(0,0,0,0.25)",
        border: "2px solid currentColor",
      },
      h1Style: {
        fontFamily: "var(--mode-display-font, var(--f-display, sans-serif))",
        fontStyle: "var(--mode-italic, normal)",
        fontWeight: 900,
        fontSize: "clamp(56px, 12vw, 132px)",
        lineHeight: 0.9,
        letterSpacing: "-0.02em",
        margin: "16px 0 24px",
        textTransform: "var(--mode-uppercase, uppercase)" as React.CSSProperties["textTransform"],
      },
      eyebrowStyle: {
        display: "inline-block",
        fontFamily: "var(--f-mono)",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        background: "var(--mode-ink)",
        color: "var(--mode-bg)",
        padding: "4px 8px",
        marginBottom: 4,
      },
      headerCentered: false,
      bodyMaxWidth: 1160,
      bodyTwoColumn: true,
      paragraphStyle: {
        fontFamily: "var(--mode-body-font, var(--f-mono))",
        fontSize: 14,
        lineHeight: 1.7,
        margin: "0 0 16px",
      },
      pullQuoteStyle: {
        margin: "24px 0",
        padding: "18px 20px",
        background: "var(--mode-ink)",
        color: "var(--mode-accent)",
        fontFamily: "var(--mode-display-font, var(--f-display))",
        fontStyle: "normal",
        fontWeight: 900,
        fontSize: "clamp(22px, 2.6vw, 30px)",
        lineHeight: 1.15,
        textTransform: "uppercase",
        transform: "rotate(-0.4deg)",
        border: "none",
      },
      metaCellStyle: {
        padding: "4px 8px",
        background: "var(--mode-ink)",
        color: "var(--mode-bg)",
        border: "none",
      },
    };
  }
  // cinema
  return {
    articleMaxWidth: 1100,
    articlePadding: "40px 40px 96px",
    heroAspect: "21 / 9",
    heroFigureStyle: {
      margin: "32px 0 36px",
      border:
        "1px solid color-mix(in oklab, var(--mode-ink) 35%, transparent)",
      // Letterboxed look — frame caption rendered separately below.
    },
    h1Style: {
      fontFamily: "var(--mode-display-font, var(--f-serif, serif))",
      fontStyle: "var(--mode-italic, normal)",
      fontWeight: 400,
      fontSize: "clamp(40px, 6.5vw, 88px)",
      lineHeight: 1.0,
      letterSpacing: "-0.01em",
      margin: "8px 0 14px",
      textTransform:
        "var(--mode-uppercase, none)" as React.CSSProperties["textTransform"],
    },
    eyebrowStyle: {
      fontFamily: "var(--f-mono)",
      fontSize: 10,
      letterSpacing: "0.25em",
      textTransform: "uppercase",
      opacity: 0.6,
      marginBottom: 20,
    },
    headerCentered: false,
    bodyMaxWidth: 720,
    bodyTwoColumn: false,
    paragraphStyle: {
      fontFamily: "var(--mode-body-font, var(--f-mono))",
      fontSize: 14,
      lineHeight: 1.8,
      margin: "0 0 22px",
    },
    pullQuoteStyle: {
      margin: "32px auto",
      maxWidth: "30em",
      padding: "16px 20px",
      borderTop:
        "1px solid color-mix(in oklab, var(--mode-accent) 60%, transparent)",
      borderBottom:
        "1px solid color-mix(in oklab, var(--mode-accent) 60%, transparent)",
      fontFamily: "var(--mode-display-font, var(--f-serif))",
      fontStyle: "normal",
      fontSize: "clamp(20px, 2.4vw, 26px)",
      lineHeight: 1.4,
      textAlign: "center",
      color: "var(--mode-accent)",
    },
    metaCellStyle: {
      padding: "8px 14px",
      border:
        "1px solid color-mix(in oklab, var(--mode-ink) 30%, transparent)",
      fontFamily: "var(--f-mono)",
    },
  };
}

export function ChapterPage({
  authorHandle,
  slug,
  stopSlug,
  initialData,
}: ChapterPageProps & { initialData?: PublicProjectLookup | null }) {
  // M1 Phase 2: prefer server-fetched initialData; local Zustand as fallback.
  const localLookup = usePublicProjectLookup(authorHandle, slug);
  const lookup = initialData ?? localLookup;
  const mode = useMode();

  if (!lookup) {
    return <NotFoundCard what="This chapter" hint={`slug=${slug}`} />;
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

  const grammar = grammarFor(mode);
  const index = stops.findIndex((s) => s.n === stop.n);
  const prev = index > 0 ? stops[index - 1] : null;
  const next = index < stops.length - 1 ? stops[index + 1] : null;

  const hero = stop.heroAssetId
    ? assets.find((a) => a.id === stop.heroAssetId) ?? null
    : null;

  const headerAlignment: React.CSSProperties = grammar.headerCentered
    ? { textAlign: "center" }
    : {};

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--mode-bg, var(--paper))",
        color: "var(--mode-ink, var(--ink))",
      }}
    >
      {/* Top bar — project title + mode switcher.
          Display font follows the mode so the back-link visually leads
          into the chapter's typography. */}
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
              fontFamily:
                "var(--mode-display-font, var(--f-serif, serif))",
              fontStyle: "var(--mode-italic, italic)",
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
          maxWidth: grammar.articleMaxWidth,
          margin: "0 auto",
          padding: grammar.articlePadding,
        }}
      >
        {/* Header block — eyebrow + h1.
            Centered for Fashion; left-aligned (with stopband eyebrow)
            for Punk; left-aligned with mono eyebrow for Cinema. */}
        <div style={headerAlignment}>
          <div className="eyebrow" style={grammar.eyebrowStyle}>
            Stop {stop.n} · {stop.code} · {stop.time} · {stop.mood}
          </div>
          <h1 style={grammar.h1Style}>{stop.title}</h1>
        </div>

        {/* Hero image — aspect-ratio per mode (16:9 fashion/punk; 21:9
            cinema). When no hero is set, fall back to a slim spacer so
            the body doesn't crash up against the title. */}
        {hero?.imageUrl ? (
          <figure style={grammar.heroFigureStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.imageUrl}
              alt={stop.label ?? stop.title}
              style={{
                width: "100%",
                height: "auto",
                aspectRatio: grammar.heroAspect,
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
                textAlign: mode === "fashion" ? "right" : "left",
              }}
            >
              {stop.label}
            </figcaption>
          </figure>
        ) : (
          <div style={{ height: 40 }} />
        )}

        {/* Body — column width + (Punk) two-column layout switch. */}
        <div
          style={{
            maxWidth: grammar.bodyMaxWidth,
            margin: grammar.headerCentered ? "0 auto" : undefined,
          }}
        >
          <BodyBlocks
            blocks={stop.body}
            assets={assets}
            grammar={grammar}
            mode={mode}
          />
        </div>

        {/* Postcard CTA */}
        <div
          style={{
            marginTop: 48,
            textAlign: grammar.headerCentered ? "center" : "left",
          }}
        >
          <Link
            href={`/${authorHandle}/${project.slug}/p/${stopSlugFrom(stop.title)}`}
            className="btn btn-solid"
          >
            Open postcard →
          </Link>
        </div>

        {/* Prev / next nav — same on every mode (functional, not
            grammar-bearing). */}
        <ChapterNav
          authorHandle={authorHandle}
          projectSlug={project.slug}
          prev={prev}
          next={next}
        />
      </article>
    </main>
  );
}

// ─── Prev / next chapter nav ──────────────────────────────────────────

function ChapterNav({
  authorHandle,
  projectSlug,
  prev,
  next,
}: {
  authorHandle: string;
  projectSlug: string;
  prev: Stop | null;
  next: Stop | null;
}) {
  return (
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
            href={`/${authorHandle}/${projectSlug}/chapter/${stopSlugFrom(prev.title)}`}
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
            href={`/${authorHandle}/${projectSlug}`}
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
            href={`/${authorHandle}/${projectSlug}/chapter/${stopSlugFrom(next.title)}`}
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
  );
}

// ─── Body blocks (read-only) ──────────────────────────────────────────

function BodyBlocks({
  blocks,
  assets,
  grammar,
  mode,
}: {
  blocks: readonly BodyBlock[];
  assets: readonly Asset[];
  grammar: ModeGrammar;
  mode: NarrativeMode;
}) {
  if (!blocks || blocks.length === 0) {
    return (
      <p
        style={{
          ...grammar.paragraphStyle,
          marginTop: 32,
          fontStyle: "italic",
          opacity: 0.6,
        }}
      >
        This chapter is still in draft.
      </p>
    );
  }

  // Punk grammar: render text-y blocks (paragraph + pullQuote) in a
  // two-column grid so the body has the asymmetric, zine-like rhythm
  // the prototype showed. Image and meta blocks span both columns —
  // they're full-bleed in legacy too.
  if (grammar.bodyTwoColumn) {
    return (
      <div style={{ marginTop: 32 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            columnGap: 40,
            rowGap: 0,
          }}
        >
          {blocks.map((block, i) => {
            const fullBleed =
              block.type === "metaRow" ||
              block.type === "heroImage" ||
              block.type === "inlineImage" ||
              block.type === "mediaEmbed";
            return (
              <div
                key={i}
                style={fullBleed ? { gridColumn: "1 / -1" } : undefined}
              >
                <BlockView
                  block={block}
                  assets={assets}
                  grammar={grammar}
                  mode={mode}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 32 }}>
      {blocks.map((block, i) => (
        <BlockView
          key={i}
          block={block}
          assets={assets}
          grammar={grammar}
          mode={mode}
        />
      ))}
    </div>
  );
}

function BlockView({
  block,
  assets,
  grammar,
  mode,
}: {
  block: BodyBlock;
  assets: readonly Asset[];
  grammar: ModeGrammar;
  mode: NarrativeMode;
}) {
  if (block.type === "paragraph") {
    return <p style={grammar.paragraphStyle}>{block.content}</p>;
  }

  if (block.type === "pullQuote") {
    return <blockquote style={grammar.pullQuoteStyle}>{block.content}</blockquote>;
  }

  if (block.type === "metaRow") {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: mode === "fashion" ? 16 : 10,
          margin: "0 0 24px",
          // Fashion meta-row reads as "byline" letter-spaced text, not chips.
          ...(mode === "fashion"
            ? {
                justifyContent: "center",
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }
            : null),
        }}
      >
        {block.content.map((cell, i) => (
          <span
            key={i}
            className={mode === "fashion" ? undefined : "mono-sm"}
            style={{
              fontSize: 11,
              letterSpacing: mode === "fashion" ? "0.18em" : "0.08em",
              textTransform: "uppercase",
              ...grammar.metaCellStyle,
            }}
          >
            {mode === "fashion" && i > 0 ? `· ${cell}` : cell}
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
            ...(isHero ? grammar.heroFigureStyle : null),
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={block.caption}
            style={{
              width: "100%",
              height: "auto",
              aspectRatio: isHero ? grammar.heroAspect : undefined,
              maxHeight: isHero ? undefined : 360,
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
    return <BlockPlaceholder label="Media embed" caption={block.caption} />;
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
        background:
          "color-mix(in oklab, var(--mode-surface, var(--paper-2)) 100%, transparent)",
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
        <div style={{ fontStyle: "var(--mode-italic, italic)", opacity: 0.8 }}>
          {caption}
        </div>
      )}
    </div>
  );
}
