# M-fast — Feature port from archived app/ to web/

**Goal:** Bring every working feature from `archive/app-html-prototype-2026-04-20/` into `web/`, with the same user-visible behaviour but as proper Next.js 14 + TypeScript code. No backend yet — data stays in localStorage / IndexedDB, OpenAI key pasted to sessionStorage (same as old app).

**Duration:** 5 days target.

**Exit criteria:**
- Visiting `http://localhost:3000` gives the same experience as `http://localhost:8000/#workspace` did in the legacy prototype
- All the features on the exit list in `docs/implementation-plan.md#m-fast` work
- No references to the legacy `app/` paths remain in `web/` (besides the reference pointer in the one-off POC logs)

**Why before Supabase/auth:**
- Features are what users care about. Infra is invisible.
- Seam layers (`web/lib/storage.ts`, `lib/auth.ts`, `lib/ai-provider.ts`) let us swap storage/auth/AI-key later without touching business code.
- Getting real-looking output into a preview URL earns feedback sooner.

## Strategy: incremental port, smallest-first

Each task ports one vertical slice and is verified before moving on. If a step fails, we stop and debug — we do NOT pile up partial ports.

## Tasks

| ID | Title | Kind | Blocked by | Est |
|----|-------|------|------------|-----|
| F-T000 | POC: port one trivial component to prove the pipeline | critical | M0 done | 20 min |
| F-T001 | Port shared utilities: EXIF reader, image resize, palette, data seeds | critical | F-T000 | 0.5 day |
| F-T002 | Split `store.jsx` (1000 lines) into domain stores (project / stop / postcard / mode / ui) as TS | critical | F-T001 | 1 day |
| F-T003 | Port projects dashboard ("Your work." screen) | critical | F-T002 | 0.5 day |
| F-T004 | Port workspace: stop spine + canvas + drawers layout | critical | F-T002 | 1 day |
| F-T005 | Port stop editor (metadata, body, drag reorder, upload hero image) | critical | F-T004 | 0.5 day |
| F-T006 | Port postcard editor (6 styles, flip card, orientation toggle, AI generate) | critical | F-T005 | 1 day |
| F-T007 | Port vision pipeline (folder upload → GPT-4o → auto-stops) | critical | F-T006 | 0.5 day |
| F-T008 | Port publish flow (pre-flight, visibility, publish action) | critical | F-T005 | 0.25 day |
| F-T009 | Port public project page (hero + atlas + stops + flip postcards) | critical | F-T006, F-T008 | 0.5 day |
| F-P001 | Port mode switcher (Fashion / Punk / Cinema) — pulls from already-present `web/` tokens | parallel | F-T002 | 0.5 day |
| F-P002 | Port MapLibre atlas with mode-aware tile styles | parallel | F-T004 | 0.5 day |
| F-P003 | Port PDF export (preserve `jspdf` + postcard layout) | parallel | F-T006 | 0.25 day |
| F-P004 | Port PNG export (`html-to-image`) — **make button prominent** (was hidden in legacy) | parallel | F-T006 | 0.25 day |
| F-P005 | Copy-port legacy CSS into `web/app/globals.css` (merge `base.css` + `v2.css`) | parallel | — | 0.25 day |

## Porting rules

1. **Read the legacy file in full** before touching its new counterpart. Don't paraphrase from memory.
2. **Convert JSX → TSX** by adding type annotations. Let AI propose types; inspect for correctness.
3. **Replace UMD globals** with ES imports:
   - `React.useState` → `import { useState } from 'react'`
   - `const { ... } = window.LC` → `import { ... } from '@/lib/...'`
4. **Wrap browser-only code** with `'use client'` directive at the top of the file.
5. **IndexedDB / localStorage access** must be inside `useEffect` or client-only functions (never during SSR).
6. **OpenAI calls**: initially keep the same pattern as legacy (`fetch` directly, key from sessionStorage) but wrap it with `web/lib/ai-provider.ts` exported functions. Later swap to server-side API route (M2).
7. **Design tokens**: pull from `design-system/colors_and_type.css` — do not invent values.
8. **Files > 400 lines**: split before shipping. Especially the monolithic `store.jsx`.
9. **Test after each task**: `pnpm dev`, exercise the feature manually, screenshot it alongside the legacy version to verify parity.

## Legacy reference cheatsheet

For every feature, here's the file to read in archive/:

| Feature | Legacy file |
|---------|-------------|
| Top-level routing & shell | `archive/app-html-prototype-2026-04-20/src/app.jsx` |
| Client state (everything) | `archive/app-html-prototype-2026-04-20/src/store.jsx` |
| Three-column workspace | `archive/app-html-prototype-2026-04-20/src/workspace.jsx` |
| Postcard editor | `archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx` |
| Vision pipeline | `archive/app-html-prototype-2026-04-20/src/vision-pipeline.jsx` |
| Projects dashboard | `archive/app-html-prototype-2026-04-20/src/projects-list.jsx` |
| Publish flow | `archive/app-html-prototype-2026-04-20/src/publish.jsx` |
| Public project page | `archive/app-html-prototype-2026-04-20/src/public-project.jsx` |
| Public atlas page | `archive/app-html-prototype-2026-04-20/src/public-atlas.jsx` |
| Style/prompt palette | `archive/app-html-prototype-2026-04-20/src/palette.jsx` |
| Shared utilities | `archive/app-html-prototype-2026-04-20/src/shared.jsx` |
| Seed data | `archive/app-html-prototype-2026-04-20/src/data.jsx` |
| CSS | `archive/app-html-prototype-2026-04-20/styles/base.css` + `v2.css` |

## Known risks (from initial scan)

| Risk | Mitigation |
|------|------------|
| HEIC photos (iPhone) only decode in Safari via `createImageBitmap` | Keep legacy fallback (warn user to pre-convert in Chrome) |
| EXIF rotation edge cases | Port legacy EXIF reader as-is; add unit tests for common orientations (1, 3, 6, 8) |
| IndexedDB not available during SSR | `'use client'` + lazy init inside `useEffect` |
| Babel-standalone vs SWC behaviour differences | 99% identical; deal with surprises as they come |
| Monolithic store.jsx splitting introduces regressions | Split incrementally, keep the app runnable between each sub-split |
| OpenAI key exposure (sessionStorage, client-side fetch) | Acceptable during M-fast (same as legacy); replaced in M2 with server API route |

## Owner checkpoints

After F-T000 (POC, 20 min in): STOP and show user. Decide whether to proceed.
After F-T006 (postcard editor): STOP and show user. Biggest feature, highest risk.
After F-T009 (public page): end of M-fast, move to M-preview.
