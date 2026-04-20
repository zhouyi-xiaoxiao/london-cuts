---
id: M0-P005
title: Update README.md and INDEX.md for new structure
milestone: M0
kind: parallel
status: DONE
blocked_by: [M0-T001, M0-T002]
blocks: []
parallel_safe: true
touches:
  - README.md
  - INDEX.md
owner: opus-4.7-session-20260420
started_at: 2026-04-20T02:00Z
completed_at: 2026-04-20T02:05Z
---

# M0-P005 — Update `README.md` and `INDEX.md` for new structure

## Why
Both files describe the old two-track layout and list `app/` and `next-scaffold/` as live directories. After M0-T001 and M0-T002, both are wrong. Fix them so a human (or AI) landing on the repo sees the current reality.

## Acceptance criteria
- [ ] `README.md` describes: what the product is, the single `web/` codebase, how to run locally, how to find docs
- [ ] `README.md` no longer lists `app/` or `next-scaffold/` as live directories
- [ ] `INDEX.md` lists current top-level directories with one-line descriptions
- [ ] Both files mention `docs/requirements.md` and `tasks/README.md` as entry points for contributors/AI agents
- [ ] No broken internal links

## README.md shape (suggested)

```md
# London Cuts

A creator tool for documenting a single-location trip with photos, written stories, AI-generated postcards, and a shareable published page. Three visual modes: **Fashion**, **Punk**, **Cinema**.

**Working name:** London Cuts (placeholder). Public launch name TBD.

**Live:** `zhouyixiaoxiao.org` (after M6).

---

## Repo layout

- `web/` — the product (Next.js 14 + TypeScript, pnpm, Node 22+)
- `design-system/` — canonical tokens, components, seed imagery
- `docs/` — requirements, architecture, data model, implementation plan
- `tasks/` — executable task system for AI coding agents
- `archive/` — frozen history (do not edit)
- `pitch/` — pitch deck
- `assets/` — brand marks
- `scripts/` — one-off utilities
- `.github/workflows/` — CI

## Quickstart

```bash
cd web
pnpm install
cp .env.example .env.local   # fill in real values — see web/.env.example
pnpm dev                     # http://localhost:3000
```

## Where to start

- Contributor or AI agent: read `CLAUDE.md`, then `tasks/README.md`, then pick a task from `tasks/STATE.md`.
- Reviewer: read `docs/requirements.md` → `docs/architecture.md` → `docs/data-model.md`.
- Designer: read `design-system/README.md`.

## Docs

- `docs/requirements.md` — what we're building
- `docs/architecture.md` — how it's structured
- `docs/data-model.md` — DB schema
- `docs/implementation-plan.md` — M0–M6 roadmap

## License

(TBD — add before public launch.)
```

## INDEX.md shape (suggested)

```md
# INDEX — quick navigation

## Product
- `web/` — Next.js app (the product)
- `web/lib/` — seam layer (storage, auth, ai-provider, email, analytics)
- `web/app/` — Next.js app-router pages
- `web/components/` — UI components
- `web/supabase/migrations/` — DB schema migrations
- `web/.env.example` — environment variables

## Design
- `design-system/README.md` — start here
- `design-system/colors_and_type.css` — root tokens
- `design-system/ui_kits/studio/` — studio tokens + screens + components
- `design-system/preview/` — visual reference pages (HTML)

## Process
- `CLAUDE.md` — agent instructions (READ FIRST)
- `docs/requirements.md` — requirements (v1.0)
- `docs/architecture.md` — architecture
- `docs/data-model.md` — DB schema
- `docs/implementation-plan.md` — milestones
- `tasks/README.md` — task system overview
- `tasks/AGENTS.md` — agent protocol
- `tasks/STATE.md` — current status
- `tasks/LOG.md` — event history

## Reference
- `archive/` — frozen prior work (do not edit)
- `archive/app-html-prototype-2026-04-20/` — legacy HTML prototype (reference for M3 port)
- `pitch/` — pitch deck
- `assets/` — brand assets
```

## Steps
1. Read current `README.md` and `INDEX.md` to preserve any content still relevant.
2. Replace with the shapes above, adapting content as needed.
3. Check every link:
   ```bash
   grep -oE '\(\w[^)]*\.md\)' README.md INDEX.md | sed 's/[()]//g' | while read f; do test -e "$f" || echo MISSING: $f; done
   ```
4. Commit.

## Verification
```bash
grep -c "next-scaffold\|^app/" README.md INDEX.md
# expect: 0 (outside archive references)

grep -q "tasks/README.md" README.md && echo OK
grep -q "docs/requirements.md" README.md && echo OK
```

## Trace
