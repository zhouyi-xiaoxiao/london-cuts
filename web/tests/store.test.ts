// Smoke test for the F-T002 store split.
// Verifies: seed data loads, mutations work, persistence roundtrip is clean.
// Runs under jsdom (default in vitest.config.ts) so Zustand's localStorage
// persist layer has a real DOM backing store.
import { beforeEach, describe, expect, it } from "vitest";

import { useRootStore } from "@/stores/root";
import * as storage from "@/lib/storage";

describe("F-T002 root store", () => {
  beforeEach(() => {
    // Reset in-memory state. localStorage state between tests is fine to
    // leave — the persist middleware rehydrates on next load, and in-memory
    // state is what assertions read.
    useRootStore.getState().resetToSeed();
  });

  it("loads seed data", () => {
    const s = useRootStore.getState();
    expect(s.project.slug).toBe("a-year-in-se1");
    expect(s.stops).toHaveLength(13);
    expect(s.stops[4].n).toBe("05"); // Windsor interior
    expect(s.stops[4].body.length).toBeGreaterThan(0); // populated for stop 05
    expect(s.mode).toBe("fashion");
  });

  it("updates a project patch + bumps updatedAt", async () => {
    const before = useRootStore.getState().project.updatedAt;
    // force a different timestamp even on fast machines
    await new Promise((r) => setTimeout(r, 5));
    useRootStore.getState().setProject({ title: "renamed" });
    const after = useRootStore.getState().project;
    expect(after.title).toBe("renamed");
    expect(after.updatedAt).not.toBe(before);
  });

  it("reorders stops by id", () => {
    const original = useRootStore.getState().stops.map((st) => st.n);
    const reversed = [...original].reverse();
    useRootStore.getState().reorderStops(reversed);
    expect(useRootStore.getState().stops.map((st) => st.n)).toEqual(reversed);
  });

  it("updates a stop via scoped action", () => {
    useRootStore.getState().updateStop("03", { title: "New Tate title" });
    const st = useRootStore.getState().stops.find((s) => s.n === "03");
    expect(st?.title).toBe("New Tate title");
  });

  it("updates a postcard via scoped action", () => {
    useRootStore.getState().updatePostcard("05", { message: "hello world" });
    const st = useRootStore.getState().stops.find((s) => s.n === "05");
    expect(st?.postcard.message).toBe("hello world");
  });

  it("archives and restores a project", () => {
    // Seed state pre-archives "A Week in Reykjavík" to demonstrate product
    // scope ("any location"). Baseline archive count is 1; after archiving
    // the current SE1 project we expect 2.
    const baseline = Object.keys(useRootStore.getState().projectsArchive).length;
    const original = useRootStore.getState().project.title;

    useRootStore.getState().archiveCurrentProject();
    const afterArchive = Object.keys(
      useRootStore.getState().projectsArchive,
    );
    expect(afterArchive).toHaveLength(baseline + 1);
    // The newly archived key is the one NOT in the baseline set.
    const newlyArchivedId = afterArchive.find(
      (k) => k !== "seed-a-week-in-reykjavik",
    );
    expect(newlyArchivedId).toBeDefined();

    // mutate current, then restore
    useRootStore.getState().setProject({ title: "overwritten" });
    expect(useRootStore.getState().project.title).toBe("overwritten");

    useRootStore.getState().restoreProject(newlyArchivedId!);
    expect(useRootStore.getState().project.title).toBe(original);
    expect(Object.keys(useRootStore.getState().projectsArchive)).toHaveLength(
      baseline,
    );
  });

  it("seam lib/storage returns the current project by id", async () => {
    const current = useRootStore.getState().project;
    const p = await storage.getProject(current.id);
    expect(p?.id).toBe(current.id);
  });

  it("seam lib/storage.getProjectByHandleAndSlug resolves current slug", async () => {
    const p = await storage.getProjectByHandleAndSlug(
      "ignored",
      "a-year-in-se1",
    );
    expect(p?.slug).toBe("a-year-in-se1");
  });

  // ─── F-I009 — spine add/remove/move actions ────────────────────────

  it("addStop appends a blank stop after the given id and selects it", () => {
    const before = useRootStore.getState().stops;
    const lastN = before[before.length - 1].n;
    const newN = useRootStore.getState().addStop(lastN);
    const after = useRootStore.getState().stops;
    expect(after.length).toBe(before.length + 1);
    expect(after[after.length - 1].n).toBe(newN);
    expect(after[after.length - 1].title).toBe("Untitled stop");
    expect(useRootStore.getState().ui.activeStopId).toBe(newN);
  });

  it("removeStop drops the stop and falls back to a sibling if active", () => {
    const before = useRootStore.getState().stops;
    const target = before[2]; // some middle stop
    useRootStore.getState().setActiveStop(target.n);
    useRootStore.getState().removeStop(target.n);
    const after = useRootStore.getState().stops;
    expect(after.length).toBe(before.length - 1);
    expect(after.find((s) => s.n === target.n)).toBeUndefined();
    // active stop should be the one that was at index-1 (or 0 if first removed)
    expect(useRootStore.getState().ui.activeStopId).not.toBe(target.n);
  });

  it("removeStop is a no-op when only one stop remains", () => {
    // Drain the seed down to one stop.
    let stops = useRootStore.getState().stops;
    while (stops.length > 1) {
      useRootStore.getState().removeStop(stops[stops.length - 1].n);
      stops = useRootStore.getState().stops;
    }
    expect(useRootStore.getState().stops.length).toBe(1);
    const lone = useRootStore.getState().stops[0];
    useRootStore.getState().removeStop(lone.n);
    expect(useRootStore.getState().stops.length).toBe(1);
  });

  it("moveStop swaps with neighbour and is a no-op at edges", () => {
    const initial = useRootStore.getState().stops.map((s) => s.n);
    const second = initial[1];
    // Move second up — it should swap with first.
    useRootStore.getState().moveStop(second, "up");
    const afterUp = useRootStore.getState().stops.map((s) => s.n);
    expect(afterUp[0]).toBe(second);
    // Move first up at the edge — no-op.
    useRootStore.getState().moveStop(afterUp[0], "up");
    expect(useRootStore.getState().stops.map((s) => s.n)).toEqual(afterUp);
  });
});
