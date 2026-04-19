# London Cuts — MVP · Engineering Handoff

Target: Hackathon-ready MVP. This prototype mocks every product surface except the media generator itself (out of scope; we only design its entry, status, and result surfaces).

---

## 1. Information Architecture

```
Public surface (unauth + auth readers)
├─ /                         Landing             — editorial magazine index
├─ /atlas                    Atlas               — London-wide map + borough index
├─ /@:author/:slug           Public project      — mode-switchable long-form
│  └─ #stop-:n               Stop / Chapter      — deep-link to a chapter
├─ /@:author/:slug/p/:n      Postcard            — single postcard, front/back
└─ /search, /tags/:t         (post-MVP)

Studio surface (auth creators)
├─ /studio                   Dashboard           — projects + activity
├─ /studio/new               Create project      — 4-step wizard
└─ /studio/p/:id
   ├─ /upload                Upload memory set
   ├─ /organize              Organize / clustering
   ├─ /editor[?stop=:n]      Story editor
   ├─ /media                 Media integration panel
   └─ /publish               Publish
```

Global state: `narrativeMode` (punk | fashion | cinema), persisted to localStorage and to `project.default_mode`. Public readers can override; default comes from publisher.

---

## 2. Page-by-page direction

| # | Page | Intent | Key moves |
|---|---|---|---|
| 01 | Landing | Magazine masthead; 3-mode teaser; featured projects | Huge display type that re-renders per mode; CTA → Atlas & Studio |
| 02 | Public project | The hero artifact. Mode changes **layout grammar**, not color | Punk = ransom + taped collage + typewriter 2-col; Fashion = serif italic + whitespace + single hero portrait; Cinema = letterbox + subtitle + shot list |
| 03 | Atlas | Browsing across the city | SVG Thames map + project pins + borough index + filter grid |
| 04 | Stop | One chapter, rendered in current mode | Punk = collage w/ rotated cards; Fashion = big quote + asymmetric spread; Cinema = slate + shot sequence w/ subtitles |
| 05 | Postcard | Single generated artifact | 3D flip front/back; mode-specific front; version history; send as email |
| 06 | Studio dashboard | Home for creators | Stats strip; in-progress cards w/ step progress; activity log; published list |
| 07 | Create project | New project wizard | 4 steps: Details, Mode, Cover, Review (wizard shows step 2) |
| 08 | Upload | Ingest memory set | Drop zone; type breakdown; what-the-system-will-do explainer; detected-so-far panel with warnings |
| 09 | Organize | Cluster review + reorder | 3-pane: stop list (drag), map + timeline, inspector (hero, confidence, split/merge) |
| 10 | Story editor | Main writing surface | 3-pane: chapter list, canvas (contenteditable + media blocks), inspector (meta, postcard, media tasks) |
| 11 | Media panel | Entry / queue / results | Start task handoff cards; live task list w/ progress; results gallery draggable back to editor; selected-task inspector w/ prompt, seed, cost |
| 12 | Publish | Ship it | Pre-flight checklist; URL / visibility / default-mode / tags; live preview that reflects chosen mode |

---

## 3. Component inventory

**Shell** — `PublicNav`, `StudioSidebar`, `StudioTopbar`, `ModeSwitcher`
**Primitives** — `Img` (striped placeholder w/ mono caption), `Roundel` (Underground marker), `.btn`, `.chip`, `.eyebrow`, `.mono`, `.rule`
**Public** — `Landing`, `ProjectPunk` / `ProjectFashion` / `ProjectCinema`, `Atlas`, `StopPunk/Fashion/Cinema`, `Postcard` w/ `PostcardFront` + `PostcardBack`
**Studio** — `StudioShell`, `StudioDashboard`, `CreateProject`, `UploadMemories`, `OrganizeStops`, `StoryEditor`, `MediaPanel`, `Publish`
**Data** — `PROJECT`, `STOPS[]`, `PROJECTS_FEED[]` (swap for API)

### Design tokens (see `styles/base.css`)
- `--paper` / `--paper-2` / `--paper-3` warm off-white stack
- `--ink` / `--ink-2` / `--ink-3` warm near-black stack
- Mode tokens: `--mode-bg`, `--mode-ink`, `--mode-accent`, `--mode-display-font`, `--mode-body-font` — switched via `[data-mode="..."]` on the page root
- Fonts: `Archivo`, `Archivo Black` (punk display), `Bodoni Moda` (fashion display, italics), `Instrument Serif` (cinema display), `JetBrains Mono` (metadata / subtitles), `Caveat` (handwriting accents)

---

## 4. Key interactions

- **Mode switch** → flips `data-mode` at the root of any public page. Each public surface owns three separate sub-components (not just a CSS theme) because the **layout changes**. When implementing, keep shared content in a single data object; render three JSX trees per page.
- **Postcard flip** — CSS 3D (`perspective: 2000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`).
- **Organize — drag to reorder**: replace the static list with `dnd-kit` sortable; keep the inspector selection state driven by `selectedStopId`.
- **Story editor — contenteditable blocks**: swap for TipTap or Lexical in production. Block types: `heading`, `paragraph`, `hero-image`, `inline-image`, `pull-quote`, `media-embed` (video from media module).
- **Media panel handoff**: hitting "Start task" should POST to the external media service with `{stop_id, source_image_id, kind, mode}` and return a `task_id`. Poll or WS for `{state, progress, result_url}`.
- **Media panel drag-to-editor**: results should be draggable onto the editor canvas; dropping inserts a `media-embed` block bound to that result's immutable `asset_id`.

