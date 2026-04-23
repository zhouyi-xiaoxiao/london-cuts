# Deferred — AI auto-layout + vision-to-full-project

**Status:** deferred 2026-04-23. Two linked asks from the owner. Pure research
+ design doc — no code touched. Pick this up after M-fast lands and M2 auth is
in place (so we can rate-limit per user).

## Two asks, one thread

1. **"AI auto-layout of body blocks."** The `StopBodyEditor` today gives the
   owner six block types (paragraph, pullQuote, metaRow, heroImage,
   inlineImage, mediaEmbed) and up/down arrows. She wants an **✨ AUTO-LAYOUT**
   button that rearranges (and optionally rewrites) the blocks into a
   beautiful shape from whatever raw material is there.

2. **"Vision → full project."** Today `/api/vision/describe` returns per-photo
   `{ title, paragraph, pullQuote, postcardMessage, mood, tone, locationHint }`.
   She wants to drop in N photos and get back: project title + subtitle,
   N-or-fewer stops (photos **grouped**), each stop with full body + hero +
   postcard + layout already applied.

They are the same pipeline at different zoom levels. (2) produces the raw
material; (1) is the final layout pass. This doc covers both and proposes a
shared core.

---

## 1. Feasibility + technical options

### 1a. Auto-layout of body blocks

Current `BodyBlock` union (`web/lib/seed.ts` L36-62):

```ts
type BodyBlock =
  | { type: "metaRow";     content: readonly string[] }
  | { type: "paragraph";   content: string }
  | { type: "pullQuote";   content: string }
  | { type: "heroImage";   assetId: string; caption: string }
  | { type: "inlineImage"; assetId: string; caption: string; align: "left" | "right" | "center" }
  | { type: "mediaEmbed";  taskId: string;  caption: string };
```

Three ways to rearrange + regenerate:

**Option A — Rule-based layout engine.** Hand-written heuristics. Something
like:

```
1. Open with a metaRow if we have one, else synthesize from stop.time + stop.mood
2. heroImage (the block with assetId === stop.heroAssetId, or first heroImage)
3. First paragraph  — the "grounding" one
4. Pull quote       — pick the shortest / most evocative paragraph, extract a line
5. Second paragraph
6. An inlineImage (align alternates L/R as we go down the page)
7. Final paragraph  — the "ending" one
8. mediaEmbed last  (if present)
```

- Pros: zero LLM cost, deterministic, testable. No hallucination risk. No
  chance of clobbering her voice.
- Cons: the output is always the same "shape" — eventually reads
  mechanical. Can't decide which paragraph is actually the ending.

**Option B — LLM-driven layout.** Send the full body text + image descriptions
to GPT-4o, ask it to return a JSON plan of block ordering + optional prose
rewrites. Structured Outputs (JSON Schema, 100% reliable on gpt-4o-2024-08-06)
makes the response format safe.

- Pros: can actually read the content and decide "this pull-quote belongs
  halfway, not at the end". Can smooth transitions between paragraphs. Can
  notice that two paragraphs say the same thing.
- Cons: ~$0.01-0.05 per stop. Variable output (needs temperature=0.3 or
  lower to be stable). Biggest risk: it might rewrite paragraphs aggressively
  and the owner loses her voice.

