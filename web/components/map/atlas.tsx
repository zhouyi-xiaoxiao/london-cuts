"use client";

// F-P002 — MapLibre atlas, ported forward from
// archive/app-html-prototype-2026-04-20/src/public-atlas.jsx.
//
// Design choices for the port:
// 1. `maplibre-gl` is a heavy client-only package (WebGL, workers, ~800KB).
//    We dynamically `import()` it inside the first `useEffect` so SSR never
//    touches it — Next.js 16 builds the server bundle without the dep, and
//    tests can stub the dynamic-import resolve.
// 2. The three narrative modes pick different CARTO basemap tile URLs:
//       fashion → voyager   (warm, neutral)
//       cinema  → dark_all  (deep blue/black)
//       punk    → light_all + full B&W filter via CSS (zine)
//    URLs are all under basemaps.cartocdn.com, which is already allow-listed
//    in `web/next.config.ts` for next/image.
// 3. Mode changes swap tiles via `map.setStyle(buildStyle(mode))` so the
//    user sees a real re-themed canvas, not just a different overlay.
// 4. Fallback story: if the MapLibre constructor throws (no WebGL, or the
//    worker URL can't load), we render an SVG schematic that projects the
//    same stops onto a 800×500 viewport. No network needed.
//
// NOTE on the hover card: Earlier iterations used `maplibregl.Popup`. That
// kept tripping an auto-pan on mouseenter — MapLibre's popup system
// sometimes shifts the viewport to keep the popup within bounds, which the
// owner perceived as "pins drift away when you hover". We now render a
// single plain <div> overlay *inside* the container div, absolutely
// positioned, and manually reposition it via `map.project(...)` on every
// `move` event. A DOM overlay we drive ourselves cannot trigger MapLibre
// to re-layout, so the map stays perfectly still on hover.
//
// NOTE: This component deliberately avoids the 3-tier fallback of the
// legacy prototype (MapLibre → Leaflet → SVG). The Leaflet tier exists
// because the legacy prototype loaded maplibre-gl from a CDN at runtime;
// here it's an npm dep so library-load failure isn't a realistic failure
// mode. We keep MapLibre + SVG and drop Leaflet for now.

import { useEffect, useRef, useState } from "react";

import { useMode } from "@/stores/mode";
import type { NarrativeMode } from "@/lib/storage";
import { createStopPin } from "./stop-pin";

// ─── Types ─────────────────────────────────────────────────────────────

/**
 * Minimal stop shape used by the atlas. Intentionally loose so callers
 * don't need to pass a full `Stop` from `web/stores/types.ts` — all we
 * need is coordinates + a short label + an id to bubble back on click.
 *
 * The optional fields (`heroUrl`, `mood`, `timeLabel`) feed the
 * pin-hover card. They're all optional so existing call sites don't
 * need to know about them — missing fields just produce a simpler card.
 */
export interface AtlasStop {
  n: string; // display label / numeric id ("01".."12")
  title: string;
  lat: number;
  lng: number;
  /** Thumbnail URL shown in the hover card. */
  heroUrl?: string | null;
  /** Shown as part of the eyebrow line in the hover card. */
  mood?: string | null;
  /** Shown as part of the eyebrow line in the hover card. */
  timeLabel?: string | null;
}

export interface AtlasProps {
  stops: readonly AtlasStop[];
  /** Optional initial centre [lng, lat]. Falls back to the mean of stops. */
  center?: [number, number];
  /** Fired when a pin is clicked. The stop-id is `stop.n`. */
  onStopClick?: (stopId: string) => void;
  /** Optional CSS height. Default `420px`. */
  height?: number | string;
  /** Starting zoom if we have to fall back to it. Default 11. */
  zoom?: number;
}

// ─── Missing-coord helpers ────────────────────────────────────────────
// Stops added via `stores/root.ts → addStop` default to lat: 51.505,
// lng: -0.09. If the owner hasn't set real coords yet, multiple stops
// land on top of each other at that point and occlude everything on
// the map. We detect the exact-default case, jitter the pins so each
// is individually visible, and surface a chip telling the owner how
// many stops still need coords.
const DEFAULT_LAT = 51.505;
const DEFAULT_LNG = -0.09;

