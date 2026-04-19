# London Cuts — V2 Brief (for Claude Design)

## Context

This is the second round of design for London Cuts. V1 (designed by you in an earlier
conversation) has been fully implemented as an interactive prototype — see the
`current-prototype/` folder for the running React/Babel source, the `HANDOFF.md`
document, and `CLAUDE.md` for the project mission. You can open
`current-prototype/london-cuts.html` in a browser to see V1 running.

V1 worked at the visual level — the three mode grammars (Punk / Fashion / Cinema)
feel right, the London-specific signals land, the postcard mechanics are working
and can export a real PNG. But user testing exposed a structural problem that
visual polish can't fix: the Studio is split into too many pages, and the pages
are split along the wrong axis.

## The core problem

The Studio end (screens 06–12) is sliced by **pipeline phase**:
Dashboard → Create → Upload → Organize → Editor → Media → Publish.

But the user's actual mental model is not "I am in the Upload phase." It is
**"I am working on Stop 05 — Waterloo Bridge."** For any given stop, they want
to pull the three photos from that day, pick which one is the hero, write two
paragraphs, kick off an AI render, preview the postcard, and come back to tweak
later. That is one unified act at the stop level — not five separate apps.

Splitting by phase means the core task (write one stop end-to-end) costs five
page transitions. Reopening a project to fix one stop means navigating Upload
→ Organize → Editor → Media → Preview just to find the thing you want to
change. It feels like running five apps instead of using one.

## What stays (do not redesign)

The design system from V1 is correct. Keep it:

- **Typography stack**: Archivo (base), Archivo Black (Punk display), Bodoni
  Moda italic (Fashion display), Instrument Serif (Cinema display),
  JetBrains Mono (metadata / captions / mono UI), Caveat (handwriting accent)
- **Color tokens**: warm off-white `oklch(0.98 0.004 60)`, ink `oklch(0.12 0.008 60)`,
  Punk red-orange `oklch(0.62 0.24 25)`, Fashion oxblood `oklch(0.55 0.14 20)`,
  Cinema blue-black `oklch(0.18 0.02 240)` + subtitle yellow `oklch(0.85 0.14 90)`
- **Mode grammar**: Punk = ransom collage, taped tilts, Archivo Black caps;
  Fashion = whitespace, single hero crop, Bodoni italic; Cinema = letterbox,
  slate card, JetBrains Mono subtitles on deep blue-black. These three
  grammars should continue to feel like three different products, not three
  colour themes.
- **London signals**: Underground roundel as wayfinding mark, postcode labels
  (SE1 7PB), time-of-day metadata, Thames-ribbon geography

See `HANDOFF.md §3 Design System` and `§7 Mode Grammar Cheat Sheet` for the
full V1 system.

## What changes (the redesign)

### 1. Collapse 12 screens into 5

From V1's 12-screen IA, consolidate to:

1. **Landing** (keep 01 as-is)
2. **Public project** — merge V1's 02 (Public project) + 03 (Atlas) +
   04 (Stop). Readers should move through a continuous scrolling / layered
   experience: project overview, then an interactive atlas, then any
   stop's detail page. No hard page breaks between these three.
3. **Postcard** (keep 05, with small additions — see §3 below)
4. **Projects list** — merge V1's 06 (Studio dashboard) + 07 (Create
   project). Cards grid + New button opens a modal, not a separate page.
5. **Project workspace** — merge V1's 08 (Upload) + 09 (Organize) +
   10 (Editor) + 11 (Media panel) + 12 (Publish) into **one screen** that
   the user lives in for as long as they are working on a project.

The workspace is the hardest piece. Design it as:

- **Left spine** — vertical list of the 12 stops. Each row shows the stop's
  number, title, and a compact progress indicator (uploads present? hero
  picked? body text written? media task status?). Clicking a row becomes the
  new main content. This replaces V1's Upload + Organize + Editor + Media
  top-level navigation. Active stop is visually prominent; the spine doubles
  as project-wide progress.
- **Main canvas** — everything for the selected stop, in one view: hero
  image slot, upload / drag-drop area, ordered asset strip, rich-text body
  editor, inline media embeds, and a postcard preview tile. This is where
  writing happens.
- **Right drawer A — Assets pool** (collapsible). Global inbox for all
  uploaded / unassigned photos, videos, voice notes, text fragments.
  Draggable onto any stop in the spine. Holds the "I took 80 photos, let's
  sort them" moment.
- **Right drawer B — Media queue** (collapsible). Shows the list of running
  / queued / completed AI image-to-image and image-to-video tasks. Live
  progress dots also appear on the spine next to the stop the task belongs
  to, so users do not need to open the drawer to see progress.
- **Top bar** — mode switcher (Punk / Fashion / Cinema), project title,
  Publish button. Publish opens a **slide-over panel**, not a new screen —
  it covers about 60% width from the right, shows the pre-flight checklist
  + slug + visibility + share, and can be dismissed back to the workspace.

Design the workspace for all three modes. The mode-switching behaviour in
the workspace should still feel meaningfully different between Punk / Fashion
/ Cinema — not just token swaps. (Fashion's workspace might have more
whitespace and a tight column; Cinema might use letterbox framing around the
main canvas; Punk might allow asymmetric overlap between assets pool and
main.) Surface three distinct workspace variants.

