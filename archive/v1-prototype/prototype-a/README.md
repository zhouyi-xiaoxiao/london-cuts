# London Cuts — MVP

AI-native London storytelling platform. This repo holds the product shell: public story site, atlas, studio flow, postcards, and the media-provider adapter. Image-to-image and image-to-video generation live behind a provider interface and are stubbed with a mock.

Bundled from the Claude Design handoff (`HANDOFF.md`) — recreate pixel-perfect in your target stack (Next.js suggested); the HTML/CSS/JS prototype here is the source of truth for layout, typography, and mode grammar.

## Run the prototype

The prototype runs directly in any modern browser — no build step.

```
cd london-cuts
python3 -m http.server 8000
# then open http://localhost:8000
```

You can also open `index.html` via `file://`, but some browsers block local `<script>` loading; the localhost route is safer.

The top toolbar switches between the 12 screens. The three-way mode switch (Punk / Fashion / Cinema) lives inside the public surfaces and persists to `localStorage`.

## What's here

```
london-cuts/
├─ CLAUDE.md                     project mission + boundaries
├─ README.md                     you are here
├─ HANDOFF.md                    full engineering handoff from design
├─ index.html                    app shell (React-via-Babel, screen router)
├─ design-canvas.jsx             dev canvas view (not wired into index.html)
├─ styles/
│  └─ base.css                   tokens + mode grammars
└─ src/
   ├─ data.jsx                   PROJECT, STOPS, PROJECTS_FEED seed data
   ├─ store.jsx                  project store — localStorage-backed pub/sub
   ├─ media-provider.jsx         MediaProvider interface + MockMediaProvider
   ├─ postcard-export.jsx        canvas-based PNG export (2100 × 1500)
   ├─ shared.jsx                 PublicNav, ModeSwitcher, StudioShell primitives
   ├─ public-landing.jsx         01 · Landing
   ├─ public-project.jsx         02 · Public project (Punk / Fashion / Cinema variants)
   ├─ public-atlas.jsx           03 · Atlas
   ├─ public-stop.jsx            04 · Stop (per-mode variants)
   ├─ public-postcard.jsx        05 · Postcard (front/back flip + real PNG download)
   ├─ studio-dashboard.jsx       06 · Studio · 07 · Create project
   ├─ studio-organize.jsx        08 · Upload memories · 09 · Organize stops
   └─ studio-editor.jsx          10 · Story editor · 11 · Media panel · 12 · Publish
```

Script load order in `index.html` matters: `data → store → media-provider → postcard-export → shared → public-* → studio-*`. Everything exposes via `Object.assign(window, ...)` because Babel-standalone has no module support.

## Mode grammar (summary)

| Aspect    | Punk                          | Fashion                       | Cinema                        |
|-----------|-------------------------------|-------------------------------|-------------------------------|
| Display   | Archivo Black, upper, rotate  | Bodoni Moda italic            | Instrument Serif              |
| Body      | Archivo / JetBrains Mono      | Archivo                       | JetBrains Mono (subtitles)    |
| Surface   | near-white                    | warm cream                    | deep blue-black               |
| Accent    | red-orange                    | oxblood                       | subtitle yellow               |
| Layout    | collage, taped tilts, ransom  | whitespace, single hero crop  | letterbox, slate, shot list   |

Each public page owns three JSX layouts (not one themed layout) — layout grammar diverges on purpose. See `HANDOFF.md §7`.

## Media provider boundary

The media module is owned by a teammate. Screens never call it directly — they call a `MediaProvider` singleton. The prototype ships a `MockMediaProvider` so the whole flow works offline.

Contract (see `src/media-provider.jsx` for the JS types, `HANDOFF.md §8.5` for the network mapping):

```js
interface MediaProvider {
  id: string;                                // 'mock' | 'teammate-real' | ...
  createImageToImageJob(spec) => Promise<{ taskId }>
  createImageToVideoJob(spec) => Promise<{ taskId }>
  getJobStatus(taskId)        => Promise<MediaTask>
  cancelJob(taskId)           => Promise<void>
  retryJob(taskId)            => Promise<{ taskId }>   // returns a new task id
  subscribe(taskId, handler)  => () => void            // unsubscribe
}

type MediaTaskState = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';
```

`MediaTask` shape: `{ id, kind, providerId, stopId, sourceAssetId, mode, prompt?, strength?, seed?, state, progress, etaMs?, durationMs?, resultAssetId?, error?, createdAt, updatedAt }`.

`kind` is `img2img` or `img2vid`. Tasks are stored in the project store; the UI only ever references `task.id` / `task.resultAssetId`.

### Swap in the real service

1. Implement the interface against the teammate's API (REST + WS or polling).
2. Call the setter once at boot:
   ```js
   setMediaProvider(new TeammateRealProvider({ baseUrl, token }));
   ```
3. Delete `seedMediaTasksIfEmpty` or guard it behind `providerId === 'mock'`.

Nothing else changes — the Media panel, Story editor, and Postcard screens all talk to `getMediaProvider()`.

## Persistent store

All cross-screen state lives in `src/store.jsx` under `localStorage['lc_store_v1']`:

- `project` — title, author, slug, tags, default mode, visibility
- `assets` — uploaded files (blob URLs are rehydrated per session, metadata persists)
- `stops` — `STOPS` with added `assetIds[]` + `heroAssetId`
- `mediaTasks` — owned by the MediaProvider
- `postcardVersions` — `{ [stopId]: [ { versionId, ts, durationMs, mode, side } ] }`

Use `useStore(selector)` inside React and `storeActions.*` outside. The floating toolbar has a **Reset** button that clears the store and reloads.

## Demo path

Landing → Studio dashboard → Create project → Upload memories (drag a folder, or "Load seed") → Organize stops (drag into clusters, set hero) → Story editor (write + pull from Media panel) → Media panel (kick off img2img / img2vid, watch progress, retry failures) → Postcard (flip, download PNG) → Publish (preview, share link).

## Current limits

- No real image-to-image or image-to-video — only the mock provider. Scope per `CLAUDE.md`.
- Blob URLs for uploaded photos/videos don't survive reload; metadata does.
- One project at a time — the store is flat by design.
- No server, no auth — everything is local.

## Next steps for the production port

1. Next.js app router; SSR public pages, client-only studio.
2. Keep `styles/base.css` tokens; port to CSS Modules or Vanilla Extract (not Tailwind — typographic rhythm is easier in plain CSS here).
3. TipTap or Lexical for the story editor; nodes: `heroImage`, `inlineImage`, `pullQuote`, `mediaEmbed`.
4. Mapbox GL for atlas once real pan/zoom is needed; MVP stays stylized SVG.
5. Postcard PNG export: server-side render the same React tree to 2100×1500 at 350dpi.
6. Swap `location.hash` deep links for real routes.
7. Wire the analytics events listed in `HANDOFF.md §8.12`.
