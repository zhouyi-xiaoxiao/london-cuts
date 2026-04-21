# CLAUDE.md — agent instructions

You're working in the London Cuts repo. Before any substantial change, read:

1. **`tasks/HANDOFF.md`** — "resume from here" snapshot if you just walked in cold
2. `docs/requirements.md` — what we're building (frozen for M0–M6)
3. `docs/architecture.md` — how it's structured
4. `docs/data-model.md` — DB schema
5. `docs/implementation-plan.md` — milestone roadmap
6. `tasks/AGENTS.md` — the execution protocol (how to claim and finish tasks)
7. `tasks/PARALLELISM.md` — subagent coordination rules
8. `tasks/STATE.md` — current status of every task

## Mission

Ship a public-beta invite-only web app where users document a single-location trip (anywhere in the world) with photos, written stories, and AI-generated postcards, and publish the result as a shareable page. See `docs/requirements.md` for the full scope.

Working name: "London Cuts" (placeholder; product will be renamed before public launch).

## Single codebase

All product code lives in `web/`. Next.js 14 + TypeScript + pnpm, Node 22+.

The HTML-era prototype in `archive/app-html-prototype-2026-04-20/` (after M0-T002 completes) is **frozen**. Read for reference only; do not edit.

## Task workflow

1. Read `tasks/STATE.md` to see what's TODO / IN_PROGRESS / BLOCKED.
2. Pick a task whose `blocked_by` is all DONE.
3. Follow `tasks/AGENTS.md` — claim → do → verify → log.
4. Parallel sessions are encouraged on `parallel_safe: true` tasks with non-overlapping `touches`.

## Seam discipline

Business code imports only from `web/lib/`:
- `web/lib/storage.ts` (all DB reads/writes)
- `web/lib/auth.ts` (current user)
- `web/lib/ai-provider.ts` (OpenAI)
- `web/lib/email.ts` (Resend)
- `web/lib/analytics.ts` (PostHog)
- `web/lib/env.ts` (env vars)
- `web/lib/errors.ts` (typed errors)

Never `import { createClient } from '@supabase/supabase-js'` outside `web/lib/`. Never `import OpenAI` outside `web/lib/ai-provider.ts`. Swapping providers should touch exactly one file.

## Design system is canonical

`design-system/` holds authoritative tokens, component specs, seed imagery. Pull colors, spacing, type from:
- `design-system/colors_and_type.css`
- `design-system/ui_kits/studio/tokens.css`
- `design-system/preview/*.html` (visual reference)

Don't invent new design values. Reuse or propose an update to `design-system/`.

## Archive is frozen

`archive/` holds prior work for reference. **Never edit.** If you need a pattern, read it and re-implement forward in `web/`.

## Secrets

- No real API keys in tracked files.
- Env template: `web/.env.example`.
- All secrets via environment variables (Vercel env UI in production).
- If you spot a real key in any tracked file, stop and flag to the human.

## Forbidden without explicit approval

- Committing to `main` (use PRs)
- `git push --force`, `git reset --hard`, `rm -rf`
- Editing anything under `archive/`
- Adding new top-level directories not in `docs/architecture.md`
- Adding new npm dependencies (ask first)
- Running migrations against production Supabase
- Sending real emails outside test mode

## Commit messages

`<area>: <imperative> (<task-id>)`

Examples:
- `web: rename next-scaffold to web (M0-T001)`
- `lib/storage: add listProjects (M1-T005)`
- `docs: clarify seam rule (M0-P004)`

## Running locally

```bash
cd web && pnpm install && pnpm dev   # Next.js dev server (after M0)
cd web && pnpm typecheck             # TS check
cd web && pnpm test                  # Vitest (after tests exist)
cd web && pnpm build                 # production build
```

## When unsure

Ask the human. A 30-second clarification is cheaper than 30 minutes of wrong work.
