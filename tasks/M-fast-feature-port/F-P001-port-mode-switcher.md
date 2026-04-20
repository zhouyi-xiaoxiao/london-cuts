---
id: F-P001
title: Port mode switcher (Fashion / Punk / Cinema)
milestone: M-fast
kind: parallel
status: TODO
blocked_by: [F-T002]
blocks: []
parallel_safe: true
touches:
  - web/components/mode-switcher.tsx
  - web/app/globals.css
owner: null
started_at: null
completed_at: null
---

# F-P001 — Port mode switcher

## Why
Three visual modes are the distinctive signature of the product. The switcher toggles them; the rest of the app reacts via CSS data-attributes.

## Acceptance
- [ ] `<ModeSwitcher />` renders three buttons; active one is highlighted
- [ ] Clicks update `mode` store (already built in F-T002)
- [ ] A `data-mode` attribute on `<html>` or `<body>` reflects the current mode
- [ ] CSS rules like `html[data-mode="punk"] { ... }` swap typography, colours, ornament
- [ ] Default mode restores from localStorage

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/store.jsx` — mode state + persistence
- `archive/app-html-prototype-2026-04-20/styles/base.css` + `v2.css` — mode-specific CSS
- `design-system/preview/colors-modes.html` — token reference

## Steps
1. Create `<ModeSwitcher />` client component.
2. In `web/app/layout.tsx`, subscribe to `mode` store and set `<html data-mode={mode}>`.
3. Copy mode-specific CSS rules from legacy into `web/app/globals.css` (or a dedicated `modes.css` imported by globals). Merge with F-P005.

## Verification
- Click punk → background becomes black/white, accent red → visually matches legacy
- Reload → same mode preserved

## Trace
