# STATE — Project Status Snapshot

**Last updated:** 2026-04-21T00:30Z

## Plan version

**Plan v2.1** (see `docs/implementation-plan.md`): features-first, time estimates removed. M0 complete → M-fast in progress. M1–M6 postponed. M3 superseded by M-fast.

## Summary

| Milestone | TODO | IN_PROGRESS | DONE | BLOCKED | Total | Status |
|-----------|------|-------------|------|---------|-------|--------|
| M0 Consolidation        | 0  | 0 | 9 | 0 | 9  | ✅ **complete** |
| **M-fast Feature port** | 11 | 0 | 3 | 0 | 14 | **active** ⭐ |
| M-preview Soft launch   | —  | — | — | — | —  | after M-fast |
| M1 Supabase & data      | 8  | 0 | 0 | 0 | 8  | ⏸ postponed |
| M2 Auth & invites       | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M3 Feature parity       | 13 | 0 | 0 | 0 | 13 | 🗄 superseded by M-fast |
| M4 Public pages         | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M5 Observability        | 6  | 0 | 0 | 0 | 6  | ⏸ postponed |
| M6 Launch               | 9  | 0 | 0 | 0 | 9  | ⏸ postponed |

## Eligible next tasks (TODO with no unmet blockers)

- **F-T002** — Split legacy `store.jsx` into domain stores (critical, unblocks most of the rest of M-fast)
- No parallel-safe tasks currently unblocked until F-T002 completes — F-P001/P002/P003/P004 all depend on stores or postcard editor

## In progress

_none_

## Blocked

_none_

## Recently completed

- **F-P005** (2026-04-21T00:30Z) — Legacy CSS merged into web/app/globals.css (444 → 775 lines). Ran in parallel via subagent under PARALLELISM.md protocol. Verified no regressions.
- **F-T001** (2026-04-21T00:30Z) — Shared utilities ported: web/lib/utils/{exif,image,hash}.ts + web/lib/seed.ts. Added `exifr` dep. Found + fixed cream-on-cream StylePicker bug via Preview MCP.
- **F-T000** (2026-04-20T03:10Z) — POC: StylePicker ported, `/poc` page live
- **M0-P007** (2026-04-20T02:40Z) — Expanded M-fast: 14 task files written
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
