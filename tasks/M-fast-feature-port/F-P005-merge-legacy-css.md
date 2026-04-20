---
id: F-P005
title: Merge legacy CSS into web/app/globals.css
milestone: M-fast
kind: parallel
status: TODO
blocked_by: []
blocks: [F-T003, F-T004]
parallel_safe: true
touches:
  - web/app/globals.css
owner: null
started_at: null
completed_at: null
---

# F-P005 — Merge legacy CSS into web/app/globals.css

## Why
Legacy had `styles/base.css` and `styles/v2.css`. These contained the design-system tokens already, plus component styles for workspace, postcards, public pages, modes. To port UI with visual parity, we need these styles in `web/`.

## Acceptance
- [ ] `web/app/globals.css` contains (in order):
  1. CSS tokens imported from `design-system/colors_and_type.css` (or inlined if simpler)
  2. Base reset + typography defaults
  3. Mode-specific rules under `html[data-mode="..."]`
  4. Shared component primitives (buttons, chips, roundel, hairline borders)
- [ ] Any CSS that was only for a specific legacy component (e.g. postcard 3D flip) moves into the respective component CSS module instead of globals
- [ ] No broken selectors referencing removed `app/` classes
- [ ] `pnpm build` renders with styles intact

## Legacy references
- `archive/app-html-prototype-2026-04-20/styles/base.css`
- `archive/app-html-prototype-2026-04-20/styles/v2.css`
- `design-system/colors_and_type.css` (canonical tokens)
- `design-system/ui_kits/studio/tokens.css` (studio tokens)

## Steps
1. Read both legacy CSS files + design-system tokens.
2. Identify:
   - Global-level rules → go into `globals.css`
   - Component-level rules → note which component they belong to (will be moved when that component ports)
3. Write `globals.css` with clean sections.
4. Verify no broken references by opening the current `web/` in browser before and after.

## Verification
- `pnpm build` — success
- Manual: dev server still renders without FOUC; typography and colours match legacy header
- Mode switch (F-P001) triggers expected cascade changes

## Trace
