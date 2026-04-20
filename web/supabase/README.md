# Supabase

Database schema, migrations, and seed data for the London Cuts web app.

**Current status (plan v2.0):** M1 (Supabase wiring) is postponed until after M-fast and M-preview. This directory is scaffolded but empty. When M1 resumes, migrations land here.

## Layout (target)

- `migrations/` — SQL migration files, ordered by timestamp prefix
- `seed.sql` — seed data for local development (not run in production)
- `config.toml` — Supabase CLI config (created when linking a project in M1-T001)

## Conventions

- File names: `YYYYMMDDHHMMSS_<slug>.sql`
- Never edit an applied migration; always add a new one
- Every schema change reflected here must be reflected in `../../docs/data-model.md`

## Applying migrations (once M1 starts)

Local (with Supabase CLI):
```bash
cd web && pnpm supabase db push
```

Remote (production — only the owner runs this):
```bash
cd web && pnpm supabase db push --linked
```

## Generating types (once M1 starts)

After schema changes, regenerate TS types:
```bash
cd web && pnpm supabase gen types typescript --linked > types/database.generated.ts
```
