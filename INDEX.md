# INDEX — London Cuts repo map

Machine-readable directory map. Each line: `path/  [tags]  description`.
Tags are stable; descriptions may drift — when in doubt, read the folder's own `README.md`.

## Top level

```
web/             [active, product, nextjs-ts, pnpm]      The product. Entry: app/page.tsx.
design-system/   [canonical, tokens, assets, preview]    Design system — single source of truth.
docs/            [prose, specs]                           Requirements, architecture, data model, plan.
tasks/           [execution, agents]                      M0–M6 task system for AI coding agents.
pitch/           [deliverable, presentation]              Pitch PDF + JSX slide deck.
assets/          [brand, exports]                         Roundel logo, postcard exports.
archive/         [frozen, read-only, historical]          Prior rounds. Do not edit.
scripts/         [tools, utilities]                       Python scripts + utilities.
```

## `web/`
```
web/app/                 — Next 14 app-router pages
web/components/          — shared UI (scaffold stubs; real components land in M-fast)
web/lib/                 — seam layer (storage, auth, ai-provider, email, analytics, env, errors)
web/providers/           — React context providers (media provider adapter, demo store)
web/prototype/           — early scaffold prototype kept for reference
web/stores/              — domain state (will land in M-fast, F-T002 split from legacy store.jsx)
web/supabase/migrations/ — DB migrations (empty scaffold; filled in M1)
web/.env.example         — environment variable template (M0-P002)
web/package.json         — pnpm, next 16, react 19
web/CLAUDE.md            — local pointer to root CLAUDE.md
```

## `design-system/`
```
design-system/README.md            — overview
design-system/SKILL.md             — skill-style usage notes
design-system/colors_and_type.css  — color + typography tokens (CANONICAL)
design-system/assets/              — 13 official seed images (CANONICAL)
design-system/preview/             — 24 HTML previews of tokens + components
design-system/slides/              — 6 pitch slides (JSX + jpg + deck-stage.js)
design-system/ui_kits/studio/      — Studio UI kit (tokens.css, screens.jsx, components.jsx)
```

## `pitch/`
```
pitch/London-Cuts-Pitch.pdf        — 15 MB pitch document
pitch/deck/                        — 7 JSX slides + seed photos + deck-stage.js
```

## `docs/`
```
docs/requirements.md               — CURRENT: requirements v1.0 (frozen)
docs/architecture.md               — CURRENT: target architecture + seam layers
docs/data-model.md                 — CURRENT: target DB schema + RLS
docs/implementation-plan.md        — CURRENT: milestone roadmap (plan v2.0)
docs/SECURITY.md                   — security notes / past incidents
docs/brief-mission.md              — historical: mission / boundaries (kept for context)
docs/brief-v1-readme.md            — historical: v1 brief
docs/brief-v2.md                   — historical: v2 design brief
docs/handoff-v1.md                 — historical: engineering handoff v1
docs/handoff-v2.md                 — historical: engineering handoff v2
docs/ai-image-prompts.md           — OpenAI image prompt reference
docs/deploy-github-pages.md        — (obsolete since Vercel; retained as reference)
```

## `tasks/`
```
tasks/README.md                    — how the task system works
tasks/AGENTS.md                    — agent protocol (claim → do → verify → log)
tasks/STATE.md                     — live snapshot of all task status
tasks/LOG.md                       — append-only event history
tasks/M0-consolidation/            — M0 tasks (in progress)
tasks/M-fast-feature-port/         — M-fast tasks (next, after M0)
tasks/M1-supabase-data/            — POSTPONED (per plan v2.0)
tasks/M2-auth-invites/             — POSTPONED (per plan v2.0)
tasks/M3-feature-parity/           — SUPERSEDED by M-fast
tasks/M4-public-pages/             — POSTPONED
tasks/M5-observability/            — POSTPONED
tasks/M6-launch/                   — POSTPONED
```

## `assets/`
```
assets/roundel-logo.png
assets/roundel-logo.gif
assets/postcard-previews/          — early postcard render exports (png)
assets/postcard-exports/           — postcard renders from Downloads (png)
```

## `archive/`
```
archive/app-html-prototype-2026-04-20/  — legacy HTML + UMD React prototype (frozen M0-T002)
archive/v1-prototype/prototype-a/       — v1 prototype
archive/v1-prototype/prototype-b/       — v1 prototype alt
archive/v1-prototype/screenshots/       — reference screenshots
archive/v2-design/                      — claude.ai/design v2 handoff (React + css)
archive/earlier-handoff/london-cut/     — even earlier HTML handoff
archive/earlier-design/design.gz        — opaque design archive
archive/compiled-exports/               — single-file HTML bundles (v2-handoff + v3)
```

## `scripts/`
```
scripts/brace_check.py             — utility
scripts/render_postcards.py        — postcard renderer
```
Legacy launch/deploy scripts moved into `archive/app-html-prototype-2026-04-20/scripts/`.

---

## Conventions for agents

1. **Design truth → `design-system/`**. If a color / type / spacing value is in here, do not invent a new one.
2. **Single codebase → `web/`**. The legacy HTML prototype in `archive/app-html-prototype-2026-04-20/` is read-only reference.
3. **Never edit `archive/`**. Copy forward if you need something.
4. **Secrets**: no real API keys in tracked files. See `web/.env.example`.
5. **New top-level folder**: update this `INDEX.md` and root `README.md` in the same change.
6. **Task-driven work**: see `tasks/README.md` and `tasks/AGENTS.md`.
