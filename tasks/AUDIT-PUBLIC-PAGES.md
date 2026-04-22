# AUDIT — Public reader pages

**Date**: 2026-04-22 · **Scope**: chapter, postcard, atlas, project (delta only)
**Method**: read-only diff of `web/components/public/*` and `web/components/map/*` against `archive/app-html-prototype-2026-04-20/src/*` (frozen) plus `web/prototype/src/*` (non-frozen reference). No dev server.

## TL;DR — top 7 issues (severity: H/M/L)

1. **(H) Postcard front has zero per-mode grammar.** `web/components/postcard/postcard-front.tsx` is a plain image + two pills regardless of mode. Legacy `PostcardFrontView` (`postcard-editor.jsx:292-397`) ships three fundamentally different layouts: punk "Greetings from WATERLOO" with red taped code chip + text-shadow; cinema with letterboxes, "SCENE 05 · 17:19" subtitle band, and cyan glow text; fashion with a 2/3 grid (typography column + image column) and italic Bodoni title. Each uses `cqw` container queries to scale. **The postcard reader page therefore looks identical in all three modes** — the most photogenic surface in the app is mode-blind.
2. **(H) Chapter page has zero per-mode grammar.** `chapter-page.tsx` renders one layout (eyebrow + h1 + hero + linear blocks). Legacy ships three distinct chapter renderers (`web/prototype/src/public-stop.jsx:30-183`): `StopPunk` = collage of 5 rotated/shadowed images + 2-col typewriter body with inverted pull-quote; `StopFashion` = centred "CHAPTER FIVE · OF TEN" + 21:9 hero + asymmetric 3:2 image pair; `StopCinema` = SCENE/INT/EXT/MOOD slate + 5-shot letterboxed sequence with subtitles. Frozen archive ports the same idea inside `public-project.jsx:162-220` `StopDetail` (mode-aware h1 size + uppercase + italic, body-width 780 vs 920 for cinema). Ours uses neither.
3. **(H) Atlas hover card on pin missing.** Legacy `public-atlas.jsx:367-420` builds a thumbnail+title+meta DOM card and attaches it on `mouseenter`; ours (`stop-pin.tsx:64`) only does a `transform: scale(1.08)`. There is no info preview before click. The required CSS classes `.atlas-marker[data-mode]:hover`, `.atlas-hover-card`, `.atlas-cluster` exist in `archive/styles/v2.css` but are absent from `web/app/globals.css` — already noted as gap in `AUDIT.md` (Screen 6) but the JS side that creates the hover card is missing too.
4. **(H) Atlas page is a non-product demo, not the legacy "All stops in this project + sidebar + feed".** `web/app/atlas/page.tsx` shows the union of SE1 + Reykjavík seed stops with hardcoded copy "F-P002 · 2 cities". Legacy `public-atlas.jsx:927-1029` shows: per-project title, "13 stops · drag, zoom, click", chip mode picker in the corner, **right-side stop list (clickable, jumps to `chapter`)**, mode-grammar copy block, and a bottom "More projects across London" 4-col feed. Ours has none of the navigation surface.
5. **(M) Atlas pin click is dead in the global atlas.** `web/app/atlas/page.tsx:73-75` only `console.log`s the stopId; there is no `router.push` to the chapter. Legacy navigates. Pin click on the project page's atlas (`public-project-page.tsx:73`) does work.
6. **(M) Postcard reader has no metadata side-panel and no "Versions" picker.** `web/prototype/src/public-postcard.jsx:55-99` has the right column with: "Generated from" (project + author backlink), "Details" (location, captured time, weather, mode, source images, generation time), and "Versions" (v1/v2/v3 active). Ours is just card + 3 export buttons.
7. **(M) Chapter footer has Prev/Open postcard/Next, but lacks the "next stop title" preview that legacy uses.** Ours shows `Stop 06 · The National Theatre →`, that part is fine. But missing: a Google Maps `📍 Maps` chip in the eyebrow when `stop.lat/lng` exist (legacy `public-project.jsx:182-191`). Loses field-friendly affordance.

