# AUDIT — Workspace deep-dive

**Date**: 2026-04-22
**Scope**: `archive/.../workspace.jsx` (2557 lines) → `web/components/studio/workspace.tsx` (250 lines) + 6 sibling files (~1,170 lines total).
**Verdict**: The port is a SHELL. ~50% of legacy interactive surface is missing. Body-block editor, hero crop-pan, drag-drop, AI variants row, and asset pool are all reduced to scaffolding or absent.

---

## TL;DR — top 10 missing/broken things (prioritized)

1. **Hero drag-pan + EXIF-aware portrait letterbox** (`HeroDraggable`, L700–822) — the entire focus/recenter UX is gone; portrait photos display un-letterboxed in the new `HeroSlot`.
2. **Hero rotate buttons (90° CW/CCW)** (`handleRotate`, L829–851) — gone. Phone-shot landscapes can no longer be fixed in-app.
3. **Variants row "Re-imagine the hero"** (`VariantsRow`, L1004–1349) — ~345 lines of AI generation UI: prompt textarea, quality chips (low/med/high $0.02–$0.19), `pregen 6 styles`, single-style chips, pending tiles, per-variant Use-as-hero / Use-as-postcard / Regen / Delete actions. Fully absent. Postcard editor has its own style picker but the hero-variants flow is not ported.
4. **Slash-command body editor** (`StoryEditor` + `EditableNode`, L1432–1659) — supports 6 block types (paragraph, heroImage, inlineImage, pullQuote, mediaEmbed, metaRow) with `/` menu, in-place selection, per-node up/down/delete chrome. New `StopBodyEditor` only handles 3 types and skips inline images, hero images in body, and media embeds.
5. **AssetPicker / InlinePickerPopover for body images** (L1673–2014) — ~340 lines of project-scoped image picker (current hero / variants / other-stop / loose / upload-inline) used by body image blocks. No equivalent.
6. **Drag-drop between Spine, Asset pool, and Hero slot** (`MIME_ASSET`, L5; spine `onDrop` L443–457; hero `onDrop` L860–884; pool drag L2345–2348) — all four drop targets absent in the port. The drawer is read-only.
7. **Spine row hover affordances**: per-row Move-Up / Move-Down / Delete (with "Delete Stop … its body, postcard, hero will be lost" confirm) and "+ Add stop" footer button (L479–509, L418–425). Port has neither hover chrome nor add/delete/move actions.
8. **Top-bar "Re-analyze photos", "Pre-gen styles", "Share popover", "?" tour, in-place TitleEditor** (L224–235, L260–367, L369–398) — five of nine top-bar controls absent. Port has only `Projects ←`, mode pill, `Hide panels`, `Publish →`.
9. **Spine footer status sentence + telephone "needs uploads / hero / body" counters** (L426–429) — replaced with bare `ready/total` count.
10. **Asset pool drawer**: upload-loose, upload-to-stop, hover delete (✕), hover detach (⇥), and Media-queue task cards with progress bars / Insert↓ / Retry / Start (L2371–2552) — drawer is now a static list with "F-T005 placeholder" copy.

Bonus: **`CanvasHeader` Google/Apple Maps links + copy-coords button** (L613–637), **Postcard preview tile with mini front+back render and "Open editor →"** (L2077–2319), **per-mode hero height** (cinema=360 vs others=440, L886). All gone; new canvas just lists metadata as eyebrow text and embeds the postcard editor directly.

---

## Feature-by-feature inventory

Numbers below count substantive lines (excluding pure styling). Ratios are coarse.

### 1. Top-bar layout
- Legacy: 9 controls (`← Projects`, Roundel, in-place editable title, status pill, `?` tour, `🔄 Re-analyze photos`, `🎨 Pre-gen styles`, `🔗 Share` popover, ModePill, Hide panels, Publish). L214–245.
- Our port: 4 controls — Projects link, ModePill, Hide panels, Publish. workspace.tsx L109–182. Title is read-only; **`TitleEditor` (L369–398) lost**.
- Status: 🟡 PARTIAL.
- Recommendation: port `TitleEditor` (cheap, ~30 lines); cut Re-analyze + Pre-gen + Share popover unless the variants row is also restored.
- Cost: legacy ≈140 lines (top bar + ShareButton + TitleEditor) vs ours ≈75.

### 2. ShareButton popover
- Legacy: portal-based fixed-position popover, copy-link, open-tab, draft warning, scroll/resize re-anchor (L260–367, ~108 lines).
- Our port: NONE. Publish dialog has copy-link but no top-bar popover.
- Status: ❌ MISSING.
- Recommendation: 🤔 LEGACY_ALSO_BAD — the Publish slideover already exposes copy-link. Drop unless feedback shows users open it constantly.

