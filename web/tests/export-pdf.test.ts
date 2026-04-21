// F-P003 postcard PDF export smoke test.
//
// We mock `jspdf` so the test runs in jsdom without generating real PDF
// bytes or touching canvas APIs. The goal is to assert the *shape* of
// how `exportPostcardPdf` drives jsPDF, not to verify PDF correctness
// (that's manual/visual QA when the editor wires this up).
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock jspdf ───────────────────────────────────────────────────────────
// Every method we call in pdf.ts is captured so the test can inspect
// argument order. Methods that return the doc instance (addPage, addImage,
// line, rect, text) return `this` so chained calls still work.
//
// vi.mock is hoisted above top-level `const`/`class` declarations, so we
// keep both the spies *and* the FakeJsPdf class inside `vi.hoisted(...)`
// — that block runs before the mock factory.
const spies = vi.hoisted(() => {
  const addImage = vi.fn();
  const addPage = vi.fn();
  const setFont = vi.fn();
  const setFontSize = vi.fn();
  const setTextColor = vi.fn();
  const setDrawColor = vi.fn();
  const setLineWidth = vi.fn();
  const line = vi.fn();
  const rect = vi.fn();
  const text = vi.fn();
  const splitTextToSize = vi.fn((t: string, _max: number) =>
    typeof t === "string" ? t.split("\n") : [String(t ?? "")],
  );
  const save = vi.fn();
  const ctorSpy = vi.fn();

  class FakeJsPdf {
    constructor(opts: unknown) {
      ctorSpy(opts);
    }
    addImage(...args: unknown[]) {
      addImage(...args);
      return this;
    }
    addPage(...args: unknown[]) {
      addPage(...args);
      return this;
    }
    setFont(...args: unknown[]) {
      setFont(...args);
      return this;
    }
    setFontSize(n: number) {
      setFontSize(n);
      return this;
    }
    setTextColor(...args: unknown[]) {
      setTextColor(...args);
      return this;
    }
    setDrawColor(...args: unknown[]) {
      setDrawColor(...args);
      return this;
    }
    setLineWidth(n: number) {
      setLineWidth(n);
      return this;
    }
    line(...args: unknown[]) {
      line(...args);
      return this;
    }
    rect(...args: unknown[]) {
      rect(...args);
      return this;
    }
    text(...args: unknown[]) {
      text(...args);
      return this;
    }
    splitTextToSize(t: string, max: number) {
      return splitTextToSize(t, max);
    }
    save(filename: string) {
      save(filename);
      return this;
    }
  }

  return {
    addImage,
    addPage,
    setFont,
    setFontSize,
    setTextColor,
    setDrawColor,
    setLineWidth,
    line,
    rect,
    text,
    splitTextToSize,
    save,
    ctorSpy,
    FakeJsPdf,
  };
});

const {
  addImage,
  addPage,
  setFont,
  setFontSize,
  setTextColor,
  setDrawColor,
  setLineWidth,
  line,
  rect,
  text,
  splitTextToSize,
  save,
  ctorSpy,
} = spies;

vi.mock("jspdf", () => ({
  jsPDF: spies.FakeJsPdf,
  default: spies.FakeJsPdf,
}));

// ─── Import AFTER the mock so pdf.ts picks up FakeJsPdf. ─────────────────
import { exportPostcardPdf } from "@/lib/export/pdf";

describe("F-P003 exportPostcardPdf", () => {
  beforeEach(() => {
    addImage.mockClear();
    addPage.mockClear();
    setFont.mockClear();
    setFontSize.mockClear();
    setTextColor.mockClear();
    setDrawColor.mockClear();
    setLineWidth.mockClear();
    line.mockClear();
    rect.mockClear();
    text.mockClear();
    splitTextToSize.mockClear();
    save.mockClear();
    ctorSpy.mockClear();
  });

  // Minimal 1×1 JPEG — the `data:` prefix short-circuits the fetch path
  // inside resolveImageDataUrl so the test runs sync-enough.
  const dataUrl =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";

  const recipient = {
    name: "Dr. Ada Lovelace",
    line1: "12 Analytical Engine Ln",
    line2: "Marylebone",
    country: "United Kingdom",
  };

  it("produces a 2-page PDF and triggers save()", async () => {
    await exportPostcardPdf({
      frontImageUrl: dataUrl,
      backMessage: "Wish you were here — the fog lifted just for us.",
      recipient,
      orientation: "landscape",
      filename: "london_se1_postcard.pdf",
    });

    // Constructor called with A6, mm units, and the requested orientation.
    expect(ctorSpy).toHaveBeenCalledTimes(1);
    expect(ctorSpy.mock.calls[0][0]).toMatchObject({
      orientation: "landscape",
      unit: "mm",
      format: "a6",
    });

    // addImage called exactly once (front-image page).
    expect(addImage).toHaveBeenCalledTimes(1);
    const [image, format, x, y, w, h] = addImage.mock.calls[0];
    expect(image).toBe(dataUrl);
    expect(format).toBe("JPEG");
    expect(x).toBe(0);
    expect(y).toBe(0);
    // Landscape A6 = 148×105 mm.
    expect(w).toBe(148);
    expect(h).toBe(105);

    // addPage called exactly once (to open page 2).
    expect(addPage).toHaveBeenCalledTimes(1);

    // save() fired with the given filename.
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("london_se1_postcard.pdf");
  });

  it("writes the recipient's address lines on page 2", async () => {
    await exportPostcardPdf({
      frontImageUrl: dataUrl,
      backMessage: "",
      recipient,
      orientation: "landscape",
      filename: "p.pdf",
    });

    // Collect all first-arg strings passed to text() — these are the
    // rendered text lines. The recipient lines must appear somewhere.
    const rendered = text.mock.calls
      .map((c) => c[0])
      .filter((s): s is string => typeof s === "string");

    expect(rendered).toContain(recipient.name);
    expect(rendered).toContain(recipient.line1);
    expect(rendered).toContain(recipient.line2);
    expect(rendered).toContain(recipient.country);
  });

  it("swaps page dimensions when orientation is portrait", async () => {
    await exportPostcardPdf({
      frontImageUrl: dataUrl,
      backMessage: "Short message.",
      recipient,
      orientation: "portrait",
      filename: "portrait.pdf",
    });

    expect(ctorSpy.mock.calls[0][0]).toMatchObject({
      orientation: "portrait",
    });

    // Portrait A6 = 105×148 mm.
    const [, , , , w, h] = addImage.mock.calls[0];
    expect(w).toBe(105);
    expect(h).toBe(148);

    // Page 2 also uses portrait orientation.
    expect(addPage).toHaveBeenCalledWith("a6", "portrait");
  });

  it("skips the optional recipient.line2 without crashing", async () => {
    const { line2: _ignore, ...partial } = recipient;
    await exportPostcardPdf({
      frontImageUrl: dataUrl,
      backMessage: "Hi.",
      recipient: partial,
      orientation: "landscape",
      filename: "no-line2.pdf",
    });

    const rendered = text.mock.calls
      .map((c) => c[0])
      .filter((s): s is string => typeof s === "string");
    expect(rendered).toContain(partial.name);
    expect(rendered).not.toContain("undefined");
    expect(save).toHaveBeenCalledWith("no-line2.pdf");
  });
});
