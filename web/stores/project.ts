// Project-scoped hooks over the root Zustand store.
// Thin selectors + action helpers so components don't need to know the
// shape of the whole store.
"use client";

import { useRootStore } from "./root";
import type { Project, ArchivedProject } from "./types";

export function useProject(): Project {
  return useRootStore((s) => s.project);
}

export function useProjectArchive(): Record<string, ArchivedProject> {
  return useRootStore((s) => s.projectsArchive);
}

export function useProjectActions() {
  return useRootStore((s) => ({
    setProject: s.setProject,
    archiveCurrentProject: s.archiveCurrentProject,
    restoreProject: s.restoreProject,
    deleteArchivedProject: s.deleteArchivedProject,
    resetToSeed: s.resetToSeed,
  }));
}
