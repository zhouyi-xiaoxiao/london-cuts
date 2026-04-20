# London Cuts

> Image-first editorial storytelling about London — Punk / Fashion / Cinema modes, postcards, atlas, creator studio.

This repo is the **single source of truth** for the London Cuts project. It consolidates everything that used to be scattered across Desktop folders, Downloads zips, and earlier design handoffs.

---

## Quick start

```bash
cd web
pnpm install
pnpm dev
# open http://localhost:3000
```

**Browse the design system:**

```bash
open design-system/preview/brand-roundel.html
# ...any file in design-system/preview/
```

---

## Layout

See `INDEX.md` for the machine-readable file map. High level:

- `web/` — the product (Next.js 14 + TypeScript, pnpm, Node 22+)
- `design-system/` — **canonical** tokens, components, seed imagery, preview pages
- `docs/` — requirements, architecture, data model, implementation plan
- `tasks/` — executable task system for AI coding agents (M0–M6)
- `pitch/` — pitch deck assets (PDF + JSX slides)
- `assets/` — brand marks, postcard exports
- `archive/` — frozen historical versions, do not edit
- `scripts/` — utilities

---

## Project mission

From `docs/brief-mission.md`:

> Build the core product shell for London Cuts. Image-to-image and image-to-video generation are owned by another teammate. This repo must provide the surrounding product experience: public story website, story atlas, creator studio, upload/organize/edit flow, mode switching, postcard generation, media provider adapter and integration shell.

Do **not** implement actual image-to-image or image-to-video model calls here — use the adapter interface and mock provider.

---

## Contributing / extending

- **Design changes** flow from `design-system/` outward. The tokens in `design-system/colors_and_type.css` and `design-system/ui_kits/studio/tokens.css` are the source of truth.
- **Single codebase**: all product code lives in `web/`. The legacy HTML prototype is frozen in `archive/app-html-prototype-2026-04-20/` — do not edit it.
- **Don't edit `archive/`**. If you need something from there, copy it forward into `web/`.
- **Agent-friendly**: `CLAUDE.md` (root) describes the conventions. Each major subdirectory has its own `README.md`. Task system in `tasks/` is the live execution plan.
