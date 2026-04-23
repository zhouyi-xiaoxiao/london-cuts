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
2026-04-21T04:10Z | opus-4.7-session-20260421 | CLAIM | F-T006 | Postcard editor (3D flip + 6 styles + /api/ai/generate; MOCK default, real call verifies pipeline)
2026-04-21T04:10Z | subagent-F-P003-via-opus-4.7-main | CLAIM | F-P003 | PDF export via jspdf (pure utility, no postcard component dep)
2026-04-21T04:10Z | subagent-F-P004-via-opus-4.7-main | CLAIM | F-P004 | PNG export via html-to-image (pure utility)
2026-04-21T04:30Z | subagent-F-P003-via-opus-4.7-main | DONE | F-P003 | PDF export via jspdf@4.2.1 (2-page A6). 4 tests, 44/44 total.
2026-04-21T04:30Z | subagent-F-P004-via-opus-4.7-main | DONE | F-P004 | PNG export via html-to-image (pixelRatio 2). 9 tests. suggestPostcardFilename helper.
2026-04-21T04:40Z | opus-4.7-session-20260421 | DONE | F-T006 | Postcard editor: flip card + style picker + generate route + exports. Real API verified $0.02.
2026-04-21T04:40Z | opus-4.7-session-20260421 | NOTE | F-T006 | Real OpenAI gpt-image-1 pipeline proven end-to-end; mock reverted to default before commit.
2026-04-21T05:00Z | opus-4.7-session-20260421 | CLAIM | F-T007 | Vision pipeline: describePhoto + /api/vision/describe + VisionUpload UI wired into dashboard "New from photos"
2026-04-21T05:00Z | subagent-F-T008-via-opus-4.7-main | CLAIM | F-T008 | Publish flow: pre-flight checklist + PublishDialog slideover + workspace button wiring
2026-04-21T05:00Z | subagent-F-T009-via-opus-4.7-main | CLAIM | F-T009 | Public project page: hero + atlas + flip postcards (read-only)
2026-04-21T05:15Z | opus-4.7-session-20260421 | DONE | F-T007 | Vision pipeline: describePhoto + /api/vision/describe + VisionUpload; real GPT-4o-mini call verified 1¢/7s
2026-04-21T05:25Z | subagent-F-T008-via-opus-4.7-main | DONE | F-T008 | PublishDialog slideover + pre-flight checklist + visibility radio + publish action. 4 tests.
2026-04-21T05:30Z | subagent-F-T009-via-opus-4.7-main | DONE | F-T009 | Public pages (PublicProjectPage + ChapterPage + PostcardPage) + NotFoundCard + static-params extended. 3 tests.
2026-04-21T05:30Z | opus-4.7-session-20260421 | DONE | F-T009 | Main-session fixup: 4 TS18048 errors in postcard-page.tsx (narrow captured in const before closure) — typecheck now green.
2026-04-21T05:35Z | opus-4.7-session-20260421 | NOTE | M-fast | M-fast 14/14 COMPLETE. 51/51 tests green. Real AI pipeline (postcard art + vision) proven end-to-end. Next milestone: M-preview (password-gated Vercel soft-launch).
2026-04-21T22:00Z | opus-4.7-session-20260421 | CLAIM | M-preview | Vercel deploy: password gate via middleware, 13 seed photos to public/, / redirect to /studio
2026-04-21T22:10Z | opus-4.7-session-20260421 | BLOCK | M-preview | 5 commits pushed, all auto-deploys Error after fac50d4 despite build completing (Vercel UI misleading; deploy-phase failure invisible in build logs)
2026-04-21T23:10Z | opus-4.7-session-20260421 | NOTE | M-preview | Root cause found: `outputFileTracingRoot: __dirname` in next.config.ts broke Vercel's post-build routes-manifest-deterministic.json check. Dropped the config.
2026-04-21T23:15Z | opus-4.7-session-20260421 | DONE | M-preview | Deploy b75c087 Ready at london-cuts.vercel.app; / → /studio; 13 seed images serving; orphan `web` project removed; proxy.ts restored with correct Next 16 `proxy` export. See HANDOFF.md → "Deploy gotchas".
2026-04-21T23:15Z | opus-4.7-session-20260421 | NOTE | M-iter | Owner reported 4+ real UX issues during dogfooding; captured in HANDOFF.md M-iter backlog.
2026-04-22T00:00Z | opus-4.7-session-20260422 | DONE | M-iter | F-I001..F-I008 shipped in main session: per-mode italic+uppercase, cinema letterbox, variant cache, atlas brightness cap, postcard flip, publish URL, dashboard seed photos, v5 persist bump.
2026-04-22T00:30Z | subagent-workspace-audit | DONE | audit | tasks/AUDIT-WORKSPACE.md — 45% of legacy workspace.jsx (2557 lines) missing from port. Top gaps: VariantsRow, HeroDraggable, AssetPicker, 3 body block types.
2026-04-22T00:30Z | subagent-m1-schema | DONE | M1 | web/supabase/migrations/0001_initial.sql (447 lines) + tasks/M1-PLAN.md (156 lines). 5 tables + RLS + storage bucket stub.
2026-04-22T00:30Z | subagent-public-audit | DONE | audit | tasks/AUDIT-PUBLIC-PAGES.md — postcard front + chapter page mode-blindness, atlas pin hover missing, heroFocus ignored.
2026-04-22T01:00Z | sessionB-via-owner | DONE | M-iter F-I009 | web/stores/root.ts + stop-spine.tsx: addStop / removeStop / moveStop / reorderStops + UI affordances. Commit 841e078.
2026-04-22T01:15Z | sessionB-via-owner | DONE | M-iter F-I010+F-I011 | public-project-page + chapter-page + postcard-front: per-mode grammars restored. Commit f902383.
2026-04-22T01:30Z | opus-4.7-session-20260422 | NOTE | M1 | Supabase project `acymyvefnvydksxzzegw` created + 3 keys in .env.local + Vercel prod/dev. 0001_initial.sql applied via SQL Editor. 5 tables verified.
2026-04-22T01:45Z | opus-4.7-session-20260422 | DONE | M1-Phase1 | @supabase/supabase-js@2.104.0 installed (owner approval: "装"). web/lib/supabase.ts client factory. web/app/api/migrate/seed/route.ts (POST endpoint, dev-gated). Seed migrated to cloud Supabase — 1 user + 2 projects + 13 assets + 19 stops + 1 postcard. Anon key can read published+public per RLS. Commit 09afc16.
2026-04-22T02:00Z | opus-4.7-session-20260422 | DONE | M1-Phase2 | web/lib/public-lookup.ts server-side fetch. All three public routes (project/chapter/postcard) now pass `initialData` prop to client components. dynamicParams=true on each + revalidate=60.
2026-04-22T02:15Z | opus-4.7-session-20260422 | DONE | M1-Phase3-minimal | web/app/api/sync/upsert/route.ts + "☁️ Sync to cloud" button in dashboard header. Metadata sync only (project+stops+postcards); asset binaries still client-only until Phase 3 full.
2026-04-23T00:00Z | opus-4.7-session-20260422 | DONE | M1-Phase3-full | /api/sync/upsert extended: accepts `assets: [{legacyId, tone, dataUrl|publicUrl, styleId, prompt}]`. Base64 data URLs uploaded to Storage bucket `assets` via `db.storage.from(...).upload()` with upsert:true. Pass-through URLs (/seed-images/*) stored as-is. hero_asset_id resolved via legacy_id map. Dashboard sync now collects referenced assets + sends binaries. End-to-end verified: 1 test PNG uploaded, fetched 200 from CDN URL.
2026-04-23T01:00Z | opus-4.7-session-20260423 | DONE | M-iter F-I012 | Track 4 sync verification (production curl): POST /api/sync/upsert with test PNG data URL → 200 OK, assetsUploaded=1; GET from Supabase Storage CDN → 200 (image/png, 70 bytes); cleanup deleted test project + storage object. Full M1 pipeline confirmed live.
2026-04-23T01:30Z | opus-4.7-session-20260423 | DONE | M-iter F-I013 | HeroDraggable + heroFocus + ↺/↻ rotate ports. web/stores/types.ts: added HeroFocus + Stop.heroFocus? (optional — no persist-schema bump needed). web/lib/utils/image.ts: rotateImageDataUrl(90|-90|180) helper with CORS-safe data-URL fetch fallback. web/components/studio/hero-slot.tsx: full rewrite with pointer-drag pan, portrait EXIF-aware letterbox (blurred backdrop + contained foreground), double-click recenter, file-drop + MIME_ASSET_ID drop target, rotate buttons. Typecheck green, 55/55 tests.
2026-04-23T01:40Z | subagent-body-editor-via-opus-4.7-main | DONE | M-iter F-I014 | Body editor expanded from 3 → 6 block types; AssetPicker modal added. web/components/studio/stop-body-editor.tsx (+~360 lines) renders heroImage / inlineImage / mediaEmbed; new HeroImageEditor / InlineImageEditor / MediaEmbedEditor with AlignToggle; AddBlockBar shows all 6 kinds; click "+ Hero image" or "+ Inline image" inserts block and immediately opens picker. web/components/studio/asset-picker.tsx (333 lines, new): modal overlay with backdrop-close, bucketed sections (Current hero / Other on this stop / Other in project / Upload new), "CURRENT" badge, uses prepareImage for uploads. Zero new deps. 55/55 tests.
2026-04-23T02:00Z | opus-4.7-session-20260423 | NOTE | M-iter | 4-stream parallel sprint dispatched: 3 subagents (drawers / atlas / spine) + main (stop-canvas). Zero file overlap by design.
2026-04-23T02:00Z | opus-4.7-session-20260423 | DONE | M-iter F-I018 | stop-canvas.tsx CanvasHeader maps deep-links (Google Maps + Apple Maps + 📋 copy-coords w/ execCommand fallback) + body-block / media counters. AssetStrip under HeroSlot — horizontal thumbnails with HERO badge, click-to-promote, hover-× detach-to-loose (confirmed), draggable (sets MIME_ASSET_ID so other drop targets accept), multi-file inline upload with uploading state.
2026-04-23T02:00Z | subagent-spine-drop-via-opus-4.7-main | DONE | M-iter F-I017 | stop-spine.tsx SpineRow is now a drop target. onDragOver+onDragLeave+onDrop handlers, dropActive state. Accepts MIME_ASSET_ID (reassigns asset via updateAsset({stop}); promotes to hero if none); accepts raw image files (prepareImage + addAsset + auto-hero if none). 3px left-border accent on dragover stacks with selection highlight. 55/55 tests.
2026-04-23T02:00Z | subagent-drawers-via-opus-4.7-main | DONE | M-iter F-I015 | drawers.tsx AssetsPoolDrawer rewritten: thumbnail grid, drag source (MIME_ASSET_ID + copyMove), hover-× delete (confirm if hero), hover-⇥ detach to loose, two upload buttons (per-section, multi-file, prepareImage sequential), uploading counter pill, loose cap at 30 + "+N more" eyebrow, stop-assigned shown before loose. QueueDrawer untouched. 55/55 tests.
2026-04-23T02:00Z | subagent-atlas-hover-via-opus-4.7-main | DONE | M-iter F-I016 | atlas.tsx + 3 callers. AtlasStop extended with optional heroUrl/mood/timeLabel. MapLibre Popup per marker (closeButton:false, offset 24, maxWidth 220px), mouseenter/mouseleave wires, scoped .atlas-pin-popover CSS injected once. SVG fallback gets <title> tooltip. Callers: public-project-page (resolves heroUrl via assets.find), atlas/page (seed-only, no heroUrl), atlas.test.tsx (FakePopup registered on maplibre mock). 55/55 tests.
2026-04-23T02:00Z | opus-4.7-session-20260423 | DONE | M-iter | 4-stream sprint verified: typecheck + 55/55 tests + production build all green. M-iter 18/21+ complete; only VariantsRow remains (deferred to dedicated session per audit's M3 recommendation).
2026-04-23T02:20Z | opus-4.7-session-20260423 | NOTE | dogfood | Owner ran first real-use test; reported 7 issues: stop renumbering on delete, postcard generate rejects seed-path URLs, map hover drifts viewport, cinema mode text invisible, AI auto-layout wanted, vision-to-full-project wanted, general UX.
2026-04-23T02:30Z | opus-4.7-session-20260423 | DONE | M-iter F-I019 | Postcard generate endpoint accepts 3 URL shapes (data: | http(s) | /-public-path). lib/ai-provider.ts sourceToBytes() normalises all three → Buffer → File before calling OpenAI. fs+path imports added for disk reads. Route validation loosened. Fixes: seed-image heroes + synced Supabase CDN heroes can now generate postcards (previously hard-rejected).
2026-04-23T02:30Z | subagent-atlas-drift | DONE | M-iter F-I020 | atlas.tsx popups now created once per marker at creation time (not per-mouseenter), explicit anchor:"bottom" + closeOnMove:false + offset:[0,-18] prevents auto-pan drift. activePopupRef tracks the open one; map movestart/zoomstart clears it. Fashion-mode tile raster-contrast raised -0.05→0.1, brightness-min 0.85→0.75, warm overlay 0.08→0.05 — street labels now legible. 55/55 tests.
2026-04-23T02:30Z | subagent-spine-numbering | DONE | M-iter F-I021 | stop-spine.tsx renders 1-indexed display position (String(index+1).padStart(2,"0")) in the first column; stop.n stays stable for HTML ids, testids, store calls, and DB sync. Add-stop footer button: solid fill var(--paper-2) + "+ NEW STOP" label + larger padding + hover/focus state. requestAnimationFrame → scrollIntoView after add so the new row is visible. 55/55 tests.
2026-04-23T02:30Z | opus-4.7-session-20260423 | DONE | M-iter F-I022 | cinema-mode visibility rescue. globals.css `[data-mode="cinema"]` block now overrides the raw `--paper`, `--paper-2`, `--paper-3`, `--ink`, `--ink-2`, `--ink-3`, `--rule` tokens with cinema-adapted values (dark blue-grey surfaces, light warm ink). Components that hardcoded `var(--paper)` / `var(--ink)` in inline styles (~20 files, ~50 occurrences) auto-adapt without per-file rewrites. Body gradient also swapped to dark for cinema so pages that don't fully cover viewport still read moody.
2026-04-23T02:30Z | subagent-ai-research | DONE | M-iter F-I023 (research) | tasks/deferred/ai-auto-layout-and-vision-to-project.md written (598 lines). Recommendations: auto-layout = rule-based skeleton first + optional LLM "✨ polish prose" behind it; vision-to-project = reuse per-photo describe + add text-only compose call (no multimodal batch). Spend floor $0.14 / ceiling $0.38 per full project. New OPENAI_PER_PROJECT_CAP_CENTS=50 recommended. 3-PR split. Spend-cap atomicity bug in ai-provider L69-74 flagged (also affects VariantsRow).
