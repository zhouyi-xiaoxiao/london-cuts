// Root Zustand store — the single source of truth for all client-side state.
// Split into domain "slices" via comments for readability; consumers access via
// the domain-scoped hooks in project.ts / stop.ts / postcard.ts / asset.ts.
// Mode + UI are separately exposed via their own files because they don't
// depend on any other slice.
//
// Persistence strategy (ported from legacy store.jsx):
//   - localStorage holds lean metadata (no data URLs — data: URLs replaced by
//     `{_idb: true}` markers)
//   - IndexedDB holds asset binary data (data URLs) keyed by asset.id
//   - After hydration, idbHydrate() fills real imageUrls back in asynchronously
//     and triggers a re-render.
//   - Writes to IDB are debounced 300ms.
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  ArchivedProject,
  Asset,
  MediaTask,
  Project,
  Stop,
  UiState,
} from "./types";
import type { NarrativeMode } from "@/lib/storage";
import {
  PROJECTS_FEED,
  SEED_ASSETS,
  SEED_BODIES,
  SEED_POSTCARDS,
  SEED_PROJECT,
  SEED_PROJECT_REYKJAVIK,
  SEED_STOPS,
  SEED_STOPS_REYKJAVIK,
  SEED_TASKS,
} from "@/lib/seed";
import {
  idbAllAssetKeys,
  idbDeleteAsset,
  idbGetAsset,
  idbPutAsset,
} from "./idb";

// ─── Hydrated default state ────────────────────────────────────────────

const DEFAULT_RECIPIENT = {
  name: "",
  line1: "",
  line2: "",
  country: "",
};

const SEED_CREATED_AT = "2026-04-24T00:00:00.000Z";
const REYKJAVIK_ARCHIVED_AT = Date.parse("2026-04-17T00:00:00.000Z");

