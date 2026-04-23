// Rule-based body-block layout engine ("✨ AUTO-LAYOUT").
//
// Pure, deterministic, client-safe. No LLM, no DOM, no fs, no fetch, no window.
// Rearranges (never rewrites) a list of BodyBlocks into a canonical rhythm:
//
//   1. metaRow        (first — synthesised from context.time/mood if none)
//   2. heroImage      (first one found; skipped if context.hasExplicitHero)
//   3. paragraph      (the "grounding" paragraph)
//   4. pullQuote      (one — extracted from paragraphs if none exists and
//                      there are ≥2 paragraphs)
//   5. paragraph      (second — continues the middle)
//   6. inlineImage    (alternating align L → R → C as we walk down)
//   7. paragraph      (remaining paragraphs, in original order)
//   8. mediaEmbed     (last, if present)
//
// Idempotent: applySkeleton(applySkeleton(x)) deep-equals applySkeleton(x).
//
// Design choices worth calling out:
//   - inlineImage alignment is OVERRIDDEN to the L/R/C cycle. The whole
//     point of clicking AUTO-LAYOUT is to let the rules pick the rhythm.
//   - When there are 0 pullQuotes but ≥2 paragraphs, we clone the shortest
//     paragraph into a pullQuote. Content is untouched (the source paragraph
//     is still kept in its original position). We pick shortest because
//     short paragraphs tend to read as punchlines.
//   - metaRow synthesis: only if context has both `time` and `mood` (the
//     legacy shape is always `[time, mood.toUpperCase()]`, see
//     stop-body-editor.tsx newBlock()).

import type { BodyBlock } from "@/lib/seed";

export interface SkeletonContext {
  /** Stop metadata used to synthesise a metaRow when none exists. */
  mood?: string | null;
  time?: string | null;
  /** If true, the editor has a hero slot already; don't synthesise/inject one. */
  hasExplicitHero?: boolean;
}

export interface SkeletonResult {
  blocks: BodyBlock[];
  /** Human-readable one-liner for "what the skeleton did" — surfaced under
   *  the AUTO-LAYOUT button so the change isn't magic. */
  rationale: string;
}

const ALIGN_CYCLE: readonly ("left" | "right" | "center")[] = [
  "left",
  "right",
  "center",
];

/**
 * Rearrange body blocks into the canonical layout. See file header for rules.
 * Pure and idempotent.
 */
