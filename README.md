# London Cuts

> Image-first editorial storytelling about London — Punk / Fashion / Cinema modes, postcards, atlas, creator studio.

This repo is the **single source of truth** for the London Cuts project. It consolidates everything that used to be scattered across Desktop folders, Downloads zips, and earlier design handoffs.

---

## Quick start

**See the product running (current prototype):**

```bash
cd app
python3 -m http.server 8000
# open http://localhost:8000
```

If you have an OpenAI key and want the vision pipeline to work, copy `app/local-config.example.js` → `app/local-config.js` and paste your key. `local-config.js` is gitignored.

**Browse the design system:**

```bash
open design-system/preview/brand-roundel.html
open design-system/preview/colors-accent.html
# ...any file in design-system/preview/
```

**Next.js track (parallel implementation):**

```bash
cd next-scaffold
pnpm install
pnpm dev
```

---

## Layout

See `INDEX.md` for the machine-readable file map. High level:

- `app/` — active HTML/React-UMD prototype (what `london-cuts-v3.html` was built from)
- `next-scaffold/` — parallel Next.js + TypeScript implementation, not-yet-merged with app/
- `design-system/` — **canonical** tokens, components, seed imagery, preview pages
- `pitch/` — pitch deck assets (PDF + JSX slides)
- `docs/` — briefs, handoffs, deploy guides, mission
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
- **Two engineering tracks**: `app/` (fast-iteration HTML prototype) and `next-scaffold/` (production-shape Next.js). Decide which to advance before deep work — don't duplicate features across both unnecessarily.
- **Don't edit `archive/`**. If you need something from there, copy it forward.
- **Agent-friendly**: `CLAUDE.md` (root) describes the conventions. Each major subdirectory has its own `README.md`.
