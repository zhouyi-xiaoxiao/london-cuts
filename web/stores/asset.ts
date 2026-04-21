// Asset-scoped hooks. Asset binary data lives in IndexedDB; this store
// holds the index (id → metadata + cached imageUrl when hydrated).
"use client";

import { useShallow } from "zustand/react/shallow";

import { useRootStore } from "./root";
import type { Asset } from "./types";

export function useAssets(): readonly Asset[] {
  return useRootStore((s) => s.assetsPool);
}

export function useAsset(id: string): Asset | undefined {
  return useRootStore((s) => s.assetsPool.find((a) => a.id === id));
}

export function useAssetsByStop(stopId: string): readonly Asset[] {
  return useRootStore((s) => s.assetsPool.filter((a) => a.stop === stopId));
}

export function useLooseAssets(): readonly Asset[] {
  return useRootStore((s) => s.assetsPool.filter((a) => a.stop == null));
}

export function useAssetActions() {
  return useRootStore(
    useShallow((s) => ({
      addAsset: s.addAsset,
      updateAsset: s.updateAsset,
      removeAsset: s.removeAsset,
    })),
  );
}
