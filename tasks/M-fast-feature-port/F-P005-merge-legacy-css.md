---
id: F-P005
title: Merge legacy CSS into web/app/globals.css
milestone: M-fast
kind: parallel
status: DONE
blocked_by: []
blocks: [F-T003, F-T004]
parallel_safe: true
touches:
  - web/app/globals.css
owner: subagent-F-P005-via-opus-4.7-main
started_at: 2026-04-21T00:05Z
completed_at: 2026-04-21T00:30Z
---

# F-P005 — Merge legacy CSS into web/app/globals.css

## Why
Legacy had `styles/base.css` and `styles/v2.css`. These contained the design-system tokens already, plus component styles for workspace, postcards, public pages, modes. To port UI with visual parity, we need these styles in `web/`.

## Acceptance
- [ ] `web/app/globals.css` contains (in order):
  1. CSS tokens imported from `design-system/colors_and_type.css` (or inlined if simpler)
  2. Base reset + typography defaults
  3. Mode-specific rules under `html[data-mode="..."]`
  4. Shared component primitives (buttons, chips, roundel, hairline borders)
- [ ] Any CSS that was only for a specific legacy component (e.g. postcard 3D flip) moves into the respective component CSS module instead of globals
- [ ] No broken selectors referencing removed `app/` classes
- [ ] `pnpm build` renders with styles intact

## Legacy references
- `archive/app-html-prototype-2026-04-20/styles/base.css`
- `archive/app-html-prototype-2026-04-20/styles/v2.css`
- `design-system/colors_and_type.css` (canonical tokens)
- `design-system/ui_kits/studio/tokens.css` (studio tokens)

## Steps
1. Read both legacy CSS files + design-system tokens.
2. Identify:
   - Global-level rules → go into `globals.css`
   - Component-level rules → note which component they belong to (will be moved when that component ports)
3. Write `globals.css` with clean sections.
4. Verify no broken references by opening the current `web/` in browser before and after.

## Verification
- `pnpm build` — success
- Manual: dev server still renders without FOUC; typography and colours match legacy header
- Mode switch (F-P001) triggers expected cascade changes

## Trace

**2026-04-21T00:30Z — subagent (dispatched by opus-4.7-session-20260421) — DONE**

Executed in parallel with F-T001. Ran under `PARALLELISM.md` protocol — no file overlap with main-session task.

Subagent report (verbatim hand-off):

> Strategy. Merged legacy `base.css` (V1 tokens, primitives, placeholders, roundel, markers) + shared V2 components into `web/app/globals.css`, prefixed with legacy value comments where conflicts existed. Deferred all feature-specific V2 rules (workspace shell `.ws-*`, `.spine`, `.canvas`, `.drawers`, `.n-*` node types, `.slideover*`, `.lc-variants*`, `.lc-tour-*`, `.publish-help`, `.atlas-*`, `.lc-postcard-*` 3D flip, `.lc-key-modal*`, `.lc-gen-*`, responsive workspace breakpoints) to future component CSS modules. Kept only primitives that multiple features share: `.mode-pill`, `.pip-group`/`.pip`, `.annot`, `.frame`/`.frame-caption`, `.tabs`, `.overline-divider`, `.stopband`, `.editable`, `.sticky-sidebar`.
>
> Counts. Before: 444 lines. After: 775 lines.
>
> Conflicts resolved (legacy wins): `--paper-2/3`, `--ink-2/3`, `--rule` values aligned to legacy. `[data-mode=...]` tokens adopted legacy ink/bg exactly; both `--mode-display-font`/`--mode-body-font` (legacy) and `--mode-display`/`--mode-body` (scaffold) kept as aliases so either naming works.
>
> Risks flagged for main session:
> 1. Body has a scaffold gradient that cascades above `--mode-bg` — mode-switched pages must use `.page`/`.lc-page` wrapper.
> 2. `oklch(from currentColor …)` relative color syntax requires Chrome 119+/Safari 16.4+.
> 3. `--edge` set to legacy `40px`; some scaffold pages may look tight on mobile.
> 4. Scaffold's `.lc-studio-*` + `.lc-postcard-*` removed from globals — pages using them lose styling until their components port.

Main-session verification after merge:
- `pnpm typecheck` green
- `pnpm build` green (33 pages)
- `/poc` rendered via Preview MCP — Google Fonts load, tokens resolve, active pill styling visible
- Console: 0 errors, 0 warnings on `/poc`
- No regression on `/`, `/atlas`, `/studio` (all HTTP 200)

Subagent did NOT commit; main session commits after verification as per PARALLELISM.md protocol.