function isDefaultCoord(stop: AtlasStop): boolean {
  return stop.lat === DEFAULT_LAT && stop.lng === DEFAULT_LNG;
}

/** Deterministic tiny jitter so default-coord pins fan out rather than
 * stacking. Seeded on `stop.n` so the same stop always lands in the
 * same spot — we don't want pins to wobble between renders. */
function jitterForStop(stopId: string): { dLat: number; dLng: number } {
  let hash = 0;
  for (let i = 0; i < stopId.length; i++) {
    hash = (hash << 5) - hash + stopId.charCodeAt(i);
    hash |= 0;
  }
  const a = (hash % 97) / 97; // 0..<1
  const b = ((hash >> 3) % 89) / 89;
  // ~60-180m radius, plenty enough to separate pins visually without
  // putting them on the wrong side of a landmark.
  return {
    dLat: (a - 0.5) * 0.004,
    dLng: (b - 0.5) * 0.004,
  };
}

// ─── Hover card (DOM overlay, NOT MapLibre Popup) ──────────────────────
// We populate a single <div> overlay inside the atlas container. On
// pin mouseenter we compute `map.project(...)` → pixel coords and
// set `transform: translate(...)` to place the card above the pin.
// `pointer-events: none` so it never steals the mouseenter/leave from
// the pin underneath. Styling lives inline so it cascades `--mode-*`
// tokens from the containing `[data-mode]` wrapper.

/** Escape the handful of HTML-sensitive characters that can appear in
 * user-authored fields (titles, moods, time labels). The hover card
 * HTML is built via innerHTML so must be sanitised. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHoverCardHtml(stop: AtlasStop): string {
  const eyebrowParts: string[] = [];
  if (stop.mood) eyebrowParts.push(stop.mood);
  if (stop.timeLabel) eyebrowParts.push(stop.timeLabel);
  const eyebrow =
    eyebrowParts.length > 0 ? eyebrowParts.join(" · ") : `Stop ${stop.n}`;

  const img = stop.heroUrl
    ? `<img src="${escapeHtml(stop.heroUrl)}" alt="" style="display:block;width:100%;height:96px;object-fit:cover;border-radius:5px 5px 0 0;" />`
    : "";

  return (
    img +
    '<div style="padding:8px 10px 10px;">' +
    `<div style="font-family:var(--f-mono, monospace);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.66;margin-bottom:4px;">` +
    escapeHtml(eyebrow) +
    "</div>" +
    `<div style="font-size:13px;font-weight:700;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;">` +
    escapeHtml(stop.title) +
    "</div>" +
    "</div>"
  );
}

// ─── Tile style per mode ───────────────────────────────────────────────

const CARTO = "https://basemaps.cartocdn.com";
const TILE_URL: Record<NarrativeMode, string> = {
  fashion: `${CARTO}/rastertiles/voyager/{z}/{x}/{y}.png`,
  cinema: `${CARTO}/dark_all/{z}/{x}/{y}.png`,
  punk: `${CARTO}/light_all/{z}/{x}/{y}.png`,
};
const TILE_ATTR = "© OpenStreetMap © CARTO";

/**
 * Build a MapLibre style spec tuned to a narrative mode.
 * The raster source is the CARTO basemap; paint tweaks nudge the palette
 * toward the mode's vibe (punk gets a full desat + contrast bump to turn
 * the tiles into B&W zine art; cinema and fashion mostly ride on CARTO's
 * own styling with light tint layers for visual seasoning).
 */
