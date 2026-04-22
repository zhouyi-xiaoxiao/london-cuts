-- 0001_initial.sql — M1 initial schema
--
-- Scope: M-fast domain only (projects, stops, postcards, assets) plus a
-- minimal `users` table that M2 will flesh out with auth providers, invites,
-- and quotas. Anything M2-only (invites, invite_uses, daily_quotas,
-- ai_generations, profiles handle policy details, feedback) is intentionally
-- left for a later migration.
--
-- Conventions (mirrors docs/data-model.md):
--   * UUID primary keys via gen_random_uuid()
--   * timestamptz created_at / updated_at; soft delete via deleted_at
--   * ON DELETE CASCADE on parent → child where the child has no meaning
--     without the parent (stops, postcards, assets all cascade off projects /
--     stops). Asset → project is SET NULL so loose user-pool assets survive.
--   * legacy_id text columns let the one-off localStorage→Supabase migration
--     preserve "se1-01"-style identifiers from M-fast seed data without
--     breaking referential integrity.
--   * All policies stubbed for the M1 baseline:
--       SELECT  → anyone may read published+public projects (and their
--                 children); owner reads everything they own.
--       INSERT/UPDATE/DELETE → owner-scoped (auth.uid() = owner_id) on
--                              projects; children defer to their parent.
--     M2 wires real Supabase Auth (magic link + invites) and tightens
--     these policies; for now an unauthenticated client gets read-only
--     access to public material and nothing else.

set search_path = public;

create extension if not exists "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────

create type narrative_mode as enum ('fashion', 'punk', 'cinema');

create type project_status as enum (
  'draft',
  'in_progress',
  'publishing',
  'published',
  'unlisted',
  'archived'
);

create type project_visibility as enum ('public', 'unlisted', 'private');

create type asset_kind as enum (
  'photo',
  'video',
  'voice',
  'text',
  'generated-image',
  'generated-video',
  'postcard-export'
);

create type asset_tone as enum ('warm', 'cool', 'dark', 'punk', 'neutral');

create type postcard_orientation as enum ('portrait', 'landscape');

-- Postcard style IDs are kept as text rather than an enum because the
-- F-T006 set is still evolving (currently:
-- illustration | poster | riso | inkwash | anime | artnouveau).
-- Migrate to an enum once the catalogue stabilises.

-- ─── Helpers ──────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── users ────────────────────────────────────────────────────────────
-- Minimal app-side user table. M2 expands this with display_name, avatar_url,
-- bio, etc. and links it to auth.users(id) via a trigger on first sign-in.
-- For M1 we keep an `auth_user_id` nullable so dev / migration scripts can
-- insert rows before Supabase Auth lands.

