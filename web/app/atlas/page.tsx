"use client";

// F-P002 atlas demo page. Renders the ported MapLibre Atlas with the
// union of SE1 + Reykjavík seed stops so the demo proves the renderer
// handles international coordinates (not just London).
//
// The old AtlasPage (the SVG-schematic version in public-pages.tsx) used
// the DemoStoreProvider state that's being torn down in M-fast
// housekeeping; we skip that here and read seed data directly.

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LanguageSwitcher, useT } from "@/components/i18n-provider";
import { Atlas, type AtlasStop } from "@/components/map/atlas";
import { ModeSwitcher } from "@/components/mode-switcher";
import { stopSlugFrom } from "@/components/public/use-public-project";
import { useMode } from "@/stores/mode";
import {
  SEED_PROJECT,
  SEED_PROJECT_REYKJAVIK,
  SEED_STOPS,
  SEED_STOPS_REYKJAVIK,
} from "@/lib/seed";

// Both demo stories are published under the seed author's handle.
const SEED_HANDLE_PATH = "/@ana-ishii";

function chapterHref(stopId: string): string | null {
  const reykjavik = stopId.startsWith("r");
  const n = reykjavik ? stopId.slice(1) : stopId;
  const stop = (reykjavik ? SEED_STOPS_REYKJAVIK : SEED_STOPS).find(
    (s) => s.n === n,
  );
  if (!stop) return null;
  const slug = reykjavik ? SEED_PROJECT_REYKJAVIK.slug : SEED_PROJECT.slug;
  return `${SEED_HANDLE_PATH}/${slug}/chapter/${stopSlugFrom(stop.title)}`;
}

export default function Page() {
  const mode = useMode();
  const t = useT();
  const router = useRouter();

  // Union of seed stops. Prefix the Reykjavík IDs so `n` is unique across
  // the two projects (both use "01".."NN"). `mood` / `time` feed the
  // pin-hover popover; no hero thumbnails at this demo layer — the
  // asset pool isn't wired through, so `heroUrl` stays undefined.
  const allStops = useMemo<readonly AtlasStop[]>(
    () => [
      ...SEED_STOPS.map((s) => ({
        n: s.n,
        title: s.title,
        lat: s.lat,
        lng: s.lng,
        mood: s.mood,
        timeLabel: s.time,
      })),
      ...SEED_STOPS_REYKJAVIK.map((s) => ({
        n: `r${s.n}`,
        title: s.title,
        lat: s.lat,
        lng: s.lng,
        mood: s.mood,
        timeLabel: s.time,
      })),
    ],
    [],
  );

  return (
    <main
      data-mode={mode}
      style={{
        padding: "48px clamp(20px, 6vw, 40px)",
        maxWidth: 1280,
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div className="eyebrow">
          <Link href="/" style={{ color: "inherit" }}>
            {t("atlas.home")}
          </Link>
          {" · "}
          {t("atlas.eyebrow")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <LanguageSwitcher compact />
          <ModeSwitcher />
        </div>
      </div>
      <h1
        style={{
          fontFamily: "var(--mode-display-font)",
          fontSize: "clamp(48px, 8vw, 88px)",
          lineHeight: 0.95,
          letterSpacing: "-0.02em",
          margin: "12px 0 16px",
        }}
      >
        {t("atlas.title", { count: allStops.length })}
      </h1>
      <p
        className="mono-sm"
        style={{ opacity: 0.65, marginBottom: 28, maxWidth: 680 }}
      >
        {t("atlas.body")}
      </p>

      <Atlas
        stops={allStops}
        onStopClick={(stopId) => {
          const href = chapterHref(stopId);
          if (href) router.push(href);
        }}
        height={560}
      />

      <p
        className="mono-sm"
        style={{
          opacity: 0.5,
          marginTop: 18,
          fontFamily: "var(--f-mono, monospace)",
          fontSize: 11,
          letterSpacing: "0.08em",
        }}
      >
        {t("atlas.switchHint")}
      </p>
    </main>
  );
}