function buildStyle(mode: NarrativeMode) {
  if (mode === "punk") {
    return {
      version: 8 as const,
      sources: {
        t: {
          type: "raster" as const,
          tiles: [TILE_URL.punk],
          tileSize: 256,
          attribution: TILE_ATTR,
        },
      },
      layers: [
        {
          id: "bg",
          type: "background" as const,
          paint: { "background-color": "#f4f0e6" },
        },
        // Full desat + extreme contrast — near-B&W xerox look.
        {
          id: "t",
          type: "raster" as const,
          source: "t",
          paint: {
            "raster-saturation": -1,
            "raster-contrast": 0.9,
            "raster-brightness-min": 0.0,
            "raster-brightness-max": 1.0,
          },
        },
        // Red scrim — the "third colour" of the zine palette.
        {
          id: "scrim",
          type: "background" as const,
          paint: {
            "background-color": "#b8360a",
            "background-opacity": 0.14,
          },
        },
      ],
    };
  }

  if (mode === "cinema") {
    // Dogfood round 3 (F-I035): the previous cinema style had
    // `raster-brightness-max: 0.55` layered over a `#050a18` background,
    // which rendered CARTO's already-dark `dark_all` tiles essentially
    // invisible — owner screenshot showed a solid dark navy box with only
    // the pins visible. Reality-check in Chrome: tile network requests
    // DID fire (dark_all/12/...png, 200 OK, 24KB each) — they just drew
    // too dark to see against the bg. Fix = trust CARTO's dark_all
    // design and strip the heavy post-filter.
    return {
      version: 8 as const,
      sources: {
        t: {
          type: "raster" as const,
          tiles: [TILE_URL.cinema],
          tileSize: 256,
          attribution: TILE_ATTR,
        },
      },
      layers: [
        // Under-tile fallback. Sits below the raster so pixels between
        // tiles (edges, loading state) match the tile palette instead of
        // flashing paper-cream from the parent container.
        {
          id: "bg",
          type: "background" as const,
          paint: { "background-color": "#0f1420" },
        },
        {
          id: "t",
          type: "raster" as const,
          source: "t",
          paint: {
            // Let the tiles carry themselves. A tiny saturation lift and
            // contrast bump give streets definition without washing
            // anything out.
            "raster-saturation": 0.1,
            "raster-brightness-min": 0.15,
            "raster-brightness-max": 1.0,
            "raster-contrast": 0.15,
            "raster-opacity": 1.0,
          },
        },
      ],
    };
  }

  // fashion (default). Owner feedback: previous pass felt "washed out"
  // because the warm scrim muddied tile contrast more than it gave
  // character. Dropping the warm layer entirely and pushing contrast /
  // saturation gives cleaner tiles without losing the fashion palette
  // (the pins + postcard chrome already carry the warm accent).
  return {
    version: 8 as const,
    sources: {
      t: {
        type: "raster" as const,
        tiles: [TILE_URL.fashion],
        tileSize: 256,
        attribution: TILE_ATTR,
      },
    },
    layers: [
      {
        id: "bg",
        type: "background" as const,
        paint: { "background-color": "#f0e3cb" },
      },
      {
        id: "t",
        type: "raster" as const,
        source: "t",
        paint: {
          // Less desat than before (-0.25 vs -0.35) so warm hues read.
          "raster-saturation": -0.25,
          "raster-hue-rotate": 20,
          // Drop min so dark ink (road names, labels) can reach through
          // without being lifted toward grey.
          "raster-brightness-min": 0.75,
          // Capped at 1.0 — MapLibre rejects > 1 and the resulting console
          // error wakes Next dev tools' "1 issue" badge on every public page.
          "raster-brightness-max": 1.0,
          // Pushed from 0.1 to 0.2 — street labels now pop, building
          // outlines stop blending into the cream base.
          "raster-contrast": 0.2,
          "raster-opacity": 0.95,
        },
      },
      // NO warm overlay layer here — dropped to fix the washed-out look.
    ],
  };
}

// ─── SVG fallback (no WebGL / tiles) ───────────────────────────────────
// Projects stops to an 800×500 viewBox — never touches the network.

