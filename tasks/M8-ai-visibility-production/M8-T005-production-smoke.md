---
id: M8-T005
title: Production smoke and continuity
milestone: M8
kind: critical
status: DONE
blocked_by: [M8-T001, M8-T002, M8-T003, M8-T004]
blocks: []
parallel_safe: false
touches:
  - production/vercel-smoke
  - tasks/HANDOFF.md
  - tasks/STATE.md
  - tasks/LOG.md
owner: codex-session-20260426
started_at: 2026-04-26T21:00Z
completed_at: 2026-04-26T21:10Z
---

# M8-T005 — Production Smoke and Continuity

## Acceptance Criteria

- [x] Full web checks pass: typecheck, lint, test, build.
- [x] Secret scan finds no real API tokens, service-role keys, invite codes,
  magic links, OpenAI keys, or Resend keys in built/discovery artifacts.
- [x] M8 commit is pushed to `origin/main`.
- [x] Production smoke verifies API, OpenAPI, llms files, MCP, and AI visibility
  audit route.
- [x] `tasks/HANDOFF.md`, `tasks/STATE.md`, and `tasks/LOG.md` contain final
  smoke results and token-migration status.

## Trace

- Local checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` (20 files, 78
  tests), and `pnpm build`.
- Secret scan over `web/.next`, `web/app`, `web/lib`, `docs`, and `tasks`
  returned only the documented example regex in `docs/SECURITY.md`.
- Commit `3f996ef` pushed to `origin/main`.
- Production returned 200 for `/api/v1/projects`, `/api/openapi.json`,
  `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/sitemap.xml`, `/mcp`, and
  `/api/v1/projects/%40ana-ishii/a-year-in-se1/ai-visibility`.
- Content smoke: public DTO exposes new AI fields; markdown exposes required
  sections; OpenAPI exposes the audit path; MCP lists/calls
  `audit_public_project_visibility`.
- API-token smoke stopped before issuing a token because `api_tokens` is not
  available in production.