---

## Page 1: Chapter page (`/[author]/[slug]/chapter/[stop]`)

Files: `web/components/public/chapter-page.tsx` · legacy: `archive/.../public-project.jsx:162-273` (StopDetail + PublicNode) and reference `web/prototype/src/public-stop.jsx`.

### Layout sections (top → bottom)

| Section | Legacy (frozen) | Legacy (proto) | Ours | Verdict |
|---|---|---|---|---|
| Sticky top bar (project title + back + ModePill) | yes (`public-project.jsx:23-43`) | PublicNav | back-link + ModeSwitcher | KEEP shape |
| Eyebrow `STOP n · code · time · mood` | yes, with palette accent underline (`StopDetail:178-181`) | yes | yes (no accent underline) | MATCH (port the palette accent line) |
| `📍 Maps` chip in eyebrow when lat/lng present | yes (`StopDetail:182-191`) | no | **no** | MATCH |
| Mode-aware h1 size (132 punk / 116 fashion etc.) + italic + uppercase | yes (`StopDetail:194-200`) | yes (`StopPunk` 140 / `StopFashion` 96 / `StopCinema` 88) | one h1, `clamp(40,7vw,80)` — no mode-conditional | REBUILD |
| Hero figure | yes, mode-conditional height (380 default / 320 cinema) + heroFocus objectPosition | yes per mode | yes, **maxHeight 520** static, **no `objectPosition` from `stop.heroFocus`** | MATCH (use heroFocus) |
| Body blocks render | mode-aware container width (780 cinema / 920 default) | per-mode unique layouts | linear, single 920px column | REBUILD |
| Image-block fallback | renders `<Img>` placeholder | per-mode collage | dashed placeholder card | KEEP (works) |
| `mediaEmbed` block | renders embed thumbnail with state badge + ▶ play | n/a | dashed placeholder labelled "Media embed" | DROP-now or MATCH |
| Footer Prev/Postcard/Next | combined nav row | combined nav row | yes, nice 3-col layout | KEEP |

### Mode-aware behavior

- **Legacy**: h1 size + uppercase + italic + body max-width all branch on `mode`. Hero height differs in cinema. Stop body fallback inserts metaRow with `[time, mood, code, label]`.
- **Ours**: nothing branches on mode. h1 uses `var(--mode-display-font)` and `var(--mode-italic)` so font/italic do swap, but size doesn't, and there is no equivalent of legacy's "cinema squeezes body to 780".
- The frozen `StopDetail` body fallback (`public-project.jsx:167-171`) for empty body is `[metaRow, paragraph]` — useful when the chapter is a draft. Ours just shows "This chapter is still in draft." in italics.

### Interactive affordances

- Legacy has no scroll-trigger animations; both are static.
- Ours adds nothing legacy doesn't have. Body links open the postcard via the CTA button — same idea.
- Legacy displays an "Open postcard →" button in the *header* row of `StopDetail`; ours puts it inline below the body. Either is fine; ours has a clearer visual hierarchy.

### Visual elements

- `--mode-italic` and `--mode-display-font` ARE applied (so the recent fix landed correctly here).
- **Bug (cosmetic)**: `<blockquote>` in `BlockView` (`chapter-page.tsx:324-339`) hardcodes `var(--f-fashion)` — same bug AUDIT.md already flagged for h1s. Should be `var(--mode-display-font)` or stay serif but then be consistent. Pull quotes will look fashion-y in punk and cinema modes.
- `eyebrow` mono font + 0.18em letter-spacing matches legacy.

### Bugs/gaps

