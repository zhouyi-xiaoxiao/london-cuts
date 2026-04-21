---
id: F-T003
title: Port projects dashboard ("Your work.")
milestone: M-fast
kind: critical
status: DONE
blocked_by: [F-T002]
blocks: [F-T004]
parallel_safe: false
touches:
  - web/app/studio/page.tsx
  - web/components/studio/projects-dashboard.tsx
  - web/stores/*.ts (useShallow fix)
owner: opus-4.7-session-20260421
started_at: 2026-04-21T02:10Z
completed_at: 2026-04-21T02:30Z
---

# F-T003 — Port projects dashboard

## Why
The first screen a logged-in user sees: "Your work." with a grid of project cards (current + archived). Entry point for creating, switching, and archiving projects.

## Acceptance
- [ ] `/studio` renders a "Your work." header and a projects grid
- [ ] Grid shows: current project marked CURRENT, others as archived cards, plus optional demo cards
- [ ] "NEW PROJECT" button creates a new project via `project` store, sets it current, navigates to `/studio/[projectId]/editor`
- [ ] "LOAD LONDON MEMORIES DEMO" and "LOAD HACKATHON DEMO" buttons load seed data (`web/lib/seed.ts`)
- [ ] "NEW FROM PHOTOS" button opens the vision pipeline flow (placeholder button; wiring is F-T007)
- [ ] Clicking a card switches current project
- [ ] Each card has an archive/unarchive button
- [ ] "RESET DATA" button wipes local data with confirm dialog
- [ ] "Activity" panel at the bottom shows: NOW / TODAY / YESTERDAY / etc. from derived state
- [ ] Visual parity with legacy at http://localhost:8000/#workspace (dashboard view)

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/projects-list.jsx` — the dashboard
- `archive/app-html-prototype-2026-04-20/src/app.jsx` — how it hooks into the router
- Activity panel logic in `archive/app-html-prototype-2026-04-20/src/store.jsx`

## Steps
1. Read legacy `projects-list.jsx`.
2. Create `web/components/studio/projects-dashboard.tsx` (client component).
3. Create `web/app/studio/page.tsx` that renders `<ProjectsDashboard />`.
4. Wire to `project` store for list + current + archive actions.
5. Wire demo loaders to `seed.ts` — loading a demo archives the current project first (destructive-safe).
6. Style via `design-system/colors_and_type.css` tokens (the `Your work.` hero uses serif italic — check legacy).
7. Side-by-side visual compare with legacy at localhost:8000.

## Verification
- Curl `/studio` → 200
- Manual: create 3 projects, switch between them, archive one, confirm current switches correctly
- Manual: load a demo, confirm previous current becomes archived

## Trace

**2026-04-21T02:30Z — opus-4.7-session-20260421 — DONE**

Ran alongside F-P001 subagent + dead-code-audit subagent (3 threads).

Files created/modified:
- `web/components/studio/projects-dashboard.tsx` (new, ~400 lines) — ProjectsDashboard + ProjectCard + ArchivedCard + NewProjectModal. Uses `useProject`, `useStops`, `useAssets`, `useMode`, `useProjectArchive`, `useProjectActions`.
- `web/app/studio/page.tsx` — 1-line swap from scaffold's `StudioDashboardPage` to `<ProjectsDashboard />`.
- `web/tests/projects-dashboard.test.tsx` (new) — 4 tests: heading renders, seed project title appears as CURRENT, stop count shown, Reset Data prompts confirm.

Scope deviations from task file (all consciously):
- **Removed legacy seed-demo buttons** ("Load London Memories demo", "Load Hackathon demo"). They relied on legacy `loadLondonMemoryDemo` globals which no longer exist. These are F-T007 territory (Vision Pipeline).
- **Removed "Demo tour" + "FirstVisitBanner"**. Tour was scope-creep; can come back later as a UX task.
- **Rewrote NewProjectModal location field from legacy "postcode chips" (SE1 / E1 / …) to free-text input**. Matches product scope ("any location anywhere") vs legacy London-only chips.
- **Workspace nav**: cards link to `/studio/<projectId>/editor` which doesn't exist yet — F-T004 will wire that route.

Bug surfaced during smoke test: Zustand's default selector does strict-equality; my action-bundle selectors returned fresh `{ setX, setY, ... }` objects → every render triggered another render → "Maximum update depth exceeded". Fixed with `useShallow` wrappers across **5 hook files**: project.ts, stop.ts, postcard.ts, asset.ts, ui.ts. Added an import line to each and wrapped every `useRootStore(selector)` that returns a new object.

This is a latent-bug class — worth a memory note for future Zustand work: **any hook that returns a fresh object literal must use `useShallow`**. I'll update memory.

Parallel subagents:
- F-P001 (mode switcher) — shipped `web/components/mode-switcher.tsx` + `HtmlModeAttr` wired into `web/app/layout.tsx`. 1 new test (`tests/mode-switcher.test.tsx`).
- Dead-code audit — delivered full migration map; **not acted upon this round** (scope was "report only"). Next-round candidate: migrate `studio-pages.tsx` + `public-pages.tsx` off the legacy `DemoStoreProvider`, then delete `providers/*`, `lib/media-provider.ts`, `lib/seed-data.ts`, `lib/types.ts`, `lib/static-params.ts`.

Verification:
- `pnpm typecheck` green
- `pnpm test` — 18/18 green (13 baseline + 1 F-P001 + 4 F-T003)
- `pnpm build` — green, 33 pages
- Preview MCP `/studio` screenshot — dashboard renders with seed project card, activity feed, header nav
- Preview MCP `/poc` regression — no change, 0 console errors

Unblocks: F-T004 (workspace three-column layout).
