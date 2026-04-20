# Implementation Plan — Beta Launch

**Version:** 2.1 (2026-04-21, time estimates removed)
**Target:** Working web/ prototype first, then add infra + invite-only public beta.
**Method:** AI coding (Claude Code) executing tasks from `tasks/`. Subagent parallelism where safe (see `tasks/PARALLELISM.md`).

This is the dependency-ordered roadmap. Individual executable tasks live in `tasks/M{n}-*/`. **We don't track wall-clock time** — with AI writing most of the code, time estimates are 5–10× off. Track dependency order + definition of done instead.

## Why v2.0 (change log from v1.0)

**v1.0 ordered:** M0 → M1 (DB) → M2 (auth) → M3 (features) → M4 → M5 → M6.
Problem: a long stretch of "nothing visible to users" before features landed.

**v2.0 reorders to features-first:** M0 → **M-fast (features)** → **M-preview (soft launch)** → iterate → M1/M2 (infra) → M5 → M6.
Rationale: the `web/` scaffold had no real features — they only exist in the archived legacy `app/`. Porting them first gives us a working thing to test, demo, and iterate on *before* we invest in DB + auth infrastructure. The seam layer (`web/lib/*.ts`) was designed for exactly this: initial impls use localStorage / sessionStorage; later impls swap to Supabase / magic-link — with zero changes to business code.

---

## Milestones (v2.1)

### M0 — Consolidation ✅ done
Freeze legacy `app/`, promote `next-scaffold/` → `web/`, establish seam layers, lock docs.
**Exit criteria met.**

### M-fast — Feature port from archived app/ ⭐ active
Port all working features from `archive/app-html-prototype-2026-04-20/` into `web/`, converting JSX → TSX and splitting the monolithic `store.jsx` into domain stores. Data still lives in browser (localStorage + IndexedDB — same as old app). AI key still pasted by user into sessionStorage (same as old app). No Supabase yet. No auth yet.
**Exit criteria:**
- Projects dashboard works (list / new / archive / switch)
- Stop editor works (metadata, body, reorder, upload photo)
- Postcard editor works (6 styles, flip card, orientation, AI generate)
- Vision pipeline works (folder upload → GPT-4o → auto-stops)
- PDF + PNG export work
- MapLibre atlas works with mode-aware tiles
- Fashion / Punk / Cinema mode switcher works everywhere
- Publish flow works (visibility = public / unlisted / private, public URL renders the project)

### M-preview — Soft-launch preview ⭐ next
Deploy `web/` to Vercel as preview. Simple password gate (single shared password in env var) — not real auth, just a "don't scrape this" door. Send URL + password to a handful of trusted friends for feedback.
**Exit criteria:** A friend can visit `<something>.vercel.app`, enter the shared password, and use the app. They give feedback.

### M-iter — Iterate on feedback (open-ended)
Fix bugs. Polish UX. Add/remove features based on what real users hit. This loop can last as long as needed before committing to public launch.
**Exit criteria:** Owner feels the product is "good enough" to open up wider.

### M1 — Supabase & data model ⏸ deferred
Provision Supabase; write migrations; swap `lib/storage.ts` impl from localStorage → Supabase. Because all DB access went through `lib/storage.ts` since M-fast, business code doesn't change.
**Exit criteria:** User can create / read / update projects and they persist across devices.

### M2 — Auth & invites ⏸ deferred
Magic link + invite codes. Swap `lib/auth.ts` impl from mock-user → Supabase Auth. Move OpenAI key from sessionStorage → server-side API route.
**Exit criteria:** Invited email can sign up, log in, and use AI generation without ever seeing a key field.

### M4 — Public pages polish ⏸ deferred
Landing page polish, atlas polish, 404 / empty states, ToS + Privacy, feedback form, OG images.
**Exit criteria:** Guest visits, sees a polished public project.

### M5 — Observability & tests ⏸ deferred
Sentry, PostHog, Vitest unit tests, GitHub Actions.
**Exit criteria:** Errors show in Sentry; key events show in PostHog; CI gates PRs.

### M6 — Launch ⏸ deferred
IONOS DNS → Vercel, apex domain wired, 30 invite codes issued, first cohort invited.
**Exit criteria:** `zhouyixiaoxiao.org` serves the app; ≥ 3 non-admin users logged in.

### M3 — [superseded by M-fast] ~~Feature parity migration~~
The original M3 is now M-fast, done earlier and without Supabase dependency.

---

## Parallelism strategy

Each milestone has a critical-path task (numbered `T00X`) and parallel tasks (`P00X`).

- **Critical-path tasks** must be done sequentially in order.
- **Parallel tasks** can run concurrently across multiple Claude Code sessions.

Agents pick up tasks from `tasks/M{n}-*/` directories. Each task file has YAML frontmatter declaring:
- `blocked_by` (other task IDs)
- `parallel_safe` (true/false)
- `touches` (paths, for conflict detection)

See `tasks/AGENTS.md` for coordination rules.

---

## Task index (high level)

### M0 Consolidation

- M0-T001 Rename `next-scaffold/` → `web/`, update references
- M0-T002 Archive legacy `app/` to `archive/app-html-prototype-2026-04-20/`
- M0-P001 Create seam files (`web/lib/{storage,auth,ai-provider,email,analytics,env,errors}.ts` as stubs)
- M0-P002 Create `web/.env.example` with all required vars documented
- M0-P003 Update `web/next.config.ts` for production (remove static export if present, configure images)
- M0-P004 Update `CLAUDE.md` to reflect single-track repo
- M0-P005 Update `README.md` and `INDEX.md`
- M0-P006 Add `web/supabase/migrations/` directory with README

