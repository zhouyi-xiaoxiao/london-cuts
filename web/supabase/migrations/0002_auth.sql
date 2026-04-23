-- 0002_auth.sql — M2 PR 1: auth + invites schema additions
--
-- Scope: everything needed for Supabase Auth magic-link sign-in, invite-gated
-- onboarding, and admin-only invite minting. Additive to 0001_initial.sql —
-- NO behaviour change in the running app until PR 2 wires the code path.
--
-- Idempotency: every CREATE uses `if not exists` / every policy uses DROP +
-- CREATE so re-running this file against an already-migrated DB is safe.
--
-- Apply via Supabase Dashboard → SQL Editor → paste → Run. Same as 0001.
-- Rollback (if needed): drop tables invites + invite_redemptions, drop the
-- new columns on public.users, then re-run 0001's RLS policies.
--
-- Sections:
--   A. Extend public.users (auth_user_id already present from 0001 — we
--      add is_admin + created_at helpers; also flip Ana Ishii to admin).
--   B. public.invites — admin-minted redemption codes.
--   C. public.invite_redemptions — audit log, one redemption per user.
--   D. RLS policy refresh on existing tables (idempotent DROP + CREATE).
--   E. Reserved handles — block well-known names from being claimed.

set search_path = public;

-- ─── Section A: Extend public.users ───────────────────────────────────
-- 0001 already created `auth_user_id uuid unique references auth.users(id)
-- on delete cascade` and `created_at timestamptz not null default now()`.
-- We only need `is_admin` here. The `add column if not exists` clauses on
-- auth_user_id / created_at are defensive no-ops on a fresh 0001 DB and
-- make this file safe to re-run on any partial state.

alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade,
  add column if not exists is_admin boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

-- Flip the seed owner (Ana Ishii) to admin so PR 4's requireAdmin() works
-- out of the box. Keeps auth_user_id = NULL until she actually signs in —
-- PR 5's ownership-sync flip will match by is_admin=true as the fallback.
update public.users
  set is_admin = true
  where id = '00000000-0000-4000-8000-000000000001';

-- ─── Section B: public.invites ────────────────────────────────────────
-- Owner mints codes manually in Dashboard SQL (M2 plan §1.2). No admin UI.

create table if not exists public.invites (
  code            text primary key,
  uses_remaining  int  not null default 1 check (uses_remaining >= 0),
  issued_by       uuid references public.users(id) on delete set null,
  note            text,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz
);

create index if not exists invites_expires_at_idx on public.invites(expires_at);

alter table public.invites enable row level security;

-- Only admins may list invites. Non-admin users see nothing.
drop policy if exists invites_admin_select on public.invites;
create policy invites_admin_select on public.invites
  for select using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.is_admin = true
    )
  );

-- Intentionally NO write policy: all inserts/updates/deletes come through
-- service_role (owner-minted via Dashboard SQL). With RLS on and no write
-- policy, both anon and authenticated roles are blocked from writes.

-- ─── Section C: public.invite_redemptions ─────────────────────────────
-- Audit log. `unique (redeemed_by)` enforces "each user redeems at most
-- one invite total" — invites aren't transferable.

create table if not exists public.invite_redemptions (
  id           uuid primary key default gen_random_uuid(),
  code         text not null references public.invites(code),
  redeemed_by  uuid not null references public.users(id) on delete cascade,
  redeemed_at  timestamptz not null default now(),
  ip_address   text,
  unique (redeemed_by)
);

alter table public.invite_redemptions enable row level security;

-- Admins see all redemptions.
drop policy if exists invite_redemptions_admin_select on public.invite_redemptions;
create policy invite_redemptions_admin_select on public.invite_redemptions
  for select using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.is_admin = true
    )
  );

-- Users see their own redemption.
drop policy if exists invite_redemptions_self_select on public.invite_redemptions;
create policy invite_redemptions_self_select on public.invite_redemptions
  for select using (
    redeemed_by = (select id from public.users where auth_user_id = auth.uid())
  );

-- As with invites, no write policy — redemptions land via a service_role
-- RPC in PR 3 (atomic "decrement + insert" under SECURITY DEFINER).

-- ─── Section D: RLS policy refresh on existing tables ────────────────
-- 0001's policies are already keyed to auth.uid() → users.auth_user_id →
-- users.id → owner_id, which is the correct shape. We rewrite them here
-- so the migration is self-documenting (a reader of 0002 sees the full
-- current RLS picture without cross-referencing 0001) and idempotent.
--
-- Pattern:
--   * owner_rw → for all (select / insert / update / delete) owned rows
--   * public_read → for select on published + public rows (anon + auth)
--
-- The seed-migration path (/api/migrate/seed → service_role) bypasses RLS
-- so these policies do not affect it.

