# M6 — Launch

**Goal:** `zhouyixiaoxiao.org` serves the app publicly. 30 beta invites sent. First 3 real users logged in.
**Exit criteria:**
- Vercel production deploy green
- Domain resolves to the app, HTTPS valid
- 30 invite codes generated and stored in a private doc
- At least 3 non-admin users have signed in without issue

## Tasks

| ID | Title | Kind | Blocked by |
|----|-------|------|------------|
| M6-T001 | Vercel project setup, linked to GitHub | critical | M5 done |
| M6-T002 | Set env vars in Vercel (all 3 environments) | critical | M6-T001 |
| M6-T003 | IONOS DNS → Vercel (apex + www) | critical | M6-T001 |
| M6-T004 | SSL verified (Vercel auto-provision) | critical | M6-T003 |
| M6-T005 | Generate 30 invite codes, store privately | critical | M2 done |
| M6-T006 | Smoke test production (walkthrough from signup to publish) | critical | M6-T004 |
| M6-T007 | Send first batch of invites (manual) | critical | M6-T006 |
| M6-P001 | Write launch announcement | parallel | any |
| M6-P002 | Supabase keep-alive cron (avoid 7-day pause) | parallel | M1 done |

## IONOS → Vercel DNS notes (owner-action)

Vercel docs will give exact records. Typical:
- Apex `zhouyixiaoxiao.org` → A record to Vercel IP(s), or ALIAS/ANAME if IONOS supports it
- `www.zhouyixiaoxiao.org` → CNAME to `cname.vercel-dns.com`

Owner does this via IONOS dashboard. Agent can't.

**Propagation can take up to 48 hours.** Plan accordingly — don't promise a specific launch hour.

## Smoke test script (owner-run post-deploy)

1. Open production URL in incognito — lands on landing page
2. Click "Sign up", enter real email + invite code → receive magic link within 60s
3. Click link → land in `/studio` → create a project with 1 photo
4. Generate a postcard (all 6 styles) — confirm no OpenAI key leaked in network tab
5. Publish project → open public URL in another browser → visible
6. Check Sentry / PostHog for no errors and the signup + publish events

## Post-launch watch list

- Vercel bandwidth / build minutes
- Supabase DB size, storage size, auth MAU
- OpenAI spend (set hard cap $500/mo in OpenAI dashboard)
- Resend deliverability (bounces / complaints)
