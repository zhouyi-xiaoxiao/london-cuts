# next-scaffold/ — Next.js + TypeScript track

Parallel implementation of London Cuts using Next.js 14 (app router) + TypeScript + pnpm. Imported from an earlier handoff bundle; **not yet at feature parity with `app/`**.

## Run

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

## Structure

- `app/` — Next app-router pages
- `components/` — shared UI
- `lib/` — data + helpers
- `providers/` — media provider adapter (mock)
- `prototype/` — early HTML prototype preserved inside the scaffold
- `CLAUDE.md` — original handoff-specific agent notes (kept for context)
- `README.md` — original handoff README (kept for context)

## Relationship with `../app/`

`app/` is the fast-iteration HTML prototype; `next-scaffold/` is the production-shape attempt.
Features should live in **one** of the two. Confirm with the user before cross-porting.

Design tokens come from `../design-system/` in both cases.
