import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { PostcardBack } from "@/components/postcard/postcard-back";
import { PostcardCard } from "@/components/postcard/postcard-card";
import { PostcardFront } from "@/components/postcard/postcard-front";
import { Workspace } from "@/components/studio/workspace";
import { useRootStore } from "@/stores/root";

function setViewport(width: number, height = 844) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("responsive guardrails", () => {
  beforeEach(() => {
    useRootStore.getState().resetToSeed();
  });

  afterEach(() => {
    cleanup();
    setViewport(1280, 900);
  });

  it("moves stop navigation into the mobile switcher below 900px", async () => {
    setViewport(390);
    render(<Workspace />);

    const chip = await screen.findByTestId("mobile-stop-switcher-chip");
    expect(chip).toBeDefined();
    expect(screen.queryByText(/\d+\/\d+ STOPS READY/i)).toBeNull();

    fireEvent.click(chip);
    await waitFor(() =>
      expect(screen.getByTestId("mobile-stop-switcher-overlay")).toBeDefined(),
    );
    expect(screen.getByTestId("mobile-stop-switcher-add")).toBeDefined();
  });

  it("keeps the postcard flip control large enough for touch use", () => {
    render(
      <PostcardCard
        orientation="landscape"
        front={
          <PostcardFront
            imageUrl={null}
            stopNumber="01"
            totalStops={13}
            styleLabel={null}
          />
        }
        back={
          <PostcardBack
            postcard={{
              message: "Hello from London.",
              recipient: { name: "", line1: "", line2: "", country: "" },
            }}
            onUpdate={() => {}}
            readOnly
          />
        }
      />,
    );

    const flip = screen.getByTestId("postcard-flip-button");
    expect(flip.style.minHeight).toBe("40px");
    expect(flip.textContent).toContain("Flip");
  });
});
