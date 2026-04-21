---
id: F-P002
title: Port MapLibre atlas with mode-aware tiles
milestone: M-fast
kind: parallel
status: DONE
blocked_by: [F-T004]
blocks: []
parallel_safe: true
touches:
  - web/components/map/atlas.tsx
  - web/components/map/stop-pin.tsx
  - web/app/atlas/page.tsx
  - web/tests/atlas.test.tsx
owner: subagent-F-P002-via-opus-4.7-main
started_at: 2026-04-21T03:30Z
completed_at: 2026-04-21T03:50Z
---

# F-P002 — Port MapLibre atlas

## Why
The map is the second-most-distinctive visual element. Shows stops as pins; style changes with narrative mode (Cinema = dark + cyan; Punk = B/W + red; Fashion = neutral warm).

## Acceptance
- [ ] `<Atlas />` renders a MapLibre GL canvas
- [ ] Pins for each stop with `lat/lng` set
- [ ] Click pin → scroll to / navigate to that stop
- [ ] Tile source swaps with mode: CARTO voyager (fashion), dark-matter (cinema), carto-light with B&W filter (punk)
- [ ] Accent colour on pins matches mode
- [ ] Graceful fallback to SVG schematic if GL unavailable (copy fallback pattern from legacy)
- [ ] Client-only: wrap in `dynamic(() => import('...'), { ssr: false })` or `'use client'`

## Legacy references
- Map-using files in `archive/app-html-prototype-2026-04-20/src/*.jsx` — grep for `maplibre`
- Fallback chain: GL → Leaflet raster → SVG schematic

## Steps
1. Install maplibre-gl if not already a dep (check `web/package.json`); ask user before adding.
2. Create `<Atlas />` client component loading tiles from `basemaps.cartocdn.com` (already allow-listed in `next.config.ts`).
3. Wire to current project's stops.
4. Listen to `mode` store; re-apply style on change.
5. Add `<StopPin />` with click handler.

## Verification
- Open public project with stops that have coords → map centers on them
- Switch modes → tiles and pin colour change
- Turn off WebGL in browser → SVG fallback renders

## Trace
