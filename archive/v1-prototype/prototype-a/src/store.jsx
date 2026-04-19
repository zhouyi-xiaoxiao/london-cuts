// store.jsx — tiny pub/sub project store, persisted to localStorage.
//
// Shape (kept flat; one project at a time for MVP):
// {
//   project:        { id, title, author, subtitle, defaultMode, visibility, slug, tags[] },
//   assets:         [ { id, name, mime, size, lastModified, kind, blobUrl?, meta? } ],
//   stops:          mutated STOPS with { assetIds[], heroAssetId? }
//   mediaTasks:     [ MediaTask ]     // owned by MediaProvider
//   postcardVersions: { [stopId]: [ { versionId, ts, durationMs, mode, url? } ] }
//   preFlight:      { missingHeroes: number, missingText: number, ... }
// }
//
// Blob URLs live only for the session. We persist *everything except* blobUrl.

const LC_STORE_KEY = 'lc_store_v1';

function lcInitialState() {
  return {
    project: {
      id: 'se1-year',
      title: PROJECT.title,
      author: PROJECT.author,
      subtitle: PROJECT.subtitle,
      defaultMode: 'fashion',
      visibility: 'public',
      slug: 'a-year-in-se1',
      tags: PROJECT.tags,
    },
    assets: [],
    stops: STOPS.map(s => ({ ...s, assetIds: [], heroAssetId: null })),
    mediaTasks: [],
    postcardVersions: {},
  };
}

function lcLoadStore() {
  try {
    const raw = localStorage.getItem(LC_STORE_KEY);
    if (!raw) return lcInitialState();
    const parsed = JSON.parse(raw);
    // assets that had blob urls are invalid after reload — drop the urls, keep the metadata
    if (Array.isArray(parsed.assets)) {
      parsed.assets = parsed.assets.map(a => ({ ...a, blobUrl: null }));
    }
    return { ...lcInitialState(), ...parsed };
  } catch (e) {
    console.warn('[lc] store parse failed, resetting', e);
    return lcInitialState();
  }
}

function lcPersist(state) {
  try {
    const safe = {
      ...state,
      assets: state.assets.map(({ blobUrl, ...rest }) => rest),
    };
    localStorage.setItem(LC_STORE_KEY, JSON.stringify(safe));
  } catch (e) {
    console.warn('[lc] store persist failed', e);
  }
}

let __lcState = lcLoadStore();
const __lcSubs = new Set();

function lcGetState() { return __lcState; }

function lcSetState(updater) {
  const next = typeof updater === 'function' ? updater(__lcState) : updater;
  if (next === __lcState) return;
  __lcState = next;
  lcPersist(__lcState);
  __lcSubs.forEach(fn => {
    try { fn(__lcState); } catch (e) { console.error(e); }
  });
}

function lcSubscribe(fn) {
  __lcSubs.add(fn);
  return () => __lcSubs.delete(fn);
}

function lcResetStore() {
  __lcState = lcInitialState();
  lcPersist(__lcState);
  __lcSubs.forEach(fn => fn(__lcState));
}

// React hook — forces re-render when the store updates.
function useStore(selector) {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => lcSubscribe(() => force()), []);
  return selector ? selector(__lcState) : __lcState;
}

// Convenience mutations — keep call sites readable.
const storeActions = {
  setProject(patch) {
    lcSetState(s => ({ ...s, project: { ...s.project, ...patch } }));
  },
  addAssets(newAssets) {
    lcSetState(s => ({ ...s, assets: [...s.assets, ...newAssets] }));
  },
  clearAssets() {
    lcSetState(s => ({ ...s, assets: [] }));
  },
  assignAssetToStop(assetId, stopId) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId
        ? { ...st, assetIds: [...new Set([...(st.assetIds || []), assetId])] }
        : st),
    }));
  },
  setHero(stopId, assetId) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId ? { ...st, heroAssetId: assetId } : st),
    }));
  },
  // MediaProvider-owned — provider writes tasks in here.
  upsertTask(task) {
    lcSetState(s => {
      const idx = s.mediaTasks.findIndex(t => t.id === task.id);
      if (idx === -1) return { ...s, mediaTasks: [task, ...s.mediaTasks] };
      const next = s.mediaTasks.slice();
      next[idx] = { ...next[idx], ...task };
      return { ...s, mediaTasks: next };
    });
  },
  removeTask(taskId) {
    lcSetState(s => ({ ...s, mediaTasks: s.mediaTasks.filter(t => t.id !== taskId) }));
  },
  addPostcardVersion(stopId, version) {
    lcSetState(s => ({
      ...s,
      postcardVersions: {
        ...s.postcardVersions,
        [stopId]: [version, ...(s.postcardVersions[stopId] || [])],
      },
    }));
  },
};

Object.assign(window, {
  lcGetState, lcSetState, lcSubscribe, lcResetStore,
  useStore, storeActions,
  LC_STORE_KEY,
});