### 3. Auto-pre-gen of all 6 postcard styles per session
- Legacy: two `useEffect` blocks (L131–162 + L1163–1196) auto-fire low-quality batch of styles per stop on first hero, deduped against IDB cache, gated by demo-mode and per-slug session flag.
- Our port: NONE.
- Status: ❌ MISSING.
- Recommendation: 🤔 LEGACY_ALSO_BAD — surprise spend. Keep on-demand only.

### 4. Variant cache restore on workspace mount
- Legacy: `restoreCachedVariantsForCurrent` (L110–124) replays IDB-cached variants for $0 on slug change.
- Our port: postcard-editor.tsx has per-key `idbGetVariant` cache, but no batch hydration on workspace mount.
- Status: 🟡 PARTIAL.
- Recommendation: KEEP — single-key hit on demand is enough.

### 5. Spine row chrome (move/delete) + add stop / footer counters
- Legacy: `SpineRow` hover overlay with ↑/↓/✕ (L479–509), confirm dialog on delete, `+ Add stop` footer button, "X stops without hero · Y without body · Z need uploads" sentence (L418–429).
- Our port: stop-spine.tsx has selection + status pips only. No hover, no add, no delete, no move. Footer = bare `ready/total`.
- Status: 🟡 PARTIAL.
- Recommendation: MATCH — these are core editing actions, not optional polish.
- Cost: legacy ≈110 lines vs ours ≈200 (port adds keyboard nav but loses every mutation).

### 6. Spine drop target (asset → stop)
- Legacy: `SpineRow` accepts `MIME_ASSET` and raw image files; on drop, attaches asset to that stop and flips `status.upload` (L437–457).
- Our port: NONE.
- Status: ❌ MISSING.
- Recommendation: MATCH if drag-drop is restored anywhere — it's the primary "move photo to a different stop" UX.

### 7. CanvasHeader — maps links, in-place title, body/media counters
- Legacy: `CanvasHeader` (L603–663) shows lat/lng → Google Maps + Apple Maps deep links + 📋 copy-coords; click-to-edit title; right-rail body-blocks count + media-task status.
- Our port: stop-canvas.tsx L54–67 — bare eyebrow + h1; title editing is in a separate input below. No maps. No counters.
- Status: 🟡 PARTIAL.
- Recommendation: MATCH the maps links and counters (~35 line port). Title editing is duplicated in the form — pick one location.

### 8. HeroSlot — drag-pan focus
- Legacy: `HeroDraggable` (L700–822, ~120 lines) — pointer-driven `objectPosition` pan, double-click recenter, EXIF-aware portrait detection that switches to blurred-backdrop + contained foreground render. Persisted via `setHeroFocus`.
- Our port: hero-slot.tsx renders `<img objectFit:cover>` with no focus control. `stop.heroFocus` doesn't exist in `stores/types.ts`.
- Status: ❌ MISSING.
- Recommendation: MATCH — without this, every photo is center-cropped which mangles non-center subjects.

### 9. HeroSlot — rotate 90° buttons + asset/file drop
- Legacy: ↺/↻ buttons re-encode the hero asset's data URL (L905–924); accepts `MIME_ASSET` drops AND raw files (L854–884).
- Our port: hero-slot.tsx has Upload + Clear only. No rotate. No drop targets.
- Status: 🟡 PARTIAL — upload + replace exist but rotate + drop are gone.
- Recommendation: MATCH rotate (`prepareImage` already EXIFs, so 90°-only rotate is ~30 lines). MATCH drop if drag-drop restored elsewhere.

### 10. Variants row ("Re-imagine the hero")
- Legacy: `VariantsRow` + `describePhotoForPrompt` + style-chip auto-batch (L956–1349). gpt-4o vision describes the hero into a prompt (cached in localStorage), user tweaks, picks low/med/high quality, generates one-off OR all 6 presets, swaps source image inline, sees pending placeholders + cost rollup, per-variant `Use as hero` / `Use as postcard` / `Regen` / `✕`.
- Our port: NONE in workspace. Postcard editor has style picker but no inline source-swap, no quality control, no prompt edit, no `Use as hero`.
- Status: ❌ MISSING (most expensive single gap).
- Recommendation: MATCH partially — drop client-side OpenAI calls (CLAUDE.md forbids), route through `/api/ai/*`. Cut quality-pick if `low` is good enough for postcards.
- Cost: legacy ≈345 lines vs ours 0.

