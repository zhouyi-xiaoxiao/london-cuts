# London Cuts — V2 Brief package

This bundle is meant to be uploaded into a **new Claude Design conversation**
as the starting context for a V2 redesign.

## What's inside

```
london-cuts-v2-brief/
├── README.md                     ← you are here
├── V2-BRIEF.md                   ← the main brief to paste into Claude Design
├── CLAUDE.md                     ← product mission + boundaries (unchanged from V1)
├── HANDOFF.md                    ← V1 engineering handoff (your previous output)
├── current-prototype/            ← V1 implemented as a working prototype
│   ├── README.md
│   ├── index.html                (multi-file entry)
│   ├── london-cuts.html          (single-file bundle — double-click to run)
│   ├── styles/base.css
│   └── src/*.jsx                 (13 modules)
└── screenshots/
    └── postcards-sheet.png       (V1 postcard export — 3 modes × 2 sides)
```

## How to hand this off

1. Open a **new** Claude Design conversation (not a continuation of the V1
   conversation — see `V2-BRIEF.md §Context` for why).
2. Upload this entire zip, or at minimum: `V2-BRIEF.md`, `CLAUDE.md`,
   `HANDOFF.md`, and `screenshots/postcards-sheet.png`.
3. Paste the contents of `V2-BRIEF.md` as the opening message, or reference
   it ("Please read V2-BRIEF.md").
4. Tell Claude Design you want its output back as a new handoff bundle that
   Claude Code / Cowork can implement against.

## What V2 asks for at a glance

- Collapse 12 screens into **5** (consolidate the Studio phases into a
  single project workspace)
- Make the Atlas a **real interactive map** with 3 mode styles
- Make postcard message + recipient **editable**
- Define **content node types** for the story editor (so it can be
  persisted via TipTap / Lexical)
- Collapse Publish into a **slide-over panel**, not a separate page

The V1 design system (fonts, colours, mode grammars, London signals) is
preserved — V2 is an IA and interaction redesign, not a visual reset.

## Implementation side — context for Claude Design

The implementation will continue on top of the existing V1 prototype:

- State: single project store in `current-prototype/src/store.jsx`,
  persisted to `localStorage`
- Media: `MediaProvider` interface in `current-prototype/src/media-provider.jsx`
  with a swappable mock — the real img2img / img2vid service is owned by a
  teammate and plugs in via `setMediaProvider(...)`
- Postcard export: real 2100×1500 canvas-based PNG download in
  `current-prototype/src/postcard-export.jsx`

No API contract changes are expected for V2. If the redesign requires new
data shape or new MediaProvider methods, please note them explicitly in the
V2 handoff so the implementation side can plumb them through.
