# AGENTS.md — Rules for AI coding agents

You are about to work on this repo. Read this entire file before taking any action.

## Ground truth

1. `docs/requirements.md` = what we are building
2. `docs/architecture.md` = how it is structured
3. `docs/data-model.md` = DB schema
4. `docs/implementation-plan.md` = milestone roadmap
5. `tasks/` = executable work units
6. `tasks/STATE.md` = current status summary
7. `tasks/LOG.md` = append-only history

If any of those conflict with a user message, ask the user. If the user updates requirements, update `docs/requirements.md` in the same change and log it in `tasks/LOG.md`.

## Before doing anything

1. Read `tasks/STATE.md` to see what's in flight.
2. Read `tasks/LOG.md`'s last ~20 lines to catch up on recent activity.
3. Read the specific task file you're about to work on, including its `Trace` section.
4. Read any docs the task references.

## Picking a task

Eligible task = `status: TODO` AND every ID in `blocked_by` has `status: DONE`.

To claim:
1. Edit the task's frontmatter: `status: IN_PROGRESS`, `owner: <session-id>`, `started_at: <ISO-time>`.
2. Append to `tasks/LOG.md`: `YYYY-MM-DDTHH:MMZ | <session-id> | CLAIM | M0-T001 | <one-line reason>`
3. Update the counts in `tasks/STATE.md`.

## Running in parallel

Multiple sessions can work concurrently IF:
- Both tasks have `parallel_safe: true`
- Their `touches` arrays don't overlap

If `touches` overlap, the second agent picks a different task. When in doubt, treat a `parallel_safe: false` task as exclusive — no other session starts until it's DONE.

## Doing the work

- Follow the task's `Steps`. Adapt as needed, but document deviations in `Trace`.
- Do not exceed the task's scope. If you discover adjacent work, either:
  - Add a follow-up task and keep going within scope, OR
  - Ask the user if this is in-scope before expanding.
- Keep edits surgical. Don't "clean up" unrelated code.
- Run the project locally to verify:
  - `cd web && pnpm dev` (after M0)
  - `cd web && pnpm typecheck`
  - `cd web && pnpm test` (after tests exist)

## Finishing

Before marking DONE, verify:
- Every acceptance criterion checks out (tick the boxes in the task file)
- The `Verification` section passes
- No linter or typecheck errors introduced
- Commit/changes make sense (if on git, produce reviewable change set)

Then:
1. Update the task: `status: DONE`, `completed_at`, append summary to `Trace`.
2. Append to `tasks/LOG.md`: `... | DONE | M0-T001 | <what you did>`
3. Update `tasks/STATE.md` counts and move task to the DONE section.
4. If your task unblocks others, note it in LOG.

## Blocking

If you're stuck (missing credential, ambiguous requirement, external dependency):
1. Set `status: BLOCKED`, fill a `Blockers` section in the task body with specific questions.
2. Append to LOG: `... | BLOCK | M0-T001 | <what you need from human>`
3. Update STATE.md.
4. Pick another task if possible; otherwise stop and tell the user.

Do **not** work around a block by guessing. Credentials, naming, and scope decisions are always human calls.

## Forbidden actions (without explicit user approval)

- Committing to `main` (always PR unless told otherwise)
- `git push --force`, `git reset --hard`, `rm -rf`
- Editing anything under `archive/`
- Creating new top-level directories outside those defined in `docs/architecture.md`
- Introducing new third-party dependencies without asking
- Running migrations against the production Supabase project
- Issuing invite codes without being asked
- Sending real emails from tests (must use Resend test mode or mocks)

## Commit messages

Format: `<area>: <imperative> (<task-id>)`

Examples:
- `web: rename next-scaffold to web (M0-T001)`
- `lib/storage: add listProjects (M1-T005)`
- `docs: update architecture for seam change (M0-T004)`

One task usually = one commit. Complex tasks may need multiple commits; reference the task in each.

## When requirements change

The user will sometimes change requirements mid-stream. Expected.

- Update `docs/requirements.md` with a version bump note at the bottom.
- If existing tasks are invalidated, set them `status: WONTFIX` with a reason in Trace.
- Add new tasks to the appropriate milestone.
- Log the decision in LOG.md.

## When unsure

Ask the user. A 30-second clarification is cheaper than 30 minutes of wrong work.
