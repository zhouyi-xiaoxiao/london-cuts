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
2026-04-21T01:00Z | opus-4.7-session-20260421 | CLAIM | F-T002 | Split legacy store.jsx into typed domain stores; implement lib/storage.ts against localStorage+IndexedDB
2026-04-21T01:00Z | subagent-vitest-via-opus-4.7-main | CLAIM | housekeeping | Vitest config + sample tests for lib/palette + lib/utils/hash
2026-04-21T01:00Z | subagent-pre-commit-via-opus-4.7-main | CLAIM | housekeeping | pre-commit hook: typecheck web/ on staged TS/TSX changes
2026-04-21T01:30Z | subagent-vitest-via-opus-4.7-main | DONE | housekeeping | Vitest config + palette.test + hash.test — 5 tests green
2026-04-21T01:30Z | subagent-pre-commit-via-opus-4.7-main | DONE | housekeeping | scripts/hooks/pre-commit — typecheck guard for staged ts/tsx under web/
2026-04-21T01:45Z | opus-4.7-session-20260421 | DONE | F-T002 | Split legacy store.jsx into Zustand+6 domain hooks. 8 new tests (13/13 total). safeLocalStorage shim fixed jsdom/SSR.
2026-04-21T02:10Z | opus-4.7-session-20260421 | CLAIM | F-T003 | Port projects dashboard ("Your work.") to web/app/studio/page.tsx
2026-04-21T02:10Z | subagent-F-P001-via-opus-4.7-main | CLAIM | F-P001 | Port mode switcher + wire data-mode to <html>
2026-04-21T02:10Z | subagent-deadcode-via-opus-4.7-main | CLAIM | housekeeping | Audit web/ scaffold dead code post-F-T002
2026-04-21T02:20Z | subagent-deadcode-via-opus-4.7-main | DONE | housekeeping | Scaffold dead-code audit delivered; blocker = studio-pages/public-pages still use DemoStoreProvider
2026-04-21T02:25Z | subagent-F-P001-via-opus-4.7-main | DONE | F-P001 | Mode switcher + HtmlModeAttr wired into layout.tsx; 1 new test
2026-04-21T02:30Z | opus-4.7-session-20260421 | DONE | F-T003 | Dashboard ported + useShallow fix across 5 hooks + 4 new tests (18/18)
2026-04-21T02:50Z | opus-4.7-session-20260421 | CLAIM | F-T004 | Workspace 3-column shell (spine+canvas+drawers)
2026-04-21T02:50Z | subagent-mobile-via-opus-4.7-main | CLAIM | housekeeping | Mobile responsive audit + CSS fixes
2026-04-21T02:50Z | subagent-seed-via-opus-4.7-main | CLAIM | housekeeping | Add non-London demo project to seed.ts (Reykjavík)
2026-04-21T02:55Z | subagent-seed-via-opus-4.7-main | DONE | housekeeping | SEED_PROJECT_REYKJAVIK + 7 stops + PROJECTS_FEED entry added to lib/seed.ts
2026-04-21T03:00Z | subagent-mobile-via-opus-4.7-main | DONE | housekeeping | globals.css 775→820; studio dashboard overflow fixed at 390px; tap targets ≥44px
2026-04-21T03:10Z | opus-4.7-session-20260421 | DONE | F-T004 | Workspace shell + Reykjavík seed wired into archive (dashboard shows both projects). 23/23 tests.
2026-04-21T03:20Z | opus-4.7-session-20260421 | NOTE | repo | HANDOFF.md added to tasks/ for conversation-compaction recovery; CLAUDE.md and MEMORY.md index updated to point at it
2026-04-21T03:30Z | opus-4.7-session-20260421 | CLAIM | F-T005 | Stop editor — metadata form, body paragraph editor, hero image upload
2026-04-21T03:30Z | subagent-F-P002-via-opus-4.7-main | CLAIM | F-P002 | MapLibre atlas with mode-aware tiles
2026-04-21T03:30Z | subagent-deadcode-migrate-via-opus-4.7-main | CLAIM | housekeeping | Migrate scaffold studio-pages + public-pages off DemoStoreProvider, then delete scaffold providers/* + lib dupes
2026-04-21T03:45Z | subagent-F-P002-via-opus-4.7-main | DONE | F-P002 | MapLibre atlas shipped; maplibre-gl@5.23.0 added; /atlas renders 19-stop cross-location map
2026-04-21T03:50Z | opus-4.7-session-20260421 | DONE | F-T005 | Stop editor fleshed out: HeroSlot + metadata form + body editor. useAssetsByStop useShallow fix. 31/31 tests.
2026-04-21T03:50Z | opus-4.7-session-20260421 | NOTE | housekeeping | Dead-code subagent still in-flight; phase 1 partial (static-params.ts migrated). Deferring phase 2/3 (delete providers) to next round.
2026-04-21T04:00Z | subagent-deadcode-migrate-via-opus-4.7-main | DONE | housekeeping | Dead-code cleanup done: providers/ deleted, media-provider + seed-data deleted, layout simplified (no more RootProviders), public-pages migrated via adapter. lib/types.ts kept (still referenced by ui.tsx / routes.ts).
