# London Cuts — V2 Handoff

> Companion document to `London Cuts V2 Handoff.html`. The HTML is
> the source of truth for visuals and interaction; this file is the
> prose + engineering checklist.

## 0 — Brief in one paragraph

V1 shipped as twelve screens divided along pipeline phase (upload →
organize → write → media → publish). Users don't think in phases; they
think in stops. V2 collapses the public surface to a single scroll
(overview → atlas → stop) and the studio to a single workspace
(spine + canvas + drawers). Publish becomes a slide-over, not a page.
Postcard message + recipient are editable. The visual system is
unchanged — same warm paper, same three mode grammars (punk, fashion,
cinema), same Underground roundel, same London signals.

---

## 1 — Screens (5, down from 12)

| # | Screen               | Replaces                                                      |
|---|----------------------|---------------------------------------------------------------|
| 1 | Landing              | Landing                                                       |
| 2 | Public project       | Public project + Atlas + Stop (now one scroll)                |
| 3 | Postcard (+ editable)| Postcard                                                      |
| 4 | Projects list        | Studio dashboard + Create project (now a modal)               |
| 5 | Project workspace    | Upload + Organize + Story editor + Media panel + Publish*     |

\*Publish is surfaced as a right-side slide-over inside the workspace.

## 2 — Navigation rules

- **Public project** is one page, one URL base; atlas markers scroll-jump
  to the stop detail below. Stops deep-link via `#stop-05`.
- **Workspace** uses the spine as its only primary navigator. Selecting
  a stop updates `?stop=05` so refresh restores state.
- **Publish** opens a 60vw slide-over. `Esc` or scrim-click dismisses
  back to the exact workspace state the user left.
- **Postcard** has its own detail page because postcards are shareable
  artifacts (OG images, download flow).

## 3 — Content node types (6)

The editor is TipTap / Lexical-compatible. Nodes are mode-agnostic;
mode switches render schemas, not document content.

| Node          | Render class | Notes |
|---------------|--------------|-------|
| `paragraph`   | `.n-para`    | Body. `text-wrap: pretty`. 64ch (punk/fashion), 56ch (cinema). |
| `heroImage`   | `.n-hero`    | Full-width, 16:9 (21:9 cinema). One per stop max. Caption in mono caps. |
| `inlineImage` | `.n-inline`  | 180–240px, left/right align. Inline caption. |
| `pullQuote`   | `.n-pull`    | Large quote. Centered italic (fashion) / taped ransom (punk) / subtitle card (cinema). |
| `mediaEmbed`  | `.n-embed`   | Bound to a media task's `resultAssetId`. Inline playback. |
| `metaRow`     | `.n-meta`    | Structured metadata chips (time, weather, postcode). 10–11px mono. |

Slash menu: `/` on an empty line → filter → Enter inserts.  
Block toolbar: convert, move, delete.

## 4 — Atlas style kits (MapLibre GL + OSM raster)

See §04 in the HTML for the full paint table. Summary:

- **Punk** — newsprint base `#f0ece0`, desaturated tiles, red-orange
  chips rotated −4°, chunky 2px black border, 12px Archivo Black
  numerals, 2px hard shadow.
- **Fashion** — cream base `#f7f1e6`, warm ochre water, oxblood ring
  marker with Bodoni italic numeral.
- **Cinema** — deep blue-black `#050a18`, hue-rotated tiles, subtitle-
  yellow ring + 14px glow. Letterbox bars clamp the viewport.

## 5 — Postcard editor

Message and recipient are editable per stop.

- Click handwritten message → fields inline; Caveat preserved.
- Click address → ruled fields inline; typography preserved.
- Per-mode edit affordance:
  - Punk: taped red-orange label above the field, rotated −3°,
    dashed red-orange outline.
  - Fashion: oxblood underline, eyebrow label appears above.
  - Cinema: slate frame + subtitle-yellow 60% outline + soft glow.
- Save = debounced (500ms). "Versions" list on the right continues to
  snapshot prior content.

## 6 — State additions

```ts
stop.body: Node[]                                 // TipTap-compatible doc
stop.status: {
  upload: boolean, hero: boolean, body: boolean,
  media: null | 'queued' | 'running' | 'done' | 'failed'
}
stop.postcard: {
  message: string,
  recipient: { name: string, line1: string, line2: string, country: string }
}
project.visibility: 'private' | 'unlisted' | 'public'
project.defaultMode: 'punk' | 'fashion' | 'cinema'
project.slug: string

ui.drawerOpen: boolean
ui.drawerTab: 'assets' | 'queue'
ui.publishOpen: boolean
```

New store actions:

```ts
setBody(stopId, nodes)
setPostcardMessage(stopId, message)
setRecipient(stopId, recipient)
setVisibility(visibility)
setDefaultMode(mode)
setSlug(slug)
```

`MediaProvider` is unchanged. The Media queue drawer subscribes via
`useMediaTasks()`; running tasks drive spine pip progress from the same
subscription.

## 7 — Component delta

### New
- `Workspace` · `Spine` · `WSCanvas` · `WSDrawers`
- `ContentNode` (6 variants; reused on public + workspace)
- `PublishSlideover`
- `PostcardEditor` (replaces V1 `Postcard`)
- `Pips`, `ModePill` (primitives)

### Retired
- `StudioSidebar` (replaced by Spine)
- `UploadMemories`, `OrganizeStops`, `StoryEditor`, `MediaPanel`,
  `Publish` — folded into Workspace. Logic migrates; components delete.

## 8 — Responsive

Workspace is desktop-first. Below 1024, right drawers become bottom
sheets; below 768, spine collapses into a horizontal swipe strip.
Below 640, studio shows a "continue on desktop" page with a QR to the
current stop. Public scales all the way down cleanly (letterbox clamps
to 20px in cinema on mobile).

## 9 — Migration checklist

- [ ] Land `Workspace` shell behind a feature flag (`v2_workspace`)
- [ ] Port TipTap schema (6 nodes) + add to `stop.body`
- [ ] Add `stop.postcard.{message,recipient}` and inline editor
- [ ] Replace `Publish` page with `PublishSlideover`; update nav
- [ ] Merge `PublicProject` / `Atlas` / `Stop` into single scroll
- [ ] Retire V1 pages; update all routes
- [ ] Update OG card pipeline to read `stop.postcard.message`
- [ ] QA on mode-switch persistence + deep link refresh

---

_Ed.02 · April 2026. See `London Cuts V2 Handoff.html` for the live
prototype and figures._
