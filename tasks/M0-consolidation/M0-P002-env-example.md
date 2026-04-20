---
id: M0-P002
title: Create web/.env.example with all required vars
milestone: M0
kind: parallel
status: TODO
blocked_by: [M0-T001]
blocks: []
parallel_safe: true
touches:
  - web/.env.example
  - web/.gitignore
owner: null
started_at: null
completed_at: null
---

# M0-P002 — Create `web/.env.example`

## Why
Any developer (human or AI) who clones the repo needs a single file that lists every env var the app expects, with comments on what each is for and where to get it. Without this, onboarding involves reading source code to discover requirements.

## Acceptance criteria
- [ ] `web/.env.example` exists
- [ ] Every var from `docs/architecture.md#6-environment-variables` is present
- [ ] Each var has a one-line comment explaining purpose + where to obtain
- [ ] `web/.gitignore` (or root `.gitignore`) excludes `.env`, `.env.local`, `.env.*.local`
- [ ] `web/.env.example` has no real secrets (only placeholder values)

## File content

Create `web/.env.example`:

```env
# ─── Supabase ───────────────────────────────────────────────────────────
# From Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
# Server-only. Never expose to client. Bypasses RLS.
SUPABASE_SERVICE_ROLE_KEY=ey...

# ─── OpenAI (server-side only) ──────────────────────────────────────────
# Used by lib/ai-provider.ts for postcard generation + vision.
OPENAI_API_KEY=sk-...

# ─── Resend (transactional email) ───────────────────────────────────────
# Used for invite emails and (via Supabase Auth SMTP) magic links.
# Domain for From: must be verified in Resend.
RESEND_API_KEY=re_...

# ─── PostHog (product analytics) ────────────────────────────────────────
# Free tier. Client-side instrumentation.
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com

# ─── Sentry (error monitoring) ──────────────────────────────────────────
# Used in both client and server bundles.
SENTRY_DSN=https://...ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=${SENTRY_DSN}

# ─── App config ─────────────────────────────────────────────────────────
# Canonical URL used by magic links, OG images, email templates.
# Local: http://localhost:3000
# Production: https://zhouyixiaoxiao.org
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Steps
1. Create `web/.env.example` with the content above.
2. Confirm `.gitignore` covers `.env*`:
   ```bash
   grep -E '^\.env' .gitignore web/.gitignore 2>/dev/null
   ```
   If missing, add to root `.gitignore`:
   ```
   .env
   .env.local
   .env.*.local
   ```
3. Confirm no `.env` file with real secrets is tracked:
   ```bash
   git ls-files | grep -E '^\.env'
   # expect: only .env.example
   ```

## Verification
```bash
test -f web/.env.example && echo OK
grep -c "^[A-Z_]*=" web/.env.example
# expect at least 9 vars
```

## Trace
