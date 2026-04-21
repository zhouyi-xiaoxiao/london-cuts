// F-T003 dashboard smoke test.
// Confirms the dashboard renders the seed project as CURRENT, shows stop
// counts, and that the Reset data button triggers confirm().
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectsDashboard } from "@/components/studio/projects-dashboard";
import { useRootStore } from "@/stores/root";

describe("F-T003 ProjectsDashboard", () => {
  beforeEach(() => {
    useRootStore.getState().resetToSeed();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders the Your work. heading", () => {
    render(<ProjectsDashboard />);
    expect(screen.getByRole("heading", { name: /your work/i })).toBeDefined();
  });

  it("shows the seed project title as the CURRENT card", () => {
    render(<ProjectsDashboard />);
    const seedTitle = useRootStore.getState().project.title;
    expect(screen.getByText(seedTitle)).toBeDefined();
    expect(screen.getByText("CURRENT")).toBeDefined();
  });

  it("reports stop count in the CURRENT card footer", () => {
    render(<ProjectsDashboard />);
    // Seed has 12 stops; footer reads "12 STOPS · …"
    const footers = screen.getAllByText(/\b12 STOPS\b/i);
    expect(footers.length).toBeGreaterThan(0);
  });

  it("reset data asks for confirmation before wiping", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ProjectsDashboard />);
    screen.getByRole("button", { name: /reset data/i }).click();
    expect(confirmSpy).toHaveBeenCalledOnce();
    confirmSpy.mockRestore();
  });
});
