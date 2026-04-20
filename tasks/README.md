# Tasks — the execution system

This directory is the operational plan. Every unit of work in M0–M6 is a file here.

## Purpose

- Break `docs/implementation-plan.md` into bite-sized, self-contained tasks
- Let multiple Claude Code sessions run in parallel without stepping on each other
- Leave a permanent trace of what was done, by whom, when, and why
- Future AI coding agents pick up where past ones left off

## Structure

```
tasks/
├── README.md            # this file
├── AGENTS.md            # coordination rules for AI agents
├── STATE.md             # auto-updated snapshot: what's done, in progress, blocked
├── LOG.md               # append-only event log (every status change logs here)
├── M0-consolidation/    # one directory per milestone
│   ├── README.md        # milestone overview
│   ├── M0-T001-*.md     # critical-path tasks (T = sequential)
│   ├── M0-P001-*.md     # parallel tasks (P = can run concurrently)
│   └── ...
├── M1-supabase-data/
├── M2-auth-invites/
├── M3-feature-parity/
├── M4-public-pages/
├── M5-observability/
└── M6-launch/
```

## Task file format

Every task file is markdown with YAML frontmatter:

```markdown
---
id: M0-T001
title: Rename next-scaffold/ to web/
milestone: M0
kind: critical       # critical | parallel
status: TODO         # TODO | IN_PROGRESS | DONE | BLOCKED
blocked_by: []       # list of task IDs this task waits on
blocks: [M0-P001]    # list of task IDs waiting on this one
parallel_safe: false
touches:             # paths this task writes to (for conflict detection)
  - next-scaffold/
  - web/
  - README.md
owner: null          # agent session id / human name
started_at: null
completed_at: null
---

# M0-T001 — Rename next-scaffold/ to web/

## Why
<context>

## Acceptance criteria
- [ ] criterion 1
- [ ] criterion 2

## Steps
1. step
2. step

## Verification
How to confirm it worked.

## Trace
<!-- Agents append here: date, who, what happened -->
```

## Agent protocol (quick version)

Full rules in `AGENTS.md`. Short form:

1. **Claim a task**: pick any `status: TODO` task whose `blocked_by` is all DONE. Set `status: IN_PROGRESS`, fill `owner` and `started_at`. Append a line to `LOG.md`.
2. **Check for conflicts**: if another IN_PROGRESS task shares paths in `touches`, pick a different one.
3. **Do the work**: follow the task's Steps section. Read related files. Ask the human only when genuinely blocked.
4. **Verify**: run the Verification section. Don't mark DONE on failing tests or broken builds.
5. **Log**: update the Trace section of the task, append a line to `LOG.md`, set `status: DONE` and `completed_at`.
6. **Update STATE.md**: bump counts, move task line to appropriate bucket.

## Human protocol

The owner (you) does these things:

- Review `STATE.md` to see overall progress
- Read `LOG.md` for narrative of what's happened
- Create new tasks when requirements change (give them unused IDs, add to milestone README)
- Unblock `BLOCKED` tasks by answering questions in the task's `Blockers` section
- Mark tasks `WONTFIX` if scope changes

## Conventions

- Task IDs are stable. Never renumber.
- `T` prefix = sequential / critical path. `P` prefix = parallel-safe.
- Dates in ISO format: `2026-04-20T14:30Z`.
- File names: `M{n}-{T|P}{nnn}-{kebab-title}.md`.
- When a task breaks into sub-tasks, the parent becomes a meta-task pointing at the new IDs.

## Why this exists (design note)

AI coding tools work best when given:
1. Self-contained context per task (no "see previous conversation")
2. Clear acceptance criteria
3. A shared trace of what's already happened

This file system is the persistent memory that individual model sessions lack. It is the project management tool *and* the onboarding doc for the next agent that walks in cold.
