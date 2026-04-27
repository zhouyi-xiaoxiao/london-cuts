# Requirements — London Cuts Beta Launch

**Version:** 1.2 (updated 2026-04-27)
**Status:** approved; M0–M6 frozen, M7+ agent/i18n surfaces active

This is the single source of truth for what we are building. If a task, plan, or change conflicts with this document, update this document first and record the change in `tasks/LOG.md`.

---

## 1. Product

**One-liner:** A creative tool for users to document a single-location trip (anywhere in the world) using photos + written stories + AI-generated postcards, publishing the result as a shareable web page in one of three visual modes (Fashion / Punk / Cinema).

- **Placeholder name:** "London Cuts" (to be renamed before public launch; treat as working name)
- **Domain:** `zhouyixiaoxiao.org` (IONOS), serve product at **root domain**
- **Language:** English + Simplified Chinese for active product surfaces
- **Platform:** Desktop-first, responsive CSS so phones don't break

## 2. Users

| Role | Can do |
|------|--------|
| **Guest** (not logged in) | Browse any public project, switch visual modes, view map, download already-published postcard PNGs |
| **Beta user** (invite + login) | Everything a guest can + create/edit/publish projects, use AI generation (50/day), manage own drafts and published works |
| **Admin** (you) | Everything + issue invite codes (via Supabase Dashboard for MVP) |

**Hard rule:** Anything that costs money (AI generation, vision parsing, outgoing email) is **login + quota gated**. Guests cannot trigger spend.

## 3. Functional scope

### FR1 Auth & invites
- Sign-up requires email + invite code
- Magic link email for login (Supabase Auth + Resend)
- Invite code marked "used" on first successful login
- Magic link TTL ≤ 15 min
- Invite codes ≥ 8 chars, cryptographically random, single-use

### FR2 Project creation (logged-in user)
- Create project with free-form location name (not London-limited)
- Upload photos, write stop metadata (title, time, mood, body)
- Drag-reorder stops
- Postcard: AI art front + handwritten back + recipient address
- 6 postcard styles: watercolour, vintage poster, risograph 2-colour, ink+watercolour, anime, art nouveau
- Vision pipeline: upload folder → GPT-4o extracts title/body/excerpt/postcard per photo → auto-create stops
- Projects have `draft` / `published` states
- Multi-project dashboard (new / archive / soft-delete)

### FR3 Publish & share
- Pre-flight checklist (all stops have hero + body + postcard)
- URL: `zhouyixiaoxiao.org/<handle>/<slug>`
- **Default visibility: public**, with `unlisted` and `private` options
- Copy share link
- Export postcard PNG (make button prominent — known UX issue in legacy `app/`)
- Export project PDF (preserve legacy `app/` capability)

### FR4 Public viewing (guests OK)
- Access public project URL → full content visible
- Hero + map + stops + flip postcards
- Mode switcher (Fashion / Punk / Cinema) changes typography, layout, color, map style
- MapLibre GL interactive map with mode-aware tiles

### FR5 AI image generation (logged-in only)
- All OpenAI calls go through server-side route
- OpenAI API key exists **only** in server environment
- Per-user quota: 50 generations/day (soft limit, friendly error on exceed)
- Same (photo, style) pair cached server-side — cache hits are free
- Clear loading states + retry on failure

### FR6 LocalStorage migration (optional)
- On first login, if anonymous localStorage has draft data, prompt user to migrate
- User can skip; local data is preserved in browser either way

### FR7 Project management
- Dashboard lists own projects (draft + published)
- Edit published project → re-publish to overwrite
- Unpublish (back to draft)
- Soft delete with 30-day restore window

## 4. Non-functional

### NFR1 Architecture
- **Single main codebase:** `web/` (renamed from `next-scaffold/` in M0-T001)
- Archive legacy: `app/` → `archive/app-html-prototype-2026-04-20/`
- Seam layers (business code MUST go through these, not raw SDKs):
  - `web/lib/storage.ts` — all data read/write
  - `web/lib/auth.ts` — current user + session
  - `web/lib/ai-provider.ts` — OpenAI wrapper
  - `web/lib/email.ts` — Resend wrapper
  - `web/lib/analytics.ts` — event tracking
- Split oversized stores by domain (project / stop / postcard / mode / auth)
- **Soft cap:** 400 lines per file (refactor when crossed)

