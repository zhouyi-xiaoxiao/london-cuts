---
id: F-T005
title: Port stop editor (metadata, body, reorder, hero upload)
milestone: M-fast
kind: critical
status: TODO
blocked_by: [F-T004]
blocks: [F-T006, F-T008]
parallel_safe: false
touches:
  - web/components/studio/stop-editor.tsx
  - web/components/studio/stop-metadata-form.tsx
  - web/components/studio/stop-body-editor.tsx
owner: null
started_at: null
completed_at: null
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
