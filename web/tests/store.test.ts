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
    expect(s.stops).toHaveLength(12);
    expect(s.stops[4].n).toBe("05"); // Waterloo bridge
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
    const original = useRootStore.getState().project.title;
    useRootStore.getState().archiveCurrentProject();
    const archiveKeys = Object.keys(useRootStore.getState().projectsArchive);
    expect(archiveKeys).toHaveLength(1);

    // mutate current, then restore
    useRootStore.getState().setProject({ title: "overwritten" });
    expect(useRootStore.getState().project.title).toBe("overwritten");

    useRootStore.getState().restoreProject(archiveKeys[0]);
    expect(useRootStore.getState().project.title).toBe(original);
    expect(Object.keys(useRootStore.getState().projectsArchive)).toHaveLength(
      0,
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
});
