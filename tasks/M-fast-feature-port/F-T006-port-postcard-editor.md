---
id: F-T006
title: Port postcard editor (6 styles, flip card, AI generate)
milestone: M-fast
kind: critical
status: TODO
blocked_by: [F-T005]
blocks: [F-T009, F-P003, F-P004]
parallel_safe: false
touches:
  - web/components/postcard/
  - web/lib/ai-provider.ts
owner: null
started_at: null
completed_at: null
---

# F-T006 — Port postcard editor (STAR FEATURE)

## Why
The postcard editor is the flagship of the product: a 3D flip card with AI-generated artwork on the front and handwritten text + recipient address on the back. Six art styles. This is the biggest and highest-risk port task. **Pause at end of this task for owner checkpoint.**

## Acceptance
- [ ] Flip card: 3D CSS transform, 700ms flip animation, front = art, back = text + address (matches legacy)
- [ ] Orientation toggle: portrait (105×148mm) / landscape (148×105mm)
- [ ] Front: auto-populated from hero image; user can "re-imagine" via AI
- [ ] Back: editable message (multi-line), recipient name + address (4 lines + country)
- [ ] Style picker shows 6 styles (extends F-T000 POC): watercolour, vintage_poster, risograph, ink_watercolour, anime, art_nouveau
- [ ] "GENERATE 6 STYLES" button fires all 6 in parallel with OpenAI, shows progress
- [ ] "RE-IMAGINE" button fires one style at current quality (low / medium / high)
- [ ] Cost estimate shown per quality tier ("LOW · $0.02" / "MEDIUM · $0.04" / "HIGH · $0.19") — matches legacy
- [ ] Cached (`sourceHash + style`) results reused — no duplicate charges
- [ ] CLEAR UNUSED button removes non-hero generated variants
- [ ] Assets pool sidebar shows all generated variants with tags

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx` — THE file to read (the whole thing)
- `archive/app-html-prototype-2026-04-20/src/palette.jsx` — style prompts (ported in F-T001)
- `archive/app-html-prototype-2026-04-20/src/shared.jsx` — image helpers (ported in F-T001)

## AI provider wiring
- During M-fast, calls stay client-side and use a key the user pastes into sessionStorage (legacy pattern). Wrap them in `web/lib/ai-provider.ts`:
  - `generatePostcardArt({ sourceAssetId, style, prompt? })` — calls OpenAI `/v1/images/edits` with source image + style prompt
  - Concurrency limiter: max 4 parallel (match legacy)
  - Retry on 429/5xx with exponential backoff (match legacy)
- In M2, this seam's impl swaps to a server-side fetch; no caller code changes.

## Steps
1. Read legacy `postcard-editor.jsx` fully — it's ~900 lines, take notes on sub-components.
2. Split into multiple files (400-line cap):
   - `web/components/postcard/postcard-card.tsx` — the flip card + 3D CSS
   - `web/components/postcard/postcard-front.tsx` — art layer
   - `web/components/postcard/postcard-back.tsx` — message + address
   - `web/components/postcard/postcard-editor.tsx` — container with controls
   - `web/components/postcard/style-picker.tsx` — (already in F-T000, extend here)
   - `web/components/postcard/generate-controls.tsx` — quality + generate buttons
   - `web/components/postcard/variants-panel.tsx` — assigned variants grid
3. Port CSS for the 3D flip into `web/app/globals.css` (or a css module).
4. Wire to `postcard` store + `asset` store.
5. Implement `lib/ai-provider.ts` real functions with the client-side OpenAI call pattern from legacy.
6. Test generation with a real key — confirm cached hits are free.

## Risks
- **OpenAI `/v1/images/edits` API shape** — double-check current API; legacy may be on an older version
- **Large base64 data URLs** — IndexedDB storage, not localStorage (already handled in F-T002)
- **Generation concurrency** — ensure the limiter works (legacy had a `runQueue` pattern)

## Checkpoint
After this task completes: **stop, show user, get approval before continuing**.

## Verification
- Upload a photo → generate 6 styles → all return in under 2 min → results visible in variants panel
- Select one variant → flip card shows it on front → flip to back → edit message → front persists
- Reload page → current state (stop, postcard message, recipient, selected variant) all persisted

## Trace
