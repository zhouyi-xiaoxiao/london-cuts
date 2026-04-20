---
id: M0-T002
title: Archive legacy app/ HTML prototype
milestone: M0
kind: critical
status: DONE
blocked_by: []
blocks: [M0-P005]
parallel_safe: false
touches:
  - app/
  - archive/
  - scripts/
  - .github/workflows/
  - CLAUDE.md
  - README.md
  - INDEX.md
owner: opus-4.7-session-20260420
started_at: 2026-04-20T00:30Z
completed_at: 2026-04-20T00:50Z
---

# M0-T002 — Archive legacy `app/` HTML prototype

## Why
The HTML/UMD React prototype served its purpose: fast iteration and demos. From M0 onward, all feature work goes to `web/`. We preserve `app/` for reference (vision pipeline logic, postcard styles, store shape) but freeze it.

## Acceptance criteria
- [ ] `app/` directory moved to `archive/app-html-prototype-2026-04-20/`
- [ ] `git mv` used (history preserved)
- [ ] `scripts/START-LIVE-DEMO.command` updated or removed (it launches the old app)
- [ ] `scripts/deploy-phase-a.sh` updated or archived (it stages the old app)
- [ ] `.github/workflows/` has no references to `app/`
- [ ] `archive/README.md` updated to mention the new frozen directory
- [ ] An `archive/app-html-prototype-2026-04-20/WHY-ARCHIVED.md` explains why and what to reference

## Steps
1. `git mv app archive/app-html-prototype-2026-04-20`
2. Create `archive/app-html-prototype-2026-04-20/WHY-ARCHIVED.md` with content like:
   ```
   # Archived 2026-04-20

   This is the HTML + UMD React prototype that ran London Cuts before the M0 consolidation. Functionality lives in `web/` going forward. Do not edit this directory.

   Useful references (read-only):
   - src/vision-pipeline.jsx — GPT-4o vision flow
   - src/postcard-editor.jsx — 3D flip card + 6 postcard styles
   - src/store.jsx — original client state shape (see docs/data-model.md for target shape)
   - src/public-project.jsx — original public page layout
   ```
3. Update `archive/README.md`: add a line pointing to `app-html-prototype-2026-04-20/`.
4. Handle old deploy/launch scripts:
   - Option A (recommended): move `scripts/START-LIVE-DEMO.command` and `scripts/deploy-phase-a.sh` to `archive/app-html-prototype-2026-04-20/scripts/` since they are tied to the old app
   - Option B: delete them (they are in git history)
5. Grep for remaining `app/` references outside archive:
   ```
   git grep -nE '(^|[^a-z])app/' -- . ':!archive/' ':!web/' ':!tasks/'
   ```
   Update any real references (in CLAUDE.md, README, INDEX, docs/).
   Be careful: `/web/app/` is Next.js app-router; `src/app/` in other projects is common. Only fix references to the old root `app/`.
6. Commit.

## Verification
```bash
# Old app no longer at root
ls app 2>&1 | grep -q "No such"

# Archive path exists
test -d archive/app-html-prototype-2026-04-20

# No remaining refs to root 'app/' outside archive/web/tasks
git grep -n "^app/" -- . ':!archive/' ':!web/' ':!tasks/'
# expect: 0 results
```

## Trace

**2026-04-20T00:50Z — opus-4.7-session-20260420 — DONE**

Executed:
- `git mv app archive/app-html-prototype-2026-04-20` (history preserved)
- Moved app-tied scripts into archive: `scripts/START-LIVE-DEMO.command` and `scripts/deploy-phase-a.sh` → `archive/app-html-prototype-2026-04-20/scripts/`
- Wrote `archive/app-html-prototype-2026-04-20/WHY-ARCHIVED.md` with port reference table for M3
- Updated `archive/README.md` to list the new archived directory at the top
- Purged residual active `app/` refs:
  - `.gitignore`: `app/local-config.js` → `archive/app-html-prototype-*/local-config.js`
  - `README.md`: removed two-tracks mention, collapsed quick-start to `web/` only
  - `INDEX.md`: removed obsolete `## app/` section, updated conventions list

Deviation from strict acceptance:
- Remaining mentions of `app/` in `docs/SECURITY.md` (describes past incident) and inside `archive/app-html-prototype-2026-04-20/` (self-referential) — both intentional.
- Did not delete `.github/workflows/deploy-pages.yml` (M0-P003 owns that).

Verification:
- `cd web && pnpm build` — 33 pages built, success
- `ls app` → not found (confirmed moved)
- `ls archive/app-html-prototype-2026-04-20` → all legacy files present

Next: M0-P001 through M0-P007 (all parallel-safe now).
