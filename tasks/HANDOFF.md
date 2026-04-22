# HANDOFF — Resume from here

**For a fresh Claude Code session after conversation compaction.** Read this one file and you should be able to continue without asking the user for context.

---

## What's the project

See `~/.claude/projects/-Users-ae23069/memory/project_london_cuts.md` for the enduring snapshot. Short version:

A creator tool for documenting a single-location trip (anywhere in the world) with photos + stories + AI-generated postcards. Three visual modes (Fashion / Punk / Cinema). Target: public invite-only beta at `zhouyixiaoxiao.org`. Placeholder name "London Cuts" — will be renamed before public launch. Owner: PhD student at University of Bristol.

## Plan version + where we are

`docs/implementation-plan.md` is at **v2.1** — features-first ordering:
M0 consolidation → M-fast feature port → M-preview soft-launch → M-iter (half-done) → **M1 Supabase (Phases 1+2+3-minimal LIVE)** → M2 Auth+invites → M4/M5/M6.

**As of 2026-04-22**:
- **M-preview LIVE**: `https://london-cuts.vercel.app` serving commits on `main`. `/` redirects to `/studio`. 13 seed photos (SE1) + 1 cover render from `web/public/seed-images/`. Vercel auto-deploy on every push to `main`. Custom domain `zhouyixiaoxiao.org` NOT yet wired. Preview gate via `web/proxy.ts` (set `PREVIEW_PASSWORD` in Vercel env to activate).
- **M-iter**: half-done. F-I001..F-I011 shipped (font swap, cinema letterbox, postcard flip, publish URL, atlas brightness, spine add/remove/move, per-mode postcard front + chapter grammars, variant cache). Still missing per `tasks/AUDIT-WORKSPACE.md` + `tasks/AUDIT-PUBLIC-PAGES.md`: VariantsRow, HeroDraggable, AssetPicker, 3 body block types, atlas pin hover, heroFocus integration, cover-asset fallback bug.
- **M1 LIVE (Phases 1+2+3 full)**: Supabase backend is real, complete.
  - Project ref: `acymyvefnvydksxzzegw`, region Central EU (Frankfurt), Free tier, org "55".
  - Schema: 5 tables (`users` / `projects` / `stops` / `postcards` / `assets`) + RLS + storage bucket `assets`. Applied via Supabase SQL Editor; source of truth = `web/supabase/migrations/0001_initial.sql`.
  - Env vars set in BOTH `web/.env.local` AND Vercel (production + development): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Preview env skipped (we don't use preview branches).
  - Seed data pushed via `/api/migrate/seed` → 1 user + 2 projects + 13 assets + 19 stops + 1 postcard.
  - Public pages (project / chapter / postcard) fetch from Supabase server-side via `web/lib/public-lookup.ts` + pass `initialData` prop to client components (client components still fall back to local Zustand via `usePublicProjectLookup` if no server data).
  - **"☁️ Sync to cloud"** dashboard button POSTs current Zustand state → `/api/sync/upsert` → service_role upserts into Supabase. Phase 3 **full** now — binaries included. Assets with `data:` URLs get uploaded to Supabase Storage bucket `assets` at path `{ownerId}/{projectId}/{legacyId}.{ext}`; the returned public URL lands in `assets.storage_path`. Assets with a `/seed-images/*` URL pass through as-is. Response includes `assetsUploaded` + `assetsPassedThrough` counts; dashboard banner surfaces the uploaded count.
- **Dep added**: `@supabase/supabase-js@2.104.0` (owner-approved).

**M-fast: COMPLETE 14/14.** In order:
- F-T000 POC (style picker)
- F-T001 shared utilities (exif / image / hash / seed)
- F-T002 Zustand root store + 6 domain hooks + IndexedDB
- F-T003 "Your work." dashboard
- F-T004 workspace 3-column shell (spine + canvas + drawers)
- F-T005 stop editor (HeroSlot with EXIF upload, metadata form, body editor)
- F-T006 postcard editor (3D flip card + 6 AI styles + generate route + PDF/PNG exports)
- F-T007 vision pipeline (folder upload → GPT-4o-mini → auto-create project)
- F-T008 publish flow (pre-flight checklist + visibility + publish action)
- F-T009 public pages (reader views: project / chapter / postcard + NotFoundCard)
- F-P001 mode switcher + `<HtmlModeAttr />`
- F-P002 MapLibre atlas with mode-aware tiles (maplibre-gl 5.23)
- F-P003 PDF export (jspdf 4.2.1)
- F-P004 PNG export (html-to-image, 2× pixel density), prominent top-bar buttons
- F-P005 legacy CSS merged into globals.css

**Next eligible:** M-preview — see "The road ahead" section at the bottom of this file.

**OpenAI pipeline live (don't regress):**
- `/api/ai/generate` for postcard art (**gpt-image-2**, swapped in 2026-04-21 after initial verification with gpt-image-1); `/api/vision/describe` for photo analysis (gpt-4o-mini).
- `lib/ai-provider.ts` has MOCK mode (default, returns tinted SVG / pseudo-random JSON) and REAL mode (needs `AI_PROVIDER_MOCK=false` + valid `OPENAI_API_KEY` in `web/.env.local`).
- Spend cap: `OPENAI_SPEND_CAP_CENTS` env (default 800 = $8). Enforced in `ai-provider.ts` before every call; throws `QuotaExceededError` → API returns HTTP 429.
- Pipeline verified end-to-end on 2026-04-21: 1 postcard (gpt-image-1 watercolour, 2¢/19s) + 1 vision (gpt-4o-mini, 1¢/7s). If a new session needs to test real gen, ask the owner for a fresh key + flip `AI_PROVIDER_MOCK=false` + **revert to `true` before committing**.

**Housekeeping done:** `web/providers/` removed. `web/lib/media-provider.ts` + `web/lib/seed-data.ts` deleted. `web/app/layout.tsx` simplified. Scaffold `studio-pages.tsx` + `public-pages.tsx` now read Zustand via `web/components/studio-pages.adapter.ts`. `web/lib/types.ts` still present (ui.tsx + routes.ts still import it).

## How to keep moving

1. `tasks/STATE.md` — authoritative. Check "Eligible next tasks".
2. `tasks/AGENTS.md` — the protocol. Claim a task by editing its frontmatter to `IN_PROGRESS`, append a LOG.md line, do the work, update `Trace`, mark DONE.
3. `tasks/PARALLELISM.md` — subagent rules. Three concurrent subagents is the proven upper bound (main + 2 background via `Agent` tool with `run_in_background: true`). Check `touches:` arrays for overlap.
4. `tasks/LOG.md` — append-only event history, newest at the bottom.

## Things a fresh session must NOT regress (latent bug classes)

- **Zustand selectors returning any fresh reference (object literal, filtered array, mapped array) MUST use `useShallow`**. Otherwise "Maximum update depth exceeded" on mount. All existing `use*Actions()`, `useAssetsByStop`, `useLooseAssets` already do this. Caught twice in M-fast (F-T003 action bundles, F-T005 filter selectors). When adding new hooks, default to `useShallow` unless the selector returns a primitive or a value that IS a stable reference.
- **Test environment**: `vitest.config.ts` defaults to `jsdom`. The Zustand store uses a `safeLocalStorage()` shim in `web/stores/root.ts` that falls back to an in-memory Map. Don't remove — fixes both jsdom and SSR.
- **Postcard style IDs stay legacy-verbatim**: `illustration | poster | riso | inkwash | anime | artnouveau`. Don't rename to semantic — they key into the variants cache and OpenAI calls later.
- **Next.js private folders**: `_xxx/` prefix excludes a folder from routing. Use plain `xxx/` for test/poc routes.
- **Seed data**: `web/stores/root.ts` pre-seeds `projectsArchive` with a Reykjavík demo. Tests that count archive entries need to account for baseline=1 (see `tests/store.test.ts`).
- **`next.config.ts` must NOT set `outputFileTracingRoot`** — breaks Vercel deploy with `ENOENT: routes-manifest-deterministic.json`. See "Deploy gotchas" below.
- **`proxy.ts` (NOT `middleware.ts`)** — Next 16 renamed the convention. Both the file and the exported function are `proxy`. Legacy `middleware.ts` compiles but files a deprecation warning.

## Deploy gotchas (2026-04-21 session — don't re-learn these)

- **Vercel root directory is `web/`** (configured at project level). Linking locally: `cd` to repo root, `npx vercel link` (the repo-level `.vercel/project.json` points at `london-cuts`). Do NOT run `vercel --prod` from inside `web/` — that creates a second orphan project called `web`.
- **`next.config.ts` `outputFileTracingRoot` is a trap.** Setting it to `__dirname` seems to "fix" a harmless Vercel startup warning but actually redirects Next's `.next/` output in a way that breaks Vercel's post-build `routes-manifest-deterministic.json` check. Leave it unset; Vercel auto-infers from Root Directory.
- **Build success ≠ deploy success.** Vercel's build logs can say "Build Completed in /vercel/output" and still `status ● Error` because the deploy-phase check fails. Look at `npx vercel --prod --yes` output (or `vercel logs`) for the real error — the build-log tail alone will lie to you.
- **5 environment variables live in Vercel prod env**: `OPENAI_API_KEY`, `OPENAI_SPEND_CAP_CENTS=800`, `AI_PROVIDER_MOCK=true` (flip to `false` when running real AI), `PREVIEW_PASSWORD` (the shared gate password), `NEXT_PUBLIC_APP_URL`. To inspect: `npx vercel env ls production`.
- **Custom domain `zhouyixiaoxiao.org` not yet wired.** When ready: IONOS DNS panel → CNAME `@` and `www` → `cname.vercel-dns.com`, then Vercel → Settings → Domains → Add. HTTPS is auto.

## M1 architecture (2026-04-22) — data flow

```
              ┌──────── Zustand store (client, "source of truth" for edits) ────────┐
              │                                                                     │
Studio UI ───▶│ useProject / useStops / etc. → optimistic local updates to          │
              │ localStorage + IndexedDB (binary)                                   │
              └─────────┬─── "☁️ Sync to cloud" button in dashboard ────────────────┘
                        │
                        ▼
              POST /api/sync/upsert   (service_role, bypasses RLS)
                        │
                        ▼
                   ┌──────────┐
                   │ Supabase │  ── 5 tables, RLS enforced
                   └────┬─────┘
                        │  SELECT via anon key (published+public RLS policy)
                        ▼
              web/lib/public-lookup.ts   (server-side fetch)
                        │
                        ▼
              app/[author]/[slug]/page.tsx   (SSR — passes `initialData` prop)
                        │
                        ▼
              <PublicProjectPage initialData={...}>   (falls back to Zustand hook if initialData=null)
```

Key seam files (don't import `@supabase/supabase-js` anywhere else):
- `web/lib/supabase.ts` — `getServerClient()` / `getBrowserClient()` / `hasSupabaseConfig()`
- `web/lib/public-lookup.ts` — server-side `fetchPublicProjectByHandleAndSlug(handle, slug)` — used by the three `app/[author]/[slug]/*/page.tsx` files to hand `initialData` to the client components
- `web/app/api/migrate/seed/route.ts` — one-shot seed → Supabase migration. Idempotent; POST to it after any schema change that rebuilds the tables
- `web/app/api/sync/upsert/route.ts` — studio → Supabase write endpoint. Delete-then-insert stops (safe because the client always sends the full list). Wiped of asset binaries — only metadata syncs in Phase 3 minimal
- `web/supabase/migrations/0001_initial.sql` — the schema (447 lines). Apply via Supabase SQL Editor → paste → Run. Safe to re-run? **NO** — has `create type` / `create table` without `if not exists` for some. If you need to re-apply, drop the public schema first

Seeded fixed UUIDs (idempotent across re-migrations):
- Owner: `00000000-0000-4000-8000-000000000001` (handle `ana-ishii`)
- SE1 project: `00000000-0000-4000-8000-000000000101`
- Reykjavík project: `00000000-0000-4000-8000-000000000102`

## M1 gotchas (don't re-learn)

- **`/api/migrate/seed` is dev-gated.** In production it returns 403 unless `x-migrate-secret` header is present (any non-empty value passes). The preview password gate via `web/proxy.ts` ALSO applies to `/api/*` routes — so curl from outside needs the `lc_preview_auth` cookie. Easiest: open the dashboard in a logged-in browser, grab the cookie via DevTools, then curl with `Cookie: lc_preview_auth=<password>`.
- **`next.config.ts` must NOT set `outputFileTracingRoot`** — repeat, same trap as M0. It breaks Vercel.
- **Anon key and service_role key live in `.env.local`** (gitignored) AND Vercel (production + development environments). **Preview env has no Supabase vars** intentionally — we don't ship preview branches, only `main`.
- **Sync upload wipes and re-inserts stops per click.** If the client sends a partial stops list (race condition, bug, etc.), stops get deleted. Always send the full list. M2 will add per-stop upsert via auth scoping.
- **Asset binaries now upload in sync (Phase 3 full).** data: URLs are base64-decoded + pushed to Storage bucket `assets` via `db.storage.from(...).upload()` with `upsert:true`. Storage path follows `{ownerId}/{projectId}/{legacyId}.{ext}`; mime is guessed via `extFromMime()`. The returned public URL goes into `assets.storage_path`. Consequence: user uploads a photo → clicks Sync → friend on another device fetches it straight from Supabase Storage CDN.
- **Asset sync is delete-then-insert per project.** `/api/sync/upsert` wipes all `assets` rows with `project_id = X` before inserting. Client MUST send every asset referenced by the project each sync — partial lists lose rows. (Seed-migrated rows have `project_id = SE1` so they do get wiped on a client sync; client is responsible for re-sending the seed `/seed-images/*` pass-throughs.)

## M-iter backlog — known UX/feature gaps from owner dogfooding (2026-04-21)

These are real issues owner hit in the deployed preview. NOT M-preview blockers, but the next loop of work. Don't close any without owner confirmation.

1. **Dashboard photo list capped/fixed.** Owner reports "left side 12 photos can't add new." Likely the dashboard shows 13 SEED_ASSETS fixed via `web/lib/seed.ts` + upload entry point unclear. Fix: either wire an upload path from the dashboard into a specific project, or make the seed clearly labelled "demo — create a new trip to add your own."
2. **Mode switcher doesn't swap fonts.** Three modes (Fashion/Punk/Cinema) change colours but not typography. Legacy prototype switched both. Check `web/stores/mode.ts` or tokens in `design-system/ui_kits/studio/tokens.css` — might only be swapping `--ink`/`--paper` not `--f-serif`/`--f-sans`.
3. **Postcard click flips card → blocks editing.** The 3D flip-on-click gesture in F-T006 conflicts with "click to edit fields on the back." Legacy probably used hover-flip or a separate edit toggle. Separate the gestures: flip on button, edit on field focus.
4. **Publish flow doesn't surface a shareable URL.** F-T008 PublishDialog records the project as public but doesn't display the resulting `/[author]/[slug]` URL or a copy button. Add a post-publish state showing the live URL + copy-to-clipboard.
5. **Custom domain pending.** Owner wants `zhouyixiaoxiao.org`. Blocker: IONOS DNS + Vercel domain setup (~15 min of manual clicks).
6. **Owner noted "还有很多我没告诉你发现的问题"** — i.e. more bugs exist that weren't enumerated. Next time owner loads the app, take 20 min together to walk through screen-by-screen and expand this list.

## Verification pipeline (run before every commit)

```bash
cd web
pnpm typecheck     # must be green
pnpm test          # currently 23/23 green
pnpm build         # must be green
```

Visual regression via Preview MCP:
```
preview_start({ name: "london-cuts-web" })
preview_eval({ expression: "location.href = '/studio'", ... })
preview_screenshot(...)
```

## Git hygiene

- `git config core.hooksPath scripts/hooks` should already be set on this clone. If a fresh clone: run that once.
- `pre-commit` hook runs `pnpm typecheck` on staged `*.ts/*.tsx` under `web/`.
- `pre-push` hook scans the commit range for secret patterns (OpenAI / Stripe / AWS / GitHub PAT / etc.). If it flags an already-revoked secret, bypass with `git push --no-verify` + confirm the key is dead.
- Commit messages: `<area>: <imperative> (<task-id>)`. Include Co-Authored-By trailer.

## What's running locally vs remote

- Local dev: `cd web && pnpm dev` → `http://localhost:3000`
- Legacy reference: `cd archive/app-html-prototype-2026-04-20 && python3 -m http.server 8000` → `http://localhost:8000` (useful for visual parity checks on postcard editor)
- Remote: GitHub `zhouyi-xiaoxiao/london-cuts`. Force-with-lease push is fine for now (user is solo).

## Decisions already committed (don't reopen without cause)

- Plan v2.1 features-first (vs v1.0 infra-first). Reason: the scaffold has no real features.
- One Zustand root store + 6 domain hook files (not 6 separate stores). Reason: cross-store deps between stops / postcards / assets.
- Seed data stays in `web/lib/seed.ts`, not a CMS. M-fast is browser-only; M1 switches to Supabase.
- Owner's handle for public URLs is `yx` (hardcoded in PublishDialog). Rewire when real auth lands.
- `npm` deps added so far (in addition to scaffold): `zustand`, `exifr`, `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `maplibre-gl`, `jspdf`, `openai`. No more without asking the user.
- Product name "London Cuts" is a placeholder; owner hasn't picked final yet — keep it for now.

## Open decisions NOT YET made (watch for these in the next conversation)

- Product rename (just keep placeholder until the user decides)
- Seed data: should Reykjavík/SE1 both stay as permanent demos, or should new users start with an empty project? (Currently SE1 is current + Reykjavík is archived.)
- Bundle-size analyzer run (not needed until M6)

---

## The road ahead (what comes AFTER M-fast)

**Once M-fast is 14/14 the app has:**
- Create/edit project with photos + stories + postcards
- Real AI postcard generation (6 styles) + vision analysis of uploaded photos
- Publish flow with pre-flight checklist
- Public reader-side pages (project view, chapter view, postcard view, atlas)
- Three visual modes, MapLibre map, PDF + PNG export
- Tests, git hooks, responsive CSS, compaction-safe task system

**What's still missing for launch (M-preview → M6):**

### M-preview (short — 1 commit) — soft-launch to friends
Goal: get the app onto a public URL behind a password gate so 3-5 trusted friends can poke at it and give feedback. Prerequisites:
1. Vercel project linked to GitHub. Owner needs to: create Vercel account (or use existing), connect `github.com/zhouyi-xiaoxiao/london-cuts` repo, paste env vars (OPENAI_API_KEY, OPENAI_SPEND_CAP_CENTS=800, AI_PROVIDER_MOCK=false for preview, PREVIEW_PASSWORD=some-shared-string, NEXT_PUBLIC_APP_URL=the vercel domain).
2. Add `web/middleware.ts` that reads `PREVIEW_PASSWORD` + checks a cookie. If missing: serve a simple "enter password" page. If present: pass through. **Not real auth** — just a scrape-blocker until M2.
3. Copy + share the Vercel URL with 3-5 friends. Watch Sentry... wait, Sentry is M5.
4. Observation only: what do real users do? Where do they get stuck? This informs M-iter.

### M-iter (open-ended) — fix what friends complain about
Loop. No scope creep — if an issue is minor, log to a "v2 backlog" doc; only fix things blocking the published flow.

### M1 (bigger — 1-2 weeks of Claude time) — Supabase
Swap `lib/storage.ts` implementation from localStorage+IDB to Supabase Postgres. This is where the data model in `docs/data-model.md` lands as migrations. Owner needs to: create Supabase project (link via Supabase CLI), get keys, paste to Vercel env. The seam makes this a ~1-file rewrite in `lib/storage.ts` plus schema migrations; UI code doesn't know.

### M2 (medium) — Auth + invites
Swap `lib/auth.ts` from mock-user to Supabase Auth. Magic-link sign-up requires an invite code (`invites` table). Move OpenAI key from `.env.local` to server env + user-scoped daily quota (50/day).

Replaces the M-preview password gate. Kills the hardcoded `yx` handle — users choose their own.

### M4 (small) — Public page polish
Real OG share images. Terms of Service page. Privacy Policy page (EU GDPR requires because beta collects email). Feedback form → Supabase `feedback` table → email on new row.

### M5 (small) — Observability + tests
Sentry, PostHog, more Vitest tests for auth + invite + quota. GitHub Actions: typecheck + test on PR.

### M6 (small) — Launch
IONOS DNS → Vercel (apex + www). HTTPS via Vercel. Generate 30 invite codes (Supabase Dashboard SQL). Smoke test. Invite first cohort.

**Rough total effort to public launch:** M-preview (hours) → M-iter (open) → M1+M2 (bulk of remaining infra) → M4+M5+M6 (polish + ship).

## The single biggest thing the owner should do next (after M-fast)

Open the app in a real browser, spend 30 minutes pretending to be a user creating their first trip. Note everywhere it felt slow, confusing, or broken. That list — not my architectural opinions — drives the M-iter backlog.