### 11. AssetStrip (per-stop horizontal asset row under hero)
- Legacy: `AssetStrip` + `AssetStripCell` (L1352–1430) — drag handle, click-to-set-hero, hover-✕, `+ upload` cell.
- Our port: NONE.
- Status: ❌ MISSING.
- Recommendation: MATCH — this is where users see "all photos for this stop" without opening the drawer.

### 12. StoryEditor — slash menu + 6 block types
- Legacy: `StoryEditor` + `EditableNode` + `NodeBody` (L1432–1659). Slash menu (`/hero`, `/img`, `/quote`, `/embed`, `/meta`), inline selection, per-node action chrome, `AutoTextarea` that auto-resizes.
- Our port: stop-body-editor.tsx supports paragraph / pullQuote / metaRow only. No heroImage / inlineImage / mediaEmbed. No slash menu. No selection state. Auto-resize replaced by fixed `rows=3` textarea.
- Status: 🟡 PARTIAL.
- Recommendation: MATCH the 3 missing block types + slash menu (or kill the slash menu and keep the existing pill-bar). Slash menu is bonus polish.
- Cost: legacy ≈230 lines vs ours ≈315 (we have more boilerplate per block but cover fewer types).

### 13. AssetPicker + InlinePickerPopover (used by body image blocks)
- Legacy: L1673–2014, ~340 lines. Sectioned by Current hero / AI variants / Other on this stop / Loose / Other-project (collapsed). Inline upload. Hover-replace overlay on existing images.
- Our port: NONE — body image blocks aren't even supported (see #12).
- Status: ❌ MISSING.
- Recommendation: MATCH only after body image blocks are restored. The picker itself is 🤔 LEGACY_ALSO_BAD — too many sections, too many headers; rebuild simpler.

### 14. Postcard preview tile in canvas
- Legacy: `PostcardTile` + `PostcardFrontMini` + `PostcardBackMini` (L2077–2319, ~240 lines) — mini 7:5 front+back, mode-aware (punk/cinema/fashion), portrait/landscape switch, "Open editor →" button.
- Our port: stop-canvas.tsx L112 inlines the full `<PostcardEditor>` instead of a preview-and-jump. Different model: editor IS the preview.
- Status: ✏️ OUR_IMPROVEMENT (arguably) — fewer indirections, but loses the at-a-glance side-by-side mini.
- Recommendation: KEEP current model unless users complain about scroll length.

### 15. Drawer — Assets pool
- Legacy: `AssetsPoolDrawer` + `AssetPoolCell` (L2340–2491) — `+ Loose` / `+ To stop X` upload, drag source for stops, hover ✕ delete with hero-warning copy, hover ⇥ detach to loose.
- Our port: drawers.tsx `AssetsDrawer` is a static list grouped by `forStop` / `loose`. No upload, no drag, no delete, no detach. Has placeholder text "Upload comes in F-T005."
- Status: ❌ MISSING (drawer placeholder pre-dates F-T005 completing).
- Recommendation: MATCH — without this the drawer adds zero value.

### 16. Drawer — Media queue
- Legacy: `MediaQueueDrawer` (L2493–2554) — task cards with progress bar, state pill, Insert↓ / Retry / Start, `+ New task` debug button.
- Our port: drawers.tsx `QueueDrawer` is one paragraph of placeholder text.
- Status: ❌ MISSING.
- Recommendation: 🤔 LEGACY_ALSO_BAD — the queue exists but `mediaTasks` is dead seed data; postcard generation now happens synchronously in the editor. Cut both the seed data and the drawer tab unless real long-running jobs return.

### 17. Image orientation cache (`useImageOrientation`)
- Legacy: window-cached, EXIF-aware orientation detector (L13–65). Used by hero render, postcard mini, public page.
- Our port: NONE — orientation handled per-component without caching; relies on `prepareImage` EXIF normalization at upload.
- Status: 🟡 PARTIAL — covered for newly uploaded assets; legacy seed/picsum images would mis-render.
- Recommendation: KEEP. Seed images shouldn't ship to production.

### 18. `heroUrlFor` / `postcardFrontUrlFor` resolvers
- Legacy: L67–95 — single source of truth for "what URL goes in the hero slot vs the postcard front", with picsum fallback for first-visit seed and AI-art preference for postcard.
- Our port: `hero-slot.tsx` derives via `stopAssets.find(a.id === stop.heroAssetId)`. `frontAssetId` resolved inline in postcard-editor.tsx L58–66.
- Status: 🟡 PARTIAL — duplicated logic, no picsum fallback.
- Recommendation: MATCH — extract to `lib/utils/hero-url.ts`. Will become important once `coverAssetId` (already in project) is wired.

