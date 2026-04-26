# M8 — AI Visibility Productionization

**Status:** Done in the 2026-04-26 Codex pass.

Goal: turn the M7 local AI/API/MCP/GEO implementation into live, citeable,
agent-callable production surfaces with stronger retrieval quality and a
controlled token-issuance path.

## Tasks

| ID | Title | Status |
|---|---|---|
| M8-T001 | Deploy M7 read surfaces | DONE |
| M8-T002 | Public DTO and markdown quality | DONE |
| M8-T003 | AI visibility audit API/MCP/prompt | DONE |
| M8-T004 | Production token issuance path | DONE |
| M8-T005 | Production smoke and continuity | DONE |

## Agent Notes

Keep public read surfaces flowing through `web/lib/public-content.ts`. The
visibility audit is read-only and wraps sanitized public DTOs; it must never
query drafts, invite data, auth identities, service-role secrets, or studio
state.
