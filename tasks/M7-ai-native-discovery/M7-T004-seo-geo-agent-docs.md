---
id: M7-T004
title: SEO/GEO discovery and agent docs
milestone: M7
kind: parallel
status: DONE
blocked_by: [M7-T001]
blocks: []
parallel_safe: true
touches:
  - web/app/robots.ts
  - web/app/sitemap.ts
  - web/app/llms.txt/
  - web/app/llms-full.txt/
  - docs/
  - CLAUDE.md
  - README.md
  - tasks/
owner: codex-session-20260426
started_at: 2026-04-26T20:34Z
completed_at: 2026-04-26T20:34Z
---

# M7-T004 — SEO/GEO discovery and agent docs

## Why
Search engines, AI retrievers, and future coding agents need first-class entry
points and operating rules.

## Acceptance criteria
- [x] `robots.txt`, `sitemap.xml`, `llms.txt`, and `llms-full.txt` are available.
- [x] Public pages emit canonical metadata and JSON-LD.
- [x] Agent-facing docs explain API/MCP/auth and safety boundaries.

## Verification
`cd web && pnpm typecheck`

## Trace
- 2026-04-26T20:34Z — Added discovery files, metadata/JSON-LD, and agent-native docs.
