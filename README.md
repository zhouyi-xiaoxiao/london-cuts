# London Cuts

> A creator tool for documenting a single-location trip (anywhere in the world) with photos, written stories, and AI-generated postcards. Three visual modes: **Fashion**, **Punk**, **Cinema**. Publish as a shareable page.

**Working name:** London Cuts (placeholder; product may be renamed before public launch).
**Live fallback:** `https://london-cuts.vercel.app/` (currently redirects to the public SE1 reader demo).
**Future custom domain:** `zhouyixiaoxiao.org` (M6, after IONOS → Vercel DNS).
**AI entry points:** `/llms.txt`, `/llms-full.txt`, `/api/openapi.json`, `/api/v1/projects`, `/mcp`.

---

## Quick start

```bash
cd web
pnpm install
cp .env.example .env.local   # fill in values as they're needed per milestone
pnpm dev                     # http://localhost:3000

# one-time: install the pre-push secret scanner (scans git history
# for OpenAI / Stripe / AWS / GitHub / Slack / Resend / PostHog / JWT
# patterns before you push — prevents the GitHub secret-scan round-trip)
cd .. && git config core.hooksPath scripts/hooks
```

**Browse the design system:**

```bash
open design-system/preview/brand-roundel.html
# ...any file in design-system/preview/
```

---

## Where to start

- **Contributor or AI agent:** read `CLAUDE.md`, then `tasks/AGENTS.md`, then pick a task from `tasks/STATE.md`.
- **Agent integration:** read `docs/agent-manifest.md`, `docs/api-contract.md`, and `docs/ai-discovery.md`.
- **Reviewer / new teammate:** read `docs/requirements.md` → `docs/architecture.md` → `docs/data-model.md` → `docs/implementation-plan.md`.
- **Designer:** read `design-system/README.md`.

## Repo layout

- `web/` — the product (Next.js 16 + TypeScript, pnpm, Node 22+)
- `design-system/` — **canonical** tokens, components, seed imagery, preview pages
- `docs/` — requirements, architecture, data model, implementation plan (v2.0)
- `tasks/` — executable task system for AI coding agents
- `pitch/` — pitch deck (PDF + JSX slides)
- `assets/` — brand marks
- `archive/` — frozen prior work (do not edit)
- `scripts/` — utilities

## Rules

- **Design truth → `design-system/`.** Don't invent colours, spacing, or type scales.
- **Single codebase → `web/`.** The legacy HTML prototype lives in `archive/app-html-prototype-2026-04-20/` for reference only.
- **Seam discipline.** Business code imports only from `web/lib/*.ts`, never third-party SDKs directly. See `docs/architecture.md#4-the-seam-layers`.
- **Never edit `archive/`.** Copy forward into `web/` if you need a pattern.
- **Secrets via env vars.** See `web/.env.example`.

## Docs

- `docs/requirements.md` — what we're building (v1.0, frozen)
- `docs/architecture.md` — how `web/` is structured
- `docs/data-model.md` — target DB schema
- `docs/implementation-plan.md` — milestone roadmap (plan v2.1: features-first, then infra)
- `docs/agent-manifest.md` — callable surfaces, auth scopes, verification, and do-not-automate rules
- `docs/api-contract.md` — REST and MCP contract notes
- `docs/ai-discovery.md` — SEO/GEO/llms.txt strategy

## License

(TBD — add before public launch.)