- `chapter-page.tsx:148-151`: `objectFit: "cover"` ignores `stop.heroFocus.{x,y}`. If owner has set focus to "person on the right" we crop their head off.
- `chapter-page.tsx:60-63`: hero is derived from `stop.heroAssetId` only. If a `heroImage` body block exists with a different assetId, the hero asset is shown twice (first as hero, then as the inline image). Legacy guards against this in `StopDetail:211` (`!body.some(n => n.type === 'heroImage')`).
- `chapter-page.tsx:269-291`: `BodyBlocks` doesn't render the legacy fallback when body is empty — it just shows "still in draft" text. Lose the metaRow + paragraph synthesised from `stop.{time,mood,code}` that was useful on the publish flow.
- No outbound link to Google Maps even when `lat/lng` present.

### Recommendation: **REBUILD**

The page is the wrong shape (one mode-blind layout). Pick one of: (a) port the frozen-archive's mode-aware h1 sizing + body width + heroFocus + Maps chip + heroImage de-dup as a minimum, or (b) port one of the three richer `web/prototype/public-stop.jsx` layouts (punk collage / fashion full-bleed / cinema slate+sequence) per mode. Option (a) is the smaller delta; (b) is the original product.

---

## Page 2: Postcard page (`/[author]/[slug]/p/[stop]`)

