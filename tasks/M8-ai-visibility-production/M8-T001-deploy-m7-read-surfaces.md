---
id: M8-T001
title: Deploy M7 read surfaces
milestone: M8
kind: critical
status: DONE
blocked_by: []
blocks: [M8-T002, M8-T003, M8-T004, M8-T005]
parallel_safe: false
touches:
  - production/vercel-read-surfaces
owner: codex-session-20260426
started_at: 2026-04-26T20:34Z
completed_at: 2026-04-26T21:00Z
---

# M8-T001 — Deploy M7 Read Surfaces

## Acceptance Criteria

- [x] M7 changes committed as `web: expose ai-native agent surfaces (M7)`.
- [x] Commit pushed to `origin/main`.
- [x] Production returns 200 for public read/discovery routes.

## Trace

- Commit `09451aa` pushed to `origin/main`.
- Production smoke after Vercel deploy returned 200 for `/api/v1/projects`,
  `/api/openapi.json`, `/llms.txt`, `/llms-full.txt`, `/robots.txt`,
  `/sitemap.xml`, and `/mcp`.
