# Data Model

**Audience:** Anyone making DB-related changes.
**Read alongside:** `docs/architecture.md`, `docs/requirements.md`.

All SQL lives in `web/supabase/migrations/` after M1. This document describes the shape and rules.

---

## 1. Conventions

Every business table includes:

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` primary key | default `gen_random_uuid()` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, bumped via trigger |
| `deleted_at` | `timestamptz` nullable | soft delete marker |
| `owner_id` | `uuid` (where applicable) | FK → `auth.users(id)` |

**Deletes are always soft** (`update ... set deleted_at = now()`). Hard delete only via admin job for GDPR requests.

## 2. Tables

### `auth.users` (managed by Supabase)
Supabase-provided: `id`, `email`, `created_at`, `last_sign_in_at`, etc. Don't touch directly.

### `profiles`
One row per user, app-side metadata.

```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_-]{2,32}$'),
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

- `handle` is the URL-facing username (`/yx/my-trip`)
- Lowercase, alphanumeric, underscore, hyphen, 2–32 chars
- Created on first login via trigger or server action

### `invites`
Admin-issued invitation codes.

```sql
create table invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) >= 8),
  created_by uuid references auth.users(id),
  expires_at timestamptz,
  max_uses int not null default 1,
  used_count int not null default 0,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index on invites (code) where deleted_at is null;
```

### `invite_uses`
Audit trail of who used which code.

```sql
create table invite_uses (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references invites(id),
  user_id uuid not null references auth.users(id),
  used_at timestamptz default now(),
  unique (invite_id, user_id)
);
```

### `projects`
A single-location trip / story.

```sql
create type project_status as enum ('draft', 'published');
create type project_visibility as enum ('public', 'unlisted', 'private');
create type narrative_mode as enum ('fashion', 'punk', 'cinema');

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  slug text not null,
  title text not null,
  subtitle text,
  location_name text,
  default_mode narrative_mode not null default 'fashion',
  status project_status not null default 'draft',
  visibility project_visibility not null default 'public',
  cover_asset_id uuid references assets(id),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique (owner_id, slug)
);

create index on projects (owner_id) where deleted_at is null;
create index on projects (status, visibility) where deleted_at is null;
```

- URL: `/<profile.handle>/<project.slug>`
- `slug` auto-derived from `title`, editable, unique per owner
- Published projects: `status='published' AND published_at IS NOT NULL`

### `stops`
Ordered stops within a project (one "scene" of the trip).

```sql
create table stops (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  order_index int not null,
  title text,
  body text,
  time_label text,
  mood text,
  tone text,
  lat double precision,
  lng double precision,
  hero_asset_id uuid references assets(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique (project_id, order_index) deferrable initially deferred
);

create index on stops (project_id) where deleted_at is null;
```

- `order_index` is sparse (10, 20, 30…) to allow cheap reorders
- Use `deferrable initially deferred` for bulk reorders in a transaction

### `postcards`
One postcard per stop (front + back).

```sql
create type postcard_orientation as enum ('portrait', 'landscape');
create type postcard_style as enum (
  'watercolour', 'vintage_poster', 'risograph',
  'ink_watercolour', 'anime', 'art_nouveau'
);

create table postcards (
  id uuid primary key default gen_random_uuid(),
  stop_id uuid not null references stops(id),
  front_asset_id uuid references assets(id),
  back_text text,
  recipient_name text,
  recipient_address text,
  style postcard_style,
  orientation postcard_orientation not null default 'portrait',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

### `assets`
Every image (uploaded or AI-generated) referenced by projects.

```sql
create type asset_kind as enum ('photo', 'generated', 'postcard_export');

create table assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  project_id uuid references projects(id),
  kind asset_kind not null,
  storage_path text not null,
  mime text,
  width int,
  height int,
  bytes bigint,
  exif_json jsonb,
  source_asset_id uuid references assets(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index on assets (owner_id) where deleted_at is null;
create index on assets (project_id) where deleted_at is null;
```

- `storage_path` = key in Supabase Storage bucket `assets`
- `source_asset_id` links a generated image back to the source photo

### `ai_generations`
Every OpenAI call, for cost tracking + caching.

```sql
create type ai_generation_status as enum ('pending', 'success', 'failed');

create table ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  source_asset_id uuid references assets(id),
  result_asset_id uuid references assets(id),
  style postcard_style,
  prompt text,
  cache_key text,
  cost_cents int,
  status ai_generation_status not null default 'pending',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index on ai_generations (user_id, created_at);
create index on ai_generations (cache_key) where status = 'success';
```

- `cache_key = sha256(source_asset.hash || style)` — a cache hit reuses `result_asset_id`

### `daily_quotas`
Per-user daily counter for AI calls.

```sql
create table daily_quotas (
  user_id uuid not null references auth.users(id),
  date date not null,
  ai_calls_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, date)
);
```

- Increment in the same transaction as the AI call
- Reset naturally via per-day rows

### `feedback`
Simple feedback from users or guests.

```sql
create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  email text,
  message text not null,
  page_url text,
  created_at timestamptz default now()
);
```

- Either `user_id` or `email` must be present; enforce in app code

## 3. Row Level Security (RLS)

**RLS enabled on every business table.** Default policy: deny.

### `profiles`
- `select`: everyone (public handles are public)
- `update`: `auth.uid() = user_id`
- `insert`: handled by server on first login

### `invites`
- `select` / `insert` / `update`: service role only (admin via Dashboard)
- Edge function `verify-invite` runs with service role

### `projects`
- `select`: (visibility='public' AND deleted_at IS NULL) OR auth.uid() = owner_id
- `insert`: auth.uid() = owner_id
- `update` / `delete`: auth.uid() = owner_id

### `stops`, `postcards`, `assets`
- `select`: if parent project is public, OR auth.uid() owns the parent project
- `insert` / `update` / `delete`: auth.uid() owns the parent project

### `ai_generations`, `daily_quotas`
- `select` / `update`: auth.uid() = user_id
- `insert`: service role only (server-side write after AI call)

### `feedback`
- `insert`: anyone
- `select`: service role only

## 4. Storage buckets

Supabase Storage buckets (configured in M1):

| Bucket | Purpose | Access |
|--------|---------|--------|
| `assets` | User photos + AI output + exports | RLS: read if asset owner OR asset's project is public |

Path convention: `{owner_id}/{project_id}/{asset_id}.{ext}`.

## 5. Migrations

Every schema change is a new file under `web/supabase/migrations/` with timestamp prefix:
```
20260420120000_initial_schema.sql
20260421093000_add_project_tags.sql
```

Never edit an applied migration. Always add a new one.

## 6. Seed data

`web/supabase/seed.sql` sets up:
- Admin profile for owner
- A few demo invite codes (for local dev)
- A sample public project for UI testing

Not run in production.
