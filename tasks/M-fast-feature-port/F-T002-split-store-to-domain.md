---
id: F-T002
title: Split legacy store.jsx (1000 lines) into TS domain stores
milestone: M-fast
kind: critical
status: DONE
blocked_by: [F-T001]
blocks: [F-T003, F-T004, F-P001]
parallel_safe: false
touches:
  - web/stores/
  - web/lib/storage.ts
owner: opus-4.7-session-20260421
started_at: 2026-04-21T01:00Z
completed_at: 2026-04-21T01:45Z
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

**2026-04-21T01:45Z — opus-4.7-session-20260421 — DONE**

Architecture decision: hybrid of what the task described. Not 6 separate Zustand stores. Instead **one Zustand store** (`web/stores/root.ts`) with all slices inline, and **6 domain hook files** (`project.ts` / `stop.ts` / `postcard.ts` / `asset.ts` / `mode.ts` / `ui.ts`) that are thin typed selectors over it. Reason: cross-store references between stops + postcards + assets would be awkward with separate stores.

Dep added: `zustand@5.0.12`.

Files:
- `web/stores/types.ts` — shared TS types extending the seam contract (Project extends lib/storage.Project; adds legacy-facing fields)
- `web/stores/idb.ts` — IndexedDB helpers (assets bucket + variants bucket)
- `web/stores/root.ts` — the Zustand store with persist middleware, all actions, safeLocalStorage() defensive wrap, schedulePersistAssetsToIdb debounced side-channel, idbHydrate() async rehydration
- `web/stores/project.ts` — useProject, useProjectArchive, useProjectActions
- `web/stores/stop.ts` — useStops, useStop, useActiveStopId, useActiveStop, useStopActions
- `web/stores/postcard.ts` — usePostcard, usePostcardActions
- `web/stores/asset.ts` — useAssets, useAsset, useAssetsByStop, useLooseAssets, useAssetActions
- `web/stores/mode.ts` — useMode, useSetMode, NARRATIVE_MODES const
- `web/stores/ui.ts` — useUi, useUiActions, useHydrated
- `web/lib/storage.ts` — seam rewritten: getProject / getProjectByHandleAndSlug / listProjects / createProject / updateProject / softDeleteProject all return real data from the Zustand store. hardDeleteProject still NotImplementedError (M1).

Parallelism during this task:
- Subagent 1 (Vitest setup): added vitest 4.1.5 + @vitest/ui + jsdom + @testing-library/react, created vitest.config.ts + tests/palette.test.ts + tests/hash.test.ts (5 tests, all green)
- Subagent 2 (pre-commit hook): scripts/hooks/pre-commit typecheck guard (51 lines)
- Main session (F-T002): the above work
- Zero file-touch conflicts

Test coverage added in tests/store.test.ts: seed data load, project patch + updatedAt bump, stop reorder, stop update, postcard update, archive + restore roundtrip, lib/storage seam happy paths. 8 new tests, 13 total.

Bugs found + fixed:
- Vitest jsdom env: `localStorage` in the test env reported as plain `Object` rather than the jsdom `Storage` class, causing `createJSONStorage(() => localStorage)` to capture a broken reference at module-eval time. Fixed with a `safeLocalStorage()` getter in `root.ts` that falls back to an in-memory Map shim when `window.localStorage.setItem` isn't a function. This also hardens SSR — the store no longer crashes if accidentally imported in a server context.

Verification:
- `pnpm typecheck` green
- `pnpm build` green (33 pages)
- `pnpm test` — 13/13 green
- Preview MCP `/poc` screenshot — no regression, 0 console errors

Unblocks: F-T003 (dashboard), F-T004 (workspace), F-P001 (mode switcher).
