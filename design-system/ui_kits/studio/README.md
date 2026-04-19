# London Cuts Studio — UI Kit

A hi-fi recreation of the **London Cuts Studio** app, the authoring surface for editorial walks. Cosmetic components only — state is toy, not real.

## Screens (click to switch)

1. **Projects** — "Your work." Grid of walks, one CURRENT + archived cards.
2. **Workspace** — Spine (numbered stops) · Canvas (hero, editor, asset strip) · Drawers (assets / tasks / info).
3. **Postcard** — 3D flip card; front is mode-grammar photo + caption; back is handwritten message + ruled address.
4. **Public** — Reader view with mode switcher in the top bar that live-swaps the whole grammar (Fashion / Punk / Cinema).

## Components

- `TopBar` · `Roundel` · `ModePill` · `Button` · `Chip` · `Eyebrow` · `MetaRow`
- `ProjectCard` · `ActivityList`
- `Spine` · `SpineRow` · `ProgressPips`
- `Canvas` · `HeroSlot` · `BodyEditor` · `AssetStrip` · `Img` (striped placeholder)
- `Drawer` · `DrawerTabs` · `TaskRow`
- `Postcard` · `PostcardBack`
- `PublicHero` · `AtlasMarker` · `StopDetail`

Import order in `index.html`: React/ReactDOM/Babel → `tokens.css` → `components.jsx` → `screens.jsx` → `app.jsx`.