### 2. Atlas needs to be a real interactive map

V1's atlas is a stylized static SVG — beautiful as a decorative element but
not a real wayfinding tool. In V2:

- Atlas is embedded inside the Public project surface (not a separate page).
- It must support pan + zoom. 12 stop markers are placed at real GPS
  coordinates in SE1 (we will use actual London coordinates).
- Markers are clickable → scroll / transition into the selected stop's
  detail view.
- Markers on hover show a compact preview card (hero image + stop title +
  one-line caption).

We will implement this with MapLibre GL + OpenStreetMap raster tiles (no
token needed). Please design **three map style directions** — one per mode:

- **Punk map** — high contrast black / white / newsprint grey, chaotic
  marker tilts, hand-drawn Thames line if possible. Xerox / zine energy.
- **Fashion map** — cream paper base, warm ink lines, sparse labels, a
  single accent colour for markers, soft and editorial.
- **Cinema map** — deep blue-black base with low-saturation roads, neon
  amber / subtitle-yellow markers, letterbox treatment at top and bottom of
  the viewport. Noir / cityscape-at-night feel.

For each mode please provide: base colour, water colour, road colour,
label colour + font, marker style (shape, colour, size), hover interaction
colour, and a brief vibe description. We will translate these into MapLibre
style JSON on our side.

### 3. Postcard: message + recipient must be editable

V1 postcards have hard-coded text ("M — walked home across Waterloo…" and
the address "Matteo Ricci, Rua das Flores 28, Lisbon"). In V2 these become
editable state per stop.

Design:

- A message editor state for the handwritten side (Caveat font preserved).
  Keep the tactile, handwritten feel — the editor should still feel like
  writing on a postcard, not filling a textarea.
- A recipient block editor (name + address lines + country). Same
  constraint — should look like an address, not a form.
- All three modes need their own treatment of "edit state" vs "view state."
  Fashion can afford the most minimal transition (text fields inline);
  Punk might show edit affordances as taped labels; Cinema could frame the
  editable region with a slate.

### 4. Story editor: define content node types

V1's story editor is a generic contentEditable and does not persist content.
V2 will use TipTap or Lexical on the implementation side. Please define the
**content node types** the editor supports, and how each renders in each
mode. At minimum:

- `paragraph` (body text)
- `heroImage` (single full-width image tied to a stop)
- `inlineImage` (in-flow image with caption)
- `pullQuote` (large styled quote)
- `mediaEmbed` (a finished image-to-video clip inline in the text)
- `metaRow` (structured metadata like "17:19 · 8°C · SW wind")

For each node, please specify:

- How it looks in Punk / Fashion / Cinema
- Inline editing affordances (resize handles? caption field? alt text?)
- Keyboard entry behaviour (what happens when the user presses `/` or
  Enter?)

### 5. Publish as a slide-over, not a page

Collapse V1 screen 12 into a slide-over panel that takes about 60% of
viewport width from the right edge. Contents:

- Pre-flight checklist (missing heroes, missing bodies, stops with no
  content) — readable as a scrollable list with jump-to-stop links
- Slug editor
- Visibility toggle (public / unlisted / private)
- Share affordances (copy link, open public page in new tab)
- Small live preview of the public project surface

This replaces a full page with a contextual action — the user never leaves
their workspace.

## What you should output

A new handoff bundle (`HANDOFF-V2.md` + JSX / HTML prototype + design
system diff). Specifically:

1. **Updated information architecture** — explicit 5-screen IA with
   navigation rules
2. **Workspace high-fidelity designs** — one per mode (Punk / Fashion /
   Cinema), annotated
3. **Public project unified design** — shows the scroll / layer
   transitions between overview → atlas → stop detail
4. **Atlas style kits** — one per mode (colour, markers, type, vibe)
5. **Content node type specs** — render-per-mode matrix
6. **Postcard editor states** — one per mode, with edit → view
   transitions
7. **Publish slide-over** — one per mode
8. **Design system diff** — what stayed, what changed from V1. Reuse V1
   tokens wherever possible; flag any new tokens explicitly
9. **Engineering handoff notes** for V2 — MapLibre style JSON skeletons
   per mode, TipTap node render specs, updated component inventory
10. **Responsive rules** for the workspace (at <= 1280 the right drawers
    become bottom sheets; at <= 768 the spine collapses into a horizontal
    swipe strip)

## Out of scope (unchanged from V1)

- The actual image-to-image and image-to-video generator is owned by a
  teammate. Do not design the generator UI itself. Continue treating it
  as a black box behind the MediaProvider interface. V1 already has the
  correct entry points + task states + result gallery inside screen 11;
  those move into the Media queue drawer in V2.
- No multi-user, auth, or e-commerce surfaces.

## How we will iterate

When you hand the V2 bundle back, the implementation side (Claude Code /
Cowork) will land the new IA and map / editor integrations on top of the
existing state store and MediaProvider abstraction — no contract changes
needed. If during the design you discover you need a new data shape or
provider method, note it in the handoff and we will work it in.
