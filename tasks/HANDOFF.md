# HANDOFF — Resume from here

**For a fresh Claude Code session after conversation compaction.** Read this one file and you should be able to continue without asking the user for context.

---

## What's the project

See `~/.claude/projects/-Users-ae23069/memory/project_london_cuts.md` for the enduring snapshot. Short version:

A creator tool for documenting a single-location trip (anywhere in the world) with photos + stories + AI-generated postcards. Three visual modes (Fashion / Punk / Cinema). Target: public invite-only beta at `zhouyixiaoxiao.org`. Placeholder name "London Cuts" — will be renamed before public launch. Owner: PhD student at University of Bristol.

## Plan version + where we are

`docs/implementation-plan.md` is at **v2.1** — features-first ordering:
M0 consolidation → **M-fast feature port** (active, ~half) → M-preview soft-launch → iterate → M1 Supabase → M2 Auth+invites → M4/M5/M6.

**M-fast progress: 7/14 done.** In order:
- F-T000 POC (style picker)
- F-T001 shared utilities (exif / image / hash / seed)
- F-T002 Zustand root store + 6 domain hooks + IndexedDB
- F-T003 "Your work." dashboard
- F-T004 workspace 3-column shell (spine + canvas + drawers)
- F-P001 mode switcher + `<HtmlModeAttr />`
- F-P005 legacy CSS merged into globals.css

**Next eligible (TODO, no unmet blockers):**
- F-T005 stop editor (flesh out the placeholders in `web/components/studio/stop-canvas.tsx` — real title input, paragraph editor for body blocks, hero image upload flow using the `prepareImage` helper from F-T001)
- F-P002 MapLibre atlas with mode-aware tiles
- F-P003 / F-P004 PDF + PNG export (will integrate with F-T006 postcard editor)
- housekeeping: migrate scaffold `studio-pages.tsx` + `public-pages.tsx` off `DemoStoreProvider`, then delete `web/providers/*` + `web/lib/media-provider.ts` + `web/lib/seed-data.ts` + `web/lib/types.ts` (see audit map in project memory)

## How to keep moving

1. `tasks/STATE.md` — authoritative. Check "Eligible next tasks".
2. `tasks/AGENTS.md` — the protocol. Claim a task by editing its frontmatter to `IN_PROGRESS`, append a LOG.md line, do the work, update `Trace`, mark DONE.
3. `tasks/PARALLELISM.md` — subagent rules. Three concurrent subagents is the proven upper bound (main + 2 background via `Agent` tool with `run_in_background: true`). Check `touches:` arrays for overlap.
4. `tasks/LOG.md` — append-only event history, newest at the bottom.

## Things a fresh session must NOT regress (latent bug classes)

- **Zustand selectors returning fresh object literals MUST use `useShallow`**. Otherwise "Maximum update depth exceeded" on mount. All existing `use*Actions()` hooks already do this; keep it when adding new ones. See `web/stores/project.ts` for the pattern.
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
- `npm` deps added so far (in addition to scaffold): `zustand`, `exifr`, `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`. No more without asking the user.
- Product name "London Cuts" is a placeholder; owner hasn't picked final yet — keep it for now.

## Open decisions NOT YET made (watch for these in the next conversation)

- Product rename (just keep placeholder until the user decides)
- Dead-code deletion timing (migrate scaffold pages first)
- Seed data: should Reykjavík/SE1 both stay as permanent demos, or should new users start with an empty project? (Currently SE1 is current + Reykjavík is archived.)
- Bundle-size analyzer run (not needed until M6)
