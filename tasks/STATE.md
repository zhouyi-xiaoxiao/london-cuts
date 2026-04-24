# STATE — Project Status Snapshot

**Last updated:** 2026-04-24T23:45Z

## Plan version

**Plan v2.1** (see `docs/implementation-plan.md`): features-first, time estimates removed. M0 → M-fast → M-preview → M-iter → **M1 complete** → M2 next.

## Summary

| Milestone | Status | Notes |
|---|---|---|
| M0 Consolidation | ✅ complete | 9/9 tasks |
| M-fast Feature port | ✅ 14/14 done — but scaffold-level | ~45% of legacy surface actually covered; see `AUDIT-WORKSPACE.md` |
| M-preview Soft launch | ✅ **LIVE** at `london-cuts.vercel.app` | preview-password gate retired 2026-04-24T21:30Z; `/` now redirects to the public reader demo. Seed rebuilt as 13 photo-grounded stops from EXIF + vision. |
| M-iter UX polish | ✅ **COMPLETE** — F-I001..F-I031 shipped (F-I028 WONTFIX). VariantsRow + Polish-prose in. Public reader pages unlocked. | See `tasks/AUDIT.md` + `AUDIT-WORKSPACE.md` + `AUDIT-PUBLIC-PAGES.md` |
| **M1 Supabase & data** | ✅ **complete (Phases 1+2+3 full + F-I012 verified)** — 2026-04-22/23 | Project `acymyvefnvydksxzzegw` / Frankfurt. 5 tables + RLS + Storage. SSR reads + "☁️ Sync to cloud" button + binary upload all live. F-I012 end-to-end verified against production |
| M2 Auth & invites | 🟢 **LIVE + END-TO-END VERIFIED (2026-04-24)** | Migration applied, Auth configured, invite minted + redeemed, env flag ON, owner linked to seed `ana-ishii` (auth_user_id `d813b4cf-41b8-4b06-b10f-99ae4d6ef01a`), `/sign-in → /auth/callback → /studio → ☁️ Sync` full path verified in prod. Preview password removed; `/studio/*` is guarded by `web/app/studio/layout.tsx`. |
| M3 Feature parity | 🗄 superseded by M-fast + M-iter | |
| M4 Public pages polish | ⏳ not started | OG images, ToS, privacy, feedback form |
| M5 Observability | ⏳ not started | Sentry / PostHog / GitHub Actions CI |
| M6 Launch | ⏳ not started | Custom domain `zhouyixiaoxiao.org` (IONOS CNAME + Vercel), invite codes, smoke test |

## Eligible next tracks (owner picks)

1. **M4 public polish** — ToS, Privacy, feedback form, 404/loading states, OG image. This is the next best track before inviting broader EU/public beta traffic.
2. **M5 observability + CI** — Sentry, PostHog, auth/invite/quota tests, GitHub Actions.
3. **M6 custom domain** — owner action in IONOS + Vercel domain setup. Current shareable fallback is `https://london-cuts.vercel.app/` or the direct reader URL.
4. **Per-user AI quota** — new migration + `user_daily_ai_spend` table + tracker in ai-provider. Defer until friend-user traffic proves the need.
5. **User menu UI** — sign-out button + display-name in studio chrome. Small; tack onto any future UI pass.
6. **Invite/onboarding polish** — normal `/sign-in` mail now works via Resend SMTP; next polish is copy/templates and avoiding owner-only wording in beta emails.
7. **Seed sync smoke after deployment** — after any seed edit, run `/api/migrate/seed` with the migration secret or local service-role route, then verify the live reader shows 13 stops and real coordinates.

First step for whichever track: read `tasks/HANDOFF.md` first — it's the canonical resume-point and has the M1 architecture diagram + seam map + gotchas + M2 activation flow.

## In progress

_none_

## Blocked

_none_

## Recently completed

