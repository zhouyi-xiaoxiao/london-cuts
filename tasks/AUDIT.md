# AUDIT — Our app vs legacy vs design-system

**Date**: 2026-04-22
**Author**: Claude (opus-4.7) for owner @zhouyi-xiaoxiao
**Purpose**: Honest gap analysis to decide M-iter priority before opening M1 (Supabase). Owner fills VERDICT column.

---

## TL;DR — 7 critical gaps requiring owner decisions

| # | Gap | Where | Severity | My recommendation |
|---|---|---|---|---|
| 1 | **No onboarding** | dashboard first visit | high | Port `FirstVisitBanner` + welcome copy |
| 2 | **No "Load demo" button** | dashboard top bar | high | Port "📷 Load London Memories demo" + "📷 Load Hackathon demo" |
| 3 | **No variant cache** | postcard generation | high (cost) | Port `lcVariantCacheGet` — re-picking a style should be $0, not $0.02 |
| 4 | **Per-mode italic/uppercase regressed** | h1s everywhere | medium | Move inline `fontStyle: 'italic'` into mode-aware CSS |
| 5 | **Public-page cinema letterbox + EXT. subtitle missing** | `/@author/slug` hero | medium | Restore the cinematic feel — the cinema mode is the most photogenic |
| 6 | **No demo tour** | first-time users | medium | Port `demo-tour.jsx` (guided "click here to start" overlay) |
| 7 | **No "Reset to seed" + "Reset full"** | needs both | low | Add an explicit "RESET TO DEMO" alongside existing RESET DATA |

**My verdict on the bigger question**: M-fast was a SCAFFOLD-level port, not a feature port. Roughly **40% of legacy product surface** is missing in the new app. The architecture is right, the seam layer is right, but the UX is half a port.

---

## Methodology

