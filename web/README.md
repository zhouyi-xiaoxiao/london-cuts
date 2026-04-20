# London Cuts

London Cuts is the real engineering implementation of the original handoff prototype in this folder. The repo builds the surrounding product shell for:

- public story website
- story atlas
- creator studio
- upload / organize / edit flow
- Punk / Fashion / Cinema mode switching
- postcard preview and PNG export
- swappable media provider adapter

Actual image-to-image and image-to-video model calls are intentionally not implemented here. Those are owned by another teammate and isolated behind a provider abstraction.

## Structure

- `app/` — Next.js App Router routes
- `components/public-pages.tsx` — landing, public story, atlas, chapter, postcard
- `components/studio-pages.tsx` — dashboard, create, upload, organize, editor, media, publish
- `components/ui.tsx` — shared shells, mode switcher, asset surface, nav
- `providers/demo-store-provider.tsx` — client-side demo store and happy-path actions
- `lib/types.ts` — core data model
- `lib/seed-data.ts` — seed project, stops, assets, explore feed
- `lib/media-provider.ts` — `MediaProvider` and `MockMediaProvider`
- `prototype/` — preserved design handoff source
- `CLAUDE.md` — project mission and scope boundaries
- `.claude/agents/` — project subagent definitions

## Run

```bash
cd /Users/ae23069/Downloads/london-cut/project
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Path

1. `/`
2. Switch between `punk`, `fashion`, and `cinema`
3. Open the featured story
4. Open a chapter
5. Open the postcard and download PNG
6. `/studio/project-se1/upload`
7. Add a few local files
8. `/studio/project-se1/organize`
9. `/studio/project-se1/editor`
10. `/studio/project-se1/media`
11. `/studio/project-se1/publish`

## Public Routes

- `/`
- `/atlas`
- `/@ana-ishii/a-year-in-se1`
- `/@ana-ishii/a-year-in-se1/chapter/waterloo-bridge-facing-east`
- `/@ana-ishii/a-year-in-se1/p/waterloo-bridge-facing-east`

## Studio Routes

- `/studio`
- `/studio/new`
- `/studio/project-se1/upload`
- `/studio/project-se1/organize`
- `/studio/project-se1/editor`
- `/studio/project-se1/media`
- `/studio/project-se1/publish`

## Media Adapter

The teammate-owned generation system plugs in through the `MediaProvider` interface in `lib/types.ts`.

Current implementation:

- `createImageToImageJob(input)`
- `createImageToVideoJob(input)`
- `getJobStatus(job)`

`MockMediaProvider` simulates queueing, running, completion, and generated assets so the rest of the product can be demoed end-to-end.

## Replacing The Mock Provider

1. Keep the `MediaProvider` interface stable if possible.
2. Replace `MockMediaProvider` in `lib/media-provider.ts` with a real adapter.
3. Map teammate API responses back into:
   - `MediaGenerationJob`
   - optional `resultAsset`
4. Leave page components untouched; integration logic should stay inside the adapter and store layer.

## Current Limits

- Uploads use browser object URLs and are not durable across a full reload.
- Atlas is a stylized story overview, not a GIS map.
- Editor is an MVP structured editor, not TipTap/Lexical yet.
- Postcard export is PNG only.
- No auth, real persistence, or multi-user collaboration yet.

## QA

```bash
pnpm typecheck
pnpm lint
pnpm build
```
