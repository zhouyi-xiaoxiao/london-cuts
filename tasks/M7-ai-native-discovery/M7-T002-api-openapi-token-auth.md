---
id: M7-T002
title: REST API v1, OpenAPI, and token auth
milestone: M7
kind: critical
status: DONE
blocked_by: [M7-T001]
blocks: [M7-T003]
parallel_safe: false
touches:
  - web/app/api/v1/
  - web/app/api/openapi.json/
  - web/lib/agent-auth.ts
  - web/lib/api-auth.ts
  - web/supabase/migrations/
owner: codex-session-20260426
started_at: 2026-04-26T20:34Z
completed_at: 2026-04-26T20:34Z
---

# M7-T002 — REST API v1, OpenAPI, and token auth

## Why
Agents need stable callable routes and scoped non-browser auth.

## Acceptance criteria
- [x] Public API v1 reads are available.
- [x] AI/write API v1 routes reuse guarded server internals.
- [x] OpenAPI 3.1 document is available.
- [x] API token migration stores only hashes and scopes.

## Verification
`cd web && pnpm typecheck`

## Trace
- 2026-04-26T20:34Z — Added API v1 routes, OpenAPI, `agent-auth`, and migration `0003_api_tokens.sql`.
