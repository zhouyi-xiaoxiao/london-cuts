# STATE — Project Status Snapshot

**Last updated:** 2026-04-23T02:30Z

## Plan version

**Plan v2.1** (see `docs/implementation-plan.md`): features-first, time estimates removed. M0 → M-fast → M-preview → M-iter → **M1 complete** → M2 next.

## Summary

| Milestone | Status | Notes |
|---|---|---|
| M0 Consolidation | ✅ complete | 9/9 tasks |
| M-fast Feature port | ✅ 14/14 done — but scaffold-level | ~45% of legacy surface actually covered; see `AUDIT-WORKSPACE.md` |
| M-preview Soft launch | ✅ **LIVE** at `london-cuts.vercel.app` | password-gated via `web/proxy.ts` + Vercel `PREVIEW_PASSWORD` |
| M-iter UX polish | 🟢 **near-done** — 22 fixes shipped (F-I001..F-I022), VariantsRow + AI features deferred | See `tasks/AUDIT.md` + `AUDIT-WORKSPACE.md` + `AUDIT-PUBLIC-PAGES.md` + `deferred/` |
| **M1 Supabase & data** | ✅ **complete (Phases 1+2+3 full + F-I012 verified)** — 2026-04-22/23 | Project `acymyvefnvydksxzzegw` / Frankfurt. 5 tables + RLS + Storage. SSR reads + "☁️ Sync to cloud" button + binary upload all live. F-I012 end-to-end verified against production |
| M2 Auth & invites | ⏳ not started — **next eligible** | Magic-link via Supabase Auth + invite codes; replaces service_role writes with RLS |
| M3 Feature parity | 🗄 superseded by M-fast + M-iter | |
| M4 Public pages polish | ⏳ not started | OG images, ToS, privacy, feedback form |
| M5 Observability | ⏳ not started | Sentry / PostHog / GitHub Actions CI |
| M6 Launch | ⏳ not started | Custom domain `zhouyixiaoxiao.org` (IONOS CNAME + Vercel), invite codes, smoke test |

## Eligible next tracks (owner picks)

1. **M2 Auth + invites** — real multi-user. Unblocks real cross-device collaboration and removes the service_role workaround. **Most architectural value now that M-iter is effectively done.**
2. **VariantsRow** — the one remaining M-iter gap ("Re-imagine hero" w/ AI styles, ~345 legacy lines). Deferred to its own session because real AI calls + spend cap + architecture choice (pregen endpoint shape) deserve undivided attention.
3. **M6 custom domain** — ~15 min owner action (IONOS DNS) + 5 min Vercel. No architectural change. Makes sharing friendlier (`zhouyixiaoxiao.org` beats `vercel.app`).

First step for whichever track: read `tasks/HANDOFF.md` first — it's the canonical resume-point and has the M1 architecture diagram + seam map + gotchas.

## In progress

_none_

## Blocked

_none_

## Recently completed

- **F-I019..F-I023** (2026-04-23T02:30Z) — Dogfood bug-fix sprint from owner's first real-use test:
  - **F-I019** postcard generate accepts data: | http(s) | /-public paths (was: hard 400 on seed heroes)
  - **F-I020** atlas pin hover no longer drifts viewport + fashion tiles legible (subagent)
  - **F-I021** spine displays 1-index position (`01`, `02` contiguous after deletes); `stop.n` stays stable. "+ NEW STOP" button more obvious (subagent)
  - **F-I022** cinema mode text visibility: `[data-mode="cinema"]` now overrides raw `--paper*` + `--ink*` tokens so inline-style components auto-adapt; body gradient also dark in cinema
  - **F-I023 (research)** — `tasks/deferred/ai-auto-layout-and-vision-to-project.md` (598 lines): recommends rule-based skeleton + optional LLM polish; reuse per-photo describe + text compose call; $0.14-0.38 per project
- **F-I015..F-I018** (2026-04-23T02:00Z) — Four-stream parallel sprint closed the biggest audit gaps:
  - **F-I015** drawers.tsx — AssetsPool upload + delete + drag-source + hover-⇥ detach (subagent D)
  - **F-I016** atlas.tsx — MapLibre Popup on pin hover (subagent E, 4 files)
  - **F-I017** stop-spine.tsx — drop target for asset-id + image files (subagent F)
  - **F-I018** stop-canvas.tsx — CanvasHeader maps deep-links + AssetStrip per-stop (main)