---

## 5. State list

Project lifecycle: `draft → in_progress → publishing → published → unlisted | archived`
Stop: `{id, n, title, code, time, mood, lat, lng, sourceImageIds[], heroImageId, bodyBlocks, postcard: {active_version_id, versions[]}}`
Media task: `queued | running | done | failed | cancelled` with `{id, kind, stop_id, source_asset_id, prompt, strength, seed, progress, eta, cost, result_asset_id}`
Asset: `{id, kind: 'photo'|'video'|'voice'|'text', uri, exif, transcript?, geo?, timestamp}`
User visibility per project: `public | unlisted | private`

---

## 6. Responsive rules

- **≥1280**: design target. Three-pane studio, 2-col public project, 4-col Atlas grid.
- **1024–1279**: collapse studio sidebar to an icon rail (toggle w/ ≡); 3-col Atlas grid; 2-col public project → 1-col with sticky image + flowing text.
- **≤1023 (tablet)**: single-pane studio (tabs replace panes); Atlas grid → 2-col; public project single-column; mode switcher stays in top nav; postcard flip retained.
- **≤640 (phone)**: public surfaces only (MVP); studio is desktop-first. Scene list in Cinema mode stays — letterboxed images scale. Nav collapses to `roundel + hamburger`.
- Use container queries on the editor/media 3-pane so panes drop correctly at their own widths (not viewport).

---

## 7. Mode grammar cheat sheet

| Aspect | Punk | Fashion | Cinema |
|---|---|---|---|
| Background | near-white | warm cream | deep blue-black |
| Display font | Archivo Black, UPPER, rotations | Bodoni Moda italic | Instrument Serif |
| Body font | Archivo / JetBrains Mono | Archivo | JetBrains Mono (subtitles) |
| Accent | red-orange `oklch(0.62 0.24 25)` | oxblood `oklch(0.45 0.12 25)` | subtitle yellow `oklch(0.88 0.14 90)` |
| Layout | asymmetric collage, tape, taped tilts, ransom headline | whitespace, single hero crop, centered pull quote, index grid | letterbox, slate card, shot sequence, subtitle captions |
| Postcard | stamped SE1!! red block type | magazine half-split portrait | letterbox still w/ subtitle |

---

## 8. Engineering handoff notes

1. **Framework**: Next.js (app router) + TypeScript + TanStack Query. Public pages SSR for SEO; studio is client-only.
2. **Styles**: keep `styles/base.css` token model as-is; port to CSS Modules or Vanilla Extract. Do not migrate to Tailwind — the typographic rhythm is easier in plain CSS here.
3. **Mode rendering**: each public page exports `PagePunk`, `PageFashion`, `PageCinema`, and a thin router picks by mode. Don't try to unify them behind a prop — the layouts diverge on purpose.
4. **Images**: replace the `.img-ph` placeholder with a `<Img src={asset.uri} crop={block.crop} />` component. Keep the striped fallback as the skeleton loader.
5. **Media module integration**: the external service is a black box. Contract:
   - `POST /media/tasks { stop_id, source_asset_id, kind, mode, prompt?, strength?, seed? } → { task_id }`
   - `GET /media/tasks/:id → { state, progress, eta_ms, result_asset_id?, error? }`
   - `WS /media/tasks/:id/events` (fallback to polling at 1s)
   - Results land in our asset store as immutable versions; the UI only ever references `asset_id`.
6. **Atlas map**: MVP ships the stylized SVG. Swap for Mapbox GL with a custom London-only style once we need pan/zoom at real scale.
7. **Editor**: TipTap or Lexical. Required nodes: `heroImage`, `inlineImage`, `pullQuote`, `mediaEmbed` (video or generated image tied to a media task). Block toolbar appears on `/` and on selection.
8. **Postcard rendering**: for shareable image export (email, download), server-side render the same React tree to a 2100×1500 PNG at 350dpi. Front + back as separate files.
9. **Accessibility**:
   - Mode switcher is a radiogroup (`role="radiogroup"`, `aria-checked`).
   - Cinema mode subtitle captions must have a prose fallback for screen readers (`aria-label` on the frame, visually-hidden `<p>` with the same text).
   - Punk mode's rotated elements: cap rotation at ±3° so text stays readable; use `transform: rotate` on the wrapper, not on the text node, so selection remains horizontal.
10. **Persistence**: `location.hash` for deep-linking between MVP screens is a placeholder. Swap for real routes.
11. **Performance**: studio 3-pane layouts should virtualize any list > 50 items (stops, tasks, memory grid). Memory uploads > 50MB should chunk (tus-js) and surface progress in the memory set panel.
12. **Analytics events to wire**: `mode_changed`, `project_created`, `memory_uploaded`, `stop_reclustered`, `media_task_started`, `media_task_done`, `postcard_generated`, `project_published`, `project_read`, `atlas_pin_clicked`.

---

## 9. Open questions (for the team)

- **Who owns the default mode per project?** Creator at publish time? Reader override per session? (Current assumption: creator sets default, reader overrides client-side.)
- **Are postcards addressable individually** (shareable URL with OG image) or only in-project? MVP assumes individually.
- **Is the Atlas real-map or stylized?** MVP is stylized; real-map requires a privacy review of geotags.
- **Mobile for studio?** Assumed desktop-only for MVP.
- **Memory set privacy**: when a project is published, are source images exposed or only the curated/edited hero images? Assumed: only what was placed in chapters.
