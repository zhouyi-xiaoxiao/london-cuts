# CLAUDE.md — agent instructions for this repo

You're working in the London Cuts repo. Before doing anything substantial, read `README.md` and `INDEX.md`.

## Mission (short)

Build the product shell for London Cuts: a public story website, story atlas, creator studio, upload/organize/edit flow, mode switching (Punk / Fashion / Cinema), postcard generation, and a media-provider adapter with a mock implementation. **Do not implement real image-to-image or image-to-video generation** — that's owned by a teammate; keep it behind the provider adapter.

Longer version in `docs/brief-mission.md`.

## Two engineering tracks — pick one per change

- `app/` — HTML + React-UMD + Babel-standalone prototype. Fast to iterate, runs from a static server, used for live demos. This is what `london-cuts-v3.html` was built from.
- `next-scaffold/` — Next.js 14 app-router + TypeScript + pnpm. Production-shape, not yet at feature parity with `app/`.

When in doubt, ask the user which track they want a change in. Don't mirror features across both without explicit direction.

## Design system is canonical

`design-system/` holds the authoritative tokens, component specs, and seed imagery.

- `design-system/colors_and_type.css` — root color + typography tokens
- `design-system/ui_kits/studio/tokens.css` — Studio-specific tokens
- `design-system/preview/*.html` — visual reference for each token/component

If you need a color, spacing, or font scale, pull it from here. Do not invent new values.

## Archive is frozen

`archive/` contains prior design rounds and earlier prototypes. **Do not edit anything under `archive/`.** If you need a pattern from there, read it and re-implement forward in `app/` or `next-scaffold/`.

## Secrets

- No real API keys in tracked files.
- `app/local-config.js` is gitignored — it's where the OpenAI key for the vision pipeline lives. Template: `app/local-config.example.js`.
- If you spot a real key in any tracked file, stop and flag it to the user.

## Conventions

- Paths are all lowercase, hyphenated, no spaces (exception: `START-LIVE-DEMO.command` is a historical macOS launcher).
- When you add a top-level folder, update both `README.md` and `INDEX.md` in the same change.
- Each major subdirectory should have its own `README.md` describing what's inside and how to use it.
- Commit messages: one-line subject, imperative mood. Example: `app: add punk mode toggle`.

## Running things locally

```bash
# HTML prototype
cd app && python3 -m http.server 8000

# Next.js track
cd next-scaffold && pnpm install && pnpm dev

# Preview a design-system page
open design-system/preview/brand-roundel.html
```

## When in doubt

Ask the user. The project has a clear owner who wants direction-level input before you make structural changes.
