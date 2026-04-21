import { describe, expect, it } from "vitest";
import { stableFileKey, variantCacheKey } from "@/lib/utils/hash";

describe("stableFileKey", () => {
  it("returns `url:<string>` for a string input", () => {
    expect(stableFileKey("https://example.com/a.jpg")).toBe(
      "url:https://example.com/a.jpg",
    );
  });
});

describe("variantCacheKey", () => {
  it("joins source identity and style id with colons", () => {
    expect(variantCacheKey("abc", "poster")).toBe("variant:abc:poster");
  });
});
