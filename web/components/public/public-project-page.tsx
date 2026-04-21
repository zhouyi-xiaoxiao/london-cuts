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

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Atlas, type AtlasStop } from "@/components/map/atlas";
import { ModeSwitcher } from "@/components/mode-switcher";
import { NotFoundCard } from "./not-found-card";
import {
  stopSlugFrom,
  usePublicProjectLookup,
} from "./use-public-project";
import type { Asset, Stop } from "@/stores/types";

export interface PublicProjectPageProps {
  authorHandle: string;
  slug: string;
}

export function PublicProjectPage({
  authorHandle,
  slug,
}: PublicProjectPageProps) {
  const lookup = usePublicProjectLookup(authorHandle, slug);
  const router = useRouter();

  if (!lookup) {
    return (
      <NotFoundCard
        what="This project"
        hint={`author=${authorHandle} · slug=${slug}`}
      />
    );
  }

  const { project, stops, assets } = lookup;

  const atlasStops: readonly AtlasStop[] = stops.map((s) => ({
    n: s.n,
    title: s.title,
    lat: s.lat,
    lng: s.lng,
  }));

  const onAtlasStop = (stopId: string) => {
    const stop = stops.find((s) => s.n === stopId);
    if (!stop) return;
    router.push(
      `/${authorHandle}/${project.slug}/chapter/${stopSlugFrom(stop.title)}`,
    );
  };

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
            padding: "16px 40px",
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
                fontStyle: "italic",
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
                ? ` · ${project.reads.toLocaleString()} reads`
                : ""}
            </div>
          </div>
          <ModeSwitcher />
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "48px 40px 32px",
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
          }}
        >
          {project.subtitle ?? project.title}
        </p>
      </section>

      {/* Atlas */}
      <section
        aria-label="Atlas for this project"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px 40px 40px",
        }}
      >
        <Atlas stops={atlasStops} height={360} onStopClick={onAtlasStop} />
      </section>

      {/* Stop cards grid */}
      <section
        aria-label="Stops in this project"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px 40px 64px",
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
          {stops.length} stops
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
          padding: "28px 40px",
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
          }}
        >
          Published via London Cuts
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
          // eslint-disable-next-line @next/next/no-img-element
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
            No hero yet
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
