---
id: F-P004
title: Port PNG export AND make the button prominent
milestone: M-fast
kind: parallel
status: TODO
blocked_by: [F-T006]
blocks: []
parallel_safe: true
touches:
  - web/lib/export/png.ts
  - web/components/postcard/export-buttons.tsx
owner: null
started_at: null
completed_at: null
---

# F-P004 — Port PNG export, with a prominent button

## Why
Legacy has PNG export via `html-to-image` but the button is hidden / hard to find. Users (including owner) have missed it. Fix both: port the logic AND place the button where anyone will see it.

## Acceptance
- [ ] `exportPostcardPng(postcardId, side: 'front' | 'back')` in `web/lib/export/png.ts`
- [ ] Uses `html-to-image` (already in deps per package.json scan)
- [ ] Two buttons in the postcard editor top toolbar: `DOWNLOAD PNG (FRONT)` and `DOWNLOAD PNG (BACK)`
- [ ] Buttons visibly styled as primary actions (not hidden in a menu)
- [ ] Filename: `<project-slug>_<stop-slug>_<side>.png`
- [ ] PNG is 2× pixel density for sharp output

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx` — `html-to-image` usage

## Steps
1. Find the legacy export function; port wholesale with types.
2. Surface the buttons in the postcard editor toolbar (next to PUBLISH, Re-imagine, Generate).
3. Test both sides.

## Verification
- Download front → PNG opens cleanly, correct dimensions, no overflow artefacts
- Download back → same
- Owner spots the button within 2 seconds of opening the editor (UX test)

## Trace
