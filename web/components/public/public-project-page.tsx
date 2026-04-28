"use client";

// F-T009 — public project page ("reader's view").
//
// Layout (top → bottom):
//   1. Top bar: project title in the active mode's display font, then a
//      metadata row (author · publishedAt · reads), plus a right-aligned
//      ModeSwitcher.
//   2. Hero: coverLabel (eyebrow) + subtitle in display type.
//   3. Atlas snippet: <Atlas stops=… height=360 />.
//   4. Stop cards grid: numbered cards (one per stop), each a link to
//      /<author>/<slug>/chapter/<stopSlug>.
//   5. Footer: "Published via London Cuts" → /atlas.
//
// Data source: `usePublicProjectLookup()` — matches slug against the
// current project first, falls back to the archive. If nothing
// matches, we render a <NotFoundCard /> instead of calling `notFound()`.

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LanguageSwitcher, useT } from "@/components/i18n-provider";
import { Atlas, type AtlasStop } from "@/components/map/atlas";
import { ModeSwitcher } from "@/components/mode-switcher";
import { useMode } from "@/stores/mode";
import { NotFoundCard } from "./not-found-card";
import {
  stopSlugFrom,
  usePublicProjectLookup,
  type PublicProjectLookup,
} from "./use-public-project";
import type { Asset, Stop } from "@/stores/types";

export interface PublicProjectPageProps {
  authorHandle: string;
  slug: string;
  /**
   * Server-fetched data (M1 Phase 2). When provided, we skip the
   * client-side Zustand lookup entirely — this lets fresh browsers /
   * cross-device readers see the canonical Supabase state instead of
   * whatever happens to be in localStorage. Omit to fall back to the
   * legacy single-device behaviour.
   */
  initialData?: PublicProjectLookup | null;
}

