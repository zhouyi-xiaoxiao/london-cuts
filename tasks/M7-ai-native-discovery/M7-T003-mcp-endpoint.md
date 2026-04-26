---
id: M7-T003
title: MCP endpoint
milestone: M7
kind: parallel
status: DONE
blocked_by: [M7-T001, M7-T002]
blocks: []
parallel_safe: true
touches:
  - web/app/mcp/
owner: codex-session-20260426
started_at: 2026-04-26T20:34Z
completed_at: 2026-04-26T20:34Z
---

# M7-T003 — MCP endpoint

## Why
MCP-compatible clients need public resources plus authenticated AI/write tools.

## Acceptance criteria
- [x] `/mcp` supports initialize, resources, tools, and prompts.
- [x] Public tools work without auth.
- [x] AI/write tools require auth and scope checks.

## Verification
`cd web && pnpm typecheck`

## Trace
- 2026-04-26T20:34Z — Added minimal JSON-RPC MCP endpoint without introducing a new dependency.