function seedStateFromDataModule(): RootState {
  // Build assetsPool first — stops below reference these by id.
  const assetsPool: Asset[] = SEED_ASSETS.map((a) => ({
    ...a,
    // Inherit any static imageUrl declared on the seed entry (13 London
    // photos live under /public/seed-images/).
    imageUrl: a.imageUrl ?? null,
  }));
  const assetByStop = new Map<string, Asset>();
  for (const a of assetsPool) if (a.stop) assetByStop.set(a.stop, a);
  const coverAsset = assetsPool.find((a) => a.id === "se1-13") ?? null;

  const stops: Stop[] = SEED_STOPS.map((s) => {
    const hero = assetByStop.get(s.n) ?? null;
    const hasHero = Boolean(hero?.imageUrl);
    return {
      ...s,
      body: [...(SEED_BODIES[s.n] ?? [])],
      postcard: SEED_POSTCARDS[s.n]
        ? {
            message: SEED_POSTCARDS[s.n].message,
            recipient: { ...SEED_POSTCARDS[s.n].recipient },
            orientation: "landscape",
            frontAssetId: hero?.id ?? null,
            style: null,
          }
        : { message: "", recipient: { ...DEFAULT_RECIPIENT } },
      heroAssetId: hero?.id ?? null,
      assetIds: hero ? [hero.id] : [],
      // Upgrade the upload + hero status bits if we have a real photo.
      status: {
        ...s.status,
        upload: hasHero || s.status.upload,
        hero: hasHero || s.status.hero,
      },
    };
  });

  const project: Project = {
    // StorageProject fields (matches lib/storage.ts Project interface)
    id: "seed-a-year-in-se1",
    ownerId: "seed-owner",
    slug: SEED_PROJECT.slug,
    title: SEED_PROJECT.title,
    subtitle: SEED_PROJECT.subtitle,
    locationName: "London, Windsor and nearby",
    defaultMode: SEED_PROJECT.defaultMode,
    status: SEED_PROJECT.status,
    visibility: SEED_PROJECT.visibility,
    coverAssetId: coverAsset?.id ?? null,
    publishedAt: SEED_PROJECT.published,
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
    // Legacy-facing extras
    author: SEED_PROJECT.author,
    tags: SEED_PROJECT.tags,
    published: SEED_PROJECT.published,
    reads: SEED_PROJECT.reads,
    saves: SEED_PROJECT.saves,
    duration: SEED_PROJECT.duration,
    coverLabel: SEED_PROJECT.coverLabel,
  };

  // Pre-seed archive with the Reykjavík demo so the dashboard shows
  // product scope = "any location" from the first load. Archived,
  // not current, so the SE1 project stays the editing default.
  const reykjavikStops: Stop[] = SEED_STOPS_REYKJAVIK.map((s) => ({
    ...s,
    body: [],
    postcard: { message: "", recipient: { ...DEFAULT_RECIPIENT } },
    heroAssetId: null,
    assetIds: [],
  }));
  const reykjavikProject: Project = {
    id: "seed-a-week-in-reykjavik",
    ownerId: "seed-owner",
    slug: SEED_PROJECT_REYKJAVIK.slug,
    title: SEED_PROJECT_REYKJAVIK.title,
    subtitle: SEED_PROJECT_REYKJAVIK.subtitle,
    locationName: "Reykjavík, Iceland",
    defaultMode: SEED_PROJECT_REYKJAVIK.defaultMode,
    status: SEED_PROJECT_REYKJAVIK.status,
    visibility: SEED_PROJECT_REYKJAVIK.visibility,
    coverAssetId: null,
    publishedAt: SEED_PROJECT_REYKJAVIK.published,
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
    author: SEED_PROJECT_REYKJAVIK.author,
    tags: SEED_PROJECT_REYKJAVIK.tags,
    published: SEED_PROJECT_REYKJAVIK.published,
    reads: SEED_PROJECT_REYKJAVIK.reads,
    saves: SEED_PROJECT_REYKJAVIK.saves,
    duration: SEED_PROJECT_REYKJAVIK.duration,
    coverLabel: SEED_PROJECT_REYKJAVIK.coverLabel,
  };

  return {
    project,
    stops,
    assetsPool,
    mediaTasks: SEED_TASKS.map((t) => ({ ...t }) as MediaTask),
    projectsArchive: {
      "seed-a-week-in-reykjavik": {
        id: "seed-a-week-in-reykjavik",
        createdAt: REYKJAVIK_ARCHIVED_AT,
        project: reykjavikProject,
        stops: reykjavikStops,
        assetsPool: [],
        mediaTasks: [],
      },
    },
    projectsFeed: [...PROJECTS_FEED],
    mode: SEED_PROJECT.defaultMode,
    ui: {
      drawerOpen: true,
      drawerTab: "assets",
      publishOpen: false,
      activeStopId: "05",
      tour: { active: false, step: 0 },
    },
    hydrated: false,
  };
}

// ─── State shape ───────────────────────────────────────────────────────

export interface RootState {
  // Project slice
  project: Project;
  projectsArchive: Record<string, ArchivedProject>;
  projectsFeed: Array<(typeof PROJECTS_FEED)[number]>;

  // Stop slice
  stops: Stop[];

  // Asset slice
  assetsPool: Asset[];

  // Media tasks (moving to postcard/ai-provider in F-T006)
  mediaTasks: MediaTask[];

  // Mode slice
  mode: NarrativeMode;

  // UI slice
  ui: UiState;

  /** True after async idbHydrate() has merged binary data back in. */
  hydrated: boolean;
}

export interface RootActions {
  // Project
  setProject: (patch: Partial<Project>) => void;
  archiveCurrentProject: () => void;
  restoreProject: (id: string) => void;
  deleteArchivedProject: (id: string) => void;
  resetToSeed: () => void;

