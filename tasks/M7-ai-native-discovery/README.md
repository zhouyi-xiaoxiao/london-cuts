# M7 — AI-Native Discovery and Agent Surfaces

**Status:** In progress / implemented in the 2026-04-26 Codex pass.

Goal: make London Cuts callable and inspectable by AI agents without scraping
private UI state.

## Tasks

| ID | Title | Status |
|---|---|---|
| M7-T001 | Canonical public-content service | DONE |
| M7-T002 | REST API v1, OpenAPI, and token auth | DONE |
| M7-T003 | MCP endpoint | DONE |
| M7-T004 | SEO/GEO discovery and agent docs | DONE |

## Agent Notes

Future work should preserve the rule that public discovery, API, MCP, sitemap,
metadata, and `llms.txt` all read through `web/lib/public-content.ts`.
