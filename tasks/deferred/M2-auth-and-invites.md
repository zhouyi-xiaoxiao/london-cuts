# M2 — Auth + Invites (research + design)

**Audience:** the fresh session that will land M2. Read alongside
`tasks/HANDOFF.md` (M1 architecture + seam map) and
`web/supabase/migrations/0001_initial.sql` (which already anticipates auth via
`auth_user_id` on `users`).

State at 2026-04-23: M1 live; M-iter has only VariantsRow left; `web/proxy.ts`
+ `PREVIEW_PASSWORD` is the current gate. M2 replaces the gate with real auth,
introduces invite-gated onboarding, and switches writes from service_role to
RLS-scoped user clients.

---

## 0. TL;DR

M2 = **5 PRs**, land sequentially on `main`. Each PR green on `pnpm typecheck
&& pnpm test && pnpm build` before the next. Recommended decisions:

1. Sign-in — **magic link only** (`signInWithOtp`, PKCE, email-only UX).
2. Invites — **option (a)**: owner mints codes via Dashboard SQL; user pastes during onboarding. No admin UI.
3. Demo projects — **reassign to the owner's real `users.id`** after her first sign-in; drop the synthetic `00000000-...` row.
4. Handle — **user-chosen** at onboarding, pre-filled from email local-part. `yx` hardcode dies.
5. Project cap — **multi-project, no cap** (schema already supports it; dashboard UX doesn't change).
6. Roles — **`users.is_admin boolean`**, one admin = owner. No role table.

Do **not** parallel M2 with VariantsRow or polish-prose: the proxy + RLS
combo is easy to break if multiple features touch routing at once.

---

## 1. Decisions (opinionated — override before PR 1 if needed)

### 1.1 Sign-in: magic link only
`signInWithOtp` — sends a PKCE magic link by default. 30-user invite-only beta
doesn't need password reset infra or OAuth consent screens. `@supabase/ssr`
defaults to PKCE; we just call `exchangeCodeForSession` in the callback. OAuth
can be added later with zero schema impact.

### 1.2 Invites: SQL-minted codes
Admin UI (option b) ≈ 400 LOC of scope creep. Waitlist (option c) needs a
moderation queue + approval emails. Owner mints codes in Dashboard SQL:

```sql
insert into public.invites (code, uses_remaining, issued_by, note)
select encode(gen_random_bytes(6), 'base32'), 1, '<admin.users.id>'::uuid, 'beta cohort 1'
from generate_series(1, 10);
select code from public.invites where uses_remaining = 1;
```

### 1.3 Demo projects: reassign to owner
`00000000-0000-4000-8000-000000000001` has `auth_user_id = null`, so RLS
policies that join through `auth.uid()` can't resolve it once real users exist.
Run §6.2 SQL after owner's first sign-in — reassigns SE1 + Reykjavík to her
real `users.id`, drops the synthetic row. Existing `/@ana-ishii/...` share
URLs keep resolving because we copy `handle = 'ana-ishii'` onto her new row.

### 1.4 Handle: user-chosen
`users.handle` is already `text unique check (handle ~ '^[a-z0-9_-]{2,32}$')`.
Pre-fill with `email.split('@')[0]` regex-cleaned; user edits on onboarding.
Email-derived handles leak email in public URLs; user-chosen is safer.

### 1.5 Multi-project, no cap
Schema supports N projects per owner. Enforcing a cap needs a trigger + a
future drop migration + UX for "you hit the limit." Zero benefit pre-launch.

### 1.6 Admin flag, not role table
`alter table public.users add column is_admin boolean not null default false;`
Owner's row flipped to `true` via one-off SQL after her first sign-in. One
admin. Revisit in M5+ if paid tiers land.

---

## 2. Schema changes — new migration `0002_auth.sql`

Apply via Supabase SQL Editor after 0001. Do NOT edit 0001.

### 2.1 Profile + admin fields

```sql
set search_path = public;
alter table public.users
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists is_admin boolean not null default false;
```

### 2.2 Auto-create profile on auth insert

```sql
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer as $$
declare default_handle text;
begin
  default_handle := lower(split_part(new.email, '@', 1));
  default_handle := regexp_replace(default_handle, '[^a-z0-9_-]+', '-', 'g');
  default_handle := substring(default_handle from 1 for 24);
  while exists (select 1 from public.users where handle = default_handle) loop
    default_handle := default_handle || '-' || substring(encode(gen_random_bytes(3), 'hex') from 1 for 4);
  end loop;
  insert into public.users (auth_user_id, handle, display_name)
  values (new.id, default_handle, split_part(new.email, '@', 1));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
```

`security definer` is required — the trigger runs under anon role during
sign-up, which RLS would otherwise block from writing `public.users`.

### 2.3 Invites + redemptions

```sql
create table public.invites (
  code            text primary key check (length(code) between 6 and 32),
  uses_remaining  int  not null default 1 check (uses_remaining >= 0),
  issued_by       uuid references public.users(id),
  note            text,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

create table public.invite_redemptions (
  invite_code     text not null references public.invites(code),
  user_id         uuid not null references public.users(id) on delete cascade,
  redeemed_at     timestamptz not null default now(),
  primary key (invite_code, user_id)
);
create index invite_redemptions_user_idx on public.invite_redemptions (user_id);

alter table public.invites            enable row level security;
alter table public.invite_redemptions enable row level security;

create policy invites_admin_all on public.invites
  for all using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.is_admin))
  with check (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.is_admin));

create policy redemptions_self_select on public.invite_redemptions
  for select using (user_id in (select id from public.users where auth_user_id = auth.uid()));
create policy redemptions_admin_select on public.invite_redemptions
  for select using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.is_admin));
```

### 2.4 Atomic redemption RPC

```sql
create or replace function public.redeem_invite(p_code text)
returns json language plpgsql security definer as $$
declare v_user_id uuid; v_remaining int;
begin
  select id into v_user_id from public.users where auth_user_id = auth.uid();
  if v_user_id is null then
    return json_build_object('ok', false, 'reason', 'not_signed_in');
  end if;
  if exists (select 1 from public.invite_redemptions where user_id = v_user_id) then
    return json_build_object('ok', true, 'reason', 'already_redeemed');
  end if;
  update public.invites
  set uses_remaining = uses_remaining - 1
  where code = p_code
    and uses_remaining > 0
    and (expires_at is null or expires_at > now())
  returning uses_remaining into v_remaining;
  if v_remaining is null then
    return json_build_object('ok', false, 'reason', 'invalid_or_exhausted');
  end if;
  insert into public.invite_redemptions (invite_code, user_id) values (p_code, v_user_id);
  return json_build_object('ok', true);
end; $$;
revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;
```

### 2.5 `me` view — one-shot session hydration

```sql
create or replace view public.me as
select
  u.id, u.auth_user_id, u.handle, u.display_name, u.avatar_url, u.is_admin,
  (exists (select 1 from public.invite_redemptions r where r.user_id = u.id)) as has_invite
from public.users u
where u.auth_user_id = auth.uid();
```

Inherits RLS from `public.users` (existing `users_self_select` handles it).

### 2.6 Per-user daily AI spend

```sql
create table public.ai_daily_spend (
  user_id    uuid not null references public.users(id) on delete cascade,
  spend_date date not null default current_date,
  cents      int  not null default 0,
  calls      int  not null default 0,
  primary key (user_id, spend_date)
);
alter table public.ai_daily_spend enable row level security;
create policy ai_spend_self_select on public.ai_daily_spend
  for select using (user_id in (select id from public.users where auth_user_id = auth.uid()));

create or replace function public.incr_daily_spend(p_user_id uuid, p_cents int)
returns int language plpgsql security definer as $$
declare v_total int;
begin
  insert into public.ai_daily_spend (user_id, spend_date, cents, calls)
  values (p_user_id, current_date, p_cents, 1)
  on conflict (user_id, spend_date) do update
    set cents = public.ai_daily_spend.cents + p_cents,
        calls = public.ai_daily_spend.calls + 1
  returning cents into v_total;
  return v_total;
end; $$;
grant execute on function public.incr_daily_spend(uuid, int) to service_role;
```

Per-user cap lives in env (`USER_DAILY_CAP_CENTS=200` suggested). The RPC is
service_role-only so users can't zero their own spend.

---

## 3. RLS diff (summary)

0001's policies are already correct for M2 — they key off `auth.uid()` via
`(select id from public.users where auth_user_id = auth.uid())`. M2 doesn't
rewrite them; it just stops using `service_role` where a user context exists.

| Table | M1 writer | M2 writer | Policy change |
|-------|-----------|-----------|---------------|
| `users` | service_role (sync) | Trigger on auth insert; `/api/me` PATCH | None (uses `users_self_update`) |
| `projects` | service_role | User client | None (uses `projects_owner_all`) |
| `stops` | service_role | User client | None |
| `postcards` | service_role | User client | None |
| `assets` | service_role + storage service | User client + storage user client | None (existing `assets_storage_owner_write` matches) |
| `invites` | — | Admin RLS (2.3) + redeem RPC | NEW |
| `invite_redemptions` | — | RPC-only insert, self-select | NEW |
| `ai_daily_spend` | — | service_role via RPC | NEW |

Storage path convention unchanged: `{owner_id}/{project_id}/{legacyId}.{ext}`.
The `assets_storage_owner_write` policy checks the first folder-name segment
matches `public.users.id` for `auth.uid()` — this works as long as sync routes
flip to the user client.

---

## 4. Client + server seams

### 4.1 `web/lib/auth.ts` — target shape

```ts
// web/lib/auth.ts
import { createServerClient } from "@supabase/ssr";
import { AuthRequiredError, ForbiddenError } from "./errors";
import { getServerUserClient } from "./supabase";

export interface Session {
  userId: string;      // public.users.id
  authUserId: string;  // auth.users.id
  email: string;
  handle: string;
  displayName: string | null;
  isAdmin: boolean;
  hasInvite: boolean;
}

export async function currentUser(): Promise<Session | null> {
  const supa = getServerUserClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return null;
  const { data: me } = await supa.from("me").select("*").maybeSingle();
  if (!me) return null;
  return {
    userId: me.id, authUserId: me.auth_user_id, email: user.email ?? "",
    handle: me.handle, displayName: me.display_name,
    isAdmin: me.is_admin, hasInvite: me.has_invite,
  };
}

export async function requireUser(): Promise<Session> {
  const s = await currentUser();
  if (!s) throw new AuthRequiredError("sign in required");
  return s;
}

export async function requireAdmin(): Promise<Session> {
  const s = await requireUser();
  if (!s.isAdmin) throw new ForbiddenError("admin required");
  return s;
}

export async function sendMagicLink(email: string, redirectPath = "/studio"): Promise<void> {
  const supa = getServerUserClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL!;
  const { error } = await supa.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await getServerUserClient().auth.signOut();
}

export async function redeemInvite(code: string): Promise<{ ok: boolean; reason?: string }> {
  const { data, error } = await getServerUserClient().rpc("redeem_invite", { p_code: code.trim() });
  if (error) return { ok: false, reason: error.message };
  return data as { ok: boolean; reason?: string };
}
```

Add `ForbiddenError` to `web/lib/errors.ts` (mirrors `AuthRequiredError`).

### 4.2 `web/lib/supabase.ts` — add user clients

Keep existing `getBrowserClient` / `getServerClient` for backward compat. Add:

```ts
import { cookies } from "next/headers";
import { createServerClient, createBrowserClient } from "@supabase/ssr";

export function getServerUserClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => { try { cookieStore.set(name, value, options); } catch {} },
        remove: (name, options) => { try { cookieStore.set(name, "", { ...options, maxAge: 0 }); } catch {} },
      },
    },
  );
}

export function getBrowserUserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

### 4.3 New dependency: `@supabase/ssr`

**Not currently installed.** Add `@supabase/ssr@^0.5.2` (compatible with
`@supabase/supabase-js@^2.104.0`, current dep). Owner-approval needed per
CLAUDE.md "no new deps without asking" — flag in PR 1 description.

### 4.4 `/api/sync/upsert` — flip to user client

Current: `const db = getServerClient()` + hardcoded `OWNER_ID`. Target:

```ts
import { requireUser } from "@/lib/auth";
import { getServerUserClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await requireUser();
  const db = getServerUserClient();
  // ... every `OWNER_ID` becomes `session.userId`
  await db.from("projects").upsert({ owner_id: session.userId, ... });
}
```

RLS (`projects_owner_all`) rejects any write where `owner_id` doesn't match
the caller, so the explicit `session.userId` is both correct and double-checked.

Storage upload: flip `uploadDataUrlToStorage` to call through the user client
too — `assets_storage_owner_write` requires `auth.uid()` to be non-null.

### 4.5 `/api/ai/*` — `requireUser` + quota gate

```ts
import { requireUser } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const { data: spent } = await getServerClient()
    .from("ai_daily_spend").select("cents")
    .eq("user_id", session.userId).eq("spend_date", today).maybeSingle();
  const cap = parseInt(process.env.USER_DAILY_CAP_CENTS ?? "200", 10);
  if ((spent?.cents ?? 0) >= cap) {
    return NextResponse.json({ error: "daily AI spend cap reached" }, { status: 429 });
  }
  // ...existing generation logic...
  await getServerClient().rpc("incr_daily_spend", { p_user_id: session.userId, p_cents: result.costCents });
  return NextResponse.json({ ... });
}
```

Apply to `generate`, `compose-project`, `vision/describe`, and any future
`pregen-variants`. The existing `userId` field in request bodies becomes
ignored (server trusts only the session) — leave the field to avoid breaking
the client immediately; remove in M4.

### 4.6 `/api/migrate/seed` — admin-only

Replace the `x-migrate-secret` header check with `await requireAdmin()`.
Keeps the route for dev/demo re-seeds; no longer a string-guessing game.

---

## 5. UI flows

### 5.1 Route map

```
/                       → redirect /studio (unchanged)
/gate                   → REMOVE
/sign-in                → NEW (email + "send magic link")
/auth/callback          → NEW (GET: exchangeCodeForSession → redirect)
/onboarding             → NEW (handle + invite-code form)
/studio, /studio/*      → unchanged UI, now auth-gated + invite-gated
/@<handle>/<slug>/...   → unchanged, fully public
/api/auth/sign-out      → NEW (POST clears cookie)
/api/invites/redeem     → NEW (thin wrapper around redeem_invite RPC)
/api/me                 → NEW (GET Session; PATCH handle + display_name)
```

### 5.2 `/sign-in` (server component)

Reads `currentUser()`; if signed in, redirect to `/studio`. Otherwise: email
input + "Send magic link" submit → server action calls `sendMagicLink(email)`
→ success state: "We sent you a link. Click it from this device." Never leak
whether the email exists (prevent enumeration).

### 5.3 `/auth/callback` (route handler, not page)

```ts
// web/app/auth/callback/route.ts
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/studio";
  if (!code) return NextResponse.redirect(new URL("/sign-in?error=missing_code", req.url));
  const { error } = await getServerUserClient().auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/sign-in?error=exchange_failed", req.url));
  return NextResponse.redirect(new URL(next, req.url));
}
```

### 5.4 `/onboarding`

Shown once per user. Fields: handle (pre-filled from trigger-generated
placeholder, editable, regex `/^[a-z0-9_-]{2,32}$/`) + display name + invite
code. Submit: server action updates `public.users` then calls `redeem_invite`
RPC. Success → redirect `/studio`. On `/studio`, if `hasInvite=false`, bounce
back to `/onboarding`.

### 5.5 User menu

`web/components/studio/user-menu.tsx` — avatar (initials fallback), popover
with "signed in as @handle", "Account" (stub link for M4), "Sign out" (POST
`/api/auth/sign-out`, clear cookie, redirect `/`). Mount in
`workspace-header.tsx` and `projects-dashboard.tsx`.

### 5.6 Proxy replacement

```ts
// web/proxy.ts (M2)
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const STUDIO_PREFIXES = ["/studio", "/onboarding"];
const PUBLIC_PREFIXES = ["/@", "/sign-in", "/auth/callback", "/api/auth", "/api/invites/redeem", "/atlas"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!STUDIO_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const res = NextResponse.next();
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      get: (n) => req.cookies.get(n)?.value,
      set: (n, v, o) => { res.cookies.set(n, v, o); },
      remove: (n, o) => { res.cookies.set(n, "", { ...o, maxAge: 0 }); },
    }},
  );
  const { data: { user } } = await supa.auth.getUser();
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|txt|xml|json|css|js|map|woff|woff2|ttf|otf|eot)$).*)"],
};
```

**Remove `PREVIEW_PASSWORD` from Vercel env after PR 2 ships.**

---

## 6. Migration + backfill

### 6.1 Existing `lc_store_v5` client state

Nothing to migrate automatically. Owner's Zustand state (SE1 current,
Reykjavík archive) already matches Supabase after §6.2 ownership migration.
Friend users with local drafts: first Sync-to-cloud click under M2 creates
their project under their own `users.id`. Existing UX copy ("draft stays in
this browser until Sync") unchanged.

### 6.2 One-off ownership migration (owner runs after first sign-in)

```sql
do $$
declare v_new_owner uuid;
begin
  select id into v_new_owner from public.users
  where handle = 'ana-ishii' and auth_user_id is not null
  order by created_at desc limit 1;
  if v_new_owner is null then raise exception 'Owner not signed in yet.'; end if;
  update public.projects set owner_id = v_new_owner where owner_id = '00000000-0000-4000-8000-000000000001';
  update public.assets   set owner_id = v_new_owner where owner_id = '00000000-0000-4000-8000-000000000001';
  delete from public.users where id = '00000000-0000-4000-8000-000000000001';
  update public.users set is_admin = true where id = v_new_owner;
end $$;
```

Not in `0002_auth.sql` — this is a one-off after owner's first real sign-in.

### 6.3 Smoke-test checklist (must all pass before M2 merges)

1. Clean browser `/studio` → redirects `/sign-in`.
2. Enter owner email → success banner.
3. Click magic link → lands in `/onboarding`.
4. Paste valid code + confirm handle → `/studio`.
5. Edit SE1 title → Sync to cloud → 200, `public.projects` updated.
6. Sign out → `/studio` bounces to `/sign-in`.
7. Sign up a second user (`alice@test.com`) with a different code → onboarding → blank project.
8. Alice tries to `GET /studio/<owner-draft-id>` → 404/empty (RLS denies).
9. Alice generates a postcard → `ai_daily_spend` row for Alice with correct cents.
10. Set `USER_DAILY_CAP_CENTS=1` locally + loop generate → 429 after first.
11. Incognito `/@alice-test/<slug>` → published project renders, no sign-in.

Any fail = do not merge.

---

## 7. Implementation order (5 PRs)

### PR 1 — `0002_auth.sql` + `@supabase/ssr` install (~200 LOC)

- `web/supabase/migrations/0002_auth.sql` (§2)
- `web/package.json` + `pnpm-lock.yaml` (add `@supabase/ssr@^0.5.2`)
- `docs/data-model.md` — reconcile (add invites / redemptions / ai_daily_spend / is_admin / trigger / RPC)

Acceptance: migration applies cleanly; `pnpm typecheck && build` green; no
runtime behaviour change yet. Rollback = drop new tables + trigger + functions.

### PR 2 — `lib/auth.ts` real impl + sign-in + callback + proxy swap (~500 LOC)

- `web/lib/auth.ts` (§4.1 full rewrite)
- `web/lib/supabase.ts` (§4.2 additions)
- `web/lib/errors.ts` (add `ForbiddenError`)
- `web/app/sign-in/page.tsx` + `actions.ts` (§5.2)
- `web/app/auth/callback/route.ts` (§5.3)
- `web/app/api/auth/sign-out/route.ts`
- `web/proxy.ts` (§5.6 rewrite)
- DELETE `web/app/gate/page.tsx`, `web/app/api/gate/route.ts`

Acceptance: magic-link flow end-to-end in prod; public pages still render
for anon; `PREVIEW_PASSWORD` env var deleted manually.

### PR 3 — invite redemption + onboarding (~350 LOC + ~80 test)

- `web/app/onboarding/page.tsx` + `actions.ts` (§5.4)
- `web/app/api/invites/redeem/route.ts`
- `web/app/api/me/route.ts` (GET / PATCH)
- `web/app/studio/page.tsx` — add `if (!hasInvite) redirect("/onboarding")`
- `web/tests/auth.test.ts` — handle validation + RPC mocks
- `docs/invite-runbook.md` — "how to mint codes"

Acceptance: onboarding round-trip; duplicate-handle error; re-used-code error;
owner runs §6.2 migration.

### PR 4 — `/api/ai/*` require-user + quota (~200 LOC + ~70 test)

- `web/app/api/ai/generate/route.ts` — `requireUser()` + `ai_daily_spend` guard + `incr_daily_spend` call
- `web/app/api/ai/compose-project/route.ts` — same
- `web/app/api/vision/describe/route.ts` — same
- `web/tests/api-ai.test.ts` — 401 + 429 paths

Env var added (Vercel + `.env.local`): `USER_DAILY_CAP_CENTS=200`.

Acceptance: anon POST → 401; over-cap → 429; success bumps spend row.

### PR 5 — sync flip + seed admin-gate + user menu (~400 LOC + ~60 test)

- `web/app/api/sync/upsert/route.ts` — `requireUser()`, user client, `session.userId` everywhere, storage upload via user client
- `web/app/api/migrate/seed/route.ts` — `requireAdmin()` replaces header secret
- `web/components/studio/user-menu.tsx` (NEW, §5.5)
- `workspace-header.tsx` + `projects-dashboard.tsx` — mount `<UserMenu />`
- `web/components/studio/publish-dialog.tsx` — swap hardcoded `"yx"` for `session.handle`
- `web/tests/api-sync.test.ts` — session mock

Acceptance: every §6.3 smoke-test step passes; bundle grows < 50 KB; 23
existing vitest tests still green + new tests green.

**Total:** ~1650 net LOC + ~210 test LOC across 5 PRs.

(No time estimate per memory preference — use dependency order + acceptance
criteria as the schedule substitute.)

---

## 8. Owner-action checklist

Before PR 1:

1. **Confirm §1 decisions** — reply "all defaults" or call out overrides.
2. **Enable email auth** — Supabase Dashboard → Authentication → Providers → Email → ON (default settings fine). *(30 sec)*
3. **Configure redirect URLs** — Supabase Dashboard → Authentication → URL Configuration. Site URL: `https://london-cuts.vercel.app`. Redirect URLs: `http://localhost:3000/auth/callback`, `https://london-cuts.vercel.app/auth/callback` (+ custom domain once wired). *(2 min)*
4. **Approve `@supabase/ssr` dep** — one-word approval on PR 1.

After each PR ships:

5. **After PR 1**: apply `0002_auth.sql` via Supabase SQL Editor. *(30 sec)*
6. **After PR 3**: sign in once on prod; then run §6.2 SQL; then mint 5 test codes via §1.2 SQL. *(5 min total)*
7. **After PR 2**: delete `PREVIEW_PASSWORD` from Vercel env. *(30 sec)*
8. **After PR 4**: set `USER_DAILY_CAP_CENTS=200` in Vercel prod env. *(30 sec)*
9. **After PR 5**: mint 20–30 production invite codes; distribute to cohort 1. *(10 min)*

---

## 9. Seam discipline + what NOT to touch

- **Don't break the M1 data-flow diagram** (`HANDOFF.md` → "M1 architecture"). M2 changes WRITE leg only. Public SSR reads via `public-lookup.ts` + `[author]/[slug]/page.tsx` stay public — do NOT add `requireUser()` there.
- **Don't regress the generate-endpoint input flexibility** (F-I019). `/api/ai/generate` still accepts `sourceImageDataUrl` as data URL, http(s) URL, or `/`-rooted path. Adding `requireUser()` at the top does not invalidate the L54–57 validator.
- **Don't set `outputFileTracingRoot` in `next.config.ts`.** Permanent Vercel deploy trap.
- **Don't skip the verification pipeline** (`pnpm typecheck && pnpm test && pnpm build`) before any commit. Never land tests with `.skip`.
- **Don't bypass the seam.** `@supabase/supabase-js` stays only in `web/lib/supabase.ts`. `@supabase/ssr` lives in `web/lib/supabase.ts` + `web/proxy.ts` only (proxy is a special case — runs before lib code is reachable).
- **Don't delete `getServerClient()`** (service_role). Post-M2 uses: `/api/ai/*` quota writes via RPC, `/api/migrate/seed`, future admin scripts. `SUPABASE_SERVICE_ROLE_KEY` stays in Vercel.
- **Don't touch other deferred docs.** `tasks/deferred/VariantsRow.md` and `tasks/deferred/ai-auto-layout-and-vision-to-project.md` are for their own features. If you're editing them while doing M2, you've lost focus.
- **Don't rewrite 0001 RLS policies.** They already do the right thing — problems are almost always "still using service_role in the wrong place."

---

## 10. Research references (3, most useful only)

1. [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — canonical `@supabase/ssr` reference. Use `createServerClient` / `createBrowserClient` exactly as shown. Don't copy Pages-Router examples; we're App Router only.
2. [Bootstrap Next.js v16 app with Supabase Auth](https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth) — Supabase's own Next.js 16 + PKCE + cookies walkthrough. Cross-check §5.6 proxy against this if anything looks off.
3. [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow) — PKCE is the `@supabase/ssr` default. If you see "invalid grant" on callback, it's almost always "code-verifier cookie lost between `sendMagicLink` and callback" — cookie-domain mismatch or a proxy rewriting cookies.

Notes checked but not repeated: `@supabase/ssr@0.5.2` is current (April 2026);
compatible with `@supabase/supabase-js@2.104.0` already in deps. The deprecated
`@supabase/auth-helpers-nextjs` is NOT to be used. Edge runtime works with
`@supabase/ssr`; no special middleware config needed.

---

## 11. Pre-flight for the next session

Before PR 1 code lands:

- [ ] Read §0 (TL;DR), §1 (decisions), §9 (don't-touch).
- [ ] Owner has completed §8 steps 1–3.
- [ ] Re-read `HANDOFF.md` → "M1 architecture" + "M1 gotchas" + "Deploy gotchas".
- [ ] Fresh session, no other feature work in flight.

Then: open PR 1, write `0002_auth.sql`, apply it, install `@supabase/ssr`, run
verification, open PR, wait for dep approval, merge. Move to PR 2.

— prior session, 2026-04-23
