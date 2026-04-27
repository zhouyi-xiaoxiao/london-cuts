// Project-scoped hooks over the root Zustand store.
// Thin selectors + action helpers so components don't need to know the
// shape of the whole store. Action bundles use `useShallow` to avoid
// infinite re-renders (returning a fresh object from a plain selector
// triggers Zustand on every render → max-update-depth crash).
"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useRootStore } from "./root";
import { localizeProjectForClient } from "./localize";
import type { Project, ArchivedProject } from "./types";

export function useProject(): Project {
  const project = useRootStore((s) => s.project);
  return useMemo(() => localizeProjectForClient(project), [project]);
}

export function useProjectArchive(): Record<string, ArchivedProject> {
  return useRootStore((s) => s.projectsArchive);
}

export function useProjectActions() {
  return useRootStore(
    useShallow((s) => ({
      setProject: s.setProject,
      archiveCurrentProject: s.archiveCurrentProject,
      restoreProject: s.restoreProject,
      deleteArchivedProject: s.deleteArchivedProject,
      resetToSeed: s.resetToSeed,
    })),
  );
}
