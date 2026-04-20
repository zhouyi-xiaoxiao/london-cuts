# M3 — Feature parity migration

**🗄 Status:** SUPERSEDED by `tasks/M-fast-feature-port/` (plan v2.0). This folder's content is kept for reference but execution moved to M-fast (without server-side OpenAI dependency — that part shifts into M2).

**Goal:** Port every real user-facing capability from legacy `app/` to `web/`. Wire OpenAI through the `ai-provider` seam (server-side only). No feature gap vs the old prototype.
**Duration estimate:** 5 days (the biggest milestone).
**Exit criteria:**
- Authenticated user can create a project, upload photos, edit stops, generate postcards in 6 styles, export PDF + PNG, publish, view publicly
- Vision pipeline (upload folder → auto-create stops) works through new server-side route
- MapLibre atlas renders with mode-aware tiles
- Mode switcher (Fashion / Punk / Cinema) works across all pages
- OpenAI key never appears in client bundle (verified via `web/.next/` grep)

## Tasks

| ID | Title | Kind | Blocked by |
|----|-------|------|------------|
| M3-T001 | Project dashboard UI (list, new, archive) | critical | M2 done |
| M3-T002 | Stop editor (metadata, body, reorder) | critical | M3-T001 |
| M3-T003 | Postcard editor (6 styles, flip card, orientation) | critical | M3-T002 |
| M3-T004 | Image upload (drag-drop, EXIF, resize) | critical | M3-T002 |
| M3-T005 | Implement `lib/ai-provider.ts` real OpenAI calls | critical | M1 done |
| M3-T006 | API route `POST /api/ai/generate` with quota | critical | M3-T005 |
| M3-T007 | Vision pipeline (server-side GPT-4o analyse) | critical | M3-T005 |
| M3-T008 | Publish flow (pre-flight, visibility, publish) | critical | M3-T003 |
| M3-P001 | PDF export | parallel | M3-T003 |
| M3-P002 | PNG export (make button prominent — see notes) | parallel | M3-T003 |
| M3-P003 | MapLibre atlas with mode-aware tiles | parallel | M3-T001 |
| M3-P004 | Mode switcher (Fashion / Punk / Cinema) | parallel | M3-T001 |
| M3-P005 | Wire components to design-system tokens | parallel | any |

## Reference

Port logic from `archive/app-html-prototype-2026-04-20/src/`:
- `vision-pipeline.jsx` → `web/lib/ai-provider.ts` + `web/app/api/vision/route.ts`
- `postcard-editor.jsx` → `web/components/postcard/`
- `store.jsx` → split across `web/stores/` domain stores
- `public-project.jsx` → `web/app/(public)/[handle]/[slug]/page.tsx`

Design system rules: import every color, spacing, font from `design-system/colors_and_type.css` (already in use). Never invent new values.

## Known UX issues to fix during port

- **PNG export button is hidden** in legacy. Make it prominent in the postcard editor toolbar.
- **OpenAI key modal** no longer applicable — remove all user-facing key UI. Users never see keys; the server has them.
- **localStorage migration prompt** (M3 addition): on first login, if browser localStorage has legacy `lc_store_v3` data, offer to migrate it to the cloud account (FR6 in requirements).

## Owner checkpoint

- Create a test project with 5 photos
- Generate postcards in all 6 styles
- Run vision pipeline end-to-end on 3 photos → auto-stops created
- Publish → open public URL in incognito → see it render in all three modes
- Export PDF and PNG; confirm downloads
