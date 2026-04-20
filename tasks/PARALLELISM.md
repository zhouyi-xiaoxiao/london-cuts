# PARALLELISM.md — Running tasks in parallel with subagents

How to use the Agent tool to parallelise task execution in this repo without stepping on your own toes.

## When parallel is safe

A task X is safe to spawn as a subagent while the main session works on task Y when **all** of these hold:

1. Both task files declare `parallel_safe: true` in their frontmatter.
2. The `touches:` arrays in the two frontmatters have **zero overlap**. Compare path prefixes — `web/lib/utils/` and `web/app/globals.css` are safe; `web/lib/storage.ts` and `web/lib/auth.ts` are safe (different files); `web/lib/` and `web/lib/utils/` overlap and are **not safe**.
3. Neither task needs to read the *in-progress* state of the other. If X can be done cold from legacy + docs, it's a candidate.
4. No pending owner checkpoint between them.

If any check fails, run sequentially.

## When parallel is *not* worth it

- Task takes < 5 minutes — subagent spin-up + merge overhead dominates.
- Task requires judgment accumulated from the current session (e.g. "now that you've split the store, update callers").
- Task is a refactor touching many files with unclear boundaries.
- You'd need to re-verify the subagent's output in full anyway — prefer doing it yourself.

## Spawn protocol

When dispatching a subagent:

1. **Read the task file yourself first** (main session). Scan for surprises. If anything is unclear, clarify before dispatch — don't pass ambiguity downstream.
2. **Build a self-contained prompt** that includes:
   - The task ID and full path to the task file (`tasks/M-fast-feature-port/F-P005-merge-legacy-css.md`)
   - Absolute paths to every legacy reference the subagent needs to read
   - The absolute path(s) it is allowed to write
   - Explicit "do not commit, do not push, report back a diff summary"
   - Acceptance criteria it must satisfy before returning DONE
   - A word-count cap on the return summary (e.g. "report in under 300 words")
3. **Launch with `Agent` tool**, `subagent_type: "general-purpose"` unless a more specialised one fits, `run_in_background: true` so main session can continue.
4. **Claim the task in frontmatter** (`status: IN_PROGRESS`, `owner: subagent-<name>`) before the subagent runs — makes the parallel state visible in `STATE.md`.

## While the subagent runs

The main session keeps working on its own non-overlapping task. Do NOT poll the subagent. You'll be notified when it completes.

## Merge protocol (when subagent returns)

1. **Read its summary** for what it claims to have done.
2. **Diff the changes**: `git diff --stat` + `git diff <files>` on what it touched.
3. **Verify**:
   - `pnpm typecheck` (for TS changes)
   - `pnpm build` (for build-affecting changes)
   - `curl` the dev server + MCP screenshot (for UI changes)
   - Any acceptance criteria on the task file
4. **If all green**: update the task frontmatter to `DONE` + fill `Trace` with a summary + append to `tasks/LOG.md`.
5. **If broken**: `git restore` the subagent's changes, mark task BLOCKED with a note, fix in main session.
6. **Commit** with both task IDs if the commit includes both subagent and main-session work.

## Conflict detection

If mid-run you realise two agents are about to touch the same file:
- Stop the later one (if still spinning up — it hasn't stolen the turn).
- Wait for the earlier to finish + merge.
- Then start the second.

## Example (from this project, 2026-04-21)

Main session: F-T001 (port shared utilities → `web/lib/utils/*`)
Subagent (background): F-P005 (merge legacy CSS → `web/app/globals.css`)

`touches`:
- F-T001: `web/lib/utils/`, `web/lib/seed.ts`, `web/lib/palette.ts`
- F-P005: `web/app/globals.css`

No overlap → safe. Both `parallel_safe: true`. Dispatch.

## What NOT to parallelise in M-fast

- **F-T002 (split store.jsx)** — every downstream task depends on the shapes it exposes. Serial only.
- **F-T003–T008 against each other** — they all import from F-T002's stores; race conditions in shared store files.
- **Anything touching `web/lib/storage.ts`** — it's the seam; only one agent at a time.

## What IS a good parallel candidate

- Writing a doc + writing a test
- Two separate utility modules in `web/lib/utils/`
- CSS merge + JS port of unrelated concerns
- README/INDEX update + code change

## Review this file

Each milestone's README can add a "parallel map" showing which tasks can batch. Keep conservative — false parallelism wastes more time than it saves.
