---
id: F-T009
title: Port public project page + atlas page
milestone: M-fast
kind: critical
status: TODO
blocked_by: [F-T006, F-T008]
blocks: []
parallel_safe: false
touches:
  - web/app/[handle]/[slug]/page.tsx
  - web/app/[handle]/[slug]/chapter/[stop]/page.tsx
  - web/app/[handle]/[slug]/p/[stop]/page.tsx
  - web/app/atlas/page.tsx
owner: null
started_at: null
completed_at: null
---

# F-T009 — Port public pages

## Why
Published projects need to render beautifully for readers. Three public views: project overview, single stop chapter, single postcard. Plus a global atlas of all public projects.

## Acceptance
- [ ] `/<handle>/<slug>` renders project: hero, mode switch, atlas minimap, stops index, scroll-to-stop
- [ ] `/<handle>/<slug>/chapter/<stop>` renders a single stop: hero image, full body, mode-specific layout
- [ ] `/<handle>/<slug>/p/<stop>` renders a single postcard: flip card, full screen, download button
- [ ] `/atlas` renders grid of all public projects with featured story + mini-map
- [ ] All four pages respect the reader's mode choice (Fashion / Punk / Cinema)
- [ ] Mode switch persists across pages (localStorage)
- [ ] For M-fast: reads from local project store (same browser = same user). Cross-device sharing waits for Supabase.

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/public-project.jsx`
- `archive/app-html-prototype-2026-04-20/src/public-atlas.jsx`
- `archive/app-html-prototype-2026-04-20/src/public-*.jsx` — any other public pages

## Steps
1. Read legacy public pages fully.
2. For each page, create `page.tsx` at the target path:
   - Dynamic segments handled via Next `generateStaticParams` using seed projects for build
   - Client-side render of real store data at runtime
3. Mode-specific layouts: use conditional rendering or three layout components — match legacy.
4. MapLibre atlas embed: see F-P002 (ported separately, used here).

## M-fast limitation
Because data is in the user's browser only, public URLs will not work for other browsers. This is **acceptable** during M-fast + M-preview — we'll resolve it when Supabase lands in M1. During M-preview, seeding the demo via localStorage on visit (through a `?seed=london-memories` query param) provides a shareable experience.

## Verification
- Publish a project in studio, open the generated URL → see the public render
- Switch modes on the public page → layout changes
- Open atlas → see all public projects

## Trace
