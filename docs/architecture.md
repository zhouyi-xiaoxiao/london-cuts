# Architecture — Target State

**Audience:** Anyone (human or AI agent) about to make a structural change.
**Read alongside:** `docs/requirements.md`, `docs/data-model.md`.

This describes where we are going. For the current as-is legacy layout, see `README.md`.

---

## 1. Guiding principles

1. **Single main codebase.** After M0, `web/` is the one place product code lives. `app/` becomes a frozen archive reference.
2. **Seams before abstractions.** Business code must never import a third-party SDK directly. It imports from `web/lib/*.ts`. Swapping Supabase → another DB is one-file work.
3. **Design system is canonical.** Tokens live in `design-system/`. Neither product code nor styles invent colours, spacing, or type scales.
4. **Cheap reversibility > premature optimization.** Soft delete everything. Store raw events in Postgres. Defer caching/queues until a metric demands it.
5. **Agent-friendly.** Self-explanatory names, ≤ 400 lines per file, tests for invariants, trace logs for tasks.

## 2. System map

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Next.js client components)                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Studio      │  │ Public view  │  │ Auth flow              │ │
│  │ (edit mode) │  │ (read-only)  │  │ (invite + magic link)  │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js server (Vercel)                                        │
│  ┌────────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ RSC / Pages    │  │ API routes   │  │ Edge middleware   │  │
│  │ (SSR content)  │  │ (ai, API,    │  │ (auth gate)       │  │
│  │                │  │  MCP)        │  │                   │  │
│  └───────┬────────┘  └──────┬───────┘  └──────────┬────────┘  │
└──────────┼─────────────────┼─────────────────────┼─────────────┘
           │                 │                     │
           ▼                 ▼                     ▼
  ┌────────────────┐  ┌──────────────┐  ┌──────────────────────┐
  │ lib/storage.ts │  │ lib/ai-      │  │ lib/auth.ts          │
  │ lib/public-    │  │ provider.ts  │  │ lib/agent-auth.ts    │
  │ content.ts     │  │              │  │ lib/email.ts         │
  │ (seams)        │  │              │  │ lib/analytics.ts     │
  └───────┬────────┘  └──────┬───────┘  └──────────┬───────────┘
          │                  │                     │
          ▼                  ▼                     ▼
  ┌────────────────┐  ┌──────────────┐  ┌──────────────────────┐
  │ Supabase       │  │ OpenAI API   │  │ Resend / Sentry /    │
  │ (Postgres +    │  │              │  │ PostHog              │
  │  Auth +        │  │              │  │                      │
  │  Storage)      │  │              │  │                      │
  └────────────────┘  └──────────────┘  └──────────────────────┘
