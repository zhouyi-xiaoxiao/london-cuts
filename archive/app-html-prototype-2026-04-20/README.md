# app/ — London Cuts HTML prototype (V3)

Active HTML + React 18 (UMD) + Babel-standalone prototype. No build step.

## Run

```bash
cd app
python3 -m http.server 8000
# open http://localhost:8000
```

## Routes (append to URL hash)

- `#projects` — project list (default)
- `#workspace` — studio canvas (spine + hero + drawer)
- `#public` — public project page with live MapLibre SE1 atlas (10 stops)
- `#public/atlas` — standalone atlas view
- `#postcard/05` — postcard editor for stop 05 (replace 05 with any 01-12)
- `#publish` — publish slideover

## Files

- `index.html` — entry; loads `src/*.jsx` via Babel at runtime, refresh to apply edits
- `src/*.jsx` — app, store, workspace, publish, postcard-editor, public-project, public-atlas, projects-list, data, shared, palette, seed-demo, vision-pipeline, hackathon-demo, prestyle, demo-tour
- `styles/base.css` + `styles/v2.css` — styling
- `seed-images/` — demo photos

Canonical tokens & component specs live in `../design-system/`. Pull colors / typography from there, don't invent new values.

## OpenAI key (optional — for vision pipeline / image-gen ⚡)

`index.html` loads `local-config.js` if present. That file is **gitignored**.

```bash
cp local-config.example.js local-config.js
# edit local-config.js — paste sk-proj-... key
```

At runtime, keys pasted via the ⚡ modal go to sessionStorage only (cleared on tab close).

## Caveats

- OpenAI `/v1/images/generations` may CORS-block `file://` origins — always serve via a local HTTP server
- MapLibre basemaps come from `basemaps.cartocdn.com` (needs network)
- Workspace body editor is demo-grade (content from BODY_05 only); TipTap wiring is a next iteration

## Archived single-file bundle

`archive/compiled-exports/london-cuts-v3.html` is a 145 KB standalone export of an earlier state of this directory. Useful for sharing as a single file; don't treat as live.
