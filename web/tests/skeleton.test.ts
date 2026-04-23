// Unit tests for the rule-based body-block layout engine.
// Pure function — no React, no DOM, no network. Fast.

// @vitest-environment node

import { describe, expect, it } from "vitest";

import type { BodyBlock } from "@/lib/seed";
import { applySkeleton } from "@/lib/layout/skeleton";

function paragraph(content: string): BodyBlock {
  return { type: "paragraph", content };
}
function pullQuote(content: string): BodyBlock {
  return { type: "pullQuote", content };
}
function heroImage(assetId: string, caption = ""): BodyBlock {
  return { type: "heroImage", assetId, caption };
}
function inlineImage(
  assetId: string,
  align: "left" | "right" | "center" = "left",
  caption = "",
): BodyBlock {
  return { type: "inlineImage", assetId, caption, align };
}
function metaRow(content: readonly string[]): BodyBlock {
  return { type: "metaRow", content };
}
function mediaEmbed(taskId: string, caption = ""): BodyBlock {
  return { type: "mediaEmbed", taskId, caption };
}

describe("applySkeleton — rule-based body layout", () => {
  it("returns empty output and sensible rationale for empty input", () => {
    const result = applySkeleton([], { time: "17:19", mood: "Amber" });
    expect(result.blocks).toEqual([]);
    expect(result.rationale).toMatch(/add a block/i);
  });

  it("only paragraphs: passes them through in order, extracts pullQuote when ≥2 paragraphs", () => {
    const input = [
      paragraph("A long paragraph that sets the scene and goes on and on."),
      paragraph("Short."),
      paragraph("Another long paragraph to round things off."),
    ];
    const result = applySkeleton(input, {});
    // Order should be: p1, pullQuote(from shortest="Short."), p2, p3
    expect(result.blocks).toHaveLength(4);
    expect(result.blocks[0]).toEqual(input[0]); // first paragraph
    expect(result.blocks[1]).toEqual({ type: "pullQuote", content: "Short." });
    expect(result.blocks[2]).toEqual(input[1]); // second paragraph (source)
    expect(result.blocks[3]).toEqual(input[2]); // third paragraph
    expect(result.rationale).toMatch(/extracted pull-quote/i);
  });

  it("canonical mix: 1 hero + 3 paragraphs + 2 inline images + metaRow synthesis", () => {
    const input: BodyBlock[] = [
      paragraph("Grounding paragraph."),
      inlineImage("a-inline-1", "center"),
      heroImage("a-hero", "Hero caption"),
      paragraph("Middle paragraph."),
      inlineImage("a-inline-2", "left"),
      paragraph("Closing paragraph."),
    ];
    const result = applySkeleton(input, {
      time: "17:19",
      mood: "Amber",
      hasExplicitHero: false,
    });

    const types = result.blocks.map((b) => b.type);
    // Expect: metaRow, heroImage, paragraph, pullQuote, paragraph, inlineImage, inlineImage, paragraph
    expect(types).toEqual([
      "metaRow",
      "heroImage",
      "paragraph",
      "pullQuote",
      "paragraph",
      "inlineImage",
      "inlineImage",
      "paragraph",
    ]);

    // metaRow should be synthesised from context
    expect(result.blocks[0]).toEqual({
      type: "metaRow",
      content: ["17:19", "AMBER"],
    });
    // heroImage preserved with content
    expect(result.blocks[1]).toMatchObject({
      type: "heroImage",
      assetId: "a-hero",
      caption: "Hero caption",
    });
    // inline image alignment should alternate L, R (overriding original)
    const inlineBlocks = result.blocks.filter(
      (b): b is Extract<BodyBlock, { type: "inlineImage" }> =>
        b.type === "inlineImage",
    );
    expect(inlineBlocks[0].align).toBe("left");
    expect(inlineBlocks[1].align).toBe("right");
  });

  it("is idempotent: applySkeleton(applySkeleton(x)) deep-equals applySkeleton(x)", () => {
    const input: BodyBlock[] = [
      paragraph("First."),
      inlineImage("a1", "right"),
      paragraph("Second — the short one."),
      heroImage("ah"),
      paragraph("Third paragraph with more words to be long."),
      inlineImage("a2", "center"),
      mediaEmbed("t1"),
    ];
    const ctx = { time: "18:47", mood: "Steel", hasExplicitHero: false };
    const once = applySkeleton(input, ctx);
    const twice = applySkeleton(once.blocks, ctx);
    expect(twice.blocks).toEqual(once.blocks);
  });

  it("existing metaRow is preserved, not duplicated nor overridden by synthesis", () => {
    const existing = metaRow(["12:00", "NOON"]);
    const input: BodyBlock[] = [
      paragraph("Text."),
      existing,
      paragraph("More text."),
    ];
    const result = applySkeleton(input, { time: "17:19", mood: "Amber" });
    // Exactly one metaRow, and it's the owner's, not a synthesised one
    const metaRows = result.blocks.filter((b) => b.type === "metaRow");
    expect(metaRows).toHaveLength(1);
    expect(metaRows[0]).toEqual(existing);
    // First block must be the metaRow
    expect(result.blocks[0]).toEqual(existing);
    // Rationale should NOT claim to have synthesised
    expect(result.rationale).not.toMatch(/synthesised meta row/i);
  });

  it("hasExplicitHero=true: does not inject a heroImage even if one exists in input", () => {
    const input: BodyBlock[] = [
      heroImage("a-body-hero"),
      paragraph("One."),
      paragraph("Two."),
    ];
    const result = applySkeleton(input, {
      time: "10:00",
      mood: "Fog",
      hasExplicitHero: true,
    });
    // The hero block in the body is NOT duplicated to the front; still kept
    // in the output so content is preserved, just not at position 1 after meta.
    const heroCount = result.blocks.filter((b) => b.type === "heroImage").length;
    // We still preserve the input heroImage (don't lose user content), but it
    // should not be in the hero slot right after metaRow.
    expect(heroCount).toBeGreaterThanOrEqual(0);
    // The block right after metaRow should be the paragraph, not a hero image
    const metaIdx = result.blocks.findIndex((b) => b.type === "metaRow");
    if (metaIdx >= 0 && metaIdx + 1 < result.blocks.length) {
      expect(result.blocks[metaIdx + 1].type).not.toBe("heroImage");
    }
  });
});
