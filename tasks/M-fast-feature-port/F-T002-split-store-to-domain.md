---
id: F-T002
title: Split legacy store.jsx (1000 lines) into TS domain stores
milestone: M-fast
kind: critical
status: TODO
blocked_by: [F-T001]
blocks: [F-T003, F-T004, F-P001]
parallel_safe: false
touches:
  - web/stores/
  - web/lib/storage.ts
owner: null
started_at: null
completed_at: null
---

# F-T002 — Split `store.jsx` into TS domain stores

## Why
Legacy `store.jsx` is ~1000 lines holding everything: projects, stops, postcards, UI mode, assets, media tasks, persistence logic. This mega-file is hostile to both humans and AI agents. Split by domain into typed files before porting UI.

## Acceptance
- [ ] `web/stores/project.ts` — projects list + current project + CRUD
- [ ] `web/stores/stop.ts` — stops for current project + CRUD + reorder
- [ ] `web/stores/postcard.ts` — postcards + AI generation state
- [ ] `web/stores/asset.ts` — asset pool (uploaded + generated images) + IndexedDB cache
- [ ] `web/stores/mode.ts` — narrative mode (fashion / punk / cinema)
- [ ] `web/stores/ui.ts` — drawers, modals, active stop, etc.
- [ ] `web/lib/storage.ts` seam fully implemented against localStorage + IndexedDB (replaces the NotImplementedError stubs from M0-P001)
- [ ] Each store file ≤ 400 lines
- [ ] All types strict (no implicit `any`)
- [ ] Legacy `legacy/lc_store_v3` shape migration included if any dev had data there (else skip)
- [ ] `pnpm typecheck` passes
- [ ] An isolated test file shows creating a project, adding a stop, adding a postcard, and reading it back after a "reload" (re-init from localStorage)

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/store.jsx` (entire file)
- Key sections: initial state shape, `persist()`, `restore()`, IndexedDB `assets` / `variants` stores, `mediaTasks`, selectors

## Strategy
1. **First read in full**, make a bullet list of every top-level slice + every action.
2. **Introduce types**: define `Project`, `Stop`, `Postcard`, `Asset`, `NarrativeMode`, `UIState` in `web/lib/storage.ts` (extend the M0 stubs).
3. **Pick a state library**: Zustand is a natural fit (tiny, type-friendly, AI-familiar). Check if already in `web/package.json`; if not, add with user approval first.
4. **Port one slice at a time** in this order: mode → project → stop → asset → postcard → ui. After each slice, run `pnpm typecheck`.
5. **Persistence**: wrap each store with `zustand/middleware/persist` pointing at localStorage, except `asset` which needs IndexedDB (port the legacy IDB helpers into `web/lib/storage.ts`).
6. **Cross-store derived state**: compute in selectors, not duplicate state.

## Steps
1. Read `store.jsx` end to end. Take notes.
2. Ask user if we can add Zustand as a dep. If yes: `pnpm add zustand`.
3. Create `web/stores/mode.ts` as the smallest slice — verify the pattern works.
4. Port remaining slices one at a time, typechecking after each.
5. Fill in `web/lib/storage.ts` CRUD with real impls:
   - localStorage for projects / stops / postcards metadata
   - IndexedDB for asset binary data (data URLs)
6. Write a small test script in `web/scripts/smoke-store.mjs` (or similar) that exercises create→read flow.

## Risks
- **Zustand not yet a dep** → needs user approval to add.
- **IndexedDB SSR** → all IDB code must be inside client components or inside functions called only at runtime, never during module load.
- **Data migration** → if the user had real projects in the legacy app's localStorage, they need to migrate. Out of scope for F-T002; handled via the "migrate from localStorage" prompt in F-T003.

## Verification
After F-T002 ships, the test script runs: create project → add stop → reload the process → stores repopulate from localStorage with the same data.

## Trace
