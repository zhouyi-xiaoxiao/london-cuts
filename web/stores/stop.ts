// Stop-scoped hooks over the root Zustand store.
"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useRootStore } from "./root";
import { localizeStopForClient } from "./localize";
import type { Stop } from "./types";

export function useStops(): readonly Stop[] {
  const stops = useRootStore((s) => s.stops);
  return useMemo(() => stops.map(localizeStopForClient), [stops]);
}

export function useStop(stopId: string): Stop | undefined {
  const stop = useRootStore((s) => s.stops.find((st) => st.n === stopId));
  return useMemo(() => (stop ? localizeStopForClient(stop) : undefined), [stop]);
}

export function useActiveStopId(): string {
  return useRootStore((s) => s.ui.activeStopId);
}

export function useActiveStop(): Stop | undefined {
  const stop = useRootStore((s) => s.stops.find((st) => st.n === s.ui.activeStopId));
  return useMemo(() => (stop ? localizeStopForClient(stop) : undefined), [stop]);
}

export function useStopActions() {
  return useRootStore(
    useShallow((s) => ({
      setStops: s.setStops,
      updateStop: s.updateStop,
      reorderStops: s.reorderStops,
      setActiveStop: s.setActiveStop,
      addStop: s.addStop,
      removeStop: s.removeStop,
      moveStop: s.moveStop,
    })),
  );
}