create table users (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique references auth.users(id) on delete cascade,
  handle          text not null unique check (handle ~ '^[a-z0-9_-]{2,32}$'),
  display_name    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

comment on table users is
  'App-side user row. One row per signed-in human. M1 stub — M2 attaches profile metadata, invites, quotas.';

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

create index users_handle_idx on users (handle) where deleted_at is null;

-- ─── assets ───────────────────────────────────────────────────────────
-- Every binary referenced by a project. `storage_path` is the key inside
-- Supabase Storage bucket `assets` (path convention:
-- {owner_id}/{project_id|"loose"}/{asset_id}.{ext}). We declare assets BEFORE
-- projects/stops because both reference assets via cover_asset_id /
-- hero_asset_id; circular FKs are handled with deferred constraints below.

create table assets (
  id              uuid primary key default gen_random_uuid(),
  legacy_id       text unique,                 -- e.g. "se1-01" from M-fast seed
  owner_id        uuid not null references users(id) on delete cascade,
  project_id      uuid,                         -- FK added later (circular)
  kind            asset_kind not null default 'photo',
  tone            asset_tone not null default 'neutral',
  storage_path    text not null,                -- key in Supabase Storage `assets`
  mime_type       text,
  width           int,
  height          int,
  bytes           bigint,
  label           text,
  caption         text,
  location        text,
  captured_at     timestamptz,
  exif_json       jsonb,
  source_asset_id uuid references assets(id) on delete set null,
  prompt          text,                         -- generated assets only
  revised_prompt  text,
  style_id        text,                         -- postcard style key, e.g. 'inkwash'
  generated_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

comment on table assets is
  'All photos, AI-generated images, postcard exports, and other binaries. Bytes live in Supabase Storage bucket `assets`; this row is the metadata index.';

create trigger assets_set_updated_at
  before update on assets
  for each row execute function set_updated_at();

create index assets_owner_idx   on assets (owner_id)   where deleted_at is null;
create index assets_project_idx on assets (project_id) where deleted_at is null;
create index assets_legacy_idx  on assets (legacy_id)  where legacy_id is not null;

-- ─── projects ─────────────────────────────────────────────────────────
-- A single trip / story. URL: /<users.handle>/<projects.slug>.

create table projects (
  id                uuid primary key default gen_random_uuid(),
  legacy_id         text unique,                  -- e.g. "seed-a-year-in-se1"
  owner_id          uuid not null references users(id) on delete cascade,
  slug              text not null,
  title             text not null,
  subtitle          text,
  description       text,
  cover_label       text,
  location_name     text,
  area              text,
  tags              text[] not null default '{}',
  default_mode      narrative_mode not null default 'fashion',
  status            project_status not null default 'draft',
  visibility        project_visibility not null default 'public',
  cover_asset_id    uuid references assets(id) on delete set null,
  duration_label    text,                          -- "48 min read"
  reads             int not null default 0,
  saves             int not null default 0,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (owner_id, slug)
);

comment on table projects is
  'A single-location trip/story. One owner, many stops. Public-readable when status=published AND visibility=public.';

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

create index projects_owner_idx       on projects (owner_id) where deleted_at is null;
create index projects_status_idx      on projects (status, visibility) where deleted_at is null;
create index projects_published_idx   on projects (published_at desc) where status = 'published' and deleted_at is null;
create index projects_legacy_idx      on projects (legacy_id) where legacy_id is not null;

-- Now wire assets.project_id back to projects(id) (circular FK pair).
-- ON DELETE SET NULL: a deleted project shouldn't nuke loose-pool assets
-- the user might want to re-attach elsewhere.
alter table assets
  add constraint assets_project_id_fkey
  foreign key (project_id) references projects(id) on delete set null;

-- ─── stops ────────────────────────────────────────────────────────────
-- Ordered scenes within a project. order_index is sparse (10, 20, 30…) to
-- allow cheap reorders. legacy_n preserves the "01".."12" key from M-fast.

create table stops (
  id                uuid primary key default gen_random_uuid(),
  legacy_id         text unique,                 -- e.g. "se1-stop-05" if needed
  project_id        uuid not null references projects(id) on delete cascade,
  legacy_n          text,                         -- e.g. "01" .. "12"
  order_index       int not null,
  slug              text,
  code              text,                         -- postcode / locale code
  title             text,
  place             text,
  time_label        text,                         -- "HH:MM" free-form
  mood              text,
  tone              asset_tone not null default 'neutral',
  display_label     text,                         -- "WATERLOO BR · DUSK"
  excerpt           text,
  story             text,                         -- denormalised plain text
  body_blocks       jsonb not null default '[]'::jsonb,
                                                  -- BodyBlock[] from web/lib/seed.ts
  status_json       jsonb not null default '{}'::jsonb,
                                                  -- {upload, hero, body, media}
  lat               double precision,
  lng               double precision,
  hero_asset_id     uuid references assets(id) on delete set null,
  asset_ids         uuid[] not null default '{}', -- ordered gallery refs
  generated_asset_ids uuid[] not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (project_id, order_index) deferrable initially deferred
);

comment on table stops is
  'Ordered scene within a project. body_blocks holds the structured BodyBlock[] from web/lib/seed.ts (paragraph, heroImage, pullQuote, etc.).';

create trigger stops_set_updated_at
  before update on stops
  for each row execute function set_updated_at();

create index stops_project_idx       on stops (project_id) where deleted_at is null;
create index stops_project_order_idx on stops (project_id, order_index) where deleted_at is null;
create index stops_legacy_idx        on stops (legacy_id) where legacy_id is not null;

-- ─── postcards ────────────────────────────────────────────────────────
-- One postcard per stop (front art + back text + recipient).

create table postcards (
  id                  uuid primary key default gen_random_uuid(),
  stop_id             uuid not null unique references stops(id) on delete cascade,
  front_asset_id      uuid references assets(id) on delete set null,
  back_message        text,
  recipient_name      text,
  recipient_line1     text,
  recipient_line2     text,
  recipient_country   text,
  style_id            text,                       -- postcard style key
  orientation         postcard_orientation not null default 'portrait',
  active_version_id   uuid,                       -- optional pointer; versions stay in app for now
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

comment on table postcards is
  'One postcard per stop: front art (AI-generated image asset) + back text + recipient. Style + orientation drive the F-T006 editor.';

create trigger postcards_set_updated_at
  before update on postcards
  for each row execute function set_updated_at();

create index postcards_stop_idx on postcards (stop_id) where deleted_at is null;

-- ─── Row Level Security ───────────────────────────────────────────────
-- M1 baseline: anonymous SELECT on published+public projects (and the
-- stops/postcards/assets that hang off them); owner-scoped ALL elsewhere.
-- M2 will introduce stricter policies (private projects, unlisted access via
-- signed slug, invite-gated creation, daily quota enforcement).
--
-- Helper assumption: a row in `users` exists for each auth.users row, with
-- `users.auth_user_id = auth.uid()`. The M2 sign-in trigger will guarantee
-- this; for M1 the migration script seeds the owner row manually.

alter table users     enable row level security;
alter table projects  enable row level security;
alter table stops     enable row level security;
alter table postcards enable row level security;
alter table assets    enable row level security;

-- users
create policy users_self_select on users
  for select using (
    auth_user_id = auth.uid()
    or deleted_at is null  -- public handle directory; tighten in M2 if needed
  );

create policy users_self_update on users
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- projects
create policy projects_public_select on projects
  for select using (
    deleted_at is null
    and (
      (status = 'published' and visibility = 'public')
      or owner_id in (select id from users where auth_user_id = auth.uid())
    )
  );

create policy projects_owner_all on projects
  for all using (
    owner_id in (select id from users where auth_user_id = auth.uid())
  )
  with check (
    owner_id in (select id from users where auth_user_id = auth.uid())
  );

-- stops (parent visibility decides reads; owner of parent project decides writes)
create policy stops_public_select on stops
  for select using (
    deleted_at is null
    and project_id in (
      select id from projects
      where deleted_at is null
        and (
          (status = 'published' and visibility = 'public')
          or owner_id in (select id from users where auth_user_id = auth.uid())
        )
    )
  );

create policy stops_owner_all on stops
  for all using (
    project_id in (
      select id from projects
      where owner_id in (select id from users where auth_user_id = auth.uid())
    )
  )
  with check (
    project_id in (
      select id from projects
      where owner_id in (select id from users where auth_user_id = auth.uid())
    )
  );

-- postcards (mirror stops policy via parent stop)
create policy postcards_public_select on postcards
  for select using (
    deleted_at is null
    and stop_id in (
      select s.id
      from stops s
      join projects p on p.id = s.project_id
      where s.deleted_at is null
        and p.deleted_at is null
        and (
          (p.status = 'published' and p.visibility = 'public')
          or p.owner_id in (select id from users where auth_user_id = auth.uid())
        )
    )
  );

create policy postcards_owner_all on postcards
  for all using (
    stop_id in (
      select s.id
      from stops s
      join projects p on p.id = s.project_id
      where p.owner_id in (select id from users where auth_user_id = auth.uid())
    )
  )
  with check (
    stop_id in (
      select s.id
      from stops s
      join projects p on p.id = s.project_id
      where p.owner_id in (select id from users where auth_user_id = auth.uid())
    )
  );

-- assets (visible if owned or if attached to a public project; loose
-- assets — project_id NULL — are owner-only)
create policy assets_public_select on assets
  for select using (
    deleted_at is null
    and (
      owner_id in (select id from users where auth_user_id = auth.uid())
      or (
        project_id is not null
        and project_id in (
          select id from projects
          where status = 'published'
            and visibility = 'public'
            and deleted_at is null
        )
      )
    )
  );

create policy assets_owner_all on assets
  for all using (
    owner_id in (select id from users where auth_user_id = auth.uid())
  )
  with check (
    owner_id in (select id from users where auth_user_id = auth.uid())
  );

-- ─── Storage bucket: assets ───────────────────────────────────────────
-- Holds binary photos, AI-generated images, and exports. Path convention:
-- {owner_id}/{project_id|"loose"}/{asset_id}.{ext}. The bucket is "public"
-- (anon can read) so SSR public pages can <img src> directly without signing
-- URLs; private/unlisted access tightening lands in M2 alongside auth.

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- Read access mirrors the assets table policy: anyone can GET, but uploads
-- are restricted to authenticated users writing under their own owner_id
-- prefix. Path layout makes the owner_id the first path segment.

create policy "assets_storage_public_read" on storage.objects
  for select using (bucket_id = 'assets');

create policy "assets_storage_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select id::text from users where auth_user_id = auth.uid()
    )
  );

create policy "assets_storage_owner_update" on storage.objects
  for update using (
    bucket_id = 'assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select id::text from users where auth_user_id = auth.uid()
    )
  );

create policy "assets_storage_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select id::text from users where auth_user_id = auth.uid()
    )
  );
