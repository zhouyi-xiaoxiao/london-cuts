import { describe, expect, it } from "vitest";
import type { PostcardStyle } from "@/lib/ai-provider";
import { POSTCARD_STYLES, getStyleMeta } from "@/lib/palette";

describe("POSTCARD_STYLES", () => {
  it("has exactly 6 entries with unique IDs", () => {
    expect(POSTCARD_STYLES).toHaveLength(6);
    const ids = POSTCARD_STYLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(6);
  });
});

describe("getStyleMeta", () => {
  it("returns the watercolour label for 'illustration'", () => {
    expect(getStyleMeta("illustration").label).toBe("Watercolour illustration");
  });

  it("throws for an unknown style", () => {
    expect(() =>
      getStyleMeta("nonexistent" as PostcardStyle),
    ).toThrow(/Unknown postcard style/);
  });
});