### M1 Supabase & data

- M1-T001 Create Supabase project; record project ref + keys (manual, owner)
- M1-T002 Write migration `00001_initial_schema.sql` (all tables from `docs/data-model.md`)
- M1-T003 Write migration `00002_rls_policies.sql`
- M1-T004 Create Storage bucket `assets` with RLS
- M1-T005 Implement `lib/storage.ts` with typed CRUD for projects, stops, assets
- M1-P001 Generate TypeScript types from Supabase schema (`supabase gen types`)
- M1-P002 Write seed data script
- M1-P003 Implement `lib/env.ts` with Zod validation

### M2 Auth & invites

- M2-T001 Implement `lib/auth.ts`: `getCurrentUser`, `sendMagicLink`, `signOut`, `verifyInvite`
- M2-T002 Configure Supabase Auth to use Resend for SMTP
- M2-T003 API route `POST /api/invites/verify` (server-side, service role)
- M2-T004 Sign-up page (email + invite code form)
- M2-T005 Sign-in page (email only, magic link)
- M2-T006 Auth callback page (`/auth/callback`) to consume magic link
- M2-T007 Middleware gating `/studio/*` routes
- M2-P001 Implement `lib/email.ts` with Resend wrapper
- M2-P002 Write Vitest tests for `verifyInvite` logic
- M2-P003 Seed 30 invite codes via script

### M3 Feature parity migration

- M3-T001 Port project dashboard UI (list, new, archive)
- M3-T002 Port stop editor (metadata, body, reorder)
- M3-T003 Port postcard editor (6 styles, flip card, orientation)
- M3-T004 Port image upload (drag-drop, EXIF, resize)
- M3-T005 Implement `lib/ai-provider.ts` with real OpenAI calls
- M3-T006 API route `POST /api/ai/generate` with quota enforcement
- M3-T007 Port vision pipeline (GPT-4o analyse → auto-create stops)
- M3-T008 Port publish flow (pre-flight, visibility, publish action)
- M3-P001 Port PDF export
- M3-P002 Port PNG export (**make button prominent** — legacy UX issue)
- M3-P003 Port MapLibre atlas with mode-aware tiles
- M3-P004 Port mode switcher (Fashion / Punk / Cinema)
- M3-P005 Wire all components to design-system tokens (no new hex values)

### M4 Public pages & polish

- M4-T001 Public project page `(public)/[handle]/[slug]`
- M4-T002 Atlas page (global list of public projects)
- M4-T003 Landing page
- M4-P001 404 / error pages
- M4-P002 Loading states and empty states
- M4-P003 Terms of Service + Privacy Policy stubs
- M4-P004 Footer with ToS / Privacy / feedback links
- M4-P005 Feedback form writing to `feedback` table
- M4-P006 Social share OG image

### M5 Observability & tests

- M5-T001 Wire Sentry (client + server)
- M5-T002 Wire PostHog (client)
- M5-T003 Key events: signup, publish, ai_generate, ai_failure
- M5-P001 Vitest tests: auth, invite, quota
- M5-P002 GitHub Actions: run tests on PR
- M5-P003 GitHub Actions: typecheck on PR

### M6 Launch

- M6-T001 Configure Vercel project, link to GitHub repo
- M6-T002 Set env vars in Vercel (three environments)
- M6-T003 Configure IONOS DNS → Vercel (apex A record + `www` CNAME)
- M6-T004 SSL cert verified (Vercel auto-provisions)
- M6-T005 Generate 30 invite codes, put in a private doc
- M6-T006 Smoke test production
- M6-T007 Send first batch of invites
- M6-P001 Write launch announcement
- M6-P002 Set up Supabase daily keep-alive cron (avoid 7-day pause)

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Vision pipeline breaks on port (HEIC, EXIF quirks) | Keep legacy `app/` code around as reference during M3 |
| Supabase free tier pauses on inactivity | M6-P002 cron + fallback to paid if beta sustains |
| OpenAI cost spikes | Per-user 50/day quota + cache |
| User submits large files | Enforce 10MB upload limit server-side |
| RLS bug leaks private data | M5-P001 integration test that verifies RLS |
| Domain misconfigured on launch day | Test DNS in staging subdomain first |

## Budget (free-tier baseline)

All services on free tier. Expected cost: **$0/month for 30 beta users**.

- Vercel free: ample
- Supabase free: 500MB DB, 1GB Storage (watch Storage usage if users upload many photos)
- Resend free: 3000 emails/month (way more than beta needs)
- Sentry / PostHog free: sufficient
- OpenAI: owner pays; ~$0.04/image × 30 users × 50/day max = up to $60/day **worst case** (budget $100/week cap; most users won't max quota)

**Action item:** set OpenAI hard spend limit at $500/month in dashboard before launch.

## How to execute this plan with Claude Code

See `tasks/README.md` and `tasks/AGENTS.md`. Short version:

1. Owner opens Claude Code in repo root.
2. Owner says: "Pick up the next TODO task in `tasks/M0-consolidation/` and complete it. Follow the protocol in `tasks/AGENTS.md`."
3. Agent reads the task file, executes, updates status, appends to `tasks/LOG.md`.
4. Multiple sessions can run in parallel on tasks marked `parallel_safe: true` with non-overlapping `touches`.
5. Repeat until milestone complete, then move to next milestone.
