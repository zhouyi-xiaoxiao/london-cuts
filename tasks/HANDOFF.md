# HANDOFF — Resume from here

**For a fresh Claude Code session after conversation compaction.** Read this one file and you should be able to continue without asking the user for context.

---

## What's the project

See `~/.claude/projects/-Users-ae23069/memory/project_london_cuts.md` for the enduring snapshot. Short version:

A creator tool for documenting a single-location trip (anywhere in the world) with photos + stories + AI-generated postcards. Three visual modes (Fashion / Punk / Cinema). Target: public invite-only beta at `zhouyixiaoxiao.org`. Placeholder name "London Cuts" — will be renamed before public launch. Owner: PhD student at University of Bristol.

## Plan version + where we are

`docs/implementation-plan.md` is at **v2.1** — features-first ordering:
M0 consolidation → **M-fast feature port** (active, ~half) → M-preview soft-launch → iterate → M1 Supabase → M2 Auth+invites → M4/M5/M6.

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
- `/api/ai/generate` for postcard art (gpt-image-1); `/api/vision/describe` for photo analysis (gpt-4o-mini).
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
