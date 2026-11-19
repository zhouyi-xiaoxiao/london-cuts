import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetLiveLookupGuard, withLiveLookupGuard } from "@/lib/live-lookup";

describe("withLiveLookupGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetLiveLookupGuard();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the lookup's answer when it arrives in time", async () => {
    await expect(withLiveLookupGuard(async () => "live", "fallback")).resolves.toBe("live");
  });

  it("falls back when the lookup does not answer in time, then skips it for a while", async () => {
    const never = vi.fn(() => new Promise<string>(() => {}));
    const first = withLiveLookupGuard(never, "fallback");
    await vi.advanceTimersByTimeAsync(2500);
    await expect(first).resolves.toBe("fallback");

    const again = vi.fn(async () => "live");
    await expect(withLiveLookupGuard(again, "fallback")).resolves.toBe("fallback");
    expect(again).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2 * 60_000);
    await expect(withLiveLookupGuard(again, "fallback")).resolves.toBe("live");
    expect(again).toHaveBeenCalledTimes(1);
  });

  it("falls back when the lookup throws", async () => {
    await expect(
      withLiveLookupGuard(async () => {
        throw new Error("unreachable");
      }, "fallback"),
    ).resolves.toBe("fallback");
  });
});