- **Seed demo rebuilt from 13 photos** (2026-04-24T23:45Z):
  - Confirmed all 13 bundled seed images and rebuilt the public demo as `A Year Around London` with 13 stops, 13 hero assets, 13 body blocks, and 13 postcards.
  - Generated per-photo copy with OpenAI vision into `tasks/generated/seed-photo-copy.json`; EXIF + reverse-geocode evidence is in `tasks/generated/seed-photo-exif-geocode.json`.
  - Old stop 04 guard photo (`IMG_3837`) and old stop 10 restaurant/server photo (`IMG_8469`) now display upright by resetting stale EXIF Orientation to normal while preserving GPS/time; stop 13 (`IMG_9931`) was corrected the same way.
  - `web/app/api/migrate/seed/route.ts` now seeds cover from `se1-13`, writes all stop bodies/postcards, and no longer nulls `users.auth_user_id` during reruns.
  - Verification: `pnpm typecheck`, `pnpm test` (65/65), `pnpm build`, local `/api/migrate/seed` Supabase sync, and live reader/image EXIF spot-checks after Vercel picked up commit `44e614c`.
- **Auth email rate-limit mitigation** (2026-04-24T22:45Z):
  - Owner hit Supabase Auth `EMAIL RATE LIMIT EXCEEDED` while testing `/sign-in`.
  - Added API/UI handling so the raw error becomes a 429 `email_rate_limited` with a clearer user message.
  - Added `web/scripts/generate-magic-link.mjs` for owner/admin emergency links while custom SMTP is pending.
  - Sent Gmail relay tests from `zhouyixiaoxiao@gmail.com` to `xiaoxiao.zhouyi@bristol.ac.uk` and `xiaoxiaozhouyi@gmail.com` with admin-generated links + invite `beta-001`.
  - Permanent recommendation: configure Supabase Auth custom SMTP via Resend/Postmark and a domain sender; avoid relying on Bristol/Gmail personal SMTP for product auth mail.
- **Auth SMTP long-term fix completed** (2026-04-24T23:57Z):
  - IONOS DNS records added for `auth.zhouyixiaoxiao.org`; external `dig` and Resend dashboard verified DKIM, return-path MX/SPF, and DMARC.
  - Supabase Auth custom SMTP enabled with Resend: `London Cuts <no-reply@auth.zhouyixiaoxiao.org>`, `smtp.resend.com:465`, username `resend`, password from macOS Keychain.
  - Supabase Auth email rate limit changed to `100 emails/h`; minimum interval per user remains `60 seconds`.
  - Production `/api/auth/send-magic-link` returned HTTP 200 `{"ok":true}` for the previously failing Gmail address, and Resend Logs showed `POST /emails` HTTP 200.
  - Follow-up session issue fixed by changing Supabase Auth templates to token-hash links and updating `/auth/callback` to verify them with `verifyOtp`; production test with a fresh Gmail plus-address reached `/onboarding`, so the normal built-in magic-link flow works end to end. Default `ConfirmationURL` links should not be restored without a new end-to-end test.
  - IONOS MCP and Supabase management API tokens are still not configured; this fix was done through logged-in browser dashboards.
- **Photo-grounded upload metadata connected** (2026-04-24T23:25Z):
  - Confirmed bundled demo uses 13 seed photos, all with readable GPS EXIF.
  - `prepareImage()` now returns full EXIF metadata, not just orientation.
  - `VisionUpload` carries `lat/lng/dateOriginal` through the describe and compose flows; one-photo-per-stop uses the photo GPS/time, and full-draft stops use hero/average coordinates for grouped photos.
  - Added tests covering 13-photo seed count, coordinate averaging, capture-time ordering, and compact location codes.
- **OpenAI image2 safety-block fix** (2026-04-24T22:15Z):
  - Owner hit OpenAI 400 `moderation_blocked` while generating a postcard. API key/account/model were verified OK; the trigger was the old Anime prompt naming specific style references.
  - Kept `gpt-image-2`; replaced the Anime prompt with a generic animated-film travel-postcard prompt and added OpenAI `code/type/requestId` passthrough on image routes.
  - Commit `ebfb115` deployed to production. Verification: typecheck, 61/61 tests, build, live logged-in `/api/ai/generate` anime 200 `mock:false`, live `/api/ai/pregen-variants` all 6 styles 200 with 6/6 `failed:false`.
