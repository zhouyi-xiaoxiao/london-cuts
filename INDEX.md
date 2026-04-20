# INDEX — London Cuts repo map

Machine-readable directory map. Each line: `path/  [tags]  description`.
Tags are stable; descriptions may drift — when in doubt, read the folder's own `README.md`.

## Top level

```
app/             [active, prototype, react-umd, html]    Current running prototype. Entry: index.html.
web/   [active, scaffold, nextjs-ts, pnpm]     Parallel Next.js + TS track. Entry: app/page.tsx.
design-system/   [canonical, tokens, assets, preview]    Design system — single source of truth.
pitch/           [deliverable, presentation]              Pitch PDF + JSX slide deck.
docs/            [prose, briefs, handoffs]                All long-form docs in one place.
assets/          [brand, exports]                         Roundel logo, postcard exports.
archive/         [frozen, read-only, historical]          Prior rounds. Do not edit.
scripts/         [tools, utilities]                       Python scripts + demo launchers.
```

## `app/`
```
app/index.html                     — entry, loads src/*.jsx via Babel standalone
app/src/                           — 10+ JSX components (app, store, workspace, postcard-editor, public-*, atlas, …)
app/styles/base.css                — base styles
app/styles/v2.css                  — v2 mode styles
app/seed-images/                   — photos used by the prototype (overlaps with design-system/assets/)
app/local-config.example.js        — template for local OpenAI key (gitignored: app/local-config.js)
```

## `web/`
```
web/app/                 — Next 14 app-router pages
web/components/          — shared UI
web/lib/                 — data + helpers
web/providers/           — media provider adapter (mock)
web/prototype/           — early HTML prototype preserved inside the scaffold
web/package.json         — pnpm, next, react 18
web/CLAUDE.md            — scaffold-specific agent notes (from original handoff)
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
docs/brief-mission.md              — mission / boundaries / priorities (was _reference/original-brief/CLAUDE.md)
docs/brief-v1-readme.md            — v1 brief README
docs/brief-v2.md                   — v2 design brief
docs/handoff-v1.md                 — engineering handoff v1
docs/handoff-v2.md                 — engineering handoff v2
docs/ai-image-prompts.md           — OpenAI image prompt reference
docs/deploy-github-pages.md        — how to deploy to GitHub Pages
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
archive/v1-prototype/prototype-a/  — v1 prototype (was _reference/original-brief/current-prototype)
archive/v1-prototype/prototype-b/  — v1 prototype alt (was _reference/my-rounds-1-and-2)
archive/v1-prototype/screenshots/  — reference screenshots
archive/v2-design/                 — claude.ai/design v2 handoff (React + css)
archive/earlier-handoff/london-cut/— even earlier HTML handoff
archive/earlier-design/design.gz   — opaque design archive
archive/compiled-exports/          — single-file HTML bundles (v2-handoff + v3)
```

## `scripts/`
```
scripts/brace_check.py             — utility
scripts/render_postcards.py        — postcard renderer
scripts/START-LIVE-DEMO.command    — macOS double-click launcher
```

---

## Conventions for agents

1. **Design truth → `design-system/`**. If a color / type / spacing value is in here, do not invent a new one.
2. **Two tracks**: changes go into `app/` OR `web/`, not both. Confirm with user before cross-porting.
3. **Never edit `archive/`**. Copy forward if you need something.
4. **Secrets**: no real API keys in tracked files. `app/local-config.js` is gitignored.
5. **New top-level folder**: update this `INDEX.md` and root `README.md` in the same change.
