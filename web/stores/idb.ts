// IndexedDB helpers for asset binary data.
// Ported from archive/app-html-prototype-2026-04-20/src/store.jsx (lcIdb*).
// Only used client-side. Every call is safe to no-op during SSR because the
// Zustand persistence layer only invokes them after hydration.
"use client";

export const IDB_NAME = "lc-store";
export const IDB_VERSION = 2;
export const IDB_STORE_ASSETS = "assets";
export const IDB_STORE_VARIANTS = "variants";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_ASSETS)) {
        db.createObjectStore(IDB_STORE_ASSETS);
      }
      if (!db.objectStoreNames.contains(IDB_STORE_VARIANTS)) {
        db.createObjectStore(IDB_STORE_VARIANTS);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const req = fn(s);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Assets bucket (id → data URL) ─────────────────────────────────────

export async function idbPutAsset(id: string, dataUrl: string): Promise<void> {
  await tx(IDB_STORE_ASSETS, "readwrite", (s) => s.put(dataUrl, id));
}

export async function idbGetAsset(id: string): Promise<string | null> {
  const v = await tx(IDB_STORE_ASSETS, "readonly", (s) => s.get(id));
  return (v as string | undefined) ?? null;
}

export async function idbDeleteAsset(id: string): Promise<void> {
  await tx(IDB_STORE_ASSETS, "readwrite", (s) => s.delete(id));
}

export async function idbAllAssetKeys(): Promise<string[]> {
  const keys = await tx(IDB_STORE_ASSETS, "readonly", (s) => s.getAllKeys());
  return (keys as IDBValidKey[]).map(String);
}

// ─── Variants bucket (cache_key → {imageUrl, prompt, ...}) ────────────

export interface VariantCacheEntry {
  imageUrl: string;
  prompt?: string;
  revisedPrompt?: string;
  styleLabel?: string;
  styleId?: string;
  generatedAt?: number;
}

export async function idbPutVariant(
  key: string,
  value: VariantCacheEntry,
): Promise<void> {
  await tx(IDB_STORE_VARIANTS, "readwrite", (s) => s.put(value, key));
}

export async function idbGetVariant(
  key: string,
): Promise<VariantCacheEntry | null> {
  const v = await tx(IDB_STORE_VARIANTS, "readonly", (s) => s.get(key));
  return (v as VariantCacheEntry | undefined) ?? null;
}

export async function idbAllVariantKeys(): Promise<string[]> {
  const keys = await tx(IDB_STORE_VARIANTS, "readonly", (s) => s.getAllKeys());
  return (keys as IDBValidKey[]).map(String);
}

export async function idbClearVariants(): Promise<void> {
  await tx(IDB_STORE_VARIANTS, "readwrite", (s) => s.clear());
}