For each screen:
- **Ours** = web/components/... (current Next.js port)
- **Legacy** = archive/app-html-prototype-2026-04-20/src/*.jsx (frozen reference)
- **Design** = design-system/preview/*.html (intended reference)

Owner reviews each row, fills VERDICT:
- `KEEP` = our impl is fine
- `MATCH` = port the missing legacy behavior verbatim
- `REBUILD` = legacy is also wrong; design something better
- `DROP` = legacy had this but we're cutting it from product

---

## Screen 1: Dashboard (`/studio`)

**Ours**: `web/components/studio/projects-dashboard.tsx` (649 lines). 3 buttons (RESET DATA / 📁 NEW FROM PHOTOS / + NEW PROJECT). Project cards with photo cover + status pill + activity feed.

**Legacy**: `projects-list.jsx` (~200 lines). 6 buttons (📷 Load London Memories demo / 📷 Load Hackathon demo / ? Demo / Reset data / 📁 New from photos / + New project). Plus `<FirstVisitBanner />` for first-time users.

**Design**: `design-system/preview/components-project-card.html` is the canonical card spec.

| Gap | Decision | VERDICT |
|---|---|---|
| Missing "Load London Memories demo" — instantly populates 13 stops with photos + AI descriptions | port the button + wire to `loadLondonMemoryDemo()` | ___ |
| Missing "Load Hackathon demo" — 28 photos no AI | port if you want a heavier demo for friends | ___ |
| Missing "? Demo" tour entry point | port `demo-tour.jsx`'s `startTour()` | ___ |
| Missing `<FirstVisitBanner />` | port — empty dashboard is hostile to first-time users | ___ |
| h1 hardcodes `var(--f-fashion)` (matches legacy — we faithfully ported the wrong thing) | mode-aware via `var(--mode-display-font)` | REBUILD |
| ✅ Project cards with real seed photos (after F-I002 v5 bump) | — | KEEP |
| ✅ Real activity feed under "ACTIVITY" | — | KEEP |

---

## Screen 2: Workspace (`/studio/<id>/editor`)

**Ours**: `web/components/studio/workspace.tsx` (~360 lines port of legacy). Top bar + spine + canvas + right drawer.

**Legacy**: `workspace.jsx` (**2557 lines** — biggest file in the prototype). Spine + canvas + drawers + lots of inline editor affordances.

**Design**: `design-system/preview/components-spine-rows.html` + `components-content-nodes.html` + `components-mode-pill.html`.

**Honest assessment**: I haven't read all 2557 lines of legacy workspace yet. Almost certainly the gap here is the LARGEST. Things I noticed in the snapshot but haven't audited:

| Gap | Decision | VERDICT |
|---|---|---|
| Hero image alt is "WATERLOO BR · DUSK" but actual photo is church interior — coverLabel and photo mismatched | re-derive coverLabel from photo or drop it | ___ |
| No drag-to-reorder stops in spine (legacy had this) | check legacy for `Sortable` / drag handlers | ___ |
| No "+ ADD STOP" button visible | unclear if it exists | ___ |
| No inline body editor for "metaRow" / "pullQuote" / "heroImage" / "inlineImage" / "mediaEmbed" — only paragraph + pullQuote + metaRow per F-T005 docs | port 2 missing block types from legacy | ___ |
| ✅ Mode picker (FASHION / PUNK / CINEMA radios) works | — | KEEP |
| ✅ Spine-style stop list with progress dots | — | KEEP |
| ✅ Hero photo loads from seed | — | KEEP (after F-I002) |

**Action item**: I should spend a separate sub-session to read the entire 2557-line `workspace.jsx` and produce a sub-audit. Will be a long list.

---

## Screen 3: Postcard editor

**Ours**: `web/components/postcard/{postcard-card,postcard-front,postcard-back,postcard-editor,style-picker,orientation-toggle}.tsx`. Flip card via dedicated button (post F-I003), 6 styles, generate button.

**Legacy**: `postcard-editor.jsx` — has the 6 styles with FULL prompt strings, plus:

| Gap | Decision | VERDICT |
|---|---|---|
| **No variant cache** — every re-pick of a style costs another $0.02. Legacy: `lcVariantCacheGet(key)` checks IDB by `source+style` hash, restores for $0 | port the cache layer; biggest cost-control miss | ___ |
| **No user-paste-own-API-key modal** — legacy has `setShowKeyModal(true)`. Ours requires `.env.local` config | M2 makes this moot; defer | DROP-now |
| **No image-derived palette display** — legacy shows the source's dominant colors next to the postcard for visual context | nice-to-have | DROP-now |
| **Auto-orientation detection** — legacy uses `useImageOrientation(frontUrl)` to pick portrait/landscape from the actual image. Ours has manual override only | port — saves a click | ___ |
| **Initial flip state** — legacy starts on BACK (`useState(true)`) so user lands on the message-writing side. Ours starts on FRONT | small UX choice; legacy is right | MATCH |
| ✅ All 6 styles ported with same prompts | — | KEEP |
| ✅ Flip is now a button not click-anywhere (F-I003 — improvement over legacy) | — | KEEP |

---

## Screen 4: Publish dialog

**Ours**: `web/components/studio/publish-dialog.tsx`. Slideover with pre-flight, URL input, visibility radio, Live banner (F-I004).

**Legacy**: `publish.jsx`. Same slideover shape but:

| Gap | Decision | VERDICT |
|---|---|---|
| **Publish URL is in-app** — legacy uses `${location.origin}${location.pathname}#public` = same tab, hash route. Means publish + view-public is ONE app session, no SSG dependency | We have `/@author/slug` SSG routes which DON'T have user data | architectural fork — needs M1 to make ours work; legacy "works" today via single-page hash | ___ |
| **PDF export with CORS-aware image-to-dataURL + cover-crop** — legacy has 100+ lines of PDF cropping logic. We use jspdf simply | check if our PDF export actually produces good output (haven't tested visually) | ___ |
| **Help modal** — legacy has `setHelpOpen(true)` for "what happens when I publish?" | port — publish is a scary action | ___ |
| **Pre-flight only checks 3 things** in legacy (upload/hero/body). Ours checks 4 (added postcard-message). Stricter is better | — | KEEP-OURS |
| ✅ Live banner with copy + open buttons (F-I004 — better than legacy's toast-then-disappear) | — | KEEP |

---

## Screen 5: Public project page (`/@author/slug`)

**Ours**: `web/components/public/public-project-page.tsx`. Hero + atlas + stop list. Renders from store.

**Legacy**: `public-project.jsx`. Same layout shape but:

| Gap | Decision | VERDICT |
|---|---|---|
| **h1 mode-aware** at runtime: `fontStyle: mode === 'fashion' ? 'italic' : 'normal'` + `textTransform: mode === 'punk' ? 'uppercase' : 'none'` + `fontSize: mode === 'punk' ? 132 : 116`. Ours hardcodes italic. | move to mode-aware (also fixes Screen 1) | REBUILD |
| **Cinema letterboxing** — legacy adds top/bottom 48px black bands + an "EXT. <LOCATION>" subtitle bar inside hero photo. Ours: no | port — cinema mode loses 80% of its identity without this | MATCH |
| **Mode pill** in sticky header — legacy `<ModePill />` lets viewers switch mode. Ours: ?? | check if our public has a mode picker | ___ |
| **Author handle** is `@ana` not `@ana-ishii` in legacy | small inconsistency | trivial |
| ✅ Real photo cover when available | — | KEEP |
| ✅ Atlas band with map pins | — | KEEP |
| ❌ **STRUCTURAL** — clicking the "live URL" gives the seed-time `@ana-ishii/a-year-in-se1` content, not user's actual content. Cross-device fictional. Legacy doesn't have this issue because it's all single-page. | M1 (Supabase) is the only fix | M1 |

---

## Screen 6: Atlas (`/atlas`)

**Ours**: MapLibre + 19 stop pins (all seed projects).

**Legacy**: `public-atlas.jsx`.

| Gap | Decision | VERDICT |
|---|---|---|
| MapLibre `raster-brightness-max: 1.08` console error (F-I005 fixed today) | — | DONE |
| Atlas marker hover affordances per mode (`atlas-marker[data-mode="punk"]:hover { transform: rotate(-4deg) scale(1.2) }` etc.) — defined in legacy v2.css, dropped in our globals.css merge | port the hover micro-interactions | ___ |
| ❌ Haven't visually compared yet | TODO next session | ___ |

---

## Real-interaction tests run today

| # | Test | Status | Findings |
|---|---|---|---|
| 1 | Load `/studio` cold (cleared localStorage) | ✅ pass | Renders; 13 seed assets load; SE1 cover photo shows |
| 2 | Switch mode fashion → punk → cinema (via DOM data-mode) | ✅ pass | Fonts swap correctly (verified Bodoni / Archivo Black / Instrument Serif via getComputedStyle) |
| 3 | Open `/studio/seed-a-year-in-se1/editor` workspace | ✅ pass | Spine + hero + metadata fields all render |
| 4 | Click postcard flip button | ✅ pass | Card flips back-front (transform matrix verified) |
| 5 | Click textarea on back-side of postcard | ✅ pass | Stays flipped (no gesture conflict — F-I003 verified) |
| 6 | Open Publish dialog from workspace | ✅ pass | Live banner shows real URL `http://localhost:3000/@ana-ishii/a-year-in-se1` |
| 7 | Navigate to `/@ana-ishii/a-year-in-se1` | ✅ pass | Public page renders with cover, atlas, stop cards |
| 8 | Upload a photo to a stop | ⚠️ NOT RUN | requires file picker — Preview MCP can't drive |
| 9 | Generate an AI postcard (mock mode) | ⚠️ NOT RUN | requires multi-step interaction |
| 10 | Publish then open URL in second browser | ⚠️ NOT RUN | requires second browser instance — but we KNOW it would show seed not user data |

---

## Recommended priority order (my proposal)

1. **STOP porting blindly. Read the full 2557-line `workspace.jsx`** and produce a workspace sub-audit. That's where 40% of the legacy product lives and we have a SHELL.
2. **Decide what stays vs cuts** — owner reviews this doc + workspace sub-audit, marks VERDICT column. Likely 40-60% of legacy gets DROP-now.
3. **Port the high-value, owner-confirmed misses** — variant cache (saves $), demo loader (gives friends a ready trip), per-mode CSS (gives the 3 modes their identity back), cinema letterbox.
4. **Then** open M1 (Supabase) on the polished surface.

---

## What I should have done differently (BAR/AAR)

- Should have **read all of `workspace.jsx`** before claiming F-T004 done. 2557 lines isn't a "shell".
- Should have **diffed legacy vs port screen-by-screen** at every M-fast feature claim, not at the end after owner found bugs.
- Should have **questioned legacy** instead of porting it — e.g. the `font-family: var(--f-fashion)` on h1 is wrong in legacy too; I copied the wrong thing.
- Should have **insisted on owner walking through after every feature**, not waited for batch frustration.

---

## Owner action items

- [ ] Review this doc, fill VERDICT column for the 30+ gaps above
- [ ] Decide: stop M-fast/M-iter and open M1, OR finish polishing first
- [ ] Pick a real product name (placeholder "London Cuts" blocks tone-of-voice work)
- [ ] If keeping current scope: spawn me to do workspace sub-audit (reads all 2557 lines)

---

## Honest unknowns

I haven't actually verified:
- The PDF export (renders correctly?)
- The PNG export (renders correctly?)
- The vision pipeline (does describePhoto actually produce useful output?)
- The "+ NEW FROM PHOTOS" flow (does the auto-create work?)
- The `/atlas` page visual comparison vs legacy
- The `/<author>/<slug>/chapter/<stop>` chapter page
- The `/<author>/<slug>/p/<stop>` postcard page

Each of these is one more screen to audit. Estimated 5-10 more bugs hiding in those.
