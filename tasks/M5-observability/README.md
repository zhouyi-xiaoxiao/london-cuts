# M5 — Observability & tests

**Goal:** We can see errors and user behaviour after launch. Core logic has unit tests. CI blocks broken builds.
**Duration estimate:** 1–2 days.
**Exit criteria:**
- Sentry captures a thrown error in production build
- PostHog records `signup`, `publish`, `ai_generate`, `ai_failure` events
- `pnpm test` runs Vitest; tests for auth, invite, quota pass
- GitHub Actions runs typecheck + tests on every PR

## Tasks

| ID | Title | Kind | Blocked by |
|----|-------|------|------------|
| M5-T001 | Wire Sentry (client + server) | critical | M2 done |
| M5-T002 | Wire PostHog (client) | critical | M2 done |
| M5-T003 | Instrument key events (signup, publish, ai_generate, ai_failure) | critical | M5-T001, M5-T002 |
| M5-P001 | Vitest tests: verifyInvite, quota, ownership checks | parallel | M2 done |
| M5-P002 | GitHub Actions: run tests on PR | parallel | M5-P001 |
| M5-P003 | GitHub Actions: typecheck on PR | parallel | M0 done |

## Notes

- Sentry: use `@sentry/nextjs` SDK. Separate DSNs for dev / prod if owner prefers; otherwise one.
- PostHog: EU cloud recommended if owner has EU users (compliance).
- Tests are minimal on purpose: auth/invite/quota are where user impact and money impact lie. Everything else is low-risk UI.
