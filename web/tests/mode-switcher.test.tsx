// F-P001 smoke test — clicking the Punk button updates the shared mode
// store. Renders under jsdom (vitest default) so useMode/useSetMode
// exercise the same Zustand instance the app uses at runtime.
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ModeSwitcher } from "@/components/mode-switcher";
import { useRootStore } from "@/stores/root";

describe("F-P001 ModeSwitcher", () => {
  beforeEach(() => {
    useRootStore.getState().resetToSeed();
  });

  it("updates the mode store to 'punk' when the Punk button is clicked", () => {
    render(<ModeSwitcher />);
    expect(useRootStore.getState().mode).toBe("fashion"); // seed default
    fireEvent.click(screen.getByRole("button", { name: "Punk" }));
    expect(useRootStore.getState().mode).toBe("punk");
  });
});