  // Stop
  setStops: (stops: Stop[]) => void;
  updateStop: (stopId: string, patch: Partial<Stop>) => void;
  reorderStops: (orderedIds: string[]) => void;
  setActiveStop: (stopId: string) => void;
  /** Append a new blank stop after `afterStopId` (or at end if omitted). Returns the new stop's `n`. */
  addStop: (afterStopId?: string) => string;
  /** Remove a stop. If it was active, falls back to the next/prev stop. No-op if it's the last stop. */
  removeStop: (stopId: string) => void;
  /** Move a stop one position in the given direction. No-op if at edge. */
  moveStop: (stopId: string, direction: "up" | "down") => void;

  // Postcard (scoped to a stop)
  updatePostcard: (stopId: string, patch: Partial<Stop["postcard"]>) => void;

  // Asset
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  // Media tasks
  addMediaTask: (task: MediaTask) => void;
  updateMediaTask: (id: string, patch: Partial<MediaTask>) => void;

  // Mode
  setMode: (mode: NarrativeMode) => void;

  // UI
  setDrawerOpen: (open: boolean) => void;
  setDrawerTab: (tab: UiState["drawerTab"]) => void;
  setPublishOpen: (open: boolean) => void;
}

export type RootStore = RootState & RootActions;

// ─── The store ─────────────────────────────────────────────────────────

// Bumped v5 → v6 on 2026-04-25 when the public seed was rebuilt from all
// 13 EXIF-grounded photos and the cover moved from `se1-cover` to `se1-13`.
// Bumped v4 → v5 on 2026-04-22 when SEED_ASSETS switched from legacy
// `a-wb-*` ids to `se1-*` ids + real imageUrls (13 London photos in
// public/seed-images/). Pre-v5 state has null imageUrls that would
// keep the dashboard showing diagonal-stripe placeholders forever.
const PERSIST_KEY = "lc_store_v6";

// Lean a single asset so we don't put data URLs in localStorage.
function leanAsset(a: Asset): Asset {
  if (typeof a.imageUrl === "string" && a.imageUrl.startsWith("data:")) {
    return { ...a, imageUrl: null };
  }
  return a;
}

// Defensive storage getter. In the browser (real Storage on window) this
// returns the actual localStorage. In Node/SSR/Vitest-jsdom where the
// Storage shim may be missing or incomplete, it returns a no-op that
// satisfies the Zustand persist contract without throwing.
function safeLocalStorage(): Storage {
  if (
    typeof window !== "undefined" &&
    window.localStorage &&
    typeof window.localStorage.setItem === "function"
  ) {
    return window.localStorage;
  }
  const mem = new Map<string, string>();
  return {
    get length() {
      return mem.size;
    },
    clear: () => mem.clear(),
    getItem: (k) => mem.get(k) ?? null,
    key: (i) => Array.from(mem.keys())[i] ?? null,
    removeItem: (k) => {
      mem.delete(k);
    },
    setItem: (k, v) => {
      mem.set(k, v);
    },
  } satisfies Storage;
}