**Option C — Hybrid.** Rules pick the skeleton (A's 8-step template). LLM only
touches prose if explicitly asked: "polish transitions" button, "pick pull
quote" button. Layout stays deterministic; the LLM is opt-in per block.

### 1b. Vision → full project

**Option A — Per-photo describe, manual assembly.** What we have today. User
uploads 12 photos, wades through 12 mini-descriptions, drags and drops into 5
stops. Works, but it's N minutes of grunt per project and the owner is tired
of it.

**Option B — Batch describe + clustering.** Keep the per-photo describe
(already shipped, ~$0.01 each via gpt-4o-mini). Then run a **second pass** —
either a deterministic clustering step (EXIF timestamp + GPS if present,
k-means-ish group by time-proximity) or a single LLM call that takes the N
descriptions and proposes groupings + a project-level title. Cost: 12
photos × $0.01 + 1 reasoning call × $0.02 ≈ $0.14 per project.

**Option C — End-to-end multimodal.** One big call: "here are 12 photos,
return a full project structure." Pass all images as vision inputs in one
request. Expensive: each 1024×1024 image is ~340 tokens, 12 images ≈ 4000
input tokens, plus structured output ≈ 2000 tokens out. On gpt-4o (not mini):
~$0.10-0.50 per project. On gpt-4o-mini or gpt-4.1-nano (vision-capable, 33%
cheaper than mini on both input and output): ~$0.03-0.15. Variance is
high — model sees all photos together, so it can pick up a theme ("all
sunset shots") that per-photo describe misses. But the whole project
succeeds or fails as one call.

---

## 2. Concrete recommendation

### Auto-layout → **Option C (hybrid) but start at Option A**

Ship the **rule-based skeleton first** (one PR, one afternoon). Call the
button **✨ AUTO-LAYOUT**. Zero LLM cost, zero voice risk, zero server round
trip — runs in the browser. If the owner loves it, she's done. If she says
"the output feels mechanical," layer on Option B **behind a second button**
("✨ POLISH PROSE") so the aesthetic and the rewrite are separable concerns.

Why not pure B: the first-try-delight test is "did the page look more like
what I wanted with one click." A deterministic "pull-quote goes in the middle"
already achieves that 80% of the time. Adding an LLM call adds latency
(2-4s), failure modes (rate limit, bad JSON), and voice-drift risk.

### Vision-to-project → **Option B (batch describe + clustering)**

Reuse the per-photo describe we already shipped (proven, $0.01 each). Add a
**second LLM pass** that takes the N descriptions + EXIF timestamps +
locationHints as text input (no images, much cheaper — ~$0.02) and returns a
project plan: grouping of photos into stops + project-level title/subtitle.
Then run the rule-based auto-layout on each stop.

Why not C: 12 images in one call is an atomic failure. If the call errors
halfway, we lose 10 already-described photos. Describing each photo
individually with a concurrency limiter is what we already do for a reason.

### Spend envelope per full-project pass

- 12 photos × $0.01 (describe, gpt-4o-mini vision) = $0.12
- 1 project-structure call (gpt-4o, text only, ~2k in + 1k out) = $0.02
- Up to 12 per-stop layout calls (if owner hits ✨ POLISH PROSE on each) =
  12 × $0.02 = $0.24
- **Total floor:** $0.14 per project (describe + compose, no polish)
- **Total ceiling:** $0.38 per project (every stop polished)

Well under the existing $8 daily cap. A power day (5 projects fully polished)
≈ $1.90. We should cap per-project spend at $0.50 hard in the route, to avoid
a runaway loop.

### Failure modes + graceful degrade

- **LLM returns malformed JSON.** Structured Outputs with JSON Schema makes
  this very rare (OpenAI claims 100% on gpt-4o-2024-08-06). Fallback: show
  toast "layout couldn't be computed — original order kept," revert.
- **LLM times out.** Button un-greys after 10s with "try again."
- **Spend cap hit mid-project.** Already handled by `QuotaExceededError` →
  HTTP 429. UI shows a banner: "spend cap reached — X photos not analysed.
  Remove unneeded photos or ask admin to raise the cap."
- **Mock mode.** `AI_PROVIDER_MOCK=true` should produce **meaningful** mock
  output so UI development doesn't require real credits. See §5.

---

## 3. API shape

Two new endpoints, both thin wrappers over `lib/ai-provider`.

### `POST /api/ai/layout-stop`

```ts
// Request
interface LayoutStopRequest {
  blocks: BodyBlock[];               // current blocks, any order
  stopContext: {
    title: string;                   // stop.title
    mood: string;                    // stop.mood
    tone: "warm" | "cool" | "punk";
    heroDescription?: string;        // vision describe of hero image (optional)
  };
  mode: "rearrange" | "polish";      // rearrange = skeleton only (cheap),
                                     // polish = may rewrite prose
}

// Response (success)
interface LayoutStopResponse {
  blocks: BodyBlock[];               // new order; possibly rewritten content
  rationale: string;                 // one sentence, shown as ghost text
  costCents: number;                 // 0 in rearrange/mock, ~2 in polish
  mock: boolean;
  spendToDateCents: number;
}

// Example request
{
  "blocks": [
    { "type": "paragraph", "content": "The river is the only thing in London that tells the time." },
    { "type": "heroImage", "assetId": "a-wb-hero", "caption": "Waterloo Bridge 17:19" },
    { "type": "pullQuote", "content": "Six minutes of gold, then nothing." },
    { "type": "paragraph", "content": "I walked from the South Bank side." }
  ],
  "stopContext": {
    "title": "Six minutes of gold",
    "mood": "Amber",
    "tone": "warm"
  },
  "mode": "rearrange"
}

// Example response
{
  "blocks": [
    { "type": "metaRow",    "content": ["17:19", "AMBER"] },
    { "type": "heroImage",  "assetId": "a-wb-hero", "caption": "Waterloo Bridge 17:19" },
    { "type": "paragraph",  "content": "The river is the only thing in London that tells the time." },
    { "type": "pullQuote",  "content": "Six minutes of gold, then nothing." },
    { "type": "paragraph",  "content": "I walked from the South Bank side." }
  ],
  "rationale": "Hero first, pull-quote mid-text to break up prose.",
  "costCents": 0,
  "mock": false,
  "spendToDateCents": 14
}
```

### `POST /api/ai/compose-project`

```ts
// Request
interface ComposeProjectRequest {
  photos: Array<{
    id: string;                      // client-generated id for later asset-write
    dataUrl: string;                 // data:image/jpeg;base64,...
    exifDate?: string;               // ISO-8601 if available
    exifGps?: { lat: number; lng: number };
    fileName?: string;
  }>;
  owner: { handle: string };         // for quota scoping (M2+)
}

// Response (success)
interface ComposeProjectResponse {
  project: {
    title: string;
    subtitle: string | null;
    defaultMode: "fashion" | "tabloid" | "editorial";
    locationName: string | null;
  };
  stops: Array<{
    n: string;                       // "01", "02", ...
    title: string;
    code: string;                    // short mono-space caption
    time: string;                    // "17:19" — derived from EXIF if possible
    mood: string;
    tone: "warm" | "cool" | "punk";
    heroPhotoId: string;             // matches request.photos[i].id
    bodyPhotoIds: string[];          // inline images, excluding hero
    body: BodyBlock[];               // already laid out
    postcardMessage: string;
  }>;
  costCents: number;
  mock: boolean;
  spendToDateCents: number;
}

// Example response (abbreviated, 2 stops)
{
  "project": {
    "title": "A day on the South Bank",
    "subtitle": "Waterloo to Westminster, April 2026",
    "defaultMode": "fashion",
    "locationName": "South Bank, London"
  },
  "stops": [
    {
      "n": "01",
      "title": "Six minutes of gold",
      "code": "WATERLOO",
      "time": "17:19",
      "mood": "Amber",
      "tone": "warm",
      "heroPhotoId": "photo-a",
      "bodyPhotoIds": ["photo-b"],
      "body": [
        { "type": "metaRow",   "content": ["17:19", "AMBER"] },
        { "type": "heroImage", "assetId": "photo-a", "caption": "Waterloo Bridge 17:19" },
        { "type": "paragraph", "content": "The river is the only thing in London that tells the time." },
        { "type": "pullQuote", "content": "Six minutes of gold, then nothing." }
      ],
      "postcardMessage": "Walked the bridge at sunset — thought of you."
    },
    {
      "n": "02",
      "title": "Lamps on the Embankment",
      "code": "EMBNKMT",
      "time": "18:47",
      "mood": "Steel",
      "tone": "cool",
      "heroPhotoId": "photo-c",
      "bodyPhotoIds": [],
      "body": [
        { "type": "metaRow",   "content": ["18:47", "STEEL"] },
        { "type": "heroImage", "assetId": "photo-c", "caption": "Embankment, after the sun" },
        { "type": "paragraph", "content": "By the time I got off the bridge the lamps were on." }
      ],
      "postcardMessage": "Lamps came on and London went quiet."
    }
  ],
  "costCents": 14,
  "mock": false,
  "spendToDateCents": 28
}
```

**assetId ↔ photoId mapping.** The response uses `photoId` from the request in
the `heroPhotoId`/`bodyPhotoIds` fields **and** inside block `assetId` fields.
The client does the swap to real `Asset.id` values after writing assets to
the store (matches how `vision-upload.tsx` L183-190 does it today).

**Why a flat `body: BodyBlock[]` instead of letting the server pick layout.**
Because the layout pass is the rule-based engine, which can run server-side
inside `composeProject()` or client-side after the response lands. Server-
side is better for testability — the response is already "final shape."

### Error shapes (both endpoints)

```ts
// 400 — bad input
{ "error": "blocks must be an array of BodyBlock" }

// 429 — spend cap hit
{ "error": "Spend cap 800¢ reached", "spendToDateCents": 802 }

// 503 — key missing
{ "error": "OPENAI_API_KEY not configured on server" }

// 500 — anything else
{ "error": "compose-project failed: JSON schema validation" }
```

Matches existing `/api/vision/describe` and `/api/ai/generate` shapes, reusing
`AuthRequiredError` and `QuotaExceededError` from `web/lib/errors.ts`.

---

## 4. UI integration

### Auto-layout button (in stop body editor)

`web/components/studio/stop-body-editor.tsx` — the `AddBlockBar` at
L638-669 currently renders six `+ Paragraph` / `+ Hero image` buttons. Add one
more button at the far right:

```
[+ Paragraph] [+ Pull quote] [+ Meta row] [+ Hero image] [+ Inline image]
[+ Media embed]   |   [ ✨ AUTO-LAYOUT ]
```

Behaviour:

- Disabled when `stop.body.length < 2` (nothing to rearrange).
- Click → spinner state, POST `/api/ai/layout-stop` with `mode: "rearrange"`.
- On success → call `updateStop(stop.n, { body: response.blocks })` and flash
  `response.rationale` as a toast (ghost text under the bar for ~4s).
- On failure → toast with error, no state change.
- Second button later: **✨ POLISH PROSE** with `mode: "polish"`. Gated
  behind a `window.confirm` the first time: "This will use AI to rewrite your
  paragraphs. Proceed?" — with a "don't ask again" checkbox stored in
  `localStorage.polishPromptAcked`.

### Vision-to-project flow (in vision upload)

`web/components/studio/vision-upload.tsx` currently:

1. Pick photos → 2. Describe each (concurrent 3-at-a-time) → 3. Auto-build
   `N stops, 1 per photo` → 4. Done.

After step 2 (all descriptions land), **instead of** auto-building N stops,
show a choice UI:

```
┌────────────────────────────────────────────────────────────┐
│  12 photos analysed. Spend to date: 12¢                    │
│                                                             │
│  ┌──────────────┐      ┌────────────────────────────────┐ │
│  │ Build 1-to-1 │      │ ✨ Generate full draft         │ │
│  │ stops        │      │    (group photos + auto-layout)│ │
│  │ (current)    │      │    ~14¢ extra                  │ │
│  └──────────────┘      └────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

- Left button: existing path (`vision-upload.tsx` L151-222), unchanged.
- Right button: new path → POST `/api/ai/compose-project` with all photo data
  URLs + exif → apply response via `setProject` + `setStops` + `addAsset` (same
  pattern as L156-217 today) → redirect to `/studio`.

**Progressive disclosure.** First-time user sees both options side-by-side.
The compose-project cost is labelled. If mock mode (see §5), the "~14¢ extra"
becomes "0¢ (mock)."

### Destructive vs additive

See §6 — decision point for owner.

---

## 5. Seam discipline + forbidden imports

Repeat for the next implementer (cf. `../CLAUDE.md` "Seam discipline"):

- **All new AI calls go through `web/lib/ai-provider.ts`.** Add two exported
  functions: `layoutStop(input)` and `composeProject(input)`. The route
  handlers are thin (call seam, format response, map errors).
- **No `import OpenAI` outside `web/lib/ai-provider.ts`.** Ever.
- **`assertWithinBudget(costCents)` before each call.** Current
  implementation (`ai-provider.ts` L69-74) is non-atomic — if
  compose-project issues 12 parallel describe-photo calls, the cap check
  races. For this task: serialize or use a small counter-lock around
  `spendToDateCents += costCents`. VariantsRow has the same blocker —
  fix it once and reuse.
- **`AI_PROVIDER_MOCK=true` must return meaningful mocks.** Proposed:
  - `layoutStop` mock: return blocks in reversed order, rationale
    `"MOCK — reversed order"`. Visibly different from input, so dev can
    tell the call went through.
  - `composeProject` mock: return a fixed 3-stop template (based on
    `SEED_BODY_05`) with `photoId` mapped to photos[0..2].
- **New env flags.** None required. Use existing `OPENAI_SPEND_CAP_CENTS`
  and `AI_PROVIDER_MOCK`.
- **Rate limit.** M2 adds `requireUser()` at route entry — when that lands,
  gate both routes behind it and cap per-user at 5 compose-project calls/day.

---

## 6. Blockers + decisions needed (owner input)

1. **Batch vs per-photo for vision-to-project.** Recommend per-photo +
   text-only compose call (cheaper + more resilient). Owner should confirm
   she's OK with a 12-photo project taking ~15s end-to-end vs ~5s for a
   batch call. (Current per-photo flow with concurrency=3 already takes
   ~8s for 12 photos, so this is +5-7s, not a big jump.)

2. **Auto-layout rewrites prose — show diff?** If we ship **✨ POLISH PROSE**,
   it can rewrite paragraphs. Options:
   - (a) Always ask confirmation with a side-by-side diff modal
   - (b) Apply immediately, provide Cmd-Z / Undo
   - (c) Keep original in a `body_history` field, show a "compare to
         original" toggle
   Recommend **(b) + (c)**: immediate apply is fastest, undo is a safety
   net, and the compare-to-original toggle in the editor header lets her
   see what changed later. Owner should confirm — (a) is safer but breaks
   the "one-click delight" vibe.

3. **Vision-to-project: REPLACE or ADD?** Current `vision-upload.tsx` L157
   calls `archiveCurrentProject()` — it **replaces**. For compose-project:
   same behaviour, or let it **add to current project**? Recommend **always
   REPLACE** (simpler mental model, matches today's behaviour). If the owner
   wants "add," she can compose a new project and copy stops later
   (M3-feature). Owner to confirm.

4. **Cost control — per-project hard cap.** Currently one global
   `OPENAI_SPEND_CAP_CENTS` (default $8). Recommend: add
   `OPENAI_PER_PROJECT_CAP_CENTS` (default 50 = $0.50) so a single runaway
   compose-project call can't blow through the daily budget. Owner: is $0.50
   the right ceiling, or too low? At $0.38 peak (12 photos, all polished)
   we're $0.12 away from the cap.

5. **Default mode selection.** compose-project has to pick
   `defaultMode: "fashion" | "tabloid" | "editorial"`. Let the LLM pick
   based on photo mood? Or default to `"fashion"` and let the owner change?
   Recommend **LLM-picks, owner-overrides in the project settings.**

6. **Polish scope.** Does **✨ POLISH PROSE** also touch `pullQuote` content,
   or only `paragraph`? Recommend: can add a `pullQuote` block if one is
   missing (extract from existing paragraphs), but never rewrite an
   existing `pullQuote` (those are the owner's crafted one-liners — most
   precious).

---

## 7. File-touch estimate

| File | Status | LOC estimate | Notes |
|---|---|---|---|
| `web/lib/ai-provider.ts` | EDIT | +120 LOC | add `layoutStop()`, `composeProject()`, shared `LAYOUT_SKELETON` rules, mock outputs |
| `web/app/api/ai/layout-stop/route.ts` | NEW | ~70 LOC | thin wrapper — validate body, call seam, map errors. Mirrors `vision/describe/route.ts` |
| `web/app/api/ai/compose-project/route.ts` | NEW | ~90 LOC | same shape, larger input validation (photos array) |
| `web/lib/layout/skeleton.ts` | NEW | ~100 LOC | rule-based layout engine — pure function, no AI. Input `BodyBlock[]`, output `BodyBlock[]`. Importable from both the API route and (eventually) client-side |
| `web/components/studio/stop-body-editor.tsx` | EDIT | +40 LOC | add AUTO-LAYOUT button to `AddBlockBar`, plus fetch + toast |
| `web/components/studio/vision-upload.tsx` | EDIT | +70 LOC | add "Generate full draft" branch after describe completes |
| `tests/ai-provider-layout.test.ts` | NEW | ~150 LOC | unit tests on mock mode for `layoutStop` + `composeProject`; golden tests on `skeleton.ts` with SEED_BODY_05 input |
| `tests/api-layout-stop.test.ts` | NEW | ~80 LOC | route-level: 400 on bad body, 429 on cap, 200 on valid |
| `tests/api-compose-project.test.ts` | NEW | ~100 LOC | same pattern |
| **Total estimate** | | **~820 LOC** | split into 2-3 PRs recommended: (1) skeleton + mock, (2) real LLM + layout-stop endpoint, (3) compose-project endpoint + UI |

Suggested split:

- **PR 1 (smallest):** `skeleton.ts` + `stop-body-editor.tsx` button calling
  **only** the rule-based engine (no network call). Delight test — does the
  owner like the shape?
- **PR 2:** add `/api/ai/layout-stop` + real LLM path (mode="polish") behind
  second button.
- **PR 3:** `/api/ai/compose-project` + vision-upload UI branch.

If PR 1 lands well, PR 2 and 3 can be skipped or deferred further. The rule-
based skeleton may be 80% of the value.

---

## 8. Prompt sketch (for when someone picks this up)

### For `layoutStop` with Structured Outputs

Model: `gpt-4o-2024-08-06` (Structured Outputs scores 100% on JSON schema
following — per OpenAI). Cheap alternative: `gpt-4o-mini` for rearrange-only.

```ts
response_format: {
  type: "json_schema",
  json_schema: {
    name: "stop_layout",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["blocks", "rationale"],
      properties: {
        rationale: { type: "string", maxLength: 160 },
        blocks: {
          type: "array",
          items: {
            oneOf: [
              { type: "object", required: ["type","content"], properties: {
                type: { const: "paragraph" }, content: { type: "string" }
              }, additionalProperties: false },
              // ... same for pullQuote, metaRow, heroImage, inlineImage, mediaEmbed
            ]
          }
        }
      }
    }
  }
}
```

System prompt sketch:

> You are a layout editor for short travel-story vignettes. You receive a list
> of body blocks (paragraphs, pull quotes, meta rows, images) and a stop
> context (title, mood, tone). Return the same blocks in a new order that
> reads well: meta first, then hero, then prose with at most one pull-quote
> halfway through, then a final paragraph. In `rearrange` mode, never modify
> the `content` fields. In `polish` mode, you may rewrite paragraph content
> for flow but preserve voice and facts. Return JSON only.

### For `composeProject`

Same JSON Schema pattern. Input is **text only** — the descriptions have
already been computed in the describe step, so this call doesn't need
vision. Text-only gpt-4o input is ~$0.005 per call at this size.

---

## 9. Prior art + references

- **[OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)** —
  the right primitive for both endpoints. Use `response_format: { type:
  "json_schema", strict: true }`. Supported on gpt-4o-2024-08-06 and
  gpt-4o-mini-2024-07-18. OpenAI claims 100% schema-compliance on the
  August 2024 4o snapshot vs <40% on older models. This is what makes
  the "LLM returns malformed JSON" failure mode essentially a non-issue.

- **[JSON prompting for LLMs (IBM Developer)](https://developer.ibm.com/articles/json-prompting-llms/)** —
  the Prompt → Generate → Validate → Repair → Parse pattern this doc
  references. Relevant because our compose-project schema is nested (project
  → stops → body-blocks), and the IBM guidance on "compact schemas with
  descriptions, validate-then-repair" is directly applicable if
  Structured Outputs ever fails.

- **[GPT-4o-mini API pricing (2026)](https://pecollective.com/tools/gpt-4o-mini-pricing/)** —
  confirms our $0.01/photo describe floor and our $0.02 compose-call ceiling.
  Also flags **gpt-4.1-nano** as a 33% cheaper drop-in for the same
  vision+JSON workload — worth testing as a flag swap (`OPENAI_VISION_MODEL=gpt-4.1-nano`)
  once this ships. Batch API is another 50% off but asynchronous — not a
  fit for this interactive flow.

Three URLs, three distinct pieces (structured outputs, prompt pattern,
pricing). The pure layout-generation literature (e.g. floor-plan gen with
LLMs) exists but overshoots — our problem is 6 block types and <15 total
elements, much shallower than architectural layout.

---

## 10. When to pick this up

- After M2 auth lands (so we can per-user rate limit).
- Not sandwiched — the prompt-tuning and layout-rule iteration reward
  undivided attention. Expect 2-3 sessions for the full 3-PR sequence.
- Before M3 feature-parity — layout polish is a differentiator, not
  parity.
- Keep `AI_PROVIDER_MOCK=true` throughout development. Flip to `false`
  for one smoke test per PR (1 layout call ≈ $0.02, 1 compose-project
  call ≈ $0.14).
