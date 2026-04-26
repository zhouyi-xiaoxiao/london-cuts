---
id: M8-T003
title: AI visibility audit
milestone: M8
kind: parallel
status: DONE
blocked_by: [M8-T001]
blocks: [M8-T005]
parallel_safe: true
touches:
  - web/lib/ai-visibility.ts
  - web/app/api/v1/projects/[handle]/[slug]/ai-visibility/
  - web/app/mcp/
  - web/lib/openapi.ts
  - web/tests/ai-visibility.test.ts
  - web/tests/mcp.test.ts
  - web/tests/openapi.test.ts
owner: codex-session-20260426
started_at: 2026-04-26T21:00Z
completed_at: 2026-04-26T21:00Z
---

# M8-T003 — AI Visibility Audit

## Acceptance Criteria

- [x] `GET /api/v1/projects/{handle}/{slug}/ai-visibility` returns a read-only
  audit from public DTOs.
- [x] MCP exposes `audit_public_project_visibility`.
- [x] MCP exposes `improve_ai_visibility_pack` prompt.
- [x] OpenAPI includes the audit endpoint and schema.

## Trace

- Audit output includes suggested queries, answer cards, missing metadata, weak
  citations, image-alt gaps, strengths, issues, and recommendations.
