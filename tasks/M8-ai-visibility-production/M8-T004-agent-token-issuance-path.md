---
id: M8-T004
title: Agent token issuance path
milestone: M8
kind: parallel
status: DONE
blocked_by: [M8-T001]
blocks: [M8-T005]
parallel_safe: true
touches:
  - web/scripts/issue-agent-token.mjs
owner: codex-session-20260426
started_at: 2026-04-26T21:00Z
completed_at: 2026-04-26T21:00Z
---

# M8-T004 — Agent Token Issuance Path

## Acceptance Criteria

- [x] Script supports `--label`, `--scopes`, `--dry-run`, and
  `--store-keychain`.
- [x] Script stores only hashed tokens in Supabase and stores plaintext in
  macOS Keychain only when requested.
- [x] Script stops with the exact SQL Editor instruction if `api_tokens` is not
  available.

## Trace

- Added `web/scripts/issue-agent-token.mjs`.
- No production API token was issued in this task.
- `0003_api_tokens.sql` remains an explicit owner/operator step.
