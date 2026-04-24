# M2 — Flip-the-switch checklist

All code for M2 auth + invites is committed and deployed (see
`tasks/deferred/M2-auth-and-invites.md` for the full design).

## Live activation status (2026-04-24)

| Step | Status | Notes |
|---|---|---|
| 1. Apply `0002_auth.sql` | ✅ **DONE** 2026-04-24 01:00 UTC | Ran via Supabase SQL Editor (driven by Claude Chrome MCP). "Success. No rows returned." |
| 2. Enable Magic Link provider | ✅ **DONE** | Already on by default; Email OTP exp 3600s, length 8 digits |
| 3. Configure Site URL + Redirect URLs | ✅ **DONE** | Site URL = `https://london-cuts.vercel.app`. Redirect URLs: `https://london-cuts.vercel.app/auth/callback`, `http://localhost:3000/auth/callback` |
| 4. Mint invite code | ✅ **DONE** | `ana-beta-001` inserted, uses_remaining=1 |
| 5. Flip `M2_AUTH_ENABLED=true` | ✅ **DONE** 2026-04-24 01:05 UTC | Vercel prod env set via CLI (`--no-sensitive` flag required so pull works). Redeploy triggered via empty commit `17dd1ad`. Then onboarding UX polished in `b969521` |
| 6. Owner first sign-in | ✅ **DONE** 2026-04-24 ~17:40 UTC | Automated via Claude using `supabase.auth.admin.generateLink` (skips actual email) + Chrome MCP navigation. Owner's `auth.users.id` = `d813b4cf-41b8-4b06-b10f-99ae4d6ef01a`, email `zhouyixiaoxiao@gmail.com` |
| 7. Merge seed `ana-ishii` to owner's auth_user_id | ✅ **DONE** 2026-04-24 ~17:42 UTC | Node script using service_role: updated seed row to set `auth_user_id` + `is_admin=true`, inserted `invite_redemptions` row, set invite `uses_remaining = 0`. Verified: 2 projects (`a-year-in-se1`, `a-week-in-reykjavik`) now owned by her |
| 8. Retire preview-password gate | ✅ **DONE** 2026-04-24 21:30 UTC | `PREVIEW_PASSWORD` removed from Vercel envs. `/` now redirects to the public SE1 reader demo; `/studio/*` is guarded by M2 auth in `web/app/studio/layout.tsx`. |

**Required owner action**: none for the fallback Vercel URL. Full flow verified end-to-end in Chrome — `/sign-in → /auth/callback → /studio → ☁️ Sync clicked → green success banner "12 STOPS SYNCED"`. Custom domain still needs owner action in IONOS when moving from `london-cuts.vercel.app` to `zhouyixiaoxiao.org`.

## Integration gotchas discovered during activation (kept in HANDOFF too)

1. **`lib/supabase.ts` taint rule**: `next/headers` cannot appear anywhere reachable from a "use client" component's import graph. The Supabase SSR cookie helper lives in `lib/supabase-server.ts` with `import "server-only"`. DO NOT re-export it from `lib/supabase.ts` — Next traces re-exports into client bundles.
2. **Browser session storage must be cookies, not localStorage**: use `createBrowserClient` from `@supabase/ssr`. The plain `createClient` from `@supabase/supabase-js` defaults to localStorage, which the server-side `getUserServerClient` cannot see → every authenticated API call 401s with "Sign in required".
3. **`createBrowserClient` does not auto-consume URL fragments**: if Supabase redirects with `#access_token=...` (implicit flow, what `auth.admin.generateLink` returns), `/auth/callback/page.tsx` must manually parse the hash and call `setSession({access_token, refresh_token})`. Only `?code=...` (PKCE, what real email clicks return) is auto-handled via `exchangeCodeForSession`.
4. **`/auth/callback` must be `page.tsx`, not `route.ts`**: URL hash fragments never reach the server.

All four are already fixed in commits `61caee5`, `43a29b5`, `f7acac3`, `63e5ca9`.

---

## Instructions (original — kept for reference)

## Step 1 — apply the migration

Supabase Dashboard → SQL Editor → paste contents of
`web/supabase/migrations/0002_auth.sql` → Run.

Checks after:
- `select count(*) from public.invites;` → 0
- `select count(*) from public.users where is_admin = true;` → 1
  (Ana Ishii)
- `\d public.invite_redemptions` → table exists

## Step 2 — configure Supabase Auth