export function applySkeleton(
  blocks: readonly BodyBlock[],
  context: SkeletonContext,
): SkeletonResult {
  // Empty input → empty output. Short-circuit so we don't emit a confusing
  // metaRow on an otherwise blank stop.
  if (blocks.length === 0) {
    return { blocks: [], rationale: "Nothing to arrange — add a block first." };
  }

  // ─── Bucket by type (preserves original order within each bucket) ─────
  const metaRows: BodyBlock[] = [];
  const paragraphs: BodyBlock[] = [];
  const pullQuotes: BodyBlock[] = [];
  const heroImages: BodyBlock[] = [];
  const inlineImages: BodyBlock[] = [];
  const mediaEmbeds: BodyBlock[] = [];

  for (const b of blocks) {
    switch (b.type) {
      case "metaRow":
        metaRows.push(b);
        break;
      case "paragraph":
        paragraphs.push(b);
        break;
      case "pullQuote":
        pullQuotes.push(b);
        break;
      case "heroImage":
        heroImages.push(b);
        break;
      case "inlineImage":
        inlineImages.push(b);
        break;
      case "mediaEmbed":
        mediaEmbeds.push(b);
        break;
    }
  }

  const out: BodyBlock[] = [];
  const rationaleParts: string[] = [];

  // ─── 1. metaRow (synthesise if missing and context has time+mood) ──────
  let metaSynthesised = false;
  if (metaRows.length > 0) {
    out.push(metaRows[0]);
    // Trailing metaRows (rare) go at the end of the metaRow slot to preserve
    // content without duplicating the opening row.
    for (let i = 1; i < metaRows.length; i++) out.push(metaRows[i]);
  } else if (context.time && context.mood) {
    out.push({
      type: "metaRow",
      content: [context.time, context.mood.toUpperCase()],
    });
    metaSynthesised = true;
  }

  // ─── 2. heroImage (skip if editor has explicit hero slot) ─────────────
  // If context.hasExplicitHero is true, we do NOT inject a heroImage at this
  // prime slot. Any heroImage blocks still in `heroImages` are held aside
  // and appended at the tail (before mediaEmbeds) so no user content is lost.
  let heroImageUsed = 0;
  if (!context.hasExplicitHero && heroImages.length > 0) {
    out.push(heroImages[0]);
    heroImageUsed = 1;
  }

  // ─── 3+. Interleave paragraphs, pullQuote, inlineImages ───────────────

  // If zero pullQuotes but ≥2 paragraphs: clone the shortest paragraph as
  // a pullQuote (source paragraph stays in place).
  let extractedQuote = false;
  const workingPullQuotes = [...pullQuotes];
  if (workingPullQuotes.length === 0 && paragraphs.length >= 2) {
    let shortestIdx = 0;
    let shortestLen = Infinity;
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      if (p.type === "paragraph" && p.content.length < shortestLen) {
        shortestLen = p.content.length;
        shortestIdx = i;
      }
    }
    const src = paragraphs[shortestIdx];
    if (src.type === "paragraph") {
      workingPullQuotes.push({ type: "pullQuote", content: src.content });
      extractedQuote = true;
    }
  }

  // 3. First paragraph (grounding)
  if (paragraphs.length >= 1) out.push(paragraphs[0]);

  // 4. One pullQuote (first in bucket, since they're in order)
  if (workingPullQuotes.length >= 1) out.push(workingPullQuotes[0]);

  // 5. Second paragraph (if any)
  if (paragraphs.length >= 2) out.push(paragraphs[1]);

  // 6. inlineImages — alternating align. Override existing align.
  for (let i = 0; i < inlineImages.length; i++) {
    const img = inlineImages[i];
    if (img.type !== "inlineImage") continue;
    const newAlign = ALIGN_CYCLE[i % ALIGN_CYCLE.length];
    out.push({ ...img, align: newAlign });
  }

  // 7. Remaining paragraphs (3rd onward), in original order
  for (let i = 2; i < paragraphs.length; i++) out.push(paragraphs[i]);

  // Remaining pullQuotes (2nd onward) go at the tail of the prose section,
  // before media embeds. Preserves content without inventing a new slot.
  for (let i = 1; i < workingPullQuotes.length; i++) out.push(workingPullQuotes[i]);

  // Any heroImage content that didn't make it into the prime slot (either
  // because hasExplicitHero=true, or because there were >1 heroImages in
  // the input) gets appended here to preserve content.
  for (let i = heroImageUsed; i < heroImages.length; i++) out.push(heroImages[i]);

  // 8. mediaEmbed (all, last)
  for (const m of mediaEmbeds) out.push(m);

  // ─── Rationale string ─────────────────────────────────────────────────
  if (metaSynthesised) rationaleParts.push("synthesised meta row");
  if (extractedQuote) rationaleParts.push("extracted pull-quote from shortest paragraph");
  if (inlineImages.length >= 2) rationaleParts.push("alternated inline-image alignment L/R/C");
  const counts: string[] = [];
  if (paragraphs.length > 0) counts.push(`${paragraphs.length} paragraph${paragraphs.length === 1 ? "" : "s"}`);
  if (inlineImages.length > 0) counts.push(`${inlineImages.length} image${inlineImages.length === 1 ? "" : "s"}`);
  const countStr = counts.length > 0 ? counts.join(" + ") : "blocks";
  let rationale: string;
  if (rationaleParts.length > 0) {
    rationale = `Reordered ${countStr} into canonical rhythm; ${rationaleParts.join("; ")}.`;
  } else {
    rationale = `Reordered ${countStr} into canonical rhythm.`;
  }

  return { blocks: out, rationale };
}