- **F-I014** (2026-04-23T01:40Z) — Body editor 3 → 6 block types (heroImage / inlineImage / mediaEmbed) + AssetPicker modal (project-scoped, bucketed, upload-in-modal). Via subagent; 55/55 tests.
- **F-I013** (2026-04-23T01:30Z) — HeroDraggable + heroFocus pan + ↺/↻ 90° rotate + portrait letterbox + file-drop target. Main session.
- **F-I012** (2026-04-23T01:00Z) — Production sync verification via curl: POST upsert → assetsUploaded=1 → Supabase Storage CDN 200. Test project cleaned up.
- **F-T009** (2026-04-21T05:30Z) — Public pages (PublicProjectPage + ChapterPage + PostcardPage) via subagent. 3 new tests; total 51/51.
- **F-T008** (2026-04-21T05:25Z) — Publish slideover dialog + workspace wire. 4 new tests.
- **F-T007** (2026-04-21T05:15Z) — Vision pipeline: `describePhoto`, `/api/vision/describe`, `<VisionUpload>`. Real GPT-4o-mini call verified 1¢/7s.
- **F-T006** (2026-04-21T04:40Z) — Postcard editor with 3D flip card + 6 AI styles + PDF/PNG export. Real OpenAI gpt-image-1 verified 2¢/19s.
- **F-P003** (2026-04-21T04:30Z) — PDF export via jspdf@4.2.1. 4 tests.
- **F-P004** (2026-04-21T04:30Z) — PNG export via html-to-image (2× pixel density). 9 tests. Buttons consumed by postcard editor as PROMINENT top-bar actions per task.
- **F-T005** (2026-04-21T03:50Z) — Stop editor fleshed out.
- **F-P002** (2026-04-21T03:50Z) — MapLibre atlas.
- **F-T004** (2026-04-21T03:10Z) — Workspace shell.
- **housekeeping: scaffold dead code** (2026-04-21T04:00Z) — providers/ deleted, layout simplified.
- **housekeeping: mobile responsive** (2026-04-21T03:00Z) — Subagent added 45 lines of @media rules to globals.css, fixed studio dashboard overflow at 390px, bumped tap targets to 44px.
- **housekeeping: Reykjavík seed** (2026-04-21T02:55Z) — Subagent added `SEED_PROJECT_REYKJAVIK` + 7 stops + PROJECTS_FEED entry.
- **F-T003** (2026-04-21T02:30Z) — Dashboard "Your work." ported. Fixed Zustand `useShallow` infinite-loop across 5 hooks.
- **F-P001** (2026-04-21T02:25Z) — Mode switcher + `<HtmlModeAttr>` wired into `<html data-mode>`.
- **dead-code audit** (2026-04-21T02:20Z) — Scaffold deletion graph in project memory.
- **F-T002** (2026-04-21T01:45Z) — Split legacy store.jsx into Zustand + 6 domain hooks.
- **F-P005** (2026-04-21T00:30Z) — Legacy CSS merged into globals.css
- **F-T001** (2026-04-21T00:30Z) — Shared utilities + seed
- **F-T000** (2026-04-20T03:10Z) — POC StylePicker
- **M0-P005** (2026-04-20T02:05Z) — Rewrote README.md + INDEX.md for plan v2.0
- **M0-P004** (2026-04-20T02:05Z) — CLAUDE.md (root) updated to v2 content; web/CLAUDE.md replaced with pointer to root
- **M0-P006** (2026-04-20T01:58Z) — Created web/supabase/ dir scaffold
- **M0-P002** (2026-04-20T01:53Z) — Created web/.env.example
- **M0-P001** (2026-04-20T01:50Z) — Seam stubs in web/lib/ (storage, auth, ai-provider, email, analytics, env, errors)
- **M0-P003** (2026-04-20T01:15Z) — Removed GitHub Pages config; dev server / returns 200
- **M0-T002** (2026-04-20T00:50Z) — app/ → archive/app-html-prototype-2026-04-20
- **M0-T001** (2026-04-20T00:25Z) — Renamed next-scaffold → web

## Active sessions

_none_

## Notes

- Task files exist only for M0 in full detail; M1–M6 have stubs in their milestone READMEs. As M0 completes, expand M1 tasks; as M1 completes, expand M2; etc. This keeps the work-ahead focused and easy to re-prioritise.
- The owner is managing invite codes manually via Supabase Dashboard in beta; no admin UI in scope for M0–M6.

## How to update this file

After claiming or completing a task, adjust the counts and move task lines between sections. Keep the format stable — another agent will parse it.
