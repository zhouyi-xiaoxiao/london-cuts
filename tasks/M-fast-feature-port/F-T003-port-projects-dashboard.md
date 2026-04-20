---
id: F-T003
title: Port projects dashboard ("Your work.")
milestone: M-fast
kind: critical
status: TODO
blocked_by: [F-T002]
blocks: [F-T004]
parallel_safe: false
touches:
  - web/app/studio/page.tsx
  - web/components/studio/projects-dashboard.tsx
owner: null
started_at: null
completed_at: null
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