export const useRootStore = create<RootStore>()(
  persist(
    (set, get) => ({
      ...seedStateFromDataModule(),

      // ─ Project ─
      setProject: (patch) =>
        set((s) => ({
          project: {
            ...s.project,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        })),
      archiveCurrentProject: () =>
        set((s) => {
          const id = `archive-${Date.now()}`;
          return {
            projectsArchive: {
              ...s.projectsArchive,
              [id]: {
                id,
                createdAt: Date.now(),
                project: s.project,
                stops: s.stops,
                assetsPool: s.assetsPool,
                mediaTasks: s.mediaTasks,
              },
            },
          };
        }),
      restoreProject: (id) =>
        set((s) => {
          const archived = s.projectsArchive[id];
          if (!archived) return {};
          const { [id]: _removed, ...rest } = s.projectsArchive;
          return {
            project: archived.project,
            stops: [...archived.stops],
            assetsPool: [...archived.assetsPool],
            mediaTasks: [...archived.mediaTasks],
            projectsArchive: rest,
          };
        }),
      deleteArchivedProject: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.projectsArchive;
          return { projectsArchive: rest };
        }),
      resetToSeed: () => set(() => seedStateFromDataModule()),

      // ─ Stops ─
      setStops: (stops) => set({ stops }),
      updateStop: (stopId, patch) =>
        set((s) => ({
          stops: s.stops.map((st) =>
            st.n === stopId ? { ...st, ...patch } : st,
          ),
        })),
      reorderStops: (orderedIds) =>
        set((s) => {
          const byId = new Map(s.stops.map((st) => [st.n, st]));
          return {
            stops: orderedIds
              .map((id) => byId.get(id))
              .filter((st): st is Stop => Boolean(st)),
          };
        }),
      setActiveStop: (stopId) =>
        set((s) => ({ ui: { ...s.ui, activeStopId: stopId } })),

      addStop: (afterStopId) => {
        // Pick the next available n (highest int + 1, padded to 2 digits).
        // Sequential is enough for M-fast — no real chronology yet.
        // We use Zustand's `get()` (not `useRootStore.getState()`) to avoid
        // the circular type-inference problem of referencing the store
        // we're in the middle of defining.
        const maxN = get().stops.reduce((m, st) => {
          const n = parseInt(st.n, 10);
          return Number.isFinite(n) && n > m ? n : m;
        }, 0);
        const newN = String(maxN + 1).padStart(2, "0");
        const blank: Stop = {
          n: newN,
          code: "",
          title: "Untitled stop",
          time: "",
          mood: "",
          tone: "warm",
          // Default to central London — owner repositions on the atlas.
          lat: 51.505,
          lng: -0.09,
          label: "",
          body: [],
          assetIds: [],
          heroAssetId: null,
          status: { upload: false, hero: false, body: false, media: null },
          postcard: {
            message: "",
            recipient: { name: "", line1: "", line2: "", country: "" },
          },
        };
        set((s) => {
          const stops = [...s.stops];
          if (afterStopId) {
            const idx = stops.findIndex((st) => st.n === afterStopId);
            if (idx >= 0) stops.splice(idx + 1, 0, blank);
            else stops.push(blank);
          } else {
            stops.push(blank);
          }
          return {
            stops,
            // Auto-select the new stop so the canvas focuses on it.
            ui: { ...s.ui, activeStopId: newN },
          };
        });
        return newN;
      },

      removeStop: (stopId) =>
        set((s) => {
          if (s.stops.length <= 1) return {}; // never delete the last stop
          const idx = s.stops.findIndex((st) => st.n === stopId);
          if (idx < 0) return {};
          const next = s.stops.filter((st) => st.n !== stopId);
          // Pick a sensible new active stop if we just removed it.
          let activeStopId = s.ui.activeStopId;
          if (activeStopId === stopId) {
            const fallback = next[Math.max(0, idx - 1)] ?? next[0];
            activeStopId = fallback?.n ?? "";
          }
          return { stops: next, ui: { ...s.ui, activeStopId } };
        }),

      moveStop: (stopId, direction) =>
        set((s) => {
          const idx = s.stops.findIndex((st) => st.n === stopId);
          if (idx < 0) return {};
          const swapWith = direction === "up" ? idx - 1 : idx + 1;
          if (swapWith < 0 || swapWith >= s.stops.length) return {};
          const next = [...s.stops];
          [next[idx], next[swapWith]] = [next[swapWith]!, next[idx]!];
          return { stops: next };
        }),

      // ─ Postcard ─
      updatePostcard: (stopId, patch) =>
        set((s) => ({
          stops: s.stops.map((st) =>
            st.n === stopId
              ? { ...st, postcard: { ...st.postcard, ...patch } }
              : st,
          ),
        })),

      // ─ Assets ─
      addAsset: (asset) =>
        set((s) => ({ assetsPool: [...s.assetsPool, asset] })),
      updateAsset: (id, patch) =>
        set((s) => ({
          assetsPool: s.assetsPool.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        })),
      removeAsset: (id) =>
        set((s) => ({
          assetsPool: s.assetsPool.filter((a) => a.id !== id),
        })),

      // ─ Media tasks ─
      addMediaTask: (task) =>
        set((s) => ({ mediaTasks: [...s.mediaTasks, task] })),
      updateMediaTask: (id, patch) =>
        set((s) => ({
          mediaTasks: s.mediaTasks.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        })),

      // ─ Mode ─
      setMode: (mode) => set({ mode }),

      // ─ UI ─
      setDrawerOpen: (open) =>
        set((s) => ({ ui: { ...s.ui, drawerOpen: open } })),
      setDrawerTab: (tab) =>
        set((s) => ({ ui: { ...s.ui, drawerTab: tab } })),
      setPublishOpen: (open) =>
        set((s) => ({ ui: { ...s.ui, publishOpen: open } })),
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => safeLocalStorage()),
      // Only serialise lean data to localStorage. IDB handles the rest.
      partialize: (state) => ({
        project: state.project,
        stops: state.stops,
        assetsPool: state.assetsPool.map(leanAsset),
        mediaTasks: state.mediaTasks,
        projectsArchive: Object.fromEntries(
          Object.entries(state.projectsArchive).map(([id, ap]) => [
            id,
            {
              ...ap,
              assetsPool: ap.assetsPool.map(leanAsset),
            },
          ]),
        ),
        mode: state.mode,
      }),
      version: 5,
    },
  ),
);

