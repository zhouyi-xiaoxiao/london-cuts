---
id: M0-P007
title: Expand M-fast task files (unblock feature-port kickoff)
milestone: M0
kind: parallel
status: TODO
blocked_by: []
blocks: []
parallel_safe: true
touches:
  - tasks/M-fast-feature-port/
owner: null
started_at: null
completed_at: null
---

# M0-P007 — Expand M-fast task files (unblock feature-port kickoff)

**Note:** Redirected 2026-04-20T01:30Z from the original "expand M1 task files" scope. M1 is postponed per plan v2.0; M-fast is now the next active milestone and needs executable task detail before we can start porting.

## Why
`tasks/M-fast-feature-port/README.md` lists 15 tasks (F-T000 through F-T009 + F-P001 through F-P005) at milestone-README level only. When the next agent starts porting, it needs per-task detail: acceptance criteria, pointers to the exact legacy files, and how to verify parity.

## Acceptance criteria
- [ ] Each task listed in `tasks/M-fast-feature-port/README.md` has its own `F-T00X-*.md` or `F-P00X-*.md` file under `tasks/M-fast-feature-port/`
- [ ] Each file uses the same YAML frontmatter as M0 tasks (`id`, `milestone`, `kind`, `status`, `blocked_by`, `blocks`, `parallel_safe`, `touches`, `owner`, `started_at`, `completed_at`)
- [ ] `blocked_by` fields reflect the dependency graph in M-fast/README.md
- [ ] `touches` fields list concrete paths (e.g. `web/components/postcard/`, `web/app/studio/`)
- [ ] Each task names the specific legacy file(s) to read (under `archive/app-html-prototype-2026-04-20/src/`)
- [ ] Each task names the target file(s) in `web/`
- [ ] Each task lists a concrete "verify by" — usually "open http://localhost:3000/... and compare to http://localhost:8000/... side by side"
- [ ] `tasks/STATE.md` M-fast count matches the number of task files created (14)

## Task files to create

| File | Legacy source | Target in web/ |
|------|---------------|----------------|
| `F-T000-poc-port-one-component.md` | pick simplest: `palette.jsx` style buttons | `web/components/postcard/style-picker.tsx` |
| `F-T001-port-shared-utilities.md` | `src/shared.jsx`, `src/data.jsx` | `web/lib/utils/` (new) + `web/lib/seed.ts` |
| `F-T002-split-store-to-domain.md` | `src/store.jsx` | `web/stores/{project,stop,postcard,mode,ui}.ts` |
| `F-T003-port-projects-dashboard.md` | `src/projects-list.jsx` | `web/app/studio/page.tsx` |
| `F-T004-port-workspace-layout.md` | `src/workspace.jsx` | `web/app/studio/[projectId]/page.tsx` |
| `F-T005-port-stop-editor.md` | portion of `src/workspace.jsx` | `web/components/studio/stop-editor.tsx` |
| `F-T006-port-postcard-editor.md` | `src/postcard-editor.jsx` | `web/components/postcard/` (multiple files) |
| `F-T007-port-vision-pipeline.md` | `src/vision-pipeline.jsx` | `web/app/api/vision/route.ts` + client UI |
| `F-T008-port-publish-flow.md` | `src/publish.jsx` | `web/components/studio/publish-dialog.tsx` |
| `F-T009-port-public-pages.md` | `src/public-project.jsx`, `src/public-atlas.jsx` | `web/app/[handle]/[slug]/page.tsx` + `web/app/atlas/page.tsx` |
| `F-P001-port-mode-switcher.md` | scattered in `src/app.jsx`, `src/store.jsx` | `web/components/mode-switcher.tsx` |
| `F-P002-port-maplibre-atlas.md` | map code in `src/*.jsx` | `web/components/map/atlas.tsx` |
| `F-P003-port-pdf-export.md` | postcard-editor export fns | `web/lib/export/pdf.ts` |
| `F-P004-port-png-export-prominent.md` | postcard-editor export fns | `web/lib/export/png.ts` + UI button in postcard editor |
| `F-P005-merge-legacy-css.md` | `styles/base.css` + `styles/v2.css` | `web/app/globals.css` (merged) |

## Guidance

For each file, follow the M0 task file format. Use the legacy files as ground truth. Write concrete, contained tasks — an agent should be able to pick one up cold and execute without asking further questions.

Typical task body sections:
- `## Why` — one paragraph
- `## Acceptance criteria` — checkboxes
- `## Legacy references` — specific line-range pointers where relevant
- `## Target files` — what to create in `web/`
- `## Steps` — ordered list
- `## Verification` — side-by-side vs legacy at localhost:8000
- `## Blockers` — empty; fill if you hit one
- `## Trace` — empty; executing agent fills in

## Verification
```bash
ls tasks/M-fast-feature-port/ | wc -l
# expect: 15 (README + 14 task files)
```

## Trace
