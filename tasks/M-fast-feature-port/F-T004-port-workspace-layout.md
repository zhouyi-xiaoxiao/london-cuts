---
id: F-T004
title: Port workspace three-column layout
milestone: M-fast
kind: critical
status: TODO
blocked_by: [F-T002]
blocks: [F-T005, F-T006, F-T008, F-P002]
parallel_safe: false
touches:
  - web/app/studio/[projectId]/editor/page.tsx
  - web/components/studio/workspace.tsx
  - web/components/studio/stop-spine.tsx
  - web/components/studio/drawers/
owner: null
started_at: null
completed_at: null
---

# F-T004 — Port workspace three-column layout

## Why
The workspace is the core editing surface: left spine (stops list), center canvas (stop detail + postcard + hero image), right drawers (assets pool, media queue, settings). Every editing task works through this layout.

## Acceptance
- [ ] `/studio/[projectId]/editor` renders the three-column layout
- [ ] Left spine: numbered stops with status dots, drag handles, selection state
- [ ] Center canvas: active stop title, body preview, postcard slot, hero image slot, timeline bar at top with `STOP 01 · TW6 · 20:03 · FLUORESCENT`
- [ ] Right drawer tabs: `ASSETS POOL` / `MEDIA QUEUE` switchable
- [ ] Drawer toggle (HIDE PANELS / SHOW PANELS)
- [ ] `PROJECTS` back link returns to `/studio`
- [ ] PUBLISH button in header opens the publish dialog (F-T008)
- [ ] Header center shows project title + DRAFT/LIVE badge + `X/Y STOPS READY`
- [ ] Mode toggle (PUNK / FASHION / CINEMA) in header affects typography + chrome

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/workspace.jsx` — main workspace
- Header pattern: screenshot from user at http://localhost:8000 reference
- Drawer component patterns in `workspace.jsx`

## Steps
1. Read legacy `workspace.jsx` in full.
2. Sketch the component tree:
   - `<Workspace />` (outer grid)
     - `<WorkspaceHeader />`
     - `<StopSpine />` (left col)
     - `<StopCanvas />` (center col)
     - `<Drawers />` (right col, tabs)
3. Implement each, wiring to stores (`project`, `stop`, `mode`, `ui`).
4. Use CSS Grid for the three columns; keep responsive breakpoint at 1024px (below that, spine + drawers collapse to dropdowns — match legacy behaviour).
5. Preserve visual tokens from legacy (spacing, borders, type).

## Out of scope
- Stop editing itself: F-T005
- Postcard editor: F-T006
- MapLibre atlas: F-P002 (lives inside the canvas for stops with coords)
- Publish flow: F-T008

## Verification
- Side-by-side with legacy at http://localhost:8000 using the same demo project
- Resize window to 800px — layout degrades gracefully

## Trace
