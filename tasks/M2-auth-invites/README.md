# M2 — Auth & invites

**⏸ Status:** POSTPONED (per plan v2.0, 2026-04-20). M-fast + M-preview + M1 run first.

This milestone swaps `lib/auth.ts` from its M-fast mock/no-auth impl to Supabase Auth + magic links, and moves OpenAI key from client sessionStorage to a server-side API route. Don't start until user approves.

**Goal:** Invite-code + magic-link sign-up/sign-in works end-to-end. Routes protected by auth middleware.
**Exit criteria:**
- A real email with a valid invite code can sign up via the UI
- Magic link arrives from Resend (branded domain)
- Clicking the link logs the user in
- Authenticated user can reach `/studio/*`; unauthenticated user cannot
- Invite code is single-use and marked used on successful sign-up
- Vitest tests pass for `verifyInvite`

## Tasks (to be expanded before starting — mirror M0-P007 approach)

| ID | Title | Kind | Blocked by |
|----|-------|------|------------|
| M2-T001 | Implement `lib/auth.ts` (getCurrentUser, sendMagicLink, verifyInvite) | critical | M1 done |
| M2-T002 | Configure Supabase Auth → Resend SMTP | critical | M2-T001 |
| M2-T003 | API route `POST /api/invites/verify` (server-side, service role) | critical | M2-T001 |
| M2-T004 | Sign-up page (email + invite code form) | critical | M2-T003 |
| M2-T005 | Sign-in page (email only) | critical | M2-T001 |
| M2-T006 | Auth callback page (`/auth/callback`) | critical | M2-T005 |
| M2-T007 | Middleware gating `/studio/*` | critical | M2-T006 |
| M2-P001 | Implement `lib/email.ts` Resend wrapper | parallel | M1 done |
| M2-P002 | Vitest tests for `verifyInvite` | parallel | M2-T003 |
| M2-P003 | Seed 30 invite codes (owner-run script) | parallel | M1-P002 |

## Owner checkpoint

- Human tester signs up with a real email + one of the 30 codes
- Receives magic link email within 60 seconds
- Clicking link lands in `/studio` with `requireUser()` returning a valid session
- Opens another browser profile (not logged in) and tries `/studio` → gets bounced to sign-in
