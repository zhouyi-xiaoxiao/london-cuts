---
id: M8-T002
title: Public DTO and markdown quality
milestone: M8
kind: critical
status: DONE
blocked_by: [M8-T001]
blocks: [M8-T005]
parallel_safe: true
touches:
  - web/lib/public-content.ts
  - web/app/llms.txt/
  - web/app/llms-full.txt/
  - web/tests/public-content.test.ts
owner: codex-session-20260426
started_at: 2026-04-26T21:00Z
completed_at: 2026-04-26T21:00Z
---

# M8-T002 — Public DTO and Markdown Quality

## Acceptance Criteria

- [x] Public project DTOs include `shortSummary`, `retrievalKeywords`,
  `featuredStops`, `places`, `imageCount`, and `citationGuidance`.
- [x] Markdown packs include At a Glance, Facts, Stops Table, Image References,
  Citation URLs, and Do-Not-Infer Notes.
- [x] Public reads remain published/public only.

## Trace

- DTO and markdown generation still live in `web/lib/public-content.ts`.
- `llms.txt` and `llms-full.txt` now point agents toward markdown packs and
  visibility audits as preferred citation surfaces.
