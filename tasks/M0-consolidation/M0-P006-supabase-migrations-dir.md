---
id: M0-P006
title: Create web/supabase/migrations/ directory skeleton
milestone: M0
kind: parallel
status: TODO
blocked_by: [M0-T001]
blocks: [M1-T002, M1-T003]
parallel_safe: true
touches:
  - web/supabase/
owner: null
started_at: null
completed_at: null
---

# M0-P006 — Create `web/supabase/migrations/` directory skeleton

## Why
All SQL migrations live under `web/supabase/migrations/` (Supabase CLI convention). Creating the directory in M0 means M1 can start writing migrations immediately without scaffolding decisions.

## Acceptance criteria
- [ ] `web/supabase/` directory exists
- [ ] `web/supabase/migrations/` directory exists with a `.gitkeep` file
- [ ] `web/supabase/README.md` exists explaining the convention
- [ ] `web/supabase/seed.sql` exists as an empty stub with a header comment
- [ ] `web/supabase/config.toml` is **not** created yet (that comes in M1-T001 when the Supabase project is linked)

## Steps

### 1. Create directories and placeholder files
```bash
mkdir -p web/supabase/migrations
touch web/supabase/migrations/.gitkeep
```

### 2. Create `web/supabase/README.md`
```md
# Supabase

Database schema, migrations, and seed data for the London Cuts web app.

## Layout

- `migrations/` — SQL migration files, ordered by timestamp prefix
- `seed.sql` — seed data for local development (not run in production)
- `config.toml` — Supabase CLI config (created when linking a project in M1-T001)

## Conventions

- File names: `YYYYMMDDHHMMSS_<slug>.sql`
- Never edit an applied migration; always add a new one
- Every schema change reflected here must be reflected in `docs/data-model.md`

## Applying migrations

Local (with Supabase CLI):
```
cd web && pnpm supabase db push
```

Remote (production — only the owner runs this):
```
cd web && pnpm supabase db push --linked
```

## Generating types

After schema changes, regenerate TS types:
```
cd web && pnpm supabase gen types typescript --linked > types/database.generated.ts
```
See task M1-P001.
```

### 3. Create `web/supabase/seed.sql`
```sql
-- Seed data for local development only.
-- Do NOT apply in production.
-- Populated in M1-P002.

-- Example (fill in real content in M1-P002):
-- insert into profiles (user_id, handle, display_name) values (...);
```

## Verification
```bash
test -d web/supabase/migrations && echo OK
test -f web/supabase/README.md && echo OK
test -f web/supabase/seed.sql && echo OK
```

## Trace
