# Archived 2026-04-20

This is the HTML + UMD React prototype that ran London Cuts before the M0 consolidation (task `M0-T002`). All feature work moves to `web/` from here on. **Do not edit this directory.**

## What was here

- `index.html` — loaded `src/*.jsx` via Babel standalone (no build step)
- `src/` — 17 JSX components (~1800 lines), including:
  - `app.jsx` — router / top-level shell
  - `store.jsx` — centralized client state (~1000 lines)
  - `workspace.jsx` — three-column studio editor (spine / canvas / drawers)
  - `postcard-editor.jsx` — 3D flip-card editor for stop postcards
  - `vision-pipeline.jsx` — GPT-4o image-analysis adapter (folder → auto-stops)
  - `public-*.jsx` — reader-facing public pages
  - `projects-list.jsx`, `publish.jsx`, `seed-demo.jsx`, `demo-tour.jsx`, `hackathon-demo.jsx`
- `styles/base.css`, `styles/v2.css` — CSS
- `seed-images/` — demo photography
- `local-config.example.js` — template for pasted OpenAI key (never tracked)
- `generated-images/` — AI output cache

And the scripts that only drove this prototype:
- `scripts/START-LIVE-DEMO.command` — macOS double-click launcher (Python http server + browser open)
- `scripts/deploy-phase-a.sh` — Cloudflare Pages staging script with secret filters

## Why archive rather than delete

Functional reference for the `web/` port during **M3 Feature parity migration** (see `tasks/M3-feature-parity/README.md`):

| Want to port… | Read… |
|---|---|
| Vision pipeline (GPT-4o photo analysis) | `src/vision-pipeline.jsx` |
| 6 postcard art styles | `src/postcard-editor.jsx` |
| 3D flip-card interaction | `src/postcard-editor.jsx` |
| Original client-state shape | `src/store.jsx` (compare to `docs/data-model.md`) |
| Multi-project dashboard | `src/projects-list.jsx` |
| Public project page layout | `src/public-project.jsx` |
| Mode-aware MapLibre atlas | `src/*.jsx` that touches `maplibre-gl` |
| Publish pre-flight checklist | `src/publish.jsx` |
| PDF + PNG export | `src/postcard-editor.jsx` + export helpers |

The `WHY-ARCHIVED.md` pattern is standard across `archive/`. Future work should follow it.

## How to run it (read-only)

If you need to see the legacy prototype running locally for reference:

```bash
cd archive/app-html-prototype-2026-04-20
python3 -m http.server 8000
# open http://localhost:8000
```

This is a reference activity. Do not make changes here — any fix belongs in `web/`.