- **Dogfood round 4 + M2 full build** (2026-04-23T09:05Z) — overnight autonomous session:
  - **F-I035/36** atlas paint simplification. Removed the stacked raster filters (brightness-max, hue-rotate, saturation clamps, warm/cyan scrims) that fought CARTO's basemaps and rendered cinema tiles invisibly. New rule: trust each basemap, +0.05-0.1 contrast only.
  - **F-I037** spine top "+" button beside the stop count header.
  - **F-I038** mode-pill active-state color flipped to `var(--mode-bg)` — fixes cinema's amber-on-white wash.
  - **F-I039** mobile responsive: <900px drops spine, shows `<MobileStopSwitcher>` chip + fullscreen modal; <480px tightens Publish/mode-pill.
  - **M2 PRs 1-5** all shipped env-gated behind `M2_AUTH_ENABLED`. Migration, magic-link sign-in, onboarding + invite redemption, requireUser on AI + sync routes, user-scoped owner_id on sync. Rollback = one env toggle. See `tasks/deferred/M2-ENABLE-CHECKLIST.md`.
- **Preview gate retired + public root** (2026-04-24T21:30Z):
  - Removed `PREVIEW_PASSWORD` from Vercel envs.
  - `/` now redirects to `/@ana-ishii/a-year-in-se1` so the main Vercel URL is shareable.
  - Added `web/app/studio/layout.tsx` server guard so `/studio/*` redirects unauthenticated visitors to `/sign-in?next=/studio` and incomplete profiles to `/onboarding`.
- **F-I029..F-I031 + M2 plan doc + proxy public-bypass** (2026-04-23T07:30Z) — M-iter **CLOSED**:
  - **F-I030** proxy.ts: `/@*/*` + `/atlas` reader pages are now password-free. Studio + `/api/ai/*` + `/api/sync/*` + `/api/migrate/*` stay gated until M2
  - **F-I031 VariantsRow** — the final deferred item. `/api/ai/pregen-variants` with atomic spend-cap pre-flight, 6 style chips, per-variant thumbs (Use-as-hero / Use-as-postcard / Regen / ×), MOCK instant
  - **F-I029 Polish-prose** — `polishStopBlocks()` + `/api/ai/layout-stop`. "✨ Polish prose" button next to "✨ Auto-layout" in body editor. gpt-4o-mini text-only, ~2¢. Same-length same-types contract (client refuses anything else)
  - **M2 plan** — `tasks/deferred/M2-auth-and-invites.md` (681 lines). Recommendations + 5-PR sequence + flags `@supabase/ssr` dep
- **F-I024..F-I027** (2026-04-23T07:10Z) — Second dogfood round: map overhaul + AI creator features:
  - **F-I024** atlas: replaced maplibregl.Popup entirely with a DOM overlay — hover-drift is GONE because MapLibre never sees the card. Pins 36→18px with mode-aware colours. Fashion tiles de-washed (no warm overlay, contrast 0.2). Default-coord stops jittered + "N stops need coordinates" chip
  - **F-I025** rule-based auto-layout: `lib/layout/skeleton.ts` (idempotent, pure, +6 tests). "✨ Auto-layout" button in body editor + dismissible rationale chip. Zero AI cost
  - **F-I026** vision → full project: `composeProject()` + `/api/ai/compose-project` (~$0.02/call, gpt-4o-mini text-only). Vision-upload now asks "+ Create N stops" vs "✨ Generate full draft" after describe completes
  - **F-I027** spine footer sticky: "+ NEW STOP" always visible (overflow moved from aside to ul)
  - **F-I028 WONTFIX**: postcard gen slow is OpenAI latency, not network
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
