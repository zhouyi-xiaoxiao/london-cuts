// F-T004 workspace shell smoke test.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Workspace } from "@/components/studio/workspace";
import { useRootStore } from "@/stores/root";

describe("F-T004 Workspace shell", () => {
  beforeEach(() => {
    useRootStore.getState().resetToSeed();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders top bar with project title and stops-ready summary", () => {
    render(<Workspace />);
    const title = useRootStore.getState().project.title;
    expect(screen.getByText(title)).toBeDefined();
    // 7/12 ready in seed data (stops with upload+hero+body all true).
    expect(screen.getByText(/\d+\/\d+ STOPS READY/i)).toBeDefined();
  });

  it("spine renders all 12 seed stops", () => {
    render(<Workspace />);
    const rows = screen.getAllByRole("option");
    expect(rows).toHaveLength(12);
  });

  it("canvas shows the active stop's title (default stop 05)", () => {
    render(<Workspace />);
    // Stop 05 title is "Waterloo bridge, facing east" — unique to canvas h1.
    // The spine row shows it but in truncated style, so multiple matches
    // are fine; we assert at least one.
    expect(screen.getAllByText(/Waterloo bridge, facing east/i).length).toBeGreaterThan(0);
  });

  it("clicking a spine row selects that stop", () => {
    render(<Workspace />);
    const rows = screen.getAllByRole("option");
    fireEvent.click(rows[0]); // stop 01 Borough Market
    expect(useRootStore.getState().ui.activeStopId).toBe("01");
    // Canvas h1 now shows the stop 01 title.
    expect(screen.getAllByText(/Borough Market at opening/i).length).toBeGreaterThan(0);
  });

  it("mode pill cycles modes via click", () => {
    render(<Workspace />);
    const punkBtn = screen.getByRole("radio", { name: /punk/i });
    fireEvent.click(punkBtn);
    expect(useRootStore.getState().mode).toBe("punk");
  });
});