Supabase Dashboard → Authentication → Providers → Email:
- Enable "Email" provider
- Toggle "Enable Sign in with Magic Link" ON
- Toggle "Confirm email" OFF (magic link self-confirms)

Authentication → URL Configuration:
- Site URL: `https://london-cuts.vercel.app`
- Redirect URLs (add all that apply):
  - `https://london-cuts.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `https://zhouyixiaoxiao.org/auth/callback` (when domain lands)

## Step 3 — mint an invite for yourself

SQL Editor:
```sql
INSERT INTO public.invites (code, note) VALUES
  ('ana-beta-001', 'Owner self-invite');
```

(You can mint more for friends: each row = one code; each code defaults
to `uses_remaining=1` — single use.)

## Step 4 — flip the env flag

Vercel → Project → Settings → Environment Variables → add to Production
(and Development):
```
M2_AUTH_ENABLED=true
```

Redeploy (Vercel does this automatically on env change). ~60s.

## Step 5 — first sign-in

1. Open `https://london-cuts.vercel.app/sign-in` in a private window
   (clear session).
2. Enter your email → Send magic link.
3. Check inbox → click link → lands on `/onboarding`.
4. Pick a handle (MUST pick something OTHER than `ana-ishii` for now —
   that handle is taken by the seed row; we unify in step 6).
   Try: `ana` or `ana-ishii-new`.
5. Enter invite code `ana-beta-001`.
6. Submit → redirected to `/studio`.

## Step 6 — inherit the seed is_admin row

After your real user row exists, link it to the existing Ana Ishii seed
row so you inherit `is_admin=true` AND the seed projects transfer to
you cleanly.

SQL Editor (replace `YOUR-NEW-AUTH-USER-ID` — find it at Dashboard →
Auth → Users, copy the UUID for your email):

```sql
-- Option A (merge, recommended): delete your freshly-created row,
-- link the seed row to your auth identity.
BEGIN;
DELETE FROM public.invite_redemptions
  WHERE redeemed_by = (SELECT id FROM public.users WHERE handle = 'ana');
DELETE FROM public.users WHERE handle = 'ana';

UPDATE public.users
  SET auth_user_id = 'YOUR-NEW-AUTH-USER-ID',
      is_admin = true
  WHERE id = '00000000-0000-4000-8000-000000000001';
COMMIT;
```

After this you're the admin and you own SE1 + Reykjavík demos.

## Step 7 — verify

1. `/studio` loads.
2. Click ☁️ Sync to cloud on SE1 → should succeed (you're owner now).
3. Try creating a postcard → `/api/ai/generate` returns 200 (M2 gate
   recognises your session).
4. Sign out (via user menu — TODO: add this UI in a future PR).
5. Visit `/studio` → should redirect to `/sign-in` (proxy still gates,
   but now /sign-in is the door, not /gate).

## Step 8 — retire the preview-password gate (done)

Completed 2026-04-24T21:30Z.

- Vercel env `PREVIEW_PASSWORD` removed from Production, Preview, and Development.
- `/` now redirects to `/@ana-ishii/a-year-in-se1`.
- `/studio/*` is guarded by `web/app/studio/layout.tsx`; unauthenticated users go to `/sign-in?next=/studio`.

Redeploy after this change so Vercel picks up the removed env var and the route guard.

## Known gaps (defer to M3+)

- **Per-user daily AI quota**: not implemented. Global
  `OPENAI_SPEND_CAP_CENTS` (default 800 = $8) is shared across all
  users. A single authenticated user can drain the cap.
- **User menu UI**: no sign-out button in the studio chrome yet.
  Workaround: clear cookies manually.
- **Handle collision UX**: `/onboarding` form doesn't live-check
  handle availability. Shown on submit as 409.
- **Email deliverability**: Supabase built-in mailer throttles ~3
  mails/hour per address. Fine for a 5-friend beta. For a bigger
  cohort, flip to external SMTP (Resend / SendGrid) in Supabase Auth
  settings.
- **Handle = email-local-part prefill**: not implemented; the
  onboarding form is empty by default.
- **Admin invite-minting UI**: no page for it; SQL-only.

## If something breaks

Rollback is a single Vercel env change: set
`M2_AUTH_ENABLED=false` (or delete the var). All routes immediately
revert to legacy service_role behaviour. The migration itself is
idempotent + additive — no DB rollback needed unless the owner
explicitly wants to drop the new tables.
