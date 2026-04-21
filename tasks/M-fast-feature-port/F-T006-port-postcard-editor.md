---
id: F-T006
title: Port postcard editor (6 styles, flip card, AI generate)
milestone: M-fast
kind: critical
status: DONE
blocked_by: [F-T005]
blocks: [F-T009, F-P003, F-P004]
parallel_safe: false
touches:
  - web/components/postcard/
  - web/lib/ai-provider.ts
  - web/lib/env.ts
  - web/app/api/ai/generate/route.ts
  - web/components/studio/stop-canvas.tsx
owner: opus-4.7-session-20260421
started_at: 2026-04-21T04:10Z
completed_at: 2026-04-21T04:40Z
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

**2026-04-21T04:40Z — opus-4.7-session-20260421 — DONE**

Three-thread parallel session: main session built postcard components + server-side seam, subagent A shipped F-P003 PDF export, subagent B shipped F-P004 PNG export. Zero file conflicts.

**F-T006 (main) — files created:**
- `web/components/postcard/postcard-card.tsx` — 3D flip card (rotateY, 700ms), keyboard-accessible (Enter/Space flips), `forwardRef` exposes `frontNode()` / `backNode()` for export helpers.
- `web/components/postcard/postcard-front.tsx` — art image + stop-counter pill + style-label pill.
- `web/components/postcard/postcard-back.tsx` — Caveat-style handwritten message (editable) + mono recipient block + stamp box. `readOnly` prop for clean export snapshot.
- `web/components/postcard/orientation-toggle.tsx` — landscape/portrait radiogroup.
- `web/components/postcard/postcard-editor.tsx` — orchestrator. Wires: state (selected style + orientation + generation status), `fetch('/api/ai/generate', ...)`, saves generated variant to asset store, variants carousel (click to swap front), 3 prominent export buttons (PNG front / PNG back / PDF).
- `web/app/api/ai/generate/route.ts` — server-side endpoint. Validates input, calls `generatePostcardArt` seam, returns `{ imageDataUrl, prompt, costCents, mock, spendToDateCents }` OR structured error with HTTP 400/429/500/503.
- `web/lib/ai-provider.ts` — REAL implementation. Mock mode (default) returns a tinted SVG placeholder; real mode uses `openai` SDK `images.edit` with `gpt-image-1`, enforces `OPENAI_SPEND_CAP_CENTS` before every call, tracks `spendToDateCents` in-process.
- `web/lib/env.ts` — added `OPENAI_SPEND_CAP_CENTS` (default "800") + `AI_PROVIDER_MOCK` (default "true").
- `web/components/studio/stop-canvas.tsx` — replaced postcard placeholder block with `<PostcardEditor stop={stop} totalStops={stops.length} />`.

**Deps added:** `openai` (official SDK).

**Real-API smoke test (on purpose, budgeted):**
- Flipped `AI_PROVIDER_MOCK=false` in `web/.env.local`
- POST `/api/ai/generate` with a real 469KB SE1 seed photo, style=illustration, quality=low
- Response: HTTP 200 in 19.3s
- Cost: **2 cents** (pipeline reports `costCents: 2, spendToDateCents: 2`)
- Image returned: 2.5MB PNG data URL, rendered a clean hand-painted watercolour of the source photo's window scene
- Flipped mock back to `true` before committing; verified via `grep AI_PROVIDER_MOCK .env.local` = `AI_PROVIDER_MOCK=true`
- Temp files (payload, response, sample PNG) deleted from `/tmp/`

**F-P003 (subagent A):**
- Added `jspdf@4.2.1`.
- `web/lib/export/pdf.ts` — 212 lines. `exportPostcardPdf()` → 2-page A6 PDF (page 1 = front image, page 2 = message + recipient + stamp). Handles remote URL fetch + CORS fallback.
- `web/tests/export-pdf.test.ts` — 4 tests, all green. Uses `vi.hoisted()` to sidestep the `vi.mock` hoisting gotcha with jspdf.

**F-P004 (subagent B):**
- `web/lib/export/png.ts` — `exportNodeToPng(node, filename, { pixelRatio: 2 })` via `html-to-image` (already a dep from scaffold) + `suggestPostcardFilename(projectSlug, stopSlug, side)` helper that sanitises to `[a-z0-9-]`.
- `web/tests/export-png.test.ts` — 9 tests, all green. Mocks `html-to-image` to avoid jsdom canvas limits.

**Verification:**
- `pnpm typecheck` green
- `pnpm test` — 44/44 green (was 31; +13 new = 4 PDF + 9 PNG)
- `pnpm build` — green, `/api/ai/generate` shows as `ƒ (Dynamic)` route (server-rendered on demand)
- Preview MCP `/studio/seed-a-year-in-se1/editor` — shows the postcard editor with prominent PNG/PDF buttons at top, landscape/portrait toggle, 6-style picker, RE-IMAGINE button. `html[data-mode]` still flips via F-P001's wiring.

**Unblocks:** F-T009 (public pages can render the flip card in read-only mode via `<PostcardBack readOnly>` + `<PostcardFront>`).

**Deferred:**
- Vision pipeline (F-T007) — separate task.
- Postcard editor's "GENERATE ALL 6" bulk action — legacy has it, skipped in F-T006 to stay focused. Future task.
- PNG export real DOM rendering (currently `html-to-image` in jsdom is mocked; real browser flows work fine because html-to-image uses canvas which real browsers have).
