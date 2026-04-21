---
id: F-T004
title: Port workspace three-column layout
milestone: M-fast
kind: critical
status: DONE
blocked_by: [F-T002]
blocks: [F-T005, F-T006, F-T008, F-P002]
parallel_safe: false
touches:
  - web/app/studio/[projectId]/editor/page.tsx
  - web/components/studio/workspace.tsx
  - web/components/studio/stop-spine.tsx
  - web/components/studio/stop-canvas.tsx
  - web/components/studio/drawers/
  - web/stores/root.ts (Reykjavík seed wire-in)
owner: opus-4.7-session-20260421
started_at: 2026-04-21T02:50Z
completed_at: 2026-04-21T03:10Z
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

**2026-04-21T03:10Z — opus-4.7-session-20260421 — DONE**

Three-thread parallel session. Main session: F-T004. Subagent A: mobile responsive audit + fixes. Subagent B: Reykjavík seed data.

**Files created:**
- `web/components/studio/workspace.tsx` — shell with topbar, 3-col grid, narrow-viewport detect, Escape-to-close overlay drawer, mode pill in top bar
- `web/components/studio/stop-spine.tsx` — left column; keyboard-navigable listbox (arrow keys + Enter/Space) with aria-selected, status pips for upload/hero/body/media
- `web/components/studio/stop-canvas.tsx` — center column with eyebrow (STOP n · postcode · time · mood), big title h1, title editor input, hero placeholder for F-T005, body preview (paragraph / pullQuote / metaRow supported), postcard slot placeholder for F-T006
- `web/components/studio/drawers/drawers.tsx` — right column with Assets Pool + Media Queue tabs, overlay behaviour on narrow viewport
- `web/tests/workspace.test.tsx` — 5 shell tests (topbar, spine, canvas, click-to-select, mode pill)

**Files modified:**
- `web/app/studio/[projectId]/editor/page.tsx` — swapped scaffold EditorPage → `<Workspace />`; `dynamicParams: true` for any project id
- `web/stores/root.ts` — imported SEED_PROJECT_REYKJAVIK + SEED_STOPS_REYKJAVIK; pre-seed `projectsArchive` with a Reykjavík entry so dashboard shows both projects on first load (product scope = any location)
- `web/tests/store.test.ts` — updated archive/restore test to accept the baseline of 1 pre-seeded archive

**Scope kept lean (per task file):** this is SHELL only. Hero image slot, story editor, AI generate buttons, share popover, re-analyse / pre-gen buttons — all deferred to F-T005/T006.

**Subagent A — mobile responsive** (parallel):
- `web/app/globals.css` 775 → 820 lines (+45, under cap)
- Fixed studio dashboard overflow at 390px: header wraps, grid collapses to 1 column, padding shrinks
- Fixed atlas row squish
- Bumped tap-target heights to ≥44px on buttons at ≤600px
- Added class names to `projects-dashboard.tsx` so CSS can override without touching inline styles
- Landing and POC already mobile-clean

**Subagent B — Reykjavík seed** (parallel):
- Added `SEED_PROJECT_REYKJAVIK` + `SEED_STOPS_REYKJAVIK` (7 stops) to `web/lib/seed.ts`
- Added `PROJECTS_FEED` entry
- Main session wired the data into `projectsArchive` during `seedStateFromDataModule()` so dashboard shows both projects

**Bug caught + fixed:** tests/store.test.ts archive/restore test expected exactly 1 archived project after archiving the current one. Now baseline is 1 (Reykjavík pre-seeded), so post-archive is 2. Test rewritten to compute baseline dynamically + find the newly archived id excluding the baseline.

Verification:
- `pnpm typecheck` green
- `pnpm test` — 23/23 green
- `pnpm build` — green, 33 pages
- Preview MCP `/studio` desktop — shows both "A Year in SE1" CURRENT + "A Week in Reykjavík" LIVE archived
- Preview MCP `/studio/seed-a-year-in-se1/editor` desktop — full 3-col workspace, spine active on 05, canvas renders Waterloo bridge title + meta + body paragraphs + pullquote, drawer shows Assets Pool + Media Queue tabs
- Preview MCP `/studio` at 375px (mobile preset) — single-col cards, no horizontal scroll, header wraps
- Preview MCP `/studio/<id>/editor` at 375px — drawer shows in overlay mode; auto-close triggers on first mount once sessionStorage flag set

**Three-subagent pattern validated**: main + 2 background subagents, zero file-touch conflicts. `touches:` discipline worked again. Mobile subagent took ~9 minutes (longest of the three), seed subagent ~1.3 min, main took ~20 min.

Unblocks F-T005 (stop editor fleshing out the placeholders).