function AtlasSvgFallback({
  stops,
  mode,
  onStopClick,
}: {
  stops: readonly AtlasStop[];
  mode: NarrativeMode;
  onStopClick?: (stopId: string) => void;
}) {
  const W = 800;
  const H = 500;
  const M = 60;

  const lngs = stops.map((s) => s.lng);
  const lats = stops.map((s) => s.lat);
  const minLng = lngs.length ? Math.min(...lngs) : -0.2;
  const maxLng = lngs.length ? Math.max(...lngs) : 0.0;
  const minLat = lats.length ? Math.min(...lats) : 51.45;
  const maxLat = lats.length ? Math.max(...lats) : 51.55;
  const lngSpan = maxLng - minLng || 0.01;
  const latSpan = maxLat - minLat || 0.01;
  const project = (lng: number, lat: number) => {
    const x = M + ((lng - minLng) / lngSpan) * (W - 2 * M);
    const y = M + (1 - (lat - minLat) / latSpan) * (H - 2 * M);
    return { x, y };
  };

  const palette =
    mode === "cinema"
      ? {
          bg: "#04060f",
          ink: "#e6d27a",
          stroke: "#203050",
          dotFill: "#0a0e1c",
          dotRing: "#e6d27a",
          label: "#e6d27a",
        }
      : mode === "punk"
        ? {
            bg: "#f4f1e8",
            ink: "#1a1a1a",
            stroke: "#1a1a1a",
            dotFill: "#fff",
            dotRing: "#b8360a",
            label: "#1a1a1a",
          }
        : {
            bg: "#f7f1e6",
            ink: "#5a2a2a",
            stroke: "#8a6a52",
            dotFill: "#fff8ec",
            dotRing: "#8a3a2a",
            label: "#3a2a1a",
          };

  return (
    <div
      style={{ width: "100%", height: "100%", background: palette.bg }}
      data-mode={mode}
      data-fallback="svg"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        {stops.map((s) => {
          const { x, y } = project(s.lng, s.lat);
          const eyebrowParts: string[] = [];
          if (s.mood) eyebrowParts.push(s.mood);
          if (s.timeLabel) eyebrowParts.push(s.timeLabel);
          const tooltip =
            eyebrowParts.length > 0
              ? `${s.title} — ${eyebrowParts.join(" · ")}`
              : s.title;
          return (
            <g
              key={s.n}
              style={{ cursor: onStopClick ? "pointer" : "default" }}
              onClick={() => onStopClick?.(s.n)}
            >
              {/* Native SVG tooltip — browsers render it on hover. Good
                  enough for the rare SVG-fallback path. */}
              <title>{tooltip}</title>
              <circle
                cx={x}
                cy={y}
                r="9"
                fill={palette.dotFill}
                stroke={palette.dotRing}
                strokeWidth="1"
              />
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                fontFamily="monospace"
                fontSize="10"
                fill={palette.label}
              >
                {s.n}
              </text>
            </g>
          );
        })}

        <text
          x={M}
          y={H - 18}
          fontFamily="monospace"
          fontSize="10"
          fill={palette.ink}
          opacity="0.6"
        >
          offline atlas · {stops.length} stops
        </text>
      </svg>
    </div>
  );
}

// ─── The atlas component ───────────────────────────────────────────────

// Imperative map handle + marker list. `unknown`-typed at the boundary
// because `maplibre-gl` is only present at runtime behind a dynamic
// import — adding its types here would pull the module into the SSR
// bundle. Local casts keep the call sites honest.
type MaplibreMap = {
  remove: () => void;
  setStyle: (style: ReturnType<typeof buildStyle>) => unknown;
  once: (event: string, cb: () => void) => unknown;
  on: (event: string, cb: () => void) => unknown;
  off?: (event: string, cb: () => void) => unknown;
  fitBounds: (bounds: unknown, opts: unknown) => unknown;
  project: (coord: [number, number]) => { x: number; y: number };
};
type MaplibreMarker = {
  remove: () => void;
  setLngLat: (coord: [number, number]) => MaplibreMarker;
  addTo: (map: MaplibreMap) => MaplibreMarker;
  getElement?: () => HTMLElement;
};
// Kept for compatibility with the `maplibre-gl` module type — we no
// longer instantiate Popup, but the mock in atlas.test.tsx still
// exports the class and we want the typed import to resolve cleanly.
type MaplibrePopup = {
  remove: () => MaplibrePopup;
  setLngLat: (coord: [number, number]) => MaplibrePopup;
  setHTML: (html: string) => MaplibrePopup;
  addTo: (map: MaplibreMap) => MaplibrePopup;
  isOpen?: () => boolean;
};
type MaplibreModule = {
  Map: new (opts: unknown) => MaplibreMap;
  Marker: new (opts: unknown) => MaplibreMarker;
  // Still declared so the module typecheck passes in mixed envs.
  // Not used — see the long note at the top of this file.
  Popup: new (opts?: unknown) => MaplibrePopup;
  LngLatBounds: new () => {
    extend: (coord: [number, number]) => unknown;
  };
};

