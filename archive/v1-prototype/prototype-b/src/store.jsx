// store.jsx — tiny pub/sub project store, persisted to localStorage.
//
// Shape (kept flat; one project at a time for MVP):
// {
//   project:        { id, title, author, subtitle, defaultMode, visibility, slug, tags[] },
//   assets:         [ { id, name, mime, size, lastModified, kind, blobUrl?, meta? } ],
//   stops:          mutated STOPS with { assetIds[], heroAssetId?, body, message, recipient }
//   assetsPool:     [ assetId ] — assets uploaded but not yet assigned to any stop
//   mediaTasks:     [ MediaTask ]     // owned by MediaProvider
//   postcardVersions: { [stopId]: [ { versionId, ts, durationMs, mode, url? } ] }
//   preFlight:      { missingHeroes: number, missingText: number, ... }
// }
//
// Blob URLs live only for the session. We persist *everything except* blobUrl.
// V2 migration: keys changed from lc_store_v1 to lc_store_v2 with shape upgrade.

const LC_STORE_KEY_V2 = 'lc_store_v2';
const LC_STORE_KEY = 'lc_store_v1'; // kept for migration fallback

// Default message and recipient — pulled from public-postcard.jsx
const DEFAULT_MESSAGE = 'M — walked home across Waterloo last night. The river caught. Thought of you in Lisbon. Six minutes of gold, then nothing. 

— A.';
const DEFAULT_RECIPIENT = {
  name: 'Matteo Ricci',
  addressLines: ['Rua das Flores 28', '1200-195 Lisboa'],
  country: 'Portugal',
};

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
    stops: STOPS.map(s => ({
      ...s,
      assetIds: [],
      heroAssetId: null,
      body: { type: 'doc', content: [] },
      message: DEFAULT_MESSAGE,
      recipient: { ...DEFAULT_RECIPIENT },
    })),
    assetsPool: [],
    mediaTasks: [],
    postcardVersions: {},
  };
}

function lcMigrateV1ToV2(v1State) {
  // Upgrade v1 shape to v2: add body, message, recipient to each stop; add assetsPool
  return {
    ...v1State,
    stops: (v1State.stops || []).map(s => ({
      ...s,
      body: s.body || { type: 'doc', content: [] },
      message: s.message || DEFAULT_MESSAGE,
      recipient: s.recipient || { ...DEFAULT_RECIPIENT },
    })),
    assetsPool: v1State.assetsPool || [],
  };
}

function lcLoadStore() {
  try {
    // Try V2 key first
    let raw = localStorage.getItem(LC_STORE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      // assets that had blob urls are invalid after reload — drop the urls, keep the metadata
      if (Array.isArray(parsed.assets)) {
        parsed.assets = parsed.assets.map(a => ({ ...a, blobUrl: null }));
      }
      return { ...lcInitialState(), ...parsed };
    }

    // Fallback to V1 key for migration
    raw = localStorage.getItem(LC_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Clean blob URLs
      if (Array.isArray(parsed.assets)) {
        parsed.assets = parsed.assets.map(a => ({ ...a, blobUrl: null }));
      }
      // Upgrade to V2 shape
      const upgraded = lcMigrateV1ToV2(parsed);
      // Persist under V2 key for next load (leave V1 as safety net)
      lcPersist(upgraded, true); // force persist on load
      return { ...lcInitialState(), ...upgraded };
    }

    // No existing state — fresh start
    return lcInitialState();
  } catch (e) {
    console.warn('[lc] store parse failed, resetting', e);
    return lcInitialState();
  }
}

function lcPersist(state, forceV2 = false) {
  try {
    const safe = {
      ...state,
      assets: state.assets.map(({ blobUrl, ...rest }) => rest),
    };
    // Always write to V2 key
    localStorage.setItem(LC_STORE_KEY_V2, JSON.stringify(safe));
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
  setStopBody(stopId, doc) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId ? { ...st, body: doc } : st),
    }));
  },
  setStopMessage(stopId, text) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId ? { ...st, message: text } : st),
    }));
  },
  setStopRecipient(stopId, recipient) {
    // Validate and fill in defaults if needed
    const safe = {
      name: recipient?.name || DEFAULT_RECIPIENT.name,
      addressLines: Array.isArray(recipient?.addressLines) ? recipient.addressLines : DEFAULT_RECIPIENT.addressLines,
      country: recipient?.country || DEFAULT_RECIPIENT.country,
    };
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId ? { ...st, recipient: safe } : st),
    }));
  },
  addToAssetsPool(asset) {
    lcSetState(s => ({
      ...s,
      assetsPool: [...new Set([...(s.assetsPool || []), asset.id])],
    }));
  },
  removeFromAssetsPool(assetId) {
    lcSetState(s => ({
      ...s,
      assetsPool: (s.assetsPool || []).filter(id => id !== assetId),
    }));
  },
  assignAssetToStopFromPool(assetId, stopId) {
    lcSetState(s => ({
      ...s,
      // Remove from pool
      assetsPool: (s.assetsPool || []).filter(id => id !== assetId),
      // Add to stop
      stops: s.stops.map(st => st.n === stopId
        ? { ...st, assetIds: [...new Set([...(st.assetIds || []), assetId])] }
        : st),
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
  LC_STORE_KEY, LC_STORE_KEY_V2,
});
