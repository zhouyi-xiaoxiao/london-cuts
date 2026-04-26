---
id: M8-T005
title: Production smoke and continuity
milestone: M8
kind: critical
status: TODO
blocked_by: [M8-T001, M8-T002, M8-T003, M8-T004]
blocks: []
parallel_safe: false
touches:
  - production/vercel-smoke
  - tasks/HANDOFF.md
  - tasks/STATE.md
  - tasks/LOG.md
owner: codex-session-20260426
started_at:
completed_at:
---

# M8-T005 — Production Smoke and Continuity

## Acceptance Criteria

- [ ] Full web checks pass: typecheck, lint, test, build.
- [ ] Secret scan finds no real API tokens, service-role keys, invite codes,
  magic links, OpenAI keys, or Resend keys in built/discovery artifacts.
- [ ] M8 commit is pushed to `origin/main`.
- [ ] Production smoke verifies API, OpenAPI, llms files, MCP, and AI visibility
  audit route.
- [ ] `tasks/HANDOFF.md`, `tasks/STATE.md`, and `tasks/LOG.md` contain final
  smoke results and token-migration status.
