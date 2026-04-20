---
id: F-T007
title: Port vision pipeline (folder upload → GPT-4o → auto-stops)
milestone: M-fast
kind: critical
status: TODO
blocked_by: [F-T006]
blocks: []
parallel_safe: false
touches:
  - web/components/studio/vision-upload.tsx
  - web/lib/ai-provider.ts
owner: null
started_at: null
completed_at: null
---

# F-T007 — Port vision pipeline

## Why
The "New from photos" superpower: user drops a folder of photos, GPT-4o describes each, auto-creates stops with title/body/excerpt/postcard-message. Huge UX win for first-time users.

## Acceptance
- [ ] Drag-drop folder or multi-file input onto the `NEW FROM PHOTOS` entry
- [ ] Each image compressed + base64'd (reusing `lib/utils/image.ts`)
- [ ] Each image sent to `describePhoto(assetId)` → returns `{ title, body, excerpt, postcardMessage }`
- [ ] A new project created, one stop per photo, populated from the result
- [ ] Progress UI: `3 / 12 photos analysed…`
- [ ] Heic support: detect, attempt `createImageBitmap`, warn if not decodable
- [ ] On completion, navigates to `/studio/[projectId]/editor` with stops pre-filled

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/vision-pipeline.jsx` — the full pipeline

## Steps
1. Read legacy `vision-pipeline.jsx`.
2. Build `<VisionUpload />` client component for file drop.
3. Add `describePhoto` impl in `lib/ai-provider.ts`:
   - POST to OpenAI `/v1/chat/completions` with `gpt-4o-mini` (or whatever the legacy uses; check)
   - System prompt asks for JSON `{title, body, excerpt, postcardMessage}`
   - Validate response shape; fail gracefully if malformed
4. Orchestration:
   - Queue photos with concurrency 4
   - On each success: create stop in current project
   - On all done: navigate to editor
5. Persist progress through a "vision job" state in `ui` store so a reload shows progress indicator rather than starting over

## Out of scope
- Server-side vision (M2 moves the key off the client)

## Verification
- Test with legacy's 13-photo "London Memories" seed → creates 13 stops matching legacy output

## Trace
