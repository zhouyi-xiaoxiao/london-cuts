# STATE — Project Status Snapshot

**Last updated:** 2026-04-21T01:45Z

## Plan version

**Plan v2.1** (see `docs/implementation-plan.md`): features-first, time estimates removed. M0 complete → M-fast in progress. M1–M6 postponed. M3 superseded by M-fast.

## Summary

| Milestone | TODO | IN_PROGRESS | DONE | BLOCKED | Total | Status |
|-----------|------|-------------|------|---------|-------|--------|
| M0 Consolidation        | 0  | 0 | 9 | 0 | 9  | ✅ **complete** |
| **M-fast Feature port** | 10 | 0 | 4 | 0 | 14 | **active** ⭐ |
| M-preview Soft launch   | —  | — | — | — | —  | after M-fast |
| M1 Supabase & data      | 8  | 0 | 0 | 0 | 8  | ⏸ postponed |
| M2 Auth & invites       | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M3 Feature parity       | 13 | 0 | 0 | 0 | 13 | 🗄 superseded by M-fast |
| M4 Public pages         | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M5 Observability        | 6  | 0 | 0 | 0 | 6  | ⏸ postponed |
| M6 Launch               | 9  | 0 | 0 | 0 | 9  | ⏸ postponed |

## Eligible next tasks (TODO with no unmet blockers)

F-T002 is done → 3 downstream tasks unblock:

- **F-T003** — Port projects dashboard ("Your work." screen) — critical, uses stores
- **F-T004** — Port workspace three-column layout — critical, uses stores
- **F-P001** — Port mode switcher (Fashion / Punk / Cinema) — parallel-safe

## In progress

_none_

## Blocked

_none_

## Recently completed

- **F-T002** (2026-04-21T01:45Z) — Split legacy store.jsx into Zustand + 6 domain hook files (types/root/idb/project/stop/postcard/asset/mode/ui). Seam storage.ts fully impl'd. 8 new tests green (13 total). Defensive safeLocalStorage shim fixed jsdom flakiness.
- **F-P005** (2026-04-21T00:30Z) — Legacy CSS merged into web/app/globals.css (444 → 775 lines)
- **F-T001** (2026-04-21T00:30Z) — Shared utilities ported: web/lib/utils/{exif,image,hash}.ts + web/lib/seed.ts
- **F-T000** (2026-04-20T03:10Z) — POC: StylePicker ported, `/poc` page live
- **housekeeping** (2026-04-21T01:30Z) — Vitest set up (subagent), pre-commit hook (subagent)
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