### 19. Narrow-viewport drawer behavior
- Legacy: 1280px breakpoint, scrim, Esc-to-close, one-time auto-close (L175–203).
- Our port: workspace.tsx L24–75 — same logic, threshold 1200px.
- Status: ✅ PORTED.
- Recommendation: KEEP. Verify breakpoint matches design intent (1200 vs 1280).

### 20. Mode pill (3 modes, persists in store)
- Legacy: `ModePill` referenced but defined elsewhere; switches data-mode on root.
- Our port: workspace.tsx L222–250 — 3 radio buttons, ARIA, store-backed.
- Status: ✅ PORTED.
- Recommendation: KEEP.

### 21. Publish dialog (slideover with pre-flight)
- Legacy: external `onOpenPublish` (handled in app shell, not this file).
- Our port: publish-dialog.tsx (636 lines) — pre-flight checks (upload/hero/body-paragraph/postcard-message), per-stop jump, slug edit, visibility, copy/open URL, live banner.
- Status: ✏️ OUR_IMPROVEMENT — much richer than what was visible from workspace.jsx alone. Pre-flight checklist did not exist.
- Recommendation: KEEP.

### 22. Vision upload (folder → stops)
- Legacy: separate `vision-pipeline.jsx` (not part of workspace.jsx).
- Our port: vision-upload.tsx (389 lines) — server-side `/api/vision/describe`, concurrency 3, EXIF prep.
- Status: ✏️ OUR_IMPROVEMENT (architecture). Not invoked from `workspace.tsx`; needs to be wired into a top-bar entry-point or onboarding flow.

### 23. Stop-metadata form
- Legacy: edited inline via `CanvasHeader` (title) + scattered controls.
- Our port: stop-metadata-form.tsx — discrete form with code/time/mood/tone/lat/lng. Tone is 3-option ("warm/cool/punk").
- Status: ✏️ OUR_IMPROVEMENT — cleaner than legacy.
- Recommendation: KEEP. Note tone vocabulary may have drifted from legacy seed asset tones (warm/cool/punk/dark/generated).

### 24. Project-level reset / archive actions
- Legacy: handled outside workspace.
- Our port: workspace.tsx imports `archiveCurrentProject`, `resetToSeed` from store but never calls them. Dead imports.
- Status: ❌ MISSING (UI). Store hooks present but unused.
- Recommendation: drop the imports or wire to a top-bar overflow menu.

### 25. Demo tour ("?" button)
- Legacy: top-bar `?` triggers `storeActions.startTour()` (L224); demo-tour.jsx defines overlays (not in this file).
- Our port: NONE.
- Status: ❌ MISSING. Already flagged in tasks/AUDIT.md item 6.
- Recommendation: defer — separate task.

---

## Quick line-cost summary

| Area | Legacy lines | Port lines | Coverage |
|---|---|---|---|
| Top bar + ShareButton + TitleEditor | ≈190 | ≈75 | 40% |
| Spine + drop-target + add/delete/move | ≈110 | ≈200 | 30% (more code, fewer features) |
| Hero slot + draggable + rotate + variants | ≈465 | ≈190 | 25% |
| Body editor (6 types + slash + picker) | ≈580 | ≈315 | 35% |
| Postcard tile (in-canvas mini) | ≈240 | 0 (replaced by editor embed) | n/a |
| Drawers (assets + queue) | ≈215 | ≈100 | 20% |
| **Workspace total** | **≈2557** | **≈1170** | **~45%** |

The "~40% missing" suspicion is approximately right; the gap is concentrated in **HeroSlot variants + drag-drop + body block coverage + drawer interactivity**. Layout, mode, publish, and metadata forms are fine.

---

## Recommended port order (if owner ports any of this)

1. Spine row chrome (add/delete/move + footer counters) — small, high-value, no AI deps.
2. Hero rotate + drop targets — small, no AI deps.
3. AssetStrip per-stop — small, depends on drag-drop infra (1 new MIME type).
4. Body editor: heroImage + inlineImage + mediaEmbed blocks + AssetPicker — medium, no AI deps.
5. AssetsPoolDrawer interactivity (upload/delete/detach/drag source) — medium.
6. HeroDraggable focus pan (add `heroFocus` to Stop type) — medium, important for non-center subjects.
7. VariantsRow — large, requires AI route work; defer until M3 (feature parity milestone).
