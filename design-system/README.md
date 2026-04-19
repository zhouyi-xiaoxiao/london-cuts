# London Cuts — Design System

A three-voice design system for **London Cuts**, a studio app for composing and publishing small editorial "walks" — illustrated journeys through a London postcode. Each walk is a sequence of numbered *stops*; each stop becomes a postcard, a body of writing, and a point on an atlas.

The distinctive idea: **one project, three visual modes.** The same content renders as **Fashion** (editorial italic serif, whitespace, amber paper), **Punk** (zine collage, Archivo Black, electric red, asymmetric), or **Cinema** (dark letterbox, subtitle yellow, JetBrains mono). Mode is a live reader choice, not an authoring decision — the app treats typography, layout, markers, and ornament as *grammar* that swaps per mode.

## Source

- **Codebase**: `london-cuts-EVERYTHING/london-cuts-v3/` (local mount) — full React-in-browser SPA, ~1800 lines of JSX, two CSS files (`styles/base.css`, `styles/v2.css`) containing the entire token + component system used here.
- **Reference bundles**: `_reference/` siblings contain earlier rounds, an original brief, a compiled single-file HTML build (`london-cuts-v3.html`), and postcard previews.
- **Seed imagery**: `london-cuts-v3/seed-images/` — 40+ photographs shot around SE1 (Waterloo, Bermondsey, Borough Market, Tate, Shard, Thames foreshore). These are the visual ground truth for the brand's photography: warm, walked-in, late-light, handheld.

## Product surfaces

- **Projects dashboard** — list of walks you've started, plus archived ones.
- **Workspace** — three-column editor: **Spine** (numbered stops, progress pips) · **Canvas** (hero slot, body editor, asset strip) · **Drawers** (tabbed: assets / tasks / info).
- **Postcard editor** — 3D flip card; front is a mode-grammar treatment of the hero; back is a handwritten message + ruled address block. AI can restyle the front as watercolour / riso / poster / oil etc.
- **Public project** — reader-facing long scroll: hero → atlas (real MapLibre map, 10+ SE1 stops) → stop detail. Mode pill in the top bar swaps the entire visual grammar.
- **Publish slideover** — right-side checklist drawer confirming every stop has upload + hero + body before going live.

---

## CONTENT FUNDAMENTALS

The writing voice is the **quiet editorial of a seasoned diarist** — a photographer-writer who walks the same borough at different hours. Think London Review of Books column, not product copy.

**Tone**
- Observational, sensory, unhurried. *"The river is the only thing in London that tells the time. Everything else lies — the sky, the lamps on the embankment, the hour on your phone — but the Thames knows exactly where the sun is."*
- First person, singular **I**. The reader is not addressed directly — there is no "you". Product chrome occasionally speaks to the author as "you" (*"Your work."*, *"Friends will only see content if you publish…"*) but editorial content never does.
- Short, true sentences next to long ones. No em-dashes in body prose; em-dashes are reserved for bylines and metadata rows.
- Present tense for observation; past tense for anecdote. Both appear on the same page.

**Casing**
- **Editorial copy** is sentence-case. Titles of stops are sentence-case too: *"Borough Market at opening"*, *"The walk home"*.
- **UI metadata** is ALL-CAPS mono: `SE1 9DT · 07:12 · AMBER`, `ED.01 · PUBLISHED 14 APR 2026`, `WATERLOO BR · DUSK`. This is the eyebrow voice — it never appears in running prose.
- **Punk mode** is the exception: display heads force uppercase and tilt slightly off axis.

**Pronouns & address**
- Editorial: I, the narrator. Named recipients appear abbreviated on postcards (*"M —"*, *"— A."*).
- Product: second-person for the author in their own studio (*"Your work."*). Never "we" — the app does not speak as a team.

**Emoji**
- **Never in editorial content.**
- Sparingly in product chrome as functional icons, always in small sizes: 📍 (map-jump), 🔗 (share), 📷 (demo load), 🎨 (regen styles), 📁 (new from photos), ⚡ (AI action), ⚠️ (draft warning), 🔄 (re-analyze). Treat them as icon substitutes only.
- Postcard style picker uses emoji as swatch-labels: 🎨 🗺️ 🟥 🖋️ ✂️ 🌸 🪻 🖼️.

**Vibe**
- Specific places, specific times. Every stop has a postcode and a clock time.
- Weather, light, temperature, direction (NE wind, 8°C, low tide) over adjectives.
- Cover labels read like filename stamps: `SOUTHWARK · GOLDEN HOUR`, `BERMONDSEY ST · NEON`, `WATERLOO BR · DUSK`.
- Mood words are single nouns: *Amber · Steel · Rust · Mud · Gold · Concrete · Ember · Neon · Silver · Stone · Brick.*

**Example copy in the wild**
- Project subtitle: *"Twelve walks between Bermondsey and Waterloo, 2025–2026"*
- Pull quote: *"Six minutes of gold, then nothing."*
- Meta row: `17:19 · 28 OCT 2025 · 8°C · SW · WATERLOO BR · DUSK`
- Activity feed: `NOW — 8/12 stops ready · 2 need a hero`

