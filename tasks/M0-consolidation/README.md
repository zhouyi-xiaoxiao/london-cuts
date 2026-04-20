# M0 — Consolidation

**Goal:** One clean codebase in `web/`. Seam files exist. Legacy archived. Docs aligned.
**Exit criteria:**
- `web/` directory exists and builds (`cd web && pnpm install && pnpm build` succeeds).
- `app/` is moved to `archive/app-html-prototype-2026-04-20/` and untouched afterward.
- Seam files exist in `web/lib/` (as stubs or first pass — real implementation is M1+).
- `CLAUDE.md`, `README.md`, `INDEX.md` describe the single-track layout.
- `docs/` is authoritative and referenced from `CLAUDE.md`.

## Tasks

| ID | Title | Kind | Blocked by |
|----|-------|------|------------|
| M0-T001 | Rename `next-scaffold/` → `web/` | critical | — |
| M0-T002 | Archive legacy `app/` | critical | — |
| M0-P001 | Create seam file stubs | parallel | M0-T001 |
| M0-P002 | Create `web/.env.example` | parallel | M0-T001 |
| M0-P003 | Update `web/next.config.ts` for production | parallel | M0-T001 |
| M0-P004 | Update `CLAUDE.md` to single-track | parallel | — |
| M0-P005 | Update `README.md` and `INDEX.md` | parallel | M0-T001, M0-T002 |
| M0-P006 | Create `web/supabase/migrations/` directory | parallel | M0-T001 |
| M0-P007 | Add `tasks/M1-*` stub task files | parallel | — |

## Order of play (single-agent)

1. M0-P004 (doc update, no blockers)
2. M0-T001 (the rename)
3. M0-T002 (the archive)
4. Fan out M0-P001..P006 in parallel
5. M0-P005 last (needs the rename + archive visible)

## Parallel plan (3 agents)

- **Agent A (sequential path):** M0-P004 → M0-T001 → M0-T002 → M0-P005
- **Agent B (blocked until T001 done):** M0-P001 (seam stubs) then M0-P002 (env)
- **Agent C (blocked until T001 done):** M0-P003 (next config) then M0-P006 (migrations dir) then M0-P007 (M1 stubs)

## Owner checkpoint

After M0 completes, the owner runs:
```bash
cd web && pnpm install && pnpm dev
```
Visit http://localhost:3000 and confirm the app loads. Then approve moving to M1.
