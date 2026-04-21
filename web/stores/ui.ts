// UI-scoped hooks: drawer, publish slideover, active stop id, tour.
"use client";

import { useShallow } from "zustand/react/shallow";

import { useRootStore } from "./root";
import type { UiState } from "./types";

export function useUi(): UiState {
  return useRootStore((s) => s.ui);
}

export function useUiActions() {
  return useRootStore(
    useShallow((s) => ({
      setDrawerOpen: s.setDrawerOpen,
      setDrawerTab: s.setDrawerTab,
      setPublishOpen: s.setPublishOpen,
    })),
  );
}

export function useHydrated(): boolean {
  return useRootStore((s) => s.hydrated);
}