export function PublicProjectPage({
  authorHandle,
  slug,
  initialData,
}: PublicProjectPageProps) {
  // Always call both hooks (React rule-of-hooks). Prefer server data
  // when present; otherwise the client store is the fallback.
  const localLookup = usePublicProjectLookup(authorHandle, slug);
  const lookup = initialData ?? localLookup;
  const router = useRouter();
  const mode = useMode();
  const t = useT();

  if (!lookup) {
    return (
      <NotFoundCard
        what="This project"
        hint={`author=${authorHandle} · slug=${slug}`}
      />
    );
  }

  const { project, stops, assets } = lookup;

  // Cover photo: first stop with a heroAssetId wins. Falls back to first
  // stop, then null. Mirrors the dashboard's coverUrlFor() logic so the
  // public hero matches the dashboard card.
  const coverStop = stops.find((s) => s.heroAssetId) ?? stops[0];
  const coverAsset = coverStop?.heroAssetId
    ? assets.find((a) => a.id === coverStop.heroAssetId)
    : assets.find((a) => a.imageUrl);
  const coverUrl = coverAsset?.imageUrl ?? null;
  const coverLabel = (coverStop?.label ?? project.coverLabel ?? "").toUpperCase();

  // F-I040 follow-up: memoize the projected stops array so the Atlas
  // doesn't re-render every marker on unrelated parent re-renders
  // (mode toggle, language switcher hover, router events, …). Without
  // useMemo, `atlasStops` is a new reference each render, the stops
  // effect inside Atlas re-fires, all markers get destroyed and
  // re-created, and any active hover card flickers. The state machine
  // still suppresses unwanted fitBounds via `didInitialFitRef`, but
  // we shouldn't even reach that point on a no-op render.
  const atlasStops: readonly AtlasStop[] = useMemo(
    () =>
      stops.map((s) => {
        // Pin-hover popover wants a thumbnail + mood/time eyebrow.
        // Look up the hero asset from the assets pool via the stop's
        // `heroAssetId` — same path the stop-card grid uses.
        const hero = s.heroAssetId
          ? assets.find((a) => a.id === s.heroAssetId) ?? null
          : null;
        return {
          n: s.n,
          title: s.title,
          lat: s.lat,
          lng: s.lng,
          heroUrl: hero?.imageUrl ?? null,
          mood: s.mood ?? null,
          timeLabel: s.time ?? null,
        };
      }),
    [stops, assets],
  );

  const onAtlasStop = useCallback(
    (stopId: string) => {
      const stop = stops.find((s) => s.n === stopId);
      if (!stop) return;
      router.push(
        `/${authorHandle}/${project.slug}/chapter/${stopSlugFrom(stop.title)}`,
      );
    },
    [stops, router, authorHandle, project.slug],
  );

  return (
    <main
      style={{ minHeight: "100vh", background: "var(--mode-bg, var(--paper))" }}
    >
      {/* Top bar */}
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
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px clamp(20px, 6vw, 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <h1
              style={{
                fontFamily: "var(--mode-display-font, var(--f-serif, serif))",
                fontStyle: "var(--mode-italic, italic)",
                fontSize: "clamp(24px, 3vw, 32px)",
                lineHeight: 1,
                margin: 0,
              }}
            >
              {project.title}
            </h1>
            <div
              className="mono-sm"
              style={{ opacity: 0.62, fontSize: 12, letterSpacing: "0.06em" }}
            >
              {project.author}
              {project.publishedAt ? ` · ${project.publishedAt}` : ""}
              {typeof project.reads === "number"
                ? ` · ${project.reads.toLocaleString()} ${t("public.reads")}`
                : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <LanguageSwitcher compact />
            <ModeSwitcher />
          </div>
        </div>
      </header>

      {/* Hero — cover image (when present) + title overlay. Cinema mode adds
          the legacy letterbox bands + EXT. <LOCATION> subtitle so the mode
          actually feels like cinema rather than just dark colors. */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding:
            "clamp(36px, 9vw, 48px) clamp(20px, 6vw, 40px) 32px",
        }}
      >
        {coverUrl && (
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: mode === "cinema" ? "21 / 9" : "16 / 9",
              overflow: "hidden",
              marginBottom: 28,
              background: "var(--paper-2)",
            }}
            data-mode-aware-hero
          >
            <img
              src={coverUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {mode === "cinema" && (
              <>
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 48,
                    background: "black",
                  }}
                />
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 48,
                    background: "black",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 60,
                    left: 24,
                    right: 24,
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      background: "rgba(0,0,0,0.55)",
                      padding: "6px 14px",
                      fontFamily: "var(--f-mono)",
                      fontSize: 13,
                      letterSpacing: "0.12em",
                      color: "oklch(0.88 0.14 90)",
                    }}
                  >
                    EXT. {coverLabel || "LONDON · GOLDEN HOUR"}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div
          className="eyebrow"
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: 12,
          }}
        >
          {project.coverLabel}
        </div>
        <p
          style={{
            fontFamily: "var(--mode-display-font, var(--f-serif, serif))",
            fontSize: "clamp(40px, 6vw, 72px)",
            lineHeight: 1.04,
            letterSpacing: "-0.01em",
            margin: 0,
            maxWidth: "18ch",
            overflowWrap: "break-word",
            textTransform: "var(--mode-uppercase, none)" as React.CSSProperties["textTransform"],
          }}
        >
          {project.subtitle ?? project.title}
        </p>
      </section>

      {/* Atlas */}
      <section
        aria-label={t("public.atlasAria")}
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px clamp(20px, 6vw, 40px) 40px",
        }}
      >
        <Atlas stops={atlasStops} height={360} onStopClick={onAtlasStop} />
      </section>

      {/* Stop cards grid */}
      <section
        aria-label={t("public.stopsAria")}
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px clamp(20px, 6vw, 40px) 64px",
        }}
      >
        <div
          className="eyebrow"
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: 16,
          }}
        >
          {stops.length} {t("public.stops")}
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {stops.map((stop, index) => (
            <li key={stop.n}>
              <StopCard
                stop={stop}
                index={index}
                assets={assets}
                href={`/${authorHandle}/${project.slug}/chapter/${stopSlugFrom(stop.title)}`}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop:
            "1px solid color-mix(in oklab, currentColor 15%, transparent)",
          padding: "28px clamp(20px, 6vw, 40px)",
          textAlign: "center",
        }}
      >
        <Link
          href="/atlas"
          className="mono-sm"
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.72,
            display: "inline-flex",
            alignItems: "center",
            minHeight: 40,
          }}
        >
          {t("public.publishedVia")}
        </Link>
      </footer>
    </main>
  );
}

// ─── Stop card ─────────────────────────────────────────────────────────

function StopCard({
  stop,
  index,
  assets,
  href,
}: {
  stop: Stop;
  index: number;
  assets: readonly Asset[];
  href: string;
}) {
  const hero = stop.heroAssetId
    ? assets.find((a) => a.id === stop.heroAssetId) ?? null
    : null;
  const thumb = hero?.imageUrl ?? null;
  const t = useT();

  return (
    <Link
      href={href}
      data-testid="public-stop-card"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        border:
          "1px solid color-mix(in oklab, currentColor 15%, transparent)",
        background: "var(--paper, #fff)",
        overflow: "hidden",
        transition: "transform 160ms ease",
      }}
    >
      <div
        style={{
          aspectRatio: "16 / 10",
          width: "100%",
          background: "var(--paper-2, #eee)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={stop.label ?? stop.title}
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
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              opacity: 0.45,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {t("public.noHero")}
          </div>
        )}
        <div
          className="mono-sm"
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "3px 8px",
            background: "var(--paper, #fff)",
            border:
              "1px solid color-mix(in oklab, currentColor 25%, transparent)",
            fontSize: 10,
            letterSpacing: "0.12em",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>
      <div style={{ padding: "14px 16px 18px" }}>
        <h3
          style={{
            fontFamily: "var(--mode-display-font, var(--f-serif, serif))",
            fontSize: 20,
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {stop.title}
        </h3>
        <div
          className="mono-sm"
          style={{
            marginTop: 6,
            fontSize: 11,
            letterSpacing: "0.06em",
            opacity: 0.66,
          }}
        >
          {stop.code} · {stop.time} · {stop.mood}
        </div>
      </div>
    </Link>
  );
}
