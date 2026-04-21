# STATE — Project Status Snapshot

**Last updated:** 2026-04-21T03:10Z

## Plan version

**Plan v2.1** (see `docs/implementation-plan.md`): features-first, time estimates removed. M0 complete → M-fast in progress. M1–M6 postponed. M3 superseded by M-fast.

## Summary

| Milestone | TODO | IN_PROGRESS | DONE | BLOCKED | Total | Status |
|-----------|------|-------------|------|---------|-------|--------|
| M0 Consolidation        | 0  | 0 | 9 | 0 | 9  | ✅ **complete** |
| **M-fast Feature port** | 7  | 0 | 7 | 0 | 14 | **active** ⭐ (halfway) |
| M-preview Soft launch   | —  | — | — | — | —  | after M-fast |
| M1 Supabase & data      | 8  | 0 | 0 | 0 | 8  | ⏸ postponed |
| M2 Auth & invites       | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M3 Feature parity       | 13 | 0 | 0 | 0 | 13 | 🗄 superseded by M-fast |
| M4 Public pages         | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M5 Observability        | 6  | 0 | 0 | 0 | 6  | ⏸ postponed |
| M6 Launch               | 9  | 0 | 0 | 0 | 9  | ⏸ postponed |

## Eligible next tasks (TODO with no unmet blockers)

- **F-T005** — Stop editor (metadata form + body blocks editor + hero image upload with EXIF) — critical, unlocks F-T006
- **F-P002** — MapLibre atlas with mode-aware tiles — parallel-safe
- **F-P003** — PDF export (jspdf) — parallel-safe (depends on F-T006 for postcard component, but scaffolding can start)
- Dead-code migration (housekeeping): migrate scaffold `studio-pages.tsx` + `public-pages.tsx` off `DemoStoreProvider`, then delete scaffold providers. See audit map in project memory.

## In progress

_none_

## Blocked

_none_

## Recently completed

- **F-T004** (2026-04-21T03:10Z) — Workspace 3-column shell + spine (keyboard-nav) + canvas + drawers; Reykjavík seed demo wired into archive. 5 new tests (23/23). Mobile subagent fixed dashboard + CSS at 390px.
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
