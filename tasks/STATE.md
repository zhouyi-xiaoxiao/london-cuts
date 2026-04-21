# STATE — Project Status Snapshot

**Last updated:** 2026-04-21T04:40Z

## Plan version

**Plan v2.1** (see `docs/implementation-plan.md`): features-first, time estimates removed. M0 complete → M-fast in progress. M1–M6 postponed. M3 superseded by M-fast.

## Summary

| Milestone | TODO | IN_PROGRESS | DONE | BLOCKED | Total | Status |
|-----------|------|-------------|------|---------|-------|--------|
| M0 Consolidation        | 0  | 0 | 9  | 0 | 9  | ✅ **complete** |
| **M-fast Feature port** | 2  | 0 | 12 | 0 | 14 | **active** ⭐ (12/14) |
| M-preview Soft launch   | —  | — | — | — | —  | after M-fast |
| M1 Supabase & data      | 8  | 0 | 0 | 0 | 8  | ⏸ postponed |
| M2 Auth & invites       | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M3 Feature parity       | 13 | 0 | 0 | 0 | 13 | 🗄 superseded by M-fast |
| M4 Public pages         | 10 | 0 | 0 | 0 | 10 | ⏸ postponed |
| M5 Observability        | 6  | 0 | 0 | 0 | 6  | ⏸ postponed |
| M6 Launch               | 9  | 0 | 0 | 0 | 9  | ⏸ postponed |

## Eligible next tasks (TODO with no unmet blockers)

- **F-T007** — Vision pipeline (folder upload → GPT-4o describe → auto-create stops). Uses existing ai-provider seam + new server route.
- **F-T008** — Publish flow (pre-flight checklist + visibility chooser + publish action).
- **F-T009** — Public project page + atlas page (readers, no auth).

## In progress

_none_

## Blocked

_none_

## Recently completed

- **F-T006** (2026-04-21T04:40Z) — Postcard editor: 3D flip card + 6-style picker + orientation toggle + generate flow via /api/ai/generate + variants carousel + prominent PNG/PDF buttons. Pipeline proven with real OpenAI call ($0.02, watercolour of an SE1 seed photo). Mock mode default; real mode behind AI_PROVIDER_MOCK=false + OPENAI_SPEND_CAP_CENTS=800.
- **F-P003** (2026-04-21T04:30Z) — PDF export via jspdf@4.2.1. 4 tests.
- **F-P004** (2026-04-21T04:30Z) — PNG export via html-to-image (2× pixel density). 9 tests. Buttons consumed by postcard editor as PROMINENT top-bar actions per task.
- **F-T005** (2026-04-21T03:50Z) — Stop editor fleshed out.
- **F-P002** (2026-04-21T03:50Z) — MapLibre atlas.
- **F-T004** (2026-04-21T03:10Z) — Workspace shell.
- **housekeeping: scaffold dead code** (2026-04-21T04:00Z) — providers/ deleted, layout simplified.
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
