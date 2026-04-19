---
name: london-cuts-design
description: Use this skill to generate well-branded interfaces and assets for London Cuts, a three-voice editorial walks studio. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the Studio app and its Fashion / Punk / Cinema public reader grammars.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Key files

- `README.md` — full brand rules: content fundamentals (tone, casing, pronouns), visual foundations (colors, type, spacing, shadows, corner radii), iconography policy, and mode grammar (Fashion · Punk · Cinema).
- `colors_and_type.css` — drop-in CSS tokens + semantic type utility classes + the three `[data-mode]` override sets. Fonts load from Google Fonts.
- `assets/seed-*.jpg` — twelve ground-truth photographs (SE1, late light, handheld). Use these for placeholders and hero imagery in prototypes.
- `preview/` — one HTML card per design-system concept (type, colors, spacing, components, brand).
- `ui_kits/studio/` — full click-through recreation of the Studio app (Projects, Workspace, Postcard, Public) with reusable JSX components. Start here for any app-surface work.

## Golden rules, one-line each

- Warm cream paper, oxblood accent, near-black ink. No blue. No gradients.
- Instrument Serif / Bodoni italic for display; Archivo body; JetBrains Mono ALL-CAPS for every piece of metadata.
- Hard corners everywhere. The only round things are the roundel, chips, pips, and atlas markers.
- Use the 135° striped `.img-ph` placeholder wherever an image is missing — never generate SVG illustrations.
- Meta reads as `PLACE · TIME · MOOD` in uppercase mono. Editorial prose is sentence-case, first-person, observational.
- Never invent icons. Mono text labels first → unicode glyphs (`→` `←` `↻` `×`) → small functional emoji. No icon libraries.
- Three-mode grammar: Fashion (cream / italic serif) · Punk (paper / Archivo Black / electric red / 6px hard-offset shadows) · Cinema (indigo / subtitle yellow / letterbox).
