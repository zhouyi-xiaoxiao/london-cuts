---
id: M7-T001
title: Canonical public-content service
milestone: M7
kind: critical
status: DONE
blocked_by: []
blocks: [M7-T002, M7-T003, M7-T004]
parallel_safe: false
touches:
  - web/lib/public-content.ts
owner: codex-session-20260426
started_at: 2026-04-26T20:34Z
completed_at: 2026-04-26T20:34Z
---

# M7-T001 — Canonical public-content service

## Why
All AI/search/citation surfaces need one sanitized public DTO layer.

## Acceptance criteria
- [x] Published public projects can be listed and fetched.
- [x] Stops, postcards, assets, canonical URLs, metadata, and markdown are normalized.
- [x] Private/auth/admin fields are not included.

## Verification
`cd web && pnpm typecheck`

## Trace
- 2026-04-26T20:34Z — Added `web/lib/public-content.ts`.
