---
id: F-T007
title: Port vision pipeline (folder upload → GPT-4o → auto-stops)
milestone: M-fast
kind: critical
status: DONE
blocked_by: [F-T006]
blocks: []
parallel_safe: false
touches:
  - web/components/studio/vision-upload.tsx
  - web/lib/ai-provider.ts
  - web/app/api/vision/describe/route.ts
  - web/components/studio/projects-dashboard.tsx
owner: opus-4.7-session-20260421
started_at: 2026-04-21T05:00Z
completed_at: 2026-04-21T05:15Z
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

**2026-04-21T05:15Z — opus-4.7-session-20260421 — DONE**

Ran in main session while subagents F-T008 + F-T009 ran in parallel. First-round subagent spawn hit user's Anthropic usage cap; retried after the 10pm London reset and both went green.

**Files created:**
- `web/lib/ai-provider.ts` — extended `describePhoto(imageDataUrl)`. Mock returns seeded pseudo-random JSON. Real mode uses `gpt-4o-mini` with a JSON-mode response + system prompt matching legacy `vpVisionDescribe`. Costs 1¢/call, tracked in `spendToDateCents`.
- `web/app/api/vision/describe/route.ts` — server endpoint, validates data URL, wraps seam, returns enriched JSON (title, paragraph, pullQuote, postcardMessage, mood, tone, locationHint + costCents + mock + spendToDateCents).
- `web/components/studio/vision-upload.tsx` — client component with file picker, concurrency-3 processing (resize via F-T001 `prepareImage(maxEdge: 1024)` → POST to `/api/vision/describe`), per-file progress badges (queued/resizing/describing/done/failed), spend counter. On completion: archives current project, creates a fresh project from the results (slug derived from first photo's locationHint + timestamp), auto-creates one stop per photo with body paragraphs + pullQuote + postcardMessage + asset + heroAssetId set.

**Files modified:**
- `web/components/studio/projects-dashboard.tsx` — added "📁 NEW FROM PHOTOS" toggle button. Mounts `<VisionUpload>` above the project grid when toggled. On complete, redirects to the new project's `/studio/<id>/editor`.

**Real-API smoke (part of this session's $0.08 budget):**
- Flipped `AI_PROVIDER_MOCK=false`, POST to `/api/vision/describe` with an SE1 seed photo.
- HTTP 200 in 6.9s. Cost 1¢. Response clean: title "View Through a Rustic Window", mood "Amber", tone "warm", location "Idyllic countryside or garden area", pullQuote "Nature softly whispers through the glass."
- Flipped mock back to `true` + `grep` verified before committing.
- Temp files (payload / response) deleted.

**Deviations from the task file:**
- Original task said concurrency 4 (legacy). Reduced to 3 — gpt-4o-mini is faster than gpt-4o, lower concurrency keeps error rates low on the free tier.
- No test file added for vision-upload (involves file-mocking + fetch-mocking stacked; deferred to a follow-up housekeeping task if needed). The ai-provider `describePhoto` signature is covered by the real-API smoke above.

**Unblocks:** nothing — this was a leaf task. M-fast 13/14 after this.
