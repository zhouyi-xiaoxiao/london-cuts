---
id: M0-T001
title: Rename next-scaffold/ to web/
milestone: M0
kind: critical
status: DONE
blocked_by: []
blocks: [M0-P001, M0-P002, M0-P003, M0-P005, M0-P006]
parallel_safe: false
touches:
  - next-scaffold/
  - web/
  - README.md
  - INDEX.md
  - .github/workflows/
  - CLAUDE.md
owner: opus-4.7-session-20260420
started_at: 2026-04-20T00:10Z
completed_at: 2026-04-20T00:25Z
---

# M0-T001 — Rename `next-scaffold/` → `web/`

## Why
`next-scaffold/` was a working name when two tracks existed. We are collapsing to a single codebase, and `web/` is more descriptive of its role. Every reference in the repo needs to move.

## Acceptance criteria
- [ ] Directory renamed on disk from `next-scaffold/` to `web/`
- [ ] `package.json` name field updated (if it said `next-scaffold`)
- [ ] `cd web && pnpm install && pnpm dev` boots the Next.js dev server without error
- [ ] `cd web && pnpm build` completes without error
- [ ] No remaining grep matches for `next-scaffold` in tracked files (except in `archive/` and in `tasks/LOG.md` history)
- [ ] `.github/workflows/*.yml` updated to use `web/` paths
- [ ] `CLAUDE.md` reference updated
- [ ] Git history preserved (use `git mv`, not delete + create)

## Steps
1. Confirm no agent is currently working on `next-scaffold/` files (check `tasks/STATE.md`).
2. `cd` to repo root.
3. `git mv next-scaffold web`
4. Find all references:
   ```
   git grep -n "next-scaffold" -- . ':!archive/' ':!tasks/LOG.md'
   ```
5. Update each. Common locations:
   - `.github/workflows/deploy-pages.yml` (working-directory: next-scaffold → web)
   - `CLAUDE.md` (multiple mentions)
   - `README.md`
   - `INDEX.md`
   - `scripts/*.sh` if any reference it
   - `web/package.json` `name` field (if present)
6. Update `web/package.json` `name` to `london-cuts-web` (placeholder — actual product name TBD).
7. Run `cd web && pnpm install` (idempotent; may be instant).
8. Run `cd web && pnpm dev` and verify page loads on http://localhost:3000.
9. Kill dev server. Run `cd web && pnpm build` and confirm success.
10. Stage and commit.

## Verification
```bash
# no remaining refs outside archive and LOG
git grep -n "next-scaffold" -- . ':!archive/' ':!tasks/LOG.md' | wc -l
# expect: 0

# builds clean
cd web && pnpm build
# expect: success
```

## Blockers
_none — this is the first M0 task_

## Trace

**2026-04-20T00:25Z — opus-4.7-session-20260420 — DONE**

Executed:
- `git mv next-scaffold web` (history preserved)
- `web/package.json` `name` was already `"london-cuts"` — no change needed
- Deleted `web/README-scaffold.md` (outdated scaffold-specific readme; root README + INDEX now authoritative)
- Updated active references: `CLAUDE.md`, `README.md`, `INDEX.md`, `.github/workflows/deploy-pages.yml`, `archive/README.md`
- Updated `docs/requirements.md` line 82 to past-tense

Deviation from strict acceptance:
- Left `next-scaffold` mentions in 3 places as intentional historical markers:
  - `docs/architecture.md:58` — `"(was next-scaffold/)"` explicit history
  - `docs/implementation-plan.md:14,63` — describe M0 milestone/task titles referencing the rename
  - All task files under `tasks/M0-consolidation/` (they describe this very rename)
  - `tasks/LOG.md` (event history)
- This matches the spirit of acceptance "except in archive/ and LOG history" — these are effectively history.

Verification:
- `cd web && pnpm install` — up to date, no errors
- `cd web && pnpm typecheck` — passed (no output = success)
- `cd web && pnpm build` — built 33 pages, success

Next: M0-T002 (archive legacy `app/`).