Files: `web/components/public/postcard-page.tsx`, depends on `web/components/postcard/{postcard-card,postcard-front,postcard-back}.tsx`. Legacy: `archive/.../postcard-editor.jsx:139-515` (editor; back is editable but the *front* `PostcardFrontView:292-397` is what's relevant to the read-only reader). Reference: `web/prototype/src/public-postcard.jsx`.

### Layout sections

| Section | Legacy editor | Legacy proto | Ours | Verdict |
|---|---|---|---|---|
| Top bar (back-to-chapter + ModeSwitcher + exports) | back-to-workspace + flip + done | flip + Save + Share + Send-as-email | back-link + PNG-front + PNG-back + PDF + ModeSwitcher | KEEP (exports are owner-confirmed-good) |
| Eyebrow + h1 (stop title) | inside editor topbar | "Postcard · Stop 05 · Waterloo Bridge" + h1 "Greetings from SE1." | "Postcard · Stop n · {project}" + h1 = stop.title | KEEP shape (legacy h1 was demo flavour) |
| Card stage | centred, perspective 2000, max-width 720 landscape / 480 portrait | 7fr 3fr grid; left = card, right = sidebar | full-width card, no sidebar | MATCH (add sidebar — see below) |
| Side panel: "Generated from / Details / Versions" | n/a (workspace-side) | yes (`public-postcard.jsx:56-99`) | **missing** | MATCH or DROP-now |
| Caption row under card (`FRONT · 148×105mm`) | yes | yes | yes | KEEP |

### Mode-aware behavior

- **Front face is critical.** Legacy `PostcardFrontView` has full 3-mode layouts:
  - **punk**: black bg, image absolute-fill, code chip rotated -3° in red, "Greetings/from/{firstWord}" in `var(--f-display)` with `0.6cqw 0.6cqw 0` text-shadow in punkAccent (palette[2]). Two layout variants for portrait/landscape.
  - **cinema**: deep navy bg + image + 5.5cqw black letterbox bands top/bottom (or left/right in portrait) + `SCENE n · time` mono header + `— mood · time` subtitle band in cinemaSubtitle (palette[3]). Container queries again.
  - **fashion**: cream bg, 2fr 3fr grid (typography left / image right; flips to 3fr 2fr rows in portrait), italic Bodoni title (`var(--f-fashion)`), "LONDON · {code}" mono kicker, "ED. 01 / n OF total" footer.
- **Ours**: `PostcardFront` (`postcard-front.tsx`) is the same in all modes — image fills 100%, two mono pills (style label bottom-left, `n / total` bottom-right). No `mode` prop, no `useMode()` call, no per-mode layout. **The whole identity of the postcard product is missing.**
- `PostcardBack` (`postcard-back.tsx`) is mode-blind too. Legacy editor's `PostcardBackEditor:400-515` styles dividers via `palette[1]` color-mix and the stamp border via `palette[0]`, plus a "Cut." stamp wordmark in italic Bodoni. Ours uses static `var(--rule)` dashed bottom-borders and a generic stamp in the bottom-right. Acceptable but flat.

### Interactive affordances

- **Flip button** present (already-fixed F-I003 — KEEP).
- Legacy editor had auto-orientation detection from image (`useImageOrientation`); reader version inherits the orientation already stored. Ours uses `stop.postcard.orientation ?? "landscape"` — fine for read.
- Card click does nothing — flip is button-only. Matches legacy (after F-I003).
- No keyboard shortcut for flip (legacy didn't have one either).

### Visual elements

- Card max-width 960 in postcard-page wrapper (line 209). Card itself caps at 680 landscape / 480 portrait per `postcard-card.tsx:79`. Reasonable.
- Drop-shadow `0 20px 40px rgba(0,0,0,0.18)` matches legacy.
- Caption row uses mono-sm — matches.

### Bugs/gaps

- `postcard-page.tsx:251`: cast `stop.postcard as Postcard` — minor type smell, legacy postcard fields are all optional in the type. Not a bug yet.
- The `noop` for `PostcardBack.onUpdate` in readOnly is fine, but it does mean the type contract is wrong (PostcardBack should accept `onUpdate?` when readOnly). Cosmetic.
- The PNG/PDF buttons disable `front` button when no `frontUrl`, but allow PDF when no front (then early-error inside `onDownloadPdf`). Minor UX — could disable.
- **Frontmost (real) bug**: `Postcard · Stop {stop.n} · {project.title}` eyebrow — when `stop.n` is "01" we get "Stop 01" which reads fine, but the legacy proto had the more interesting `Postcard · Stop 05 · Waterloo Bridge` (uses stop.title). Ours separates eyebrow + h1 = stop.title, so we have it twice (h1 = stop.title, eyebrow = "Stop {n}"). Mild redundancy.

### Recommendation: **REBUILD front face**, KEEP shell + exports

The flip-card mechanics, exports row, and back layout are owner-confirmed-good (F-I003 and the M-fast PNG/PDF wiring). The *front face* is the high-value port: bring `PostcardFrontView` from `postcard-editor.jsx:292-397` forward as `PostcardFront` with mode + orientation + palette + totalStops props. Three text overlays on top of `<img>` is most of the work; container-query (`cqw`) sizing is what makes it not break at small widths.

---

## Page 3: Atlas page (`/atlas`)

Files: `web/app/atlas/page.tsx` (page shell) + `web/components/map/atlas.tsx` (`Atlas`) + `web/components/map/stop-pin.tsx` (marker DOM). Legacy: `archive/.../public-atlas.jsx` (single file, 1031 lines).

### Layout sections

| Section | Legacy | Ours | Verdict |
|---|---|---|---|
| Sticky top nav with Roundel + project title + ModePill + back | yes (`public-atlas.jsx:937-955`) | **none** (just an h1 + paragraph) | MATCH |
| Hero header "13 stops, placed on London." with mode chips on right | yes (`960-973`) | "19 stops, two cities." centred | MATCH |
| `1fr 320px` grid: map + sidebar | yes (`977`) | full-width map, no sidebar | MATCH |
| Sidebar: "All stops" list with stop number + title + time, click → chapter | yes (`983-994`) | **missing** | MATCH |
| Sidebar: "Map mode" copy block | yes per-mode (`996-1002`) | missing | nice-to-have |
| Bottom "More projects across London" 4-col feed of 8 tiles | yes (`1006-1026`) | missing | MATCH (or DROP-now if M1 reshuffles) |
| Cinema letterbox bands on map | yes (`914-919`) | **missing** | MATCH (recently fixed on project hero, not on global atlas) |
| Renderer badge ("MapLibre / Leaflet / Offline map") | yes (`920-921`) | missing | KEEP missing (Leaflet path was dropped, see comment in `atlas.tsx:24-27`) |

### Mode-aware behavior

- **Tile style swap**: both work. Legacy has 3 raster passes per mode (e.g. cinema has 3 different raster source layers + scrim + vignette); ours has 1 raster pass + 1 scrim. Cinema in particular looks less moody than legacy because the vignette + cyan rim layers are absent. **Ours: 1-2 layers per mode; legacy: 3-5 layers per mode.**
- The recently-applied brightness 1.0 cap fix is in our `buildStyle` (`atlas.tsx:188-192`) — KEEP.
- Punk in legacy goes `raster-contrast: 1.0`; ours uses `0.9`. Negligible, but the punk B&W feel will be slightly less harsh.

### Interactive affordances

- **Pin hover (legacy)**: builds an HTML hover card (`buildHoverCard`, `public-atlas.jsx:367-420`) with a thumbnail (from `stop.heroAssetId` → `assetsPool` → fallback `STOP_IMAGES`), title, and meta line. Mode-aware via `data-mode`. Required CSS lives in `archive/styles/v2.css:1109+`.
- **Pin hover (ours)**: only `transform: scale(1.08)` (`stop-pin.tsx:64-69`). No card. **Owner-named miss: "real photos" — they should also show in the atlas hover card so readers see thumbnails before clicking.**
- **Pin click (legacy)**: `flyTo` to the pin then `onStopClick`. Project-page atlas does navigate; standalone Atlas page does too.
- **Pin click (ours)**: project-page atlas works (`public-project-page.tsx:73-79`). **Standalone `/atlas` page click is a console.log only** (`atlas/page.tsx:73-75`).
- **Cluster collapse**: legacy clusters pins within 40px and shows a "{n} stops" badge that fitBounds-zooms on click (`public-atlas.jsx:433-508`). Ours has no clustering. With 19+ pins in central London this is noticeable.
- **Camera fitBounds**: both fit on first idle. Legacy adds a `padding: { top: 60, right: 40, bottom: 100, left: 40 }`; ours uses `padding: 48`. Cinema letterbox bands take more bottom room — when ported, increase bottom padding to compensate.

### Visual elements

- Marker chrome: 36px circle, `var(--mode-bg)` fill, `var(--mode-accent)` ring + text. Matches legacy intent.
- SVG fallback: feature-parity with legacy except the Thames decorative path (`thamesD` in `public-atlas.jsx:275`) is dropped. Schematic still works but is duller.
- Renderer badge dropped — that's deliberate (per `atlas.tsx:24-27`) since CDN-based maplibre fallback isn't a failure mode here.

### Bugs/gaps

- `atlas/page.tsx:60`: hardcoded "two cities" — assumes the SE1 + Reykjavík seed only. Will read wrong if seeds change.
- `atlas/page.tsx:73-75`: pin click is a no-op — see above. **Add `router.push` to chapter or back to a `/[author]/[slug]/` page when the click happens.**
- `atlas.tsx:528`: tile-load watchdog absent. Legacy had a 10s "no tile fetched at all" + 10s "no tile rendered" pair (lines 727-740) that escalated to Leaflet. Ours has no watchdog — if MapLibre stalls without throwing, user sees "LOADING ATLAS…" forever. Low likelihood given npm-imported lib, but worth a 15-second timeout that flips `failed = true` to surface SVG.
- `atlas.tsx:430`: `renderMarkersRef.current = …` is set in an effect, but is read by another effect that fires *first* on mount (boot effect, line 433+). On the initial run the ref is the no-op default `() => undefined`, then the marker placement at line 482 fires `idle` → calls a stale closure with no stops if the timing races. In practice the layoutless effect runs synchronously after render so it's usually OK, but it's fragile. Easier to call the closure directly inside boot.

### Recommendation: **MATCH** (port sidebar + click-handler + hover card; KEEP simplified renderer chain)

The renderer simplification (drop Leaflet) is fine — it's a deliberate seam-discipline win. Everything else (top nav, sidebar, More-projects feed, hover card, click navigation, letterbox in cinema, cluster collapse) needs to come back if `/atlas` is meant to be a real public surface and not a developer demo.

---

## Page 4: Project page (`/[author]/[slug]`) — additions only

Already covered in `tasks/AUDIT.md` "Screen 5". Skipping the per-mode italic/letterbox/cinema-EXT-subtitle items (already fixed). New observations only:

- **`StopCard` thumb crop ignores `heroFocus`** (`public-project-page.tsx:374-385`). Same as the chapter page bug. Owner-uploaded photos with intentional focus points get centre-cropped.
- **`coverAsset` falls through to "any asset with imageUrl"** (`public-project-page.tsx:60-62`). When no stop has a `heroAssetId`, ours picks the *first asset in the pool* — which can be a postcard variant rather than a photo. Legacy `coverStop = stops.find(s => s.heroAssetId) || current` (`public-project.jsx:19-20`) only ever uses a real stop hero. Means: a project where every stop has a postcard variant but no hero will show a stylised postcard as the cover image.
- **`<Atlas height={360}>`**: smaller than legacy's full-bleed band. Legacy `pp-atlas-band` was 1fr (map) : 320px (stop list). Our public-project page atlas has no sidebar list inside it — so you can't pick a stop from the atlas band on the project page either. The stop list lives in a separate cards grid lower down.
- **Footer Link**: "Published via London Cuts" → `/atlas` is reasonable but loses the legacy "More projects across London" feed-as-footer that gave readers somewhere to go after one project.
- **No `published` date or `reads` chip** in the sticky header beyond the line in mono. Legacy `chip chip-solid` "Published 2025-…" sits next to the title (`public-project.jsx:34-36`). Cosmetic.
- **`mode-uppercase` is wired** on the subtitle (line 241) — KEEP, this is good. Owner-confirmed-good.

---

## Owner-confirmed-good things to KEEP across all pages

- `--mode-display-font` / `--mode-italic` / `--mode-uppercase` CSS variables and their use in chapter h1, postcard h1, project h1.
- Cinema letterbox + EXT. subtitle on `public-project-page.tsx` hero (recent fix).
- `raster-brightness-max: 1.0` cap in `atlas.tsx` fashion style (recent fix).
- Postcard flip = button-only after F-I003 — survived in `postcard-card.tsx:145-168`.
- PNG/PDF export trio in `postcard-page.tsx` header — three buttons each with disabled-state, not present in legacy at all. Improvement.
- `<NotFoundCard>` shell across all three pages when the slug doesn't resolve — better than `notFound()` for shared-link UX.
- Real photos via `stop.heroAssetId` lookups in chapter hero and stop-card thumbnails (post F-I002 v5). When present they show; the gap is `heroFocus` not being honoured (cropping bug).

---

## Summary (≈150 words)

The reader pages are scaffold-quality. Three high-severity gaps: (1) the **postcard front** has no per-mode grammar — `PostcardFront` is mode-blind, where the legacy `PostcardFrontView` has full punk/cinema/fashion layouts with cqw-scaled overlays, taped chips, letterboxes and italic fashion grids; (2) the **chapter page** is one mode-blind layout, missing legacy's per-mode h1 size, body width branching, heroFocus crop, Maps chip, and pull-quote font; (3) the **atlas pages** dropped the hover card (no thumbnail preview before click), the sidebar stop list, cluster collapse, and on the standalone `/atlas` the click is a no-op. Across all pages, `heroFocus` from the editor is silently ignored in image crops. KEEPs: mode CSS vars, recent letterbox/brightness fixes, flip button, exports, NotFoundCard shell, real-photo hero lookups. Recommend: rebuild postcard-front and chapter-page for mode parity, port atlas hover-card + sidebar before announcing /atlas as a public surface.