---

## VISUAL FOUNDATIONS

**Colors.** Warm paper base (`oklch(0.985 0.004 60)` — cream, not white) with ink that's a soft near-black, never `#000`. A single oxblood accent pulls from the London Underground roundel red. Three mode grammars override: Fashion deepens the paper toward cream and the accent toward plum; Punk snaps everything to pure black/white with an electric red; Cinema inverts the whole thing — deep indigo page, subtitle-yellow accent. There is no blue primary, no gradient brand system; everything is one flat accent against paper or night.

**Type.** Six families, each with a job. Editorial display: **Instrument Serif** (default) or **Bodoni Moda** (fashion italic). Punk display: **Archivo Black**. Body: **Archivo** sans. Meta + eyebrows + chips + captions: **JetBrains Mono**, always uppercase, tight tracking. Handwriting (postcards only): **Caveat**. Cinema body: JetBrains Mono, not Archivo — the body text itself becomes subtitle-like.

**Spacing.** 8-point scale (`4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64`). Default gutter `24px`, default edge `40px`. Content max-widths are narrative, not viewport-derived: editorial `1440px`, narrow `780px`, wide `1680px`, paragraph `64ch`.

**Backgrounds.** No gradients. No full-bleed hero imagery *as background* — imagery is always framed, captioned, and held within a 1px rule. Where an image is unavailable, the placeholder is a **135° two-tone stripe** (`.img-ph`) with a small mono caption chip in the corner — this is a distinctive brand pattern, used consistently across stops, empty states, and the asset strip. Cinema flips the stripes to cold greys; Punk to hard-edged 45° black/white bars.

**Animation.** Restrained. The only ambient animation is a **pip-pulse** on the spine (running media tasks) and the tour spotlight's box-shadow pulse — both ease-in-out 1.2–1.4s. Page transitions are `400ms ease` on `background` + `color` when the mode changes (the whole page recolours). Slideovers use a custom cubic `(0.2, 0.8, 0.3, 1)` over `260ms`. No bounces. No spring physics. The postcard flip is a 700ms 3D Y-rotation with the same cubic.

**Hover states.** Buttons invert fill (`background: currentColor; color: var(--mode-bg)`) — not opacity, not a tint shift. Spine rows lift with a soft `oklch(from currentColor l c h / 0.05)` wash. Atlas markers scale (1.2) and, for Cinema, deepen their glow.

**Press states.** Implicit — fill-invert covers both hover and active. No shrink transforms on editorial chrome. The only press transform is on lightweight floating buttons (the generate icon) which scale to `0.98`.

**Borders.** Hairlines only: `1px solid var(--rule)` (oklch 0.88 warm grey). Never rounded — the entire system is **hard-cornered**. Postcards, cards, images, inputs, popovers: all sharp. Exceptions are circular: roundels, chips (`border-radius: 999px`), progress pips, atlas markers.

**Shadows.** Minimal and purposeful:
- Cards and the atlas hover tooltip: `0 4px 18px rgba(0,0,0,0.10)`.
- Modals / slideovers: `-20px 0 40px rgba(0,0,0,0.20)` (slideover) or `0 20px 60px rgba(0,0,0,0.20)` (centered modal).
- Postcards: `0 20px 40px rgba(0,0,0,0.18)` — deeper because they float.
- **Punk mode replaces shadows with offset hard blocks:** `box-shadow: 6px 6px 0 currentColor` on the hero slot; `2px 2px 0` on atlas markers. This is a deliberate zine cue.

**Protection gradients vs capsules.** Captions over imagery use **opaque mono capsules** with a fractional background (`oklch(0.98 / 0.9)`) — never a gradient scrim. Cinema letterboxes are solid black bars on the top and bottom 48px of hero art; they read as subtitle framing, not as protection.

**Layout rules.**
- Top bar is sticky (`60px` tall). Every screen has one.
- Workspace grid is `[spine 288px] [canvas 1fr] [drawer 340px?]` — the drawer collapses.
- Fashion mode centres the canvas at `max-width: 880px`; Punk uses tighter padding and rotates the canvas-inner slightly; Cinema wraps the whole canvas in a 28px letterbox band.
- Nothing is fixed-position except the tour overlay, slideover, modals, and top bar.

**Transparency & blur.** Used rarely. Slideover scrim is `rgba(0,0,0,0.35)` with a **`backdrop-filter: blur(2px)`** — the only blur in the system. Atlas hover cards and attribution use fractional alpha on solid colours, not blur.

**Imagery colour vibe.** Warm, walked-in, handheld. Seed photos skew amber/gold (golden hour, morning amber, ember pub light) with periodic cool counterpoints (Shard glass, first light at Tower Bridge, rain on stone). Grain is visible and welcome — not dialled out. B&W is reserved for Punk-mode treatments. No over-saturated HDR, no cinematic teal/orange grading.