// ─── IndexedDB hydrate + persist (async side-channel for data URLs) ────

let idbPersistTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Persist all data-URL assets in the pool (and archives) to IDB.
 * Debounced 300ms, same as legacy behaviour.
 */
export function schedulePersistAssetsToIdb() {
  if (typeof window === "undefined") return;
  if (idbPersistTimer) clearTimeout(idbPersistTimer);
  idbPersistTimer = setTimeout(persistAssetsNow, 300);
}

async function persistAssetsNow() {
  const state = useRootStore.getState();
  const current = new Map<string, string>();
  const push = (a: Asset) => {
    if (typeof a.imageUrl === "string" && a.imageUrl.startsWith("data:")) {
      current.set(a.id, a.imageUrl);
    }
  };
  for (const a of state.assetsPool) push(a);
  for (const ap of Object.values(state.projectsArchive)) {
    for (const a of ap.assetsPool) push(a);
  }

  try {
    for (const [id, url] of current) {
      await idbPutAsset(id, url);
    }
    // Garbage-collect IDB entries that were dropped from state.
    const existing = await idbAllAssetKeys();
    for (const k of existing) {
      if (!current.has(k)) await idbDeleteAsset(k);
    }
  } catch (err) {
    console.warn("[stores] IDB persist failed", err);
  }
}

/**
 * Read IDB and fill imageUrl for any asset whose localStorage entry is lean.
 * Call once after mount. Sets `hydrated: true` when done.
 */
export async function idbHydrate(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const state = useRootStore.getState();
    const hydratedPool: Asset[] = await Promise.all(
      state.assetsPool.map(async (a) => {
        if (a.imageUrl) return a;
        const url = await idbGetAsset(a.id);
        return url ? { ...a, imageUrl: url } : a;
      }),
    );
    useRootStore.setState({ assetsPool: hydratedPool, hydrated: true });
  } catch (err) {
    console.warn("[stores] IDB hydrate failed", err);
    useRootStore.setState({ hydrated: true });
  }
}

// Subscribe: any assetsPool change → schedule IDB persist.
if (typeof window !== "undefined") {
  useRootStore.subscribe((state, prev) => {
    if (state.assetsPool !== prev.assetsPool) {
      schedulePersistAssetsToIdb();
    }
  });
}
