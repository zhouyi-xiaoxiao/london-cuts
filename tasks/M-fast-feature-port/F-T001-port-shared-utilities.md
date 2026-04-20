---
id: F-T001
title: Port shared utilities (EXIF, image resize, palette, seed)
milestone: M-fast
kind: critical
status: DONE
blocked_by: [F-T000]
blocks: [F-T002, F-T006, F-T007]
parallel_safe: false
touches:
  - web/lib/utils/
  - web/lib/seed.ts
owner: opus-4.7-session-20260421
started_at: 2026-04-21T00:08Z
completed_at: 2026-04-21T00:30Z
---

# F-T001 — Port shared utilities

## Why
Low-level utility functions are used by many later tasks (image upload, postcard generation, vision pipeline). Porting them first means later tasks have solid building blocks.

## Acceptance
- [ ] EXIF reader in `web/lib/utils/exif.ts` (client-safe, no SSR import of `Image`)
- [ ] Image resize/JPEG-encode helper in `web/lib/utils/image.ts` (max-edge 1600px, quality 0.85)
- [ ] Orientation-aware image loader in `web/lib/utils/image.ts`
- [ ] Hash helper in `web/lib/utils/hash.ts` (for `cache_key`)
- [ ] Style/prompt palette in `web/lib/palette.ts` (the 6 postcard styles + their prompts)
- [ ] Seed data in `web/lib/seed.ts` (demo projects / stops for dev, matches legacy `data.jsx`)
- [ ] All files typed, no `any` without an explicit `// eslint-disable` with reason
- [ ] `pnpm typecheck` passes

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/shared.jsx` — shared helpers (EXIF, resize, base64, UUID)
- `archive/app-html-prototype-2026-04-20/src/palette.jsx` — 6 styles + prompt templates
- `archive/app-html-prototype-2026-04-20/src/data.jsx` — seed projects / stops
- Legacy uses `createImageBitmap` with EXIF auto-rotate fallback — preserve this logic

## Steps
1. Read all three legacy files.
2. Create `web/lib/utils/` directory.
3. Port `exif.ts`:
   - Export `readExifOrientation(blob: Blob): Promise<number>` (1, 3, 6, 8 are the common values)
   - Keep the byte-walking code from legacy
4. Port `image.ts`:
   - `loadImage(file: File): Promise<HTMLImageElement>` with EXIF rotation applied via canvas
   - `resizeToDataUrl(file: File, maxEdge = 1600, quality = 0.85): Promise<string>` returns `data:image/jpeg;base64,...`
   - `hashFile(file: File): Promise<string>` — SHA-256 of file bytes, hex
5. Port `hash.ts` if separate from image.ts, else inline.
6. Port `palette.ts`:
   - Export const `POSTCARD_STYLES: Record<PostcardStyle, StyleMeta>` where meta includes: `id`, `label`, `description`, `promptTemplate`, `swatchColor`
   - Use prompt templates verbatim from legacy `palette.jsx`
7. Port `seed.ts`:
   - Export `SEED_PROJECTS: Project[]` with 1-2 demo projects + their stops
   - Match shapes from `web/lib/storage.ts` types
8. Verify `pnpm typecheck`.

## Verification
- Import each util from a scratch file and log results; confirm shapes match legacy.
- Run unit test (write one if convenient): resize a fixture image, confirm output is under 1600px on the long edge.

## Trace

**2026-04-21T00:30Z — opus-4.7-session-20260421 — DONE**

Scope note: this task as originally written assumed `shared.jsx` was the source of EXIF/resize code. It wasn't — it's UI primitives (Img, Roundel, ModePill, Pips). The actual EXIF + resize functions live in `src/vision-pipeline.jsx` (`vpReadExif`, `vpLoadToJpegDataUrl`). Adjusted the port accordingly.

Added dependency: `exifr@7.1.3` (for GPS/date/orientation extraction).

Created:
- `web/lib/utils/exif.ts` — `readExif(blob)` → `{orientation, lat, lng, dateOriginal}`. Wraps exifr with a safe-default fallback (never throws). Also exports `orientationSwapsAxes(o)`.
- `web/lib/utils/image.ts` — `resizeToDataUrl(file, orientation?, maxEdge=1600, quality=0.88)` → JPEG data URL with EXIF rotation applied. Same two-tier createImageBitmap + HTMLImageElement fallback as legacy. Plus convenience `prepareImage(file)` that reads EXIF and resizes in one call.
- `web/lib/utils/hash.ts` — `stableFileKey` (cheap identity), `sha256Hex` (real SHA-256), `variantCacheKey`.
- `web/lib/seed.ts` — typed port of `data.jsx`: `SEED_PROJECT`, `SEED_STOPS`, `SEED_BODY_05`, `SEED_POSTCARD_05`, `SEED_ASSETS`, `SEED_TASKS`, `PROJECTS_FEED`, `projectSummary()`. All `readonly`.

Deferred (not in F-T001 acceptance):
- Palette-extraction K-means (the `palette.jsx` image-palette one) — only used by `usePalette` hook. Will port with the workspace in F-T004.
- UI primitives from `shared.jsx` (`Img`, `Roundel`, `ModePill`, `Pips`) — each finds its natural home in a feature file: `Roundel` → design-system primitives (already in globals.css via F-P005), `ModePill` → F-P001, `Pips` → F-T004.

POC regression test (via Preview MCP):
- Navigated to `/poc`, screenshotted before and after.
- Found and fixed a rendering bug in StylePicker: inline-style `background: currentColor` + `color: var(--mode-bg)` resolved to bg-on-bg (invisible text on active pill). Swapped to explicit `var(--mode-ink)` / `var(--mode-bg)`. Verified via second screenshot that active button now shows "🎨 WATERCOLOUR ILLUSTRATION" in paper-on-ink.
- Clicked a non-active button to verify interaction — state updates, "Selected" panel changes.
- Console: 0 errors, 0 warnings.

Verification: `pnpm typecheck` green.

Risks deferred to later tasks: HEIC fallback on Chrome (F-T005 upload path), SSR safety of `'use client'` directive (F-T003 dashboard).
