// F-T008 publish-dialog tests.
// Covers: checklist renders, publish disabled when any stop has no body paragraph,
// publish action sets status + publishedAt, visibility radio writes to project.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { PublishDialog } from "@/components/studio/publish-dialog";
import { useRootStore } from "@/stores/root";
import type { BodyBlock, Stop } from "@/stores/types";

// Seed state with all stops fully passing (upload/hero/body-para/postcard).
// Opens the dialog so the component renders.
function seedAllReady() {
  useRootStore.getState().resetToSeed();
  const s = useRootStore.getState();
  const paragraph: BodyBlock = {
    type: "paragraph",
    content: "A single paragraph so body-has-paragraph passes.",
  };
  const readyStops: Stop[] = s.stops.map((st) => ({
    ...st,
    body: [paragraph],
    status: { upload: true, hero: true, body: true, media: st.status.media },
    postcard: {
      ...st.postcard,
      message: "A postcard message so the pre-flight check passes.",
    },
  }));
  useRootStore.setState({
    stops: readyStops,
    ui: { ...s.ui, publishOpen: true },
    // Ensure project starts as draft so the "Publish →" branch renders.
    project: { ...s.project, status: "draft", publishedAt: null },
  });
}

describe("F-T008 publish dialog", () => {
  beforeEach(() => {
    seedAllReady();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders the pre-flight checklist with one row per stop", () => {
    render(<PublishDialog />);
    const stopIds = useRootStore.getState().stops.map((s) => s.n);
    for (const n of stopIds) {
      expect(screen.getByTestId(`publish-row-${n}`)).toBeDefined();
    }
    const counter = screen.getByTestId("publish-counter");
    expect(counter.textContent).toMatch(
      new RegExp(`${stopIds.length}\\s*\\/\\s*${stopIds.length} ready`),
    );
  });

  it("disables Publish when any stop is missing a body paragraph", () => {
    // Strip the paragraph from stop 05 so body-has-paragraph fails.
    const s = useRootStore.getState();
    const broken: Stop[] = s.stops.map((st) =>
      st.n === "05" ? { ...st, body: [] } : st,
    );
    useRootStore.setState({ stops: broken });

    render(<PublishDialog />);
    const btn = screen.getByTestId("publish-submit-btn") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    // Stop 05 row should show the "body has no paragraph" note.
    expect(screen.getByTestId("publish-row-05").textContent).toMatch(
      /body has no paragraph/i,
    );
  });

  it("clicking Publish sets status to published and stamps publishedAt", () => {
    render(<PublishDialog />);
    const btn = screen.getByTestId("publish-submit-btn") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    const beforeTime = Date.now();
    fireEvent.click(btn);
    const p = useRootStore.getState().project;
    expect(p.status).toBe("published");
    expect(p.publishedAt).toBeTruthy();
    // Timestamp should be parseable and >= the time we clicked.
    const stamped = p.publishedAt ? new Date(p.publishedAt).getTime() : 0;
    expect(stamped).toBeGreaterThanOrEqual(beforeTime);
  });

  it("visibility radio writes project.visibility", () => {
    render(<PublishDialog />);
    // Start as 'public' (default from seed).
    expect(useRootStore.getState().project.visibility).toBe("public");
    // Flip to unlisted via the label (click the label or the radio input).
    const unlistedLabel = screen.getByTestId("visibility-unlisted");
    const unlistedRadio = unlistedLabel.querySelector("input[type=radio]") as HTMLInputElement;
    fireEvent.click(unlistedRadio);
    expect(useRootStore.getState().project.visibility).toBe("unlisted");
    // Then flip to private.
    const privateLabel = screen.getByTestId("visibility-private");
    const privateRadio = privateLabel.querySelector("input[type=radio]") as HTMLInputElement;
    fireEvent.click(privateRadio);
    expect(useRootStore.getState().project.visibility).toBe("private");
  });
});