-- projects ────────────────────────────────────────────────────────────
drop policy if exists projects_public_select on public.projects;
drop policy if exists projects_owner_all on public.projects;
drop policy if exists projects_owner_rw on public.projects;
drop policy if exists projects_public_read on public.projects;

create policy projects_owner_rw on public.projects
  for all
  using (owner_id = (select id from public.users where auth_user_id = auth.uid()))
  with check (owner_id = (select id from public.users where auth_user_id = auth.uid()));

create policy projects_public_read on public.projects
  for select
  using (visibility = 'public' and status = 'published');

-- stops ──────────────────────────────────────────────────────────────
-- Owner check delegates through projects.owner_id. Public read delegates
-- through projects' published+public state.
drop policy if exists stops_public_select on public.stops;
drop policy if exists stops_owner_all on public.stops;
drop policy if exists stops_owner_rw on public.stops;
drop policy if exists stops_public_read on public.stops;

create policy stops_owner_rw on public.stops
  for all
  using (
    project_id in (
      select id from public.projects
      where owner_id = (select id from public.users where auth_user_id = auth.uid())
    )
  )
  with check (
    project_id in (
      select id from public.projects
      where owner_id = (select id from public.users where auth_user_id = auth.uid())
    )
  );

create policy stops_public_read on public.stops
  for select
  using (
    project_id in (
      select id from public.projects
      where visibility = 'public' and status = 'published'
    )
  );

-- postcards ──────────────────────────────────────────────────────────
-- Two hops: stop → project → owner (or published+public).
drop policy if exists postcards_public_select on public.postcards;
drop policy if exists postcards_owner_all on public.postcards;
drop policy if exists postcards_owner_rw on public.postcards;
drop policy if exists postcards_public_read on public.postcards;

create policy postcards_owner_rw on public.postcards
  for all
  using (
    stop_id in (
      select s.id from public.stops s
      join public.projects p on p.id = s.project_id
      where p.owner_id = (select id from public.users where auth_user_id = auth.uid())
    )
  )
  with check (
    stop_id in (
      select s.id from public.stops s
      join public.projects p on p.id = s.project_id
      where p.owner_id = (select id from public.users where auth_user_id = auth.uid())
    )
  );

create policy postcards_public_read on public.postcards
  for select
  using (
    stop_id in (
      select s.id from public.stops s
      join public.projects p on p.id = s.project_id
      where p.visibility = 'public' and p.status = 'published'
    )
  );

-- assets ─────────────────────────────────────────────────────────────
-- Owner RW on their own assets (owner_id column). Public read covers
-- assets attached to a published+public project via project_id. Loose
-- assets (project_id IS NULL) stay owner-only.
drop policy if exists assets_public_select on public.assets;
drop policy if exists assets_owner_all on public.assets;
drop policy if exists assets_owner_rw on public.assets;
drop policy if exists assets_public_read on public.assets;

create policy assets_owner_rw on public.assets
  for all
  using (owner_id = (select id from public.users where auth_user_id = auth.uid()))
  with check (owner_id = (select id from public.users where auth_user_id = auth.uid()));

create policy assets_public_read on public.assets
  for select
  using (
    project_id is not null
    and project_id in (
      select id from public.projects
      where visibility = 'public' and status = 'published'
    )
  );

-- Note: 0001's `users` policies (users_self_select, users_self_update) and
-- storage.objects policies (assets_storage_*) are already correctly keyed
-- to auth.uid() and are left unchanged by this migration.

-- ─── Section E: Reserved handles ─────────────────────────────────────
-- Block well-known handles from being claimed during onboarding. Kept as
-- rows with auth_user_id=NULL, is_admin=false, so they're inert except as
-- a uniqueness squat on the handle column.
--
-- Conflict handling: `ana-ishii` (owner seed, id ...0001) and `yx` (legacy
-- handle from M1 publish-dialog hardcode) may already exist in prod —
-- `on conflict do nothing` across either the primary key or the handle
-- unique constraint skips them cleanly.

insert into public.users (id, handle, display_name, is_admin)
values
  ('00000000-0000-4000-8000-000000009001', 'admin',    'Reserved', false),
  ('00000000-0000-4000-8000-000000009002', 'system',   'Reserved', false),
  ('00000000-0000-4000-8000-000000009003', 'ana-ishii','Reserved', false),
  ('00000000-0000-4000-8000-000000009004', 'yx',       'Reserved', false),
  ('00000000-0000-4000-8000-000000009005', 'support',  'Reserved', false),
  ('00000000-0000-4000-8000-000000009006', 'help',     'Reserved', false)
on conflict do nothing;

-- End of 0002_auth.sql.