export function Atlas({
  stops,
  center,
  onStopClick,
  height = 420,
  zoom = 11,
}: AtlasProps) {
  const mode = useMode();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // The single hover-card overlay. Created on mount, reused for every
  // pin. `pointer-events: none` so it never steals mouse events from
  // the pin below it.
  const hoverCardRef = useRef<HTMLDivElement | null>(null);

  // Imperative map handle + marker list. Kept in refs so we don't
  // re-render on every pan/zoom.
  const mapRef = useRef<MaplibreMap | null>(null);
  const markersRef = useRef<MaplibreMarker[]>([]);
  // Tracks whichever stop the hover card is currently anchored to, so
  // the `move` handler can recompute its pixel position during pan/zoom.
  // `null` when the card is hidden.
  const activeHoverStopRef = useRef<AtlasStop | null>(null);
  const maplibreRef = useRef<MaplibreModule | null>(null);

  // Tracks whether we've had a hard failure and need to show the SVG.
  const [failed, setFailed] = useState(false);
  // Tracks whether the dynamic import has completed (so we can mount
  // the CSS before the map fires up).
  const [ready, setReady] = useState(false);

  // Keep a ref to the latest renderMarkers closure so effects can call
  // the up-to-date version without needing `renderMarkers` in their
  // deps array (which would also create a hoisting issue with the
  // boot effect below). Refs are assigned in a layoutless effect on
  // every render — by the time any effect runs, the ref is current.
  const renderMarkersRef = useRef<() => void>(() => undefined);
  // Same pattern for the overlay repositioner so the `move` listener
  // always sees the current stops / jitter.
  const repositionHoverCardRef = useRef<() => void>(() => undefined);

  // Missing-coord accounting. Drives the "📍 N stops need coordinates"
  // chip and the jitter-on-render behaviour. Recomputed per render;
  // cheap, the stops array is small.
  const missingCoordCount = stops.filter(isDefaultCoord).length;

  // Resolve the initial centre. Compute from stops if not provided.
  // Skips default-coord stops when computing the mean so a single
  // real stop still centres the map on *its* location rather than on
  // the default central-London coord.
  const realCoordStops = stops.filter((s) => !isDefaultCoord(s));
  const centerSource = realCoordStops.length > 0 ? realCoordStops : stops;
  const initialCenter: [number, number] =
    center ??
    (centerSource.length > 0
      ? [
          centerSource.reduce((a, s) => a + s.lng, 0) / centerSource.length,
          centerSource.reduce((a, s) => a + s.lat, 0) / centerSource.length,
        ]
      : [-0.1276, 51.5074]);

  // Keep the renderMarkers ref up-to-date in a layout-phase effect so
  // the captured closure always sees the latest stops / onStopClick /
  // mode. Mutating a ref during render is disallowed by the React lint
  // rules and can cause stale reads; doing it in `useEffect` is the
  // idiomatic pattern.
  useEffect(() => {
    // Compute effective coords once and share between renderMarkers and
    // the overlay repositioner. Jitters default-coord stops so they
    // don't stack on top of each other at 51.505 / -0.09.
    const effectiveCoord = (stop: AtlasStop): [number, number] => {
      if (!isDefaultCoord(stop)) return [stop.lng, stop.lat];
      const { dLat, dLng } = jitterForStop(stop.n);
      return [stop.lng + dLng, stop.lat + dLat];
    };

    renderMarkersRef.current = () => {
      const map = mapRef.current;
      const maplibregl = maplibreRef.current;
      if (!map || !maplibregl) return;

      // Drop previous markers.
      markersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {
          /* swallow */
        }
      });
      markersRef.current = [];
      // Hide the hover card — the stop it was anchored to might have
      // been removed or renumbered.
      const card = hoverCardRef.current;
      if (card) card.style.display = "none";
      activeHoverStopRef.current = null;

      stops.forEach((stop) => {
        const el = createStopPin({
          stopId: stop.n,
          label: stop.n,
          mode,
        });
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onStopClick?.(stop.n);
        });
        const marker = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat(effectiveCoord(stop))
          .addTo(map);
        markersRef.current.push(marker);

        // Mouseenter shows the custom DOM overlay at the pin's screen
        // position. Mouseleave hides it. Map `move` / `zoom` handlers
        // (registered in the boot effect) reposition it as the user
        // pans — the whole point of this approach is that WE drive the
        // overlay, not MapLibre, so the map never auto-pans to reveal
        // an attached popup.
        el.addEventListener("mouseenter", () => {
          const cardEl = hoverCardRef.current;
          if (!cardEl) return;
          cardEl.innerHTML = renderHoverCardHtml(stop);
          activeHoverStopRef.current = stop;
          repositionHoverCardRef.current();
          cardEl.style.display = "block";
        });
        el.addEventListener("mouseleave", () => {
          const cardEl = hoverCardRef.current;
          if (!cardEl) return;
          cardEl.style.display = "none";
          if (activeHoverStopRef.current?.n === stop.n) {
            activeHoverStopRef.current = null;
          }
        });
      });
    };

    repositionHoverCardRef.current = () => {
      const map = mapRef.current;
      const cardEl = hoverCardRef.current;
      const stop = activeHoverStopRef.current;
      if (!map || !cardEl || !stop) return;
      let screen: { x: number; y: number };
      try {
        screen = map.project(effectiveCoord(stop));
      } catch {
        return;
      }
      // Card dimensions: measured each call so the translate tracks a
      // real-world thumbnail if one loaded after the initial render.
      const cardH = cardEl.offsetHeight || 64;
      const cardW = cardEl.offsetWidth || 220;
      // 14px gap above the pin (pin radius ~9 + visual breathing room).
      const x = Math.round(screen.x - cardW / 2);
      const y = Math.round(screen.y - cardH - 14);
      cardEl.style.transform = `translate(${x}px, ${y}px)`;
    };
  }, [stops, mode, onStopClick]);

  // ─── Dynamic library load + map construction ────────────────────────
  useEffect(() => {
    if (failed) return;
    if (typeof window === "undefined") return;
    let cancelled = false;

    (async () => {
      try {
        // Dynamic import keeps maplibre-gl out of the SSR bundle. In
        // tests this path is mocked; see web/tests/atlas.test.tsx.
        const mod = await import("maplibre-gl");
        // Some bundlers hand back { default: X }, others X directly. Handle both.
        const maplibregl = ((mod as unknown as { default?: MaplibreModule })
          .default ?? (mod as unknown as MaplibreModule)) as MaplibreModule;
        maplibreRef.current = maplibregl;

        // Inject the stylesheet once (maplibre-gl requires this for
        // marker positioning and controls). Using a plain <link> rather
        // than `import 'maplibre-gl/dist/maplibre-gl.css'` sidesteps
        // Next.js's "CSS imports only in app/" rule and still keeps
        // load lazy.
        if (
          typeof document !== "undefined" &&
          !document.querySelector("link[data-maplibre-css]")
        ) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href =
            "https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.css";
          link.setAttribute("data-maplibre-css", "1");
          document.head.appendChild(link);
        }

        if (cancelled || !containerRef.current) return;
        if (mapRef.current) return; // strict-mode double-fire guard

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: buildStyle(mode),
          center: initialCenter,
          zoom,
          minZoom: 2,
          maxZoom: 18,
          attributionControl: false,
        });
        mapRef.current = map;
        setReady(true);

        // Reposition the hover card on every `move` event (pan + zoom
        // both fire `move`). This is what makes the card feel "glued"
        // to the pin during user interaction while the map stays
        // absolutely still on simple hover-over-pin.
        const onMove = () => {
          repositionHoverCardRef.current();
        };
        try {
          map.on("move", onMove);
        } catch {
          /* swallow — test stubs may not implement .on */
        }

        // Render markers once the style has loaded. `idle` fires after
        // every tile has settled, so it's the most reliable moment.
        const placeMarkers = () => {
          renderMarkersRef.current();
          if (stops.length > 1) {
            try {
              const bounds = new maplibregl.LngLatBounds();
              // Use real coords where available; fall back to default
              // for missing-coord stops so bounds stay non-degenerate.
              stops.forEach((s) => bounds.extend([s.lng, s.lat]));
              map.fitBounds(bounds, {
                padding: 48,
                duration: 0,
                maxZoom: 14,
              });
            } catch {
              // fitBounds can throw on degenerate bounds; swallow.
            }
          }
        };
        map.once("idle", placeMarkers);
        map.once("load", placeMarkers);
      } catch (err) {
        console.warn("[atlas] MapLibre failed, using SVG fallback", err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      // Clean up markers + map on unmount or prop change.
      markersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {
          /* swallow */
        }
      });
      markersRef.current = [];
      activeHoverStopRef.current = null;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          /* swallow */
        }
        mapRef.current = null;
      }
    };
    // We intentionally only want to boot the map ONCE per mount. Mode
    // changes are handled in a separate effect below via `setStyle`.
    // Marker changes are handled by the `stops` effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Mode changes swap the tile style smoothly.
  useEffect(() => {
    if (!ready || failed) return;
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setStyle(buildStyle(mode));
      // setStyle removes layers but keeps markers; still, marker
      // `data-mode` needs refreshing so their accent colour cascades.
      markersRef.current.forEach((m) => {
        const el = m.getElement?.();
        if (el) el.dataset.mode = mode;
      });
    } catch (err) {
      console.warn("[atlas] setStyle failed", err);
    }
  }, [mode, ready, failed]);

  // ─── Re-render markers if the stops prop changes after mount.
  useEffect(() => {
    if (!ready || failed) return;
    renderMarkersRef.current();
  }, [stops, ready, failed]);

  // ─── The render. SVG fallback if MapLibre blew up.
  if (failed) {
    return (
      <div
        role="region"
        aria-label="Atlas (offline fallback)"
        style={{
          position: "relative",
          width: "100%",
          height: typeof height === "number" ? `${height}px` : height,
          overflow: "hidden",
          borderRadius: "8px",
          border: "1px solid var(--rule, #ddd)",
        }}
      >
        <AtlasSvgFallback
          stops={stops}
          mode={mode}
          onStopClick={onStopClick}
        />
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={`Atlas (${stops.length} stops)`}
      data-mode={mode}
      style={{
        position: "relative",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        borderRadius: "8px",
        border: "1px solid var(--rule, #ddd)",
        background: "var(--mode-surface, #f4f0e6)",
      }}
    >
      <div
        ref={containerRef}
        data-testid="atlas-map-container"
        style={{ width: "100%", height: "100%" }}
      />
      {/* Custom DOM hover card — a single overlay, repositioned on
          every marker hover and every map move. `pointer-events:none`
          means it never steals events from the pin underneath. */}
      <div
        ref={hoverCardRef}
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "none",
          pointerEvents: "none",
          zIndex: 5,
          width: "220px",
          maxWidth: "220px",
          background: "var(--mode-surface, #fff)",
          color: "var(--mode-ink, #1a1a1a)",
          border:
            "1px solid color-mix(in oklab, var(--mode-ink, #1a1a1a) 18%, transparent)",
          borderRadius: "6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          overflow: "hidden",
          fontFamily: "var(--f-sans, system-ui, sans-serif)",
          willChange: "transform",
        }}
      />
      {missingCoordCount > 0 && (
        <div
          className="mono-sm"
          aria-live="polite"
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 4,
            padding: "6px 10px",
            borderRadius: "999px",
            background: "var(--mode-surface, #fff)",
            color: "var(--mode-ink, #1a1a1a)",
            border:
              "1px solid color-mix(in oklab, var(--mode-ink, #1a1a1a) 18%, transparent)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            fontFamily: "var(--f-mono, monospace)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          {missingCoordCount === 1
            ? "1 stop needs coordinates"
            : `${missingCoordCount} stops need coordinates`}
        </div>
      )}
      {!ready && (
        <div
          className="mono-sm"
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            opacity: 0.65,
            pointerEvents: "none",
            color: "var(--mode-ink, #333)",
            fontFamily: "var(--f-mono, monospace)",
            fontSize: "11px",
            letterSpacing: "0.08em",
          }}
        >
          LOADING ATLAS…
        </div>
      )}
    </div>
  );
}

export default Atlas;