### NFR2 Security
- All secrets in env vars (Vercel env), never committed
- OpenAI key server-only
- Supabase Row Level Security enabled on every business table
- Magic link TTL 15 min
- Invite codes cryptographically random

### NFR3 Data discipline
- Every business table has: `id uuid pk / created_at / updated_at / deleted_at`
- All deletes are soft deletes
- `owner_id` foreign key on every user-owned row

### NFR4 Scalability target
- Beta: 30 users
- 6 months: scale to 1000 users without a rewrite
- Service swap (auth / AI / DB) = change ≤ 1 seam file

### NFR5 Observability
- Sentry (error monitoring, free tier)
- PostHog (product analytics, free tier)
- Key events logged: signup, publish, AI failure

### NFR10 AI-native access and discovery
- Public content has stable machine-readable DTOs and markdown citation packs
- Public API v1 and OpenAPI are available for agents
- MCP endpoint exposes public read resources/tools and authenticated AI/write tools
- AI discovery files (`llms.txt`, `llms-full.txt`) describe public surfaces and citation rules
- Traditional SEO discovery includes sitemap, robots, canonical metadata, OG metadata, and JSON-LD

### NFR11 Bilingual content and locale behavior
- Active public reader, studio/auth/onboarding, seed demo, API v1, OpenAPI, MCP,
  `llms.txt`, `llms-full.txt`, sitemap alternates, metadata, JSON-LD, docs, and
  continuity files support English and Simplified Chinese.
- Explicit `/zh/...`, `/en/...`, and `?lang=zh|en` win; then `lc_locale`
  cookie; then `Accept-Language`; then English fallback.
- Stable identifiers stay English-compatible: handles, slugs, route names, JSON
  field names, operationIds, schema keys, enum values, token scopes, MCP
  method/tool names, and style IDs.
- Base persisted fields remain the English-compatible source for existing
  content. Chinese content is additive under `translations.zh`; missing
  user-created translations fall back to source text until edited/generated.

### NFR6 Developer experience
- Maintained: `CLAUDE.md`, `docs/architecture.md`, `docs/data-model.md`, `tasks/`
- Self-explanatory file/folder names
- Target: any AI coding agent should be able to pick up a task cold from `tasks/`

### NFR7 Testing
- Vitest unit tests for: auth, invite code validation, quota enforcement
- GitHub Actions runs tests before deploy
- No E2E tests for beta (too costly)

### NFR8 Performance
- First contentful paint < 3s on 4G
- Project list load < 1s
- AI generation has loading + retry UI

### NFR9 Compliance (minimal for beta)
- Minimal Terms of Service (~500 words, beta disclaimer)
- Minimal Privacy Policy (~500 words, explain email + content collection)
- Footer links on every page
- Report/delete links email the admin; handled manually in beta

## 5. Tech stack (frozen for M0–M6)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 app-router + TypeScript |
| Package manager | pnpm |
| Hosting | Vercel (free tier) |
| Database | Supabase Postgres (free tier) |
| Auth | Supabase Auth (magic link) |
| File storage | Supabase Storage |
| Transactional email | Resend (free tier, wired to Supabase Auth) |
| AI images | OpenAI (server-side, owner pays) |
| Error monitoring | Sentry (free tier) |
| Product analytics | PostHog (free tier) |
| CI/CD | GitHub Actions → Vercel |
| Domain | zhouyixiaoxiao.org (IONOS → Vercel DNS) |

## 6. Explicitly out of scope (beta)

- Native mobile app (responsive CSS only)
- Social features (likes / follows / comments)
- Paid tier / subscriptions
- Offline mode
- Collaborative editing
- User-facing data export
- Custom admin dashboard (use Supabase Dashboard for beta)

## 7. Open items

- Final product name (placeholder: London Cuts)
- Owner's handle for first-person URL space (suggested: `yx` or `zhou`)
- Exact timeline per milestone depends on owner's hours/day investment

## Changelog

- **2026-04-20 v1.0** — Initial confirmed requirements, frozen for M0–M6
- **2026-04-26 v1.1** — Added AI-native API/MCP/discovery requirements and moved SEO/GEO from out-of-scope to beta infrastructure.
- **2026-04-27 v1.2** — Added full active-surface English/Simplified Chinese scope, locale negotiation precedence, translation storage model, and agent/API localization rules.
