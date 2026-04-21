// Stop-scoped hooks over the root Zustand store.
"use client";

import { useShallow } from "zustand/react/shallow";

import { useRootStore } from "./root";
import type { Stop } from "./types";

export function useStops(): readonly Stop[] {
  return useRootStore((s) => s.stops);
}

export function useStop(stopId: string): Stop | undefined {
  return useRootStore((s) => s.stops.find((st) => st.n === stopId));
}

export function useActiveStopId(): string {
  return useRootStore((s) => s.ui.activeStopId);
}

export function useActiveStop(): Stop | undefined {
  return useRootStore((s) => s.stops.find((st) => st.n === s.ui.activeStopId));
}

export function useStopActions() {
  return useRootStore(
    useShallow((s) => ({
      setStops: s.setStops,
      updateStop: s.updateStop,
      reorderStops: s.reorderStops,
      setActiveStop: s.setActiveStop,
    })),
  );
}
