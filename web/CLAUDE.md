# web/ — agent notes

This subdirectory is the **product codebase**. Authoritative agent instructions live one level up at [../CLAUDE.md](../CLAUDE.md).

Always start there:

1. `../CLAUDE.md` — top-level agent instructions
2. `../docs/requirements.md` — what we're building
3. `../docs/architecture.md` — how `web/` is structured
4. `../docs/implementation-plan.md` — current milestone (plan v2.0 — features-first)
5. `../tasks/AGENTS.md` — protocol for claiming and finishing tasks
6. `../tasks/STATE.md` — what's TODO / IN_PROGRESS / DONE right now

## Local specifics to this folder

- Framework: Next.js 14 + TypeScript (app-router), pnpm, Node 22+.
- Seams live in `lib/` — all external service access must go through them. See `../docs/architecture.md#4-the-seam-layers`.
- Client state: domain stores under `stores/` (split during M-fast from the legacy monolithic `store.jsx`).
- Never import third-party SDKs outside `lib/`.

## Do not

- Re-introduce GitHub Pages config (`output: export`, `basePath`, `trailingSlash`) — removed in M0-P003.
- Edit anything under `../archive/` — it's frozen reference material.
- Invent new design tokens — pull from `../design-system/colors_and_type.css`.

## Running

```bash
pnpm install
pnpm dev         # http://localhost:3000
pnpm typecheck
pnpm build
```
