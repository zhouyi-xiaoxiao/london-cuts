---
id: F-T008
title: Port publish flow (pre-flight, visibility, publish action)
milestone: M-fast
kind: critical
status: TODO
blocked_by: [F-T005]
blocks: [F-T009]
parallel_safe: false
touches:
  - web/components/studio/publish-dialog.tsx
  - web/stores/project.ts
owner: null
started_at: null
completed_at: null
---

# F-T008 — Port publish flow

## Why
Without publish, there's no shareable output. This task puts a finished project behind a public URL.

## Acceptance
- [ ] "PUBLISH" button in workspace header opens slideover dialog
- [ ] Pre-flight checklist: ✓ all stops have hero, ✓ all have body, ✓ all have postcard; red × and "edit" link for missing items
- [ ] Slug field: auto-derived from title, editable, collision warning within user's projects
- [ ] Visibility radio: public (default) / unlisted / private (matches requirements FR4.3)
- [ ] "PUBLISH" action: sets `status = 'published'`, `publishedAt = now()`, preserves visibility
- [ ] "UNPUBLISH" action (if already published): back to draft, keeps slug
- [ ] "COPY PUBLIC LINK" button → copies `http://localhost:3000/<handle>/<slug>` (in preview deploy: vercel URL)
- [ ] "OPEN PUBLIC PROJECT" button → new tab

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/publish.jsx` — publish slideover
- `archive/app-html-prototype-2026-04-20/src/store.jsx` — publish action logic

## Steps
1. Read legacy `publish.jsx`.
2. Build `<PublishDialog />` as a slideover from the right (match legacy animation, 260ms).
3. Compute pre-flight from derived state across stops + postcards.
4. Wire publish/unpublish to `project` store.
5. Handle a temp `handle` for M-fast: since there's no real user yet, use a placeholder like `yx` from an env var or mock `auth.ts`.

## Notes
- In M-fast, `handle` is essentially mocked. In M2, it comes from real `profiles` table.
- URL format `/<handle>/<slug>` is locked — public project page in F-T009 must match.

## Verification
- Open publish dialog for a ready project → checklist all green → publish → status updates → link copy works
- Open same dialog for half-done project → checklist shows red ×s → publish disabled

## Trace