**Corner radii.** `0` for all container chrome. `2px` on the caption chip inside placeholders. `50%` for roundels, pips, atlas markers. `999px` for chips. Postcards: hard square corners; the 3D flip is the only curvature.

**Cards.** A card is `1px solid var(--rule)` + `padding: 20–24px` on `var(--paper)` (or mode-bg). No rounded corners, no coloured left borders, no gradient halos. Project cards add a thin 3px progress bar at the bottom in `var(--mode-accent)`. Variant strips run along the bottom as a horizontal scroll of 60×60px thumbnails.

**Iconic shapes.** The **Underground roundel** is a brand primitive — a circle with a horizontal bar across it, rendered as `.roundel` / `.roundel-xl`. It appears as the app logo, as the mid-dot between title and author, and (in Fashion mode) as a marker on the atlas. The **numeric stop badge** (`01`–`12`, mono, 11px, tracked) is equally recognisable. These are the two shapes that carry the brand across all three modes.

---

## ICONOGRAPHY

**London Cuts does not ship an icon set.** This is a deliberate choice — the system is typographic. Actions are labelled with mono text; affordances are carried by the eyebrow / caption voice (`EDIT ✎`, `DONE ✓`, `PUBLISH →`). When a glyph is needed, the codebase uses one of three sources, in this order of preference:

1. **Unicode arrows and mono pictograms.** `→` `←` `↑` `↓` `✎` `✓` `×` `↻` `↗` — these appear in buttons (`Publish →`, `Flip ↻`, `Done →`, `Open in tab ↗`), close affordances (`×`), and checklist state. They sit inline with mono type and inherit colour.
2. **Small, single-glyph emoji** as product chrome icons (functional, never decorative). A short list: 📍 (map pin), 🔗 (share), 📷 (photos demo), 🎨 (restyle), 📁 (folder/new from photos), ⚡ (AI generate), ⚠️ (warning), 🔄 (re-analyze), ✂️ 🌸 🪻 🖼️ 🖋️ 🟥 🗺️ (postcard style swatches). These are allowed because they render as single-coloured-ish glyphs at small sizes on most systems and never enter editorial content.
3. **Hand-rolled SVG brand primitives.** There are only two: the **roundel** (circle + bar, implemented in CSS with a pseudo-element) and the **atlas marker** (also CSS, per mode). No icon font. No Lucide, no Heroicons, no Font Awesome.

**No PNG icons. No SVG icon sprites. No illustration library.** If a new affordance is needed, the pattern is: (a) try to label it with mono text first; (b) fall back to a Unicode glyph; (c) only if neither works, use a small emoji. When introducing anything else, flag it as a brand extension.

**The `.img-ph` striped placeholder** is the closest thing to an illustration style — a 135° two-tone repeating stripe with a mono caption chip. Use it anywhere an image is missing. It carries the brand well because it's unmistakably part of the system.

**Photography is the imagery.** Real photographs (see `assets/seed-*.jpg`) are the visual content layer. They're always framed by a hairline rule, captioned in mono eyebrow voice, and — in Cinema mode — pinched into a 21:9 letterbox.

---

## Visual summary for LLMs

If you are a design agent generating output for this brand, default to:

- Warm-cream paper, oxblood accent, near-black ink.
- Instrument Serif (or Bodoni italic) for display; Archivo for body; JetBrains Mono for every piece of meta, eyebrow, chip, caption.
- Hard corners, hairline rules, no gradients, no rounded cards with coloured borders.
- 135° striped placeholders where you don't have an image; never generate SVG illustrations; never invent icons.
- Meta reads: `PLACE · TIME · MOOD` in uppercase mono. Editorial prose is sentence-case, first-person, observational, specific.
- When in doubt, strip ornament. The brand's confidence is in typographic hierarchy and photographic imagery, not in decoration.

---

## Index

Root files:

- `README.md` — this file.
- `SKILL.md` — cross-compatible Agent Skill entry point.
- `colors_and_type.css` — drop-in token + semantic type stylesheet.
- `fonts/` — *not bundled*; uses Google Fonts (see below).
- `assets/` — seed photography (12 images), ground truth for the brand's visual tone.
- `preview/` — small HTML cards that populate the Design System review tab.
- `ui_kits/studio/` — recreation of the London Cuts Studio app (Projects, Workspace, Postcard, Public views) as a click-through prototype.

Fonts are loaded from Google Fonts — no local copies are bundled. If you need to embed offline, the families to fetch are **Archivo**, **Archivo Black**, **Instrument Serif**, **Bodoni Moda**, **JetBrains Mono**, and **Caveat**.

> ⚠️ **Font substitution flag**: The codebase names Bodoni Moda (which *is* a close Google-Fonts substitute for real Bodoni / Didot). If the intended production face is actually Didot or a commercial Bodoni cut, please provide the licensed files so Fashion mode renders on-brand.

UI kits:

- `ui_kits/studio/` — complete studio product: projects dashboard, workspace shell (spine / canvas / drawers), postcard flip editor, public reader view. All three modes live; click the top-bar pill to swap.
