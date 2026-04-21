// F-P004 — tests for the pure-utility PNG export module.
//
// `html-to-image` relies on real canvas APIs (and in particular
// canvas.toDataURL), which jsdom does NOT implement — calling toPng()
// against jsdom throws "Not implemented: HTMLCanvasElement.prototype.getContext"
// or returns empty strings. So we mock the module and just verify we're
// wiring it through correctly (right node, right pixelRatio, then an <a>
// download click).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toPngMock = vi.fn<(node: HTMLElement, opts?: unknown) => Promise<string>>(
  async () => "data:image/png;base64,FAKE",
);

vi.mock("html-to-image", () => ({
  toPng: (node: HTMLElement, opts?: unknown) => toPngMock(node, opts),
}));

// Import AFTER vi.mock so the module under test picks up the stub.
import {
  exportNodeToPng,
  suggestPostcardFilename,
} from "@/lib/export/png";

describe("F-P004 exportNodeToPng", () => {
  beforeEach(() => {
    toPngMock.mockClear();
    toPngMock.mockResolvedValue("data:image/png;base64,FAKE");
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("calls html-to-image's toPng with pixelRatio: 2 by default", async () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    await exportNodeToPng(node, "out.png");

    expect(toPngMock).toHaveBeenCalledTimes(1);
    expect(toPngMock).toHaveBeenCalledWith(node, { pixelRatio: 2 });
  });

  it("honours a custom pixelRatio override", async () => {
    const node = document.createElement("div");
    await exportNodeToPng(node, "out.png", { pixelRatio: 3 });
    expect(toPngMock).toHaveBeenCalledWith(node, { pixelRatio: 3 });
  });

  it("triggers a download by clicking a transient <a download>", async () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    // Spy on anchor creation so we can assert on the click + attrs.
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const el = origCreate(tag);
        if (tag === "a") {
          (el as HTMLAnchorElement).click = clickSpy;
        }
        return el;
      });

    await exportNodeToPng(node, "my-card_front.png");

    // Exactly one click on the anchor.
    expect(clickSpy).toHaveBeenCalledTimes(1);
    createSpy.mockRestore();

    // And the anchor is removed again — no lingering <a> in the body.
    expect(document.querySelectorAll("a").length).toBe(0);
  });

  it("rejects when toPng fails, so callers can surface the error", async () => {
    toPngMock.mockRejectedValueOnce(new Error("CORS-tainted image"));
    const node = document.createElement("div");
    await expect(exportNodeToPng(node, "x.png")).rejects.toThrow(
      "CORS-tainted image",
    );
  });

  it("throws if called with no node", async () => {
    // @ts-expect-error — deliberately passing undefined at the type boundary.
    await expect(exportNodeToPng(undefined, "x.png")).rejects.toThrow(
      /node is required/,
    );
  });
});

describe("F-P004 suggestPostcardFilename", () => {
  it("produces <project>_<stop>_<side>.png for clean slugs", () => {
    expect(suggestPostcardFilename("a-year-in-se1", "01-borough", "front")).toBe(
      "a-year-in-se1_01-borough_front.png",
    );
  });

  it("sanitises special characters in slugs to dashes", () => {
    expect(
      suggestPostcardFilename("A Year In SE1!", "stop #1", "back"),
    ).toBe("A-Year-In-SE1-_stop--1_back.png");
  });

  it("keeps the side verbatim (front | back)", () => {
    expect(
      suggestPostcardFilename("proj", "stop", "front").endsWith("_front.png"),
    ).toBe(true);
    expect(
      suggestPostcardFilename("proj", "stop", "back").endsWith("_back.png"),
    ).toBe(true);
  });

  it("preserves the canonical seed slug a-year-in-se1 unchanged", () => {
    // Regression guard: the current SE1 demo slug must round-trip as-is.
    expect(
      suggestPostcardFilename("a-year-in-se1", "stop", "front"),
    ).toBe("a-year-in-se1_stop_front.png");
  });
});
