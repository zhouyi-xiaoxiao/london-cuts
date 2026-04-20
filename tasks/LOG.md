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
2026-04-20T02:05Z | opus-4.7-session-20260420 | DONE | M0-P001 | seam stubs in web/lib/ (storage, auth, ai-provider, email, analytics, env, errors); typecheck green
2026-04-20T02:05Z | opus-4.7-session-20260420 | DONE | M0-P002 | web/.env.example written with vars grouped by milestone
2026-04-20T02:05Z | opus-4.7-session-20260420 | DONE | M0-P004 | root CLAUDE.md already v2; web/CLAUDE.md replaced with pointer
2026-04-20T02:05Z | opus-4.7-session-20260420 | DONE | M0-P005 | README.md + INDEX.md rewritten for plan v2.0
2026-04-20T02:00Z | opus-4.7-session-20260420 | DONE | M0-P006 | web/supabase/{migrations,README.md,seed.sql} scaffold
2026-04-20T02:40Z | opus-4.7-session-20260420 | DONE | M0-P007 | 14 M-fast task files (F-T000..F-T009 + F-P001..F-P005) written
2026-04-20T02:40Z | opus-4.7-session-20260420 | NOTE | M0 | M0 complete (9/9). Next eligible: F-T000 POC.
2026-04-20T02:50Z | opus-4.7-session-20260420 | CLAIM | F-T000 | Start POC: port style picker from legacy palette.jsx
2026-04-20T03:10Z | opus-4.7-session-20260420 | DONE | F-T000 | POC StylePicker ported; /poc serves 6 styles at HTTP 200; pipeline proven (JSX→TSX clean, type system caught style-ID mismatch, no Babel/HEIC/EXIF surprises)
2026-04-21T00:05Z | subagent-F-P005-via-opus-4.7-main | CLAIM | F-P005 | Merge legacy base.css + v2.css into web/app/globals.css (running in background)
2026-04-21T00:08Z | opus-4.7-session-20260421 | CLAIM | F-T001 | Port shared utils (EXIF, resize, hash, seed) to web/lib/utils/
2026-04-21T00:30Z | subagent-F-P005-via-opus-4.7-main | DONE | F-P005 | Legacy base.css + v2.css merged into web/app/globals.css (444 → 775 lines)
2026-04-21T00:30Z | opus-4.7-session-20260421 | DONE | F-T001 | Shared utils (exif/image/hash/seed) to web/lib/{utils,seed}. exifr dep added.
2026-04-21T00:30Z | opus-4.7-session-20260421 | NOTE | F-T000 | Found + fixed active-pill cream-on-cream bug via Preview MCP screenshot
