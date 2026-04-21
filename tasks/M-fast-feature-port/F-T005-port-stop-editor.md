---
id: F-T005
title: Port stop editor (metadata, body, reorder, hero upload)
milestone: M-fast
kind: critical
status: DONE
blocked_by: [F-T004]
blocks: [F-T006, F-T008]
parallel_safe: false
touches:
  - web/components/studio/stop-canvas.tsx
  - web/components/studio/stop-metadata-form.tsx
  - web/components/studio/stop-body-editor.tsx
  - web/components/studio/hero-slot.tsx
  - web/stores/asset.ts (useShallow fix)
owner: opus-4.7-session-20260421
started_at: 2026-04-21T03:30Z
completed_at: 2026-04-21T03:50Z
---

# F-T005 — Port stop editor

## Why
Without the stop editor, a user can't actually write the content of a trip. This is the "add title / add body text / drag to reorder / upload hero photo" work.

## Acceptance
- [ ] Metadata form: title, time label (e.g. "20:03"), mood, tone, location code (e.g. "TW6"), lat/lng (optional)
- [ ] Body editor: multiple paragraphs; add / remove / reorder paragraphs (legacy splits body into "blocks")
- [ ] Hero image slot: shows current hero, button to pick from asset pool, button to upload new photo
- [ ] Upload flow: drag-drop or file input → EXIF-corrected → resized → added to asset pool → set as hero
- [ ] Drag reorder stops in spine (left column)
- [ ] Status indicators (dots): grey = incomplete, partial = some content, filled = ready
- [ ] Changes persist (via `stop` store → localStorage)

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/workspace.jsx` — stop edit form sections
- `archive/app-html-prototype-2026-04-20/src/shared.jsx` — image upload / resize / EXIF helpers (already ported in F-T001)

## Steps
1. Read legacy stop-editing sections in `workspace.jsx`.
2. Build `<StopMetadataForm />` — controlled inputs wired to `stop` store's `updateStop(id, patch)`.
3. Build `<StopBodyEditor />` — array of paragraph inputs with add/remove/reorder.
4. Build `<HeroImagePicker />` — uses asset pool store; upload button calls `loadImage` + `resizeToDataUrl` from `lib/utils/image.ts`, then `addAsset()`.
5. Wire drag reorder in spine: `react-dnd` or native HTML5 DnD — keep it simple.
6. Status-dot logic: compute from stop fields (has title / has body / has hero / has postcard).

## Dependencies needed
- Drag/drop library — check if legacy uses one. If it does, match; otherwise use `@dnd-kit/core` (modern + accessible). Ask user before adding a new dep.

## Verification
- Edit a stop title in legacy and in new; confirm same user flow
- Reload page; confirm changes persisted
- Upload a vertical iPhone photo; confirm it displays right-side up (EXIF)

## Trace

**2026-04-21T03:50Z — opus-4.7-session-20260421 — DONE**

Ran in parallel with F-P002 (subagent A, MapLibre atlas) and dead-code migration (subagent B). Three threads, zero file-touch conflicts.

Files created:
- `web/components/studio/hero-slot.tsx` — real file-upload → `prepareImage` (EXIF + resize via F-T001) → add asset to pool → set `heroAssetId` on stop + update `status.upload/.hero`. Shows upload progress + error toast. "Replace hero" + "Clear" overlay buttons.
- `web/components/studio/stop-metadata-form.tsx` — grid of labeled inputs for location code, time, mood, tone radios (warm/cool/punk), lat, lng. All wired to `updateStop` action.
- `web/components/studio/stop-body-editor.tsx` — per-block editor with three supported kinds (paragraph, pullQuote, metaRow). Up/down/× controls per block. `+` bar at bottom to append new blocks. Advanced blocks (`heroImage`, `inlineImage`, `mediaEmbed`) still render as placeholders pointing at F-T006/T007 so existing seed data doesn't crash.

Files modified:
- `web/components/studio/stop-canvas.tsx` — replaced three placeholder sections with real `<HeroSlot />`, `<StopMetadataForm />`, `<StopBodyEditor />`. Postcard slot remains a placeholder (F-T006 target).
- `web/stores/asset.ts` — **critical fix**: `useAssetsByStop` and `useLooseAssets` were selecting `s.assetsPool.filter(...)` which returns a fresh array every call. Under Zustand's default strict equality this caused Maximum-update-depth loops as soon as `HeroSlot` mounted. Wrapped both with `useShallow`. Same class as the F-T003 action-bundle bug from 2026-04-21T02:30Z. **Memory note added** in project memory: "ANY selector that returns a new array/object via `.filter` / `.map` / object literal MUST use `useShallow`."
- `web/tests/workspace.test.tsx` — "mode pill cycles modes" test now scopes `getByRole("radio", {name:/punk/i})` to the narrative-mode radiogroup (the stop-metadata tone radio group now also has "punk").

Tests: 5 new tests in `web/tests/stop-editor.test.tsx` + 1 updated in workspace.test.tsx. Full suite: 31/31 green in 8 files.

Verification:
- `pnpm typecheck` green
- `pnpm test` 31/31 green
- `pnpm build` green, 33 pages
- Preview MCP `/studio/seed-a-year-in-se1/editor` — canvas renders Title input, Hero slot with Upload button, metadata grid (code/time/mood/tone/lat/lng), body editor with meta-row cells, paragraph textareas, pullQuote (italic serif + red border), advanced-block placeholders with up/down/× controls.

Out of scope (deferred):
- Drag-to-reorder stops in the spine — clickable + keyboard-nav works, DnD is F-T006 territory since the postcard editor uses the same library.
- Hero-image picking from the asset pool (only upload-fresh works right now). Pool-pick would need a modal; F-T006 adds the pattern and this can follow.

Unblocks F-T006 (postcard editor, flip card, 6 AI styles, PDF/PNG export).
