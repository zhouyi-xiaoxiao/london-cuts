# M1 — Supabase & data model

**⏸ Status:** POSTPONED (per plan v2.0, 2026-04-20). M-fast runs first.

This milestone will swap `lib/storage.ts` from its M-fast localStorage+IndexedDB impl to Supabase-backed persistence. The data model in `docs/data-model.md` is still the target. Do not start this milestone until the user explicitly approves coming back to it.

**Goal:** Supabase project provisioned, schema + RLS applied, `lib/storage.ts` fully implemented. Typed, RLS-protected data access across the app.
**Exit criteria:**
- Supabase project created and linked to `web/`
- All tables from `docs/data-model.md` exist in the DB
- RLS policies enforced and verified
- `lib/storage.ts` returns real data for `createProject` / `listProjects` / `getProject`
- Storage bucket `assets` exists with correct policies
- TS types auto-generated from the live schema

## Tasks (expanded in M0-P007)

| ID | Title | Kind | Blocked by |
|----|-------|------|------------|
| M1-T001 | Create Supabase project (owner action + agent scaffold) | critical | M0 done |
| M1-T002 | Initial schema migration (all tables) | critical | M1-T001 |
| M1-T003 | RLS policies migration | critical | M1-T002 |
| M1-T004 | Create `assets` Storage bucket + RLS | parallel | M1-T001 |
| M1-T005 | Implement `lib/storage.ts` (real CRUD) | critical | M1-T002, M1-T003 |
| M1-P001 | Generate TS types from schema | parallel | M1-T002 |
| M1-P002 | Seed data script | parallel | M1-T002 |
| M1-P003 | Replace `lib/env.ts` stub with Zod validation | parallel | M0-P002 |

## Owner checkpoint

After M1:
- Owner opens Supabase Dashboard → Table Editor, confirms all tables are present
- Owner runs `cd web && pnpm dev`, logs in manually (test user), creates a project in UI or via API route, verifies row appears in `projects` table in Dashboard
- Owner verifies a private project cannot be read by a different user (RLS sanity check)

Then approve M2 start.

## Notes

- `M1-T001` has steps only the owner can execute (project creation, key retrieval). Agent scaffolds files and provides checklist; owner runs it.
- Don't apply migrations against production. Use a local Supabase (via Docker) or the hosted project's Dev branch until M6.
