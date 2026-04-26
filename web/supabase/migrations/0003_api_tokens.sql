-- 0003_api_tokens.sql — AI-native agent/API tokens
--
-- Adds hashed bearer tokens for non-browser clients such as MCP hosts,
-- custom agents, and workflow automations. This migration is additive and
-- does not issue any real tokens.

set search_path = public;

create table if not exists public.api_tokens (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.users(id) on delete cascade,
  label         text not null,
  token_hash    text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  scopes        text[] not null default array['public:read'],
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  check (
    scopes <@ array['public:read', 'project:write', 'ai:run']::text[]
  )
);

create index if not exists api_tokens_owner_idx
  on public.api_tokens(owner_id)
  where revoked_at is null;

create index if not exists api_tokens_hash_idx
  on public.api_tokens(token_hash)
  where revoked_at is null;

alter table public.api_tokens enable row level security;

drop policy if exists api_tokens_owner_select on public.api_tokens;
create policy api_tokens_owner_select on public.api_tokens
  for select using (
    owner_id = (select id from public.users where auth_user_id = auth.uid())
  );

drop policy if exists api_tokens_owner_update on public.api_tokens;
create policy api_tokens_owner_update on public.api_tokens
  for update using (
    owner_id = (select id from public.users where auth_user_id = auth.uid())
  )
  with check (
    owner_id = (select id from public.users where auth_user_id = auth.uid())
  );

comment on table public.api_tokens is
  'Hashed personal access tokens for AI agents and MCP/API clients. Tokens are shown once by future admin tooling and never stored in plaintext.';

comment on column public.api_tokens.scopes is
  'Allowed scopes: public:read, project:write, ai:run.';

-- Inserts are intentionally service-role/admin only for v1. Token issuance
-- should be an explicit operator action, not an automatic signup side effect.