```

## 3. Directory layout (post-M0)

```
london-cuts/
├── web/                        # The single product codebase (was next-scaffold/)
│   ├── app/                    # Next.js app-router
│   │   ├── (marketing)/        # Public landing, about, pricing
│   │   ├── (public)/
│   │   │   ├── [handle]/
│   │   │   │   └── [slug]/     # Public project page
│   │   │   └── atlas/          # Global atlas
│   │   ├── (studio)/
│   │   │   └── studio/         # Authenticated creator UI
│   │   │       ├── new/
│   │   │       └── [projectId]/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── api/
│   │   │   ├── ai/generate/    # POST — server-side OpenAI call
│   │   │   ├── v1/             # stable public/agent API
│   │   │   ├── openapi.json/   # OpenAPI 3.1 document
│   │   │   ├── invites/verify/
│   │   │   └── webhooks/
│   │   ├── mcp/                # MCP JSON-RPC endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── studio/             # Creator UI primitives
│   │   ├── public/             # Reader UI primitives
│   │   ├── postcard/           # Flip card, styles
│   │   ├── map/                # MapLibre wrapper
│   │   └── ui/                 # Buttons, dialogs, etc.
│   ├── lib/                    # SEAMS — everything external goes through here
│   │   ├── storage.ts          # Data access (Supabase client wrapper)
│   │   ├── auth.ts             # Current user + session
│   │   ├── agent-auth.ts       # API token scopes for agents
│   │   ├── public-content.ts   # canonical public DTOs / markdown / metadata
│   │   ├── ai-provider.ts      # OpenAI wrapper
│   │   ├── email.ts            # Resend wrapper
│   │   ├── analytics.ts        # PostHog wrapper
│   │   ├── env.ts              # Validated env vars
│   │   └── errors.ts           # Error types + Sentry bridge
│   ├── stores/                 # Client state, split by domain
│   │   ├── project.ts
│   │   ├── mode.ts
│   │   └── session.ts
│   ├── types/                  # Shared TS types
│   ├── providers/              # React context providers
│   ├── tests/                  # Vitest unit tests
│   ├── public/                 # Static files
│   ├── middleware.ts           # Auth gate for /studio/*
│   ├── next.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── design-system/              # Canonical tokens, unchanged
├── docs/                       # Requirements, architecture, data model, plans
├── tasks/                      # Task system (see tasks/README.md)
├── archive/                    # Frozen history
│   └── app-html-prototype-<date>/   # Old app/ lives here after M0
├── .github/workflows/          # CI
├── scripts/                    # One-off scripts (deploy, postcard render)
├── CLAUDE.md                   # Agent instructions (top-level)
├── README.md                   # Repo front door
└── INDEX.md                    # Quick navigation
```

## 4. The seam layers

Rule: **business code imports only from `web/lib/`**. Never `import { createClient } from '@supabase/supabase-js'` outside `web/lib/`. Never `import OpenAI` outside `web/lib/ai-provider.ts`.

### `web/lib/storage.ts`
- Exports typed functions: `getProject(id)`, `listProjects({ownerId})`, `saveProject(p)`, etc.
- Hides Supabase client, table names, SQL.
- Future: if we move off Supabase, only this file changes.

### `web/lib/auth.ts`
- Exports: `getCurrentUser()`, `requireUser()`, `signOut()`, `sendMagicLink(email)`, `verifyInvite(code)`.
- Wraps Supabase Auth calls.
- Future: Clerk/Auth0 swap = one file.

### `web/lib/agent-auth.ts`
- Verifies API tokens for MCP/API agents.
- Tokens use prefix `lc_pat_`, are stored only as SHA-256 hashes, and carry scopes (`public:read`, `ai:run`, `project:write`).
- Future: OAuth can layer on top without changing public DTOs.

### `web/lib/public-content.ts`
- Canonical public content DTO layer for SSR pages, REST API v1, MCP resources/tools, sitemap, metadata, and `llms.txt`.
- Enforces published/public-only reads and strips private/auth/admin fields.

### `web/lib/ai-provider.ts`
- Exports: `generatePostcardArt({sourcePhoto, style, prompt})`, `describePhotos(photos[])`.
- Server-only. Imports `openai` package.
- Enforces quota check before call.
- Caches (photo hash, style) results in DB.

### `web/lib/email.ts`
- Exports: `sendInviteEmail(email, code)`, `sendMagicLink(email, link)`.
- Wraps Resend.

### `web/lib/analytics.ts`
- Exports: `track(event, props)`, `identify(userId, props)`.
- Wraps PostHog. No-ops gracefully if env not set.

### `web/lib/env.ts`
- Validates required env vars at boot. Fails fast with a clear error.
- Uses Zod schema.

### `web/lib/errors.ts`
- Typed error classes (`InviteInvalidError`, `QuotaExceededError`, etc.).
- Reports to Sentry.

## 5. Data flow examples

### User publishes a project
1. Client component in `web/app/(studio)/studio/[projectId]/` calls `saveProject({...status:'published'})` from `web/lib/storage.ts`.
2. `storage.ts` validates input, runs Supabase update.
3. RLS policy on `projects` table verifies `auth.uid() = owner_id`.
4. Public page `web/app/(public)/[handle]/[slug]/` reads via SSR using anon key; RLS allows public reads where `visibility='public'`.

### User clicks "generate postcard"
1. Client calls `POST /api/ai/generate` with `{stopId, style}`.
2. Route handler in `web/app/api/ai/generate/route.ts` calls `requireUser()` → 401 if not logged in.
3. Handler calls `ai-provider.generatePostcardArt(...)`.
4. `ai-provider.ts` checks `daily_quotas` table, decrements, calls OpenAI, uploads result to Supabase Storage, records in `ai_generations`.
5. Returns image URL to client.

### Guest views a public project
1. SSR render of `web/app/(public)/[handle]/[slug]/page.tsx`.
2. `storage.getProjectByHandle(handle, slug)` called with anon Supabase client.
3. RLS allows read because `visibility='public'` and `deleted_at is null`.
4. Response rendered to HTML and streamed.

## 6. Environment variables

See `web/.env.example` (to be created in M0). Key ones:

| Var | Where | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Anon key (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Bypass RLS for admin ops |
| `OPENAI_API_KEY` | server only | AI generation |
| `RESEND_API_KEY` | server only | Email sending |
| `NEXT_PUBLIC_POSTHOG_KEY` | client | Analytics |
| `SENTRY_DSN` | client + server | Error reporting |
| `NEXT_PUBLIC_APP_URL` | client + server | Canonical URL for magic links |
| `M2_AUTH_ENABLED` | server | Enables Supabase auth gates for studio/write/AI/API token paths |

## 7. Deployment

- **Preview:** every PR → Vercel preview URL
- **Production:** merge to `main` → Vercel production deploy
- **DNS:** IONOS → Vercel (A/ALIAS record for apex, CNAME for `www`)
- **Database migrations:** SQL files in `web/supabase/migrations/`, applied via Supabase CLI
- **Secrets:** Vercel env UI (three environments: Development / Preview / Production)

## 8. Testing posture

- **Must test:** auth flow, invite validation, quota enforcement, RLS (via integration test)
- **Nice to test:** storage seam smoke, core store reducers
- **Don't test (for beta):** UI components, E2E, visual regression

## 9. Out of architecture (for beta)

We are deliberately not building:
- Background job queue (all work is request-scoped; OpenAI blocks the route)
- Redis/Memcache (Supabase Postgres handles it)
- Microservices (Next.js monolith is fine to 1000s of users)
- CDN for images (Supabase Storage + Vercel CDN is enough)
- Dedicated search infrastructure (public sitemap, DTOs, and markdown packs are enough for beta)

If/when a real bottleneck appears, we revisit.

## 10. Change management

- Structural changes (new top-level dir, new seam, new table) require:
  1. Update this doc in the same change
  2. Update `docs/data-model.md` if data-related
  3. Log in `tasks/LOG.md`
  4. Note if downstream tasks need to know
- Non-structural changes (component, bugfix, content) don't touch this doc.
