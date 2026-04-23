# Deferred — VariantsRow (the "Re-imagine hero" feature)

**Status:** deferred 2026-04-23 after the 4-stream M-iter sprint. This is the
only remaining M-iter gap. Everything else in `tasks/AUDIT-WORKSPACE.md` has
landed. Why deferred: 345-line UI, real OpenAI $ per click, architecture
choice on pregen endpoint shape, and the audit itself says "defer until M3."

## What it does

In the legacy prototype, below the hero slot sits a horizontal strip:

```
┌─────────────────────────── HERO ───────────────────────────┐
│                                                             │
│   [current hero photo, with drag-pan]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

── VARIANTS ROW ──────────────────────────────────────────────
 ┌───────────────────────────────────────────────────────┐
 │ Prompt: "Waterloo Bridge at dusk, cinema grain…"     │  ← editable
 │                                                        │
 │ Quality: [low $0.02]  [med $0.07]  [high $0.19]       │  ← chips
 │ Style:   [illus] [poster] [riso] [ink] [anime] [art-nv]│  ← 6 styles
 │                                                        │
 │ [ 🎨 Pregen all 6 styles ]  [ ✨ Generate one ]        │
 └───────────────────────────────────────────────────────┘

   [variant 1] [variant 2] [variant 3] [pending…] [pending…]
   ↑ hover: "Use as hero" / "Use as postcard" / "Regen" / ×
```

Click a quality chip + style chip + Generate → one call. Or click "Pregen
all 6 styles" → six concurrent calls at low quality. Each variant shows
while pending, then fills in. Per-variant actions let you swap the current
hero with it, use it on the postcard, regen with a tweaked prompt, or
delete.

## Legacy reference

- `archive/app-html-prototype-2026-04-20/src/workspace.jsx` lines 1004–1349
- Related helper: `describePhotoForPrompt` at ~L956 (vision → prompt)
- Cache layer: `restoreCachedVariantsForCurrent` at ~L110

## Why this is bigger than it looks

1. **Spend cap matters**. Pregen at low quality = 6 × $0.02 ≈ $0.12/click.
   At high quality = 6 × $0.19 ≈ $1.14/click. `OPENAI_SPEND_CAP_CENTS`
   (default 800 = $8) lives in `web/lib/ai-provider.ts` — it already
   enforces per-call, but if the UI batches 6 calls in parallel the cap
   check needs to be atomic or we'll race past it. **Verify this before
   shipping.**

2. **API shape decision — not yet made.** Two options:
   - **(a) Client-side parallel**: 6 calls to existing `/api/ai/generate`.
     Simple, but 6× the round-trip latency and harder to enforce spend
     cap atomically across them.
   - **(b) New `/api/ai/pregen-variants` endpoint**: accepts
     `{ heroUrl, styles: PostcardStyle[], quality }`, returns
     `{ variants: [{ style, url, cents }] }`. Handles cap atomically,
     supports streaming updates. More code but better ops story.
   - **Recommendation: (b)** for atomicity, though (a) is shippable first.

3. **Vision describe flow**. The legacy flow: click the hero → call
   vision-describe on it (via `/api/vision/describe`) → preload the
   prompt textarea with the description. We already have the endpoint
   from F-T007, but we need a cache key so each hero doesn't re-describe
   on every mount. Suggest: `describeCache[assetId] = { prompt, ts }`
   in IDB.

4. **Variants cache reuse**. Postcard editor already has
   `idbGetVariant(key) / idbPutVariant(key, url)` where
   `key = "${assetId}:${styleId}"`. Pregen should reuse these keys so
   re-picking a previously generated variant is $0.

5. **"Use as hero" is destructive**. Swapping the hero changes
   `stop.heroAssetId` but the OLD hero doesn't go away — we need to
   decide: does it stay in the asset strip (as a loose-on-stop asset)
   or get deleted? Legacy: stays, so the user can flip back. Match that.

## Blockers before implementing

- [ ] Confirm spend cap atomicity strategy (read `web/lib/ai-provider.ts`
      to see how it counts; likely needs a small counter lock if we go
      option (a))
- [ ] Decide between (a) client-parallel vs (b) new endpoint
- [ ] Confirm the AssetStrip (F-I018) is the right visual home for
      variant thumbs, or if VariantsRow should be its own horizontal
      band below AssetStrip
- [ ] Write a recovery plan for failed generations (the pending tile
      needs a Retry button, and a timeout — don't leave it spinning
      forever)

## File touch list (estimate)

- `web/components/studio/variants-row.tsx` — NEW (~200 lines if we
  use option b, ~300 if option a)
- `web/components/studio/stop-canvas.tsx` — add `<VariantsRow>` under
  `<AssetStrip>`
- `web/app/api/ai/pregen-variants/route.ts` — NEW (if option b)
- `web/lib/ai-provider.ts` — extend cap-check to support batch
- `web/lib/utils/variant-cache.ts` — extract from postcard-editor
  (currently `idbGetVariant` / `idbPutVariant` live there) so both
  VariantsRow and PostcardEditor share the same cache keys
- `tests/variants-row.test.tsx` — NEW, mock the AI route

## Dev-mode flag

While implementing, keep `AI_PROVIDER_MOCK=true` so you're not burning
real money. Only flip to `false` for a final smoke test (1 variant × 1
style ≈ $0.02). Revert mock-true before committing.

## When to pick this up

After M2 (auth), or as its own dedicated session. **Not** sandwiched
between other work — the spend-cap + architecture decisions reward
undivided attention.
