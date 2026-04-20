---
id: M0-P007
title: Write detailed M1 task files (unblock M1 kickoff)
milestone: M0
kind: parallel
status: TODO
blocked_by: []
blocks: []
parallel_safe: true
touches:
  - tasks/M1-supabase-data/
owner: null
started_at: null
completed_at: null
---

# M0-P007 — Write detailed M1 task files (unblock M1 kickoff)

## Why
The milestone README for M1 exists, but individual task files are stubs. When M0 finishes, the next agent should be able to open M1-T001 and start immediately. This task expands M1 from a stub into executable detail, matching the M0 format.

Only M1 needs full detail right now. M2–M6 can stay high-level in their milestone READMEs; we expand each one just before starting it (avoids wasted work if requirements shift).

## Acceptance criteria
- [ ] Each M1 task from `docs/implementation-plan.md#m1-supabase--data` has its own `M1-T00X-*.md` or `M1-P00X-*.md` file
- [ ] Each file uses the same YAML frontmatter + sections as M0 task files
- [ ] `blocked_by` fields accurately reflect dependencies
- [ ] `touches` fields list concrete paths
- [ ] `parallel_safe` is honest (false for anything touching shared migrations file)
- [ ] Updated `tasks/STATE.md` counts reflect the new M1 files (they were already counted in STATE.md as 8, confirm they match)
- [ ] Added a log line to `tasks/LOG.md`

## M1 task list (from implementation-plan.md)

Create these files:

| File | kind |
|------|------|
| `M1-T001-create-supabase-project.md` | critical (mostly owner action — has manual steps) |
| `M1-T002-initial-schema-migration.md` | critical |
| `M1-T003-rls-policies-migration.md` | critical (depends on T002) |
| `M1-T004-storage-bucket.md` | parallel (after T001) |
| `M1-T005-implement-storage-lib.md` | critical (depends on T002, T003) |
| `M1-P001-generate-db-types.md` | parallel (after T002) |
| `M1-P002-seed-script.md` | parallel (after T002) |
| `M1-P003-env-zod-validation.md` | parallel (after M0-P002) |

## Steps

For each file, follow the M0 format. Use `docs/data-model.md` as ground truth for SQL.

### Guidance for M1-T001 (Supabase project creation)
Has manual steps the human must do:
- Create project at https://supabase.com/dashboard
- Record project ref
- Save keys to local `.env.local` and to Vercel env (Vercel config happens in M6)
- Run `pnpm supabase init` and `pnpm supabase link --project-ref <ref>` inside `web/`

Document clearly what the agent can do vs what the human must do.

### Guidance for M1-T002 (initial schema)
Write a single migration file:
`web/supabase/migrations/YYYYMMDDHHMMSS_initial_schema.sql`

Content: every `create table` from `docs/data-model.md` section 2, plus enums, plus `updated_at` trigger function, plus indexes.

Do NOT include RLS policies here — that's T003.

### Guidance for M1-T003 (RLS policies)
Second migration file:
`web/supabase/migrations/YYYYMMDDHHMMSS_rls_policies.sql`

Content: `alter table ... enable row level security;` + every `create policy` from `docs/data-model.md` section 3.

### Guidance for M1-T004 (Storage bucket)
SQL snippet to create the `assets` bucket + RLS policies for it. Can be a migration file or a config.toml change. Match Supabase CLI conventions.

### Guidance for M1-T005 (storage.ts)
Implement every function in `web/lib/storage.ts` (currently stubs from M0-P001). Use `@supabase/supabase-js` via a singleton client. Split into multiple files if the single file exceeds 400 lines:
- `web/lib/storage.ts` (barrel re-exports)
- `web/lib/storage/projects.ts`
- `web/lib/storage/stops.ts`
- `web/lib/storage/postcards.ts`
- `web/lib/storage/assets.ts`
- `web/lib/storage/client.ts` (singleton Supabase client)

### Guidance for M1-P001 (types)
Run `pnpm supabase gen types typescript --linked > types/database.generated.ts`. Commit the generated file. Add a script entry to `web/package.json`:
```json
"scripts": {
  "db:types": "supabase gen types typescript --linked > types/database.generated.ts"
}
```

### Guidance for M1-P002 (seed)
Populate `web/supabase/seed.sql` with:
- 1 admin profile row (for the owner)
- 3 invite codes for local dev
- 1 public sample project with 2 stops and postcards

### Guidance for M1-P003 (env validation)
Replace the `web/lib/env.ts` stub with a Zod schema that:
- Requires production vars in production
- Warns on missing dev vars
- Exports the validated `env` typed object

## Verification
```bash
ls tasks/M1-supabase-data/ | wc -l
# expect: 9 (README + 8 task files)
```

## Trace
