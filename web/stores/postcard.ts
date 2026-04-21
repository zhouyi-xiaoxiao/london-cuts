// Postcard-scoped hooks. A postcard always lives inside a stop — there is
// no top-level list of postcards in M-fast. This module is a thin helper
// to locate one and mutate it by stop id.
"use client";

import { useShallow } from "zustand/react/shallow";

import { useRootStore } from "./root";
import type { Postcard } from "./types";

export function usePostcard(stopId: string): Postcard | undefined {
  return useRootStore((s) => s.stops.find((st) => st.n === stopId)?.postcard);
}

export function usePostcardActions() {
  return useRootStore(
    useShallow((s) => ({
      updatePostcard: s.updatePostcard,
    })),
  );
}
