# LOG — Append-only event history

Format per line: `YYYY-MM-DDTHH:MMZ | <session-id or name> | <VERB> | <task-id or area> | <one-line note>`

Verbs: `CLAIM` `DONE` `BLOCK` `UNBLOCK` `NOTE` `SCOPE` `WONTFIX`

Keep lines short. Put details in the task's `Trace` section, not here.

---

2026-04-20T00:00Z | scaffold | NOTE | repo | Initial task system scaffolded. Requirements v1.0 frozen. 65 tasks planned across M0–M6.
2026-04-20T00:00Z | scaffold | NOTE | M0 | Full M0 task files written. M1–M6 stubbed at milestone README level.
2026-04-20T00:10Z | opus-4.7-session-20260420 | CLAIM | M0-T001 | Start rename next-scaffold -> web
2026-04-20T00:25Z | opus-4.7-session-20260420 | DONE | M0-T001 | rename complete; build+typecheck green; refs updated
2026-04-20T00:30Z | opus-4.7-session-20260420 | CLAIM | M0-T002 | Archive legacy app/ to archive/app-html-prototype-2026-04-20
2026-04-20T00:50Z | opus-4.7-session-20260420 | DONE | M0-T002 | app/ archived to archive/app-html-prototype-2026-04-20; build green
2026-04-20T01:15Z | opus-4.7-session-20260420 | DONE | M0-P003 | next.config.ts cleaned (no basePath/export); deploy-pages.yml deleted; dev server / returns 200
2026-04-20T01:30Z | opus-4.7-session-20260420 | SCOPE | plan | v1.0→v2.0: features-first re-order. M-fast inserted; M1/M2/M4/M5/M6 postponed; M3 superseded by M-fast.
