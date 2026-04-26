# Agent Manifest

London Cuts is now designed as an AI-native, agent-callable product surface.
This file is the first stop for agents that need to read, call, test, or extend
the app without scraping UI state.

## Canonical Surfaces

- Public site: `https://london-cuts.vercel.app`
- Public project demo: `https://london-cuts.vercel.app/@ana-ishii/a-year-in-se1`
- OpenAPI: `/api/openapi.json`
- REST API v1: `/api/v1/*`
- MCP endpoint: `/mcp`
- AI discovery: `/llms.txt` and `/llms-full.txt`
- Sitemap: `/sitemap.xml`

`NEXT_PUBLIC_APP_URL` is the canonical base URL. Use it instead of hardcoding
the Vercel URL in code.

## Callable Capabilities

Public, no auth:

- List published public projects: `GET /api/v1/projects`
- Read a public project: `GET /api/v1/projects/{handle}/{slug}`
- Read a public stop: `GET /api/v1/projects/{handle}/{slug}/stops/{stop}`
- Read markdown citation pack: `GET /api/v1/projects/{handle}/{slug}/markdown`
- Audit AI visibility: `GET /api/v1/projects/{handle}/{slug}/ai-visibility`
- Read OpenAPI: `GET /api/openapi.json`

Authenticated:

- Describe a photo: `POST /api/v1/ai/describe-photo`
- Compose a project from described photos: `POST /api/v1/ai/compose-project`
- Generate postcard art: `POST /api/v1/ai/generate-postcard`
- Sync a project payload: `POST /api/v1/projects/sync`

MCP:

- `initialize`
- `resources/list`
- `resources/read`
- `tools/list`
- `tools/call`
- `prompts/list`
- `prompts/get`

Public tools include `search_public_projects`, `get_public_project`,
`get_public_stop`, and `audit_public_project_visibility`. Authenticated tools
include `describe_photo`, `compose_project`, `generate_postcard`, and
`sync_project`.

## Auth

Browser agents can use the existing Supabase cookie session. Machine agents use
Bearer tokens with prefix `lc_pat_`.

Scopes:

- `public:read`
- `ai:run`
- `project:write`

Tokens are stored only as SHA-256 hashes in `public.api_tokens`. Do not store or
log plaintext tokens. Token issuance is a manual/operator action for v1.
Use `web/scripts/issue-agent-token.mjs` only after `0003_api_tokens.sql` has
been applied. Prefer `--store-keychain`; avoid `--print-once` in shared logs.

## Do Not Automate

- Do not print or commit `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `RESEND_API_KEY`, SMTP credentials, invite codes, magic links, or API tokens.
- Do not run production migrations unless the user explicitly asks.
- Do not issue invite codes unless the user explicitly asks.
- Do not send real emails from tests.
- Do not scrape `/studio` when a public DTO/API/MCP resource can answer the
  question.

## Verification Commands

```bash
cd web
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Useful smoke checks:

```bash
curl -sS http://localhost:3000/api/v1/projects
curl -sS http://localhost:3000/api/v1/projects/%40ana-ishii/a-year-in-se1/ai-visibility
curl -sS http://localhost:3000/api/openapi.json
curl -sS http://localhost:3000/llms.txt
curl -sS -X POST http://localhost:3000/mcp \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
