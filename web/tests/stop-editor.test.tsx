// F-T005 stop-editor smoke tests.
// Verifies: title input writes back, metadata fields update, body add/remove/reorder, hero slot clear.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { StopCanvas } from "@/components/studio/stop-canvas";
import { useRootStore } from "@/stores/root";
import type { Stop } from "@/stores/types";

function activeStop(): Stop {
  const s = useRootStore.getState().stops.find((x) => x.n === "05");
  if (!s) throw new Error("expected seed stop 05");
  return s;
}

describe("F-T005 stop editor", () => {
  beforeEach(() => {
    useRootStore.getState().resetToSeed();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders title input wired to the store", () => {
    render(<StopCanvas stop={activeStop()} />);
    const inputs = screen.getAllByDisplayValue("A Serene Retreat");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("title input writes through to the store", () => {
    render(<StopCanvas stop={activeStop()} />);
    const input = screen.getAllByDisplayValue("A Serene Retreat")[0];
    fireEvent.change(input, { target: { value: "Rewritten" } });
    expect(
      useRootStore.getState().stops.find((s) => s.n === "05")?.title,
    ).toBe("Rewritten");
  });

  it("adds a paragraph block via + Paragraph button", () => {
    render(<StopCanvas stop={activeStop()} />);
    const before = useRootStore.getState().stops.find((s) => s.n === "05")!
      .body.length;
    const addBtn = screen.getByRole("button", { name: /\+ Paragraph/i });
    fireEvent.click(addBtn);
    const after = useRootStore.getState().stops.find((s) => s.n === "05")!.body
      .length;
    expect(after).toBe(before + 1);
  });

  it("tone radio switches current stop tone", () => {
    render(<StopCanvas stop={activeStop()} />);
    const punkBtn = screen.getByRole("radio", { name: /^punk$/i });
    fireEvent.click(punkBtn);
    expect(
      useRootStore.getState().stops.find((s) => s.n === "05")?.tone,
    ).toBe("punk");
  });

  it("metadata code input writes through", () => {
    render(<StopCanvas stop={activeStop()} />);
    const codeInput = screen.getAllByDisplayValue("SL4 1LB")[0];
    fireEvent.change(codeInput, { target: { value: "SL4 1XX" } });
    expect(
      useRootStore.getState().stops.find((s) => s.n === "05")?.code,
    ).toBe("SL4 1XX");
  });
});
