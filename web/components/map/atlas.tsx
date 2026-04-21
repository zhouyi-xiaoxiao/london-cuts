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
 */
export interface AtlasStop {
  n: string; // display label / numeric id ("01".."12")
  title: string;
  lat: number;
  lng: number;
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
        {
          id: "bg",
          type: "background" as const,
          paint: { "background-color": "#050a18" },
        },
        {
          id: "t",
          type: "raster" as const,
          source: "t",
          paint: {
            "raster-saturation": -0.45,
            "raster-hue-rotate": 210,
            "raster-brightness-min": 0.0,
            "raster-brightness-max": 0.55,
            "raster-contrast": 0.35,
            "raster-opacity": 0.95,
          },
        },
        // Subtle cyan rim
        {
          id: "cyan-tint",
          type: "background" as const,
          paint: {
            "background-color": "#0a2040",
            "background-opacity": 0.18,
          },
        },
      ],
    };
  }

  // fashion (default)
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
          "raster-saturation": -0.35,
          "raster-hue-rotate": 20,
          "raster-brightness-min": 0.85,
          // Capped at 1.0 — MapLibre rejects > 1 and the resulting console
          // error wakes Next dev tools' "1 issue" badge on every public page.
          "raster-brightness-max": 1.0,
          "raster-contrast": -0.05,
          "raster-opacity": 0.9,
        },
      },
      {
        id: "warm",
        type: "background" as const,
        paint: {
          "background-color": "#c97a3c",
          "background-opacity": 0.08,
        },
      },
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
          return (
            <g
              key={s.n}
              style={{ cursor: onStopClick ? "pointer" : "default" }}
              onClick={() => onStopClick?.(s.n)}
            >
              <circle
                cx={x}
                cy={y}
                r="14"
                fill={palette.dotFill}
                stroke={palette.dotRing}
                strokeWidth="2.5"
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontFamily="monospace"
                fontSize="11"
                fontWeight="700"
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
  fitBounds: (bounds: unknown, opts: unknown) => unknown;
};
type MaplibreMarker = {
  remove: () => void;
  setLngLat: (coord: [number, number]) => MaplibreMarker;
  addTo: (map: MaplibreMap) => MaplibreMarker;
  getElement?: () => HTMLElement;
};
type MaplibreModule = {
  Map: new (opts: unknown) => MaplibreMap;
  Marker: new (opts: unknown) => MaplibreMarker;
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

  // Imperative map handle + marker list. Kept in refs so we don't
  // re-render on every pan/zoom.
  const mapRef = useRef<MaplibreMap | null>(null);
  const markersRef = useRef<MaplibreMarker[]>([]);
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

  // Resolve the initial centre. Compute from stops if not provided.
  const initialCenter: [number, number] =
    center ??
    (stops.length > 0
      ? [
          stops.reduce((a, s) => a + s.lng, 0) / stops.length,
          stops.reduce((a, s) => a + s.lat, 0) / stops.length,
        ]
      : [-0.1276, 51.5074]);

  // Keep the renderMarkers ref up-to-date in a layout-phase effect so
  // the captured closure always sees the latest stops / onStopClick /
  // mode. Mutating a ref during render is disallowed by the React lint
  // rules and can cause stale reads; doing it in `useEffect` is the
  // idiomatic pattern.
  useEffect(() => {
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
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });
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

        // Render markers once the style has loaded. `idle` fires after
        // every tile has settled, so it's the most reliable moment.
        const placeMarkers = () => {
          renderMarkersRef.current();
          if (stops.length > 1) {
            try {
              const bounds = new maplibregl.LngLatBounds();
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
