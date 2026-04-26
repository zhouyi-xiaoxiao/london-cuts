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
- Production token issuance was attempted only after public read-surface smoke,
  but Supabase returned `api_tokens table is not available`.
- No production API token was issued.
- Exact next step: open the Supabase SQL Editor for project `acymyvefnvydksxzzegw`
  and run `web/supabase/migrations/0003_api_tokens.sql`, then rerun the script.
