# STATE — Project Status Snapshot

**Last updated:** 2026-04-20T01:30Z

## Plan version

**Plan v2.0** (see `docs/implementation-plan.md`): re-ordered to features-first. M1 / M2 / M3 / M4 / M6 are now **postponed** until M-fast + M-preview complete and owner approves moving on. M3 is superseded by M-fast.

## Summary

| Milestone | TODO | IN_PROGRESS | DONE | BLOCKED | Total | Status |
|-----------|------|-------------|------|---------|-------|--------|
| M0 Consolidation        | 6  | 0 | 3 | 0 | 9  | in progress |
| **M-fast Feature port** | 14 | 0 | 0 | 0 | 14 | **next** ⭐ |
| M-preview Soft launch   | —  | — | — | — | —  | after M-fast |
| M1 Supabase & data      | 8  | 0 | 0 | 0 | 8  | ⏸ postponed |
| M2 Auth & invites       | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M3 Feature parity       | 13 | 0 | 0 | 0 | 13 | 🗄 superseded by M-fast |
| M4 Public pages         | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M5 Observability        | 6  | 0 | 0 | 0 | 6  | ⏸ postponed |
| M6 Launch               | 9  | 0 | 0 | 0 | 9  | ⏸ postponed |

## Active pipeline: M0 → M-fast → M-preview

## Eligible next tasks (TODO with no unmet blockers)

- **M0-P001** — Create seam file stubs (parallel)
- **M0-P002** — Create `web/.env.example` (parallel)
- **M0-P004** — Finish CLAUDE.md updates (parallel)
- **M0-P005** — Rewrite README.md + INDEX.md properly (parallel)
- **M0-P006** — Create `web/supabase/migrations/` (parallel; minimal scope since M1 is deferred)
- **M0-P007** — Expand M-fast task files (parallel; was "expand M1", redirected)

## In progress

_none (awaiting owner checkpoint before resuming)_

## Blocked

_none_

## Recently completed

- **M0-P003** (2026-04-20T01:15Z) — Rewrote next.config.ts (removed GitHub Pages static export), deleted deploy-pages.yml, dev server now serves `/` cleanly
- **M0-T002** (2026-04-20T00:50Z) — app/ → archive/app-html-prototype-2026-04-20; legacy scripts moved; WHY-ARCHIVED written; build green
- **M0-T001** (2026-04-20T00:25Z) — Rename next-scaffold → web; build/typecheck green

## Active sessions

_none_

## Notes

- Task files exist only for M0 in full detail; M1–M6 have stubs in their milestone READMEs. As M0 completes, expand M1 tasks; as M1 completes, expand M2; etc. This keeps the work-ahead focused and easy to re-prioritise.
- The owner is managing invite codes manually via Supabase Dashboard in beta; no admin UI in scope for M0–M6.

## How to update this file

After claiming or completing a task, adjust the counts and move task lines between sections. Keep the format stable — another agent will parse it.
