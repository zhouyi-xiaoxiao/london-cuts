// store.jsx — V3 nested store with useSyncExternalStore + localStorage persistence
//
// Shape (hierarchical, supports multiple stores in future):
// {
//   project: { title, author, subtitle, defaultMode, visibility, slug, tags[], reads, saves, duration, coverLabel, published },
//   stops: [ { n, code, title, time, mood, tone, lat, lng, label, status, body[], postcard, heroAssetId, assetIds[] } ],
//   assetsPool: [ { id, stop, tone, imageUrl?, generatedAt?, prompt?, revisedPrompt? } ],
//   mediaTasks: [ { id, kind, stopId, mode, state, progress, prompt } ],
//   ui: { mode, drawerOpen, drawerTab, publishOpen, activeStopId },
//   openai: { sessionKey } (memory-only, never persisted)
// }
//
// Persistence: localStorage key 'lc_store_v3', excludes ui + openai.
// Migration: from lc_store_v2 (flat shape) to V3 (nested).

const LC_STORE_KEY_V3 = 'lc_store_v3';
const LC_STORE_KEY_V2 = 'lc_store_v2'; // fallback for migration
const LC_IDB_NAME  = 'lc-store';
const LC_IDB_STORE = 'assets';
// Second object store: persistent cache of generated style variants keyed by
// `${sourceIdentity}::${styleId}`. Value shape: `{ url, prompt, revisedPrompt,
// styleLabel, quality, ts }`. Survives "Load demo" / project resets so we
// never re-pay for the same (photo, style) pair.
const LC_IDB_VARIANT_STORE = 'variants';
const LC_IDB_VERSION = 2;

// ---- IndexedDB layer for big blobs (data URLs that would overflow localStorage)
function lcIdbOpen() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no-indexeddb'));
    const openWithVersion = (v) => {
      const req = indexedDB.open(LC_IDB_NAME, v);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(LC_IDB_STORE)) db.createObjectStore(LC_IDB_STORE);
        if (!db.objectStoreNames.contains(LC_IDB_VARIANT_STORE)) db.createObjectStore(LC_IDB_VARIANT_STORE);
      };
      req.onsuccess = () => {
        const db = req.result;
        // Recovery: an older DB may exist without one of our object stores.
        // Bump the version so a fresh upgrade creates them, then try again.
        const missing = !db.objectStoreNames.contains(LC_IDB_STORE)
                     || !db.objectStoreNames.contains(LC_IDB_VARIANT_STORE);
        if (missing) {
          const currentV = db.version;
          db.close();
          openWithVersion(currentV + 1);
        } else {
          resolve(db);
        }
      };
      req.onerror = () => reject(req.error);
    };
    openWithVersion(LC_IDB_VERSION);
  });
}

// ---- Generated-variant cache helpers ----
function lcVariantCacheKey(sourceIdentity, styleId) {
  if (!sourceIdentity || !styleId) return null;
  return String(sourceIdentity) + '::' + String(styleId);
}
function lcVariantCacheSave(key, value) {
  if (!key || !value) return Promise.resolve();
  return lcIdbOpen().then(db => new Promise((resolve) => {
    try {
      const tx = db.transaction(LC_IDB_VARIANT_STORE, 'readwrite');
      tx.objectStore(LC_IDB_VARIANT_STORE).put({ ...value, ts: Date.now() }, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror    = () => { db.close(); resolve(); };
    } catch (e) { db.close(); resolve(); }
  }));
}
function lcVariantCacheGet(key) {
  if (!key) return Promise.resolve(null);
  return lcIdbOpen().then(db => new Promise((resolve) => {
    try {
      const tx = db.transaction(LC_IDB_VARIANT_STORE, 'readonly');
      const req = tx.objectStore(LC_IDB_VARIANT_STORE).get(key);
      req.onsuccess = () => { db.close(); resolve(req.result || null); };
      req.onerror   = () => { db.close(); resolve(null); };
    } catch (e) { db.close(); resolve(null); }
  }));
}
function lcVariantCacheList() {
  return lcIdbOpen().then(db => new Promise((resolve) => {
    try {
      const tx = db.transaction(LC_IDB_VARIANT_STORE, 'readonly');
      const req = tx.objectStore(LC_IDB_VARIANT_STORE).getAllKeys();
      req.onsuccess = () => { db.close(); resolve(req.result || []); };
      req.onerror   = () => { db.close(); resolve([]); };
    } catch (e) { db.close(); resolve([]); }
  }));
}
function lcVariantCacheClear() {
  return lcIdbOpen().then(db => new Promise((resolve) => {
    try {
      const tx = db.transaction(LC_IDB_VARIANT_STORE, 'readwrite');
      tx.objectStore(LC_IDB_VARIANT_STORE).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror    = () => { db.close(); resolve(); };
    } catch (e) { db.close(); resolve(); }
  }));
}
// Fetch all cached variants for a list of (sourceIdentity, styleId) pairs.
// Returns array of { key, sourceIdentity, styleId, value } for hits only.
async function lcVariantCacheGetMany(pairs) {
  const results = [];
  for (const p of pairs) {
    if (!p) continue;
    const key = lcVariantCacheKey(p.sourceIdentity, p.styleId);
    if (!key) continue;
    const value = await lcVariantCacheGet(key);
    if (value) results.push({ key, sourceIdentity: p.sourceIdentity, styleId: p.styleId, value });
  }
  return results;
}
function lcIdbPut(key, value) {
  return lcIdbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(LC_IDB_STORE, 'readwrite');
    tx.objectStore(LC_IDB_STORE).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = () => { db.close(); reject(tx.error); };
  }));
}
function lcIdbGet(key) {
  return lcIdbOpen().then(db => new Promise((resolve) => {
    const tx = db.transaction(LC_IDB_STORE, 'readonly');
    const req = tx.objectStore(LC_IDB_STORE).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror   = () => { db.close(); resolve(undefined); };
  }));
}
function lcIdbDelete(key) {
  return lcIdbOpen().then(db => new Promise((resolve) => {
    const tx = db.transaction(LC_IDB_STORE, 'readwrite');
    tx.objectStore(LC_IDB_STORE).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = () => { db.close(); resolve(); };
  }));
}
function lcIdbGetAllKeys() {
  return lcIdbOpen().then(db => new Promise((resolve) => {
    const tx = db.transaction(LC_IDB_STORE, 'readonly');
    const req = tx.objectStore(LC_IDB_STORE).getAllKeys();
    req.onsuccess = () => { db.close(); resolve(req.result || []); };
    req.onerror   = () => { db.close(); resolve([]); };
  }));
}

const STOP_IMAGES = {
  '01': 'https://picsum.photos/seed/lc-borough-market/1200/800',
  '02': 'https://picsum.photos/seed/lc-shard-london/1200/800',
  '03': 'https://picsum.photos/seed/lc-tate-turbine/1200/800',
  '04': 'https://picsum.photos/seed/lc-thames-mudlark/1200/800',
  '05': 'https://picsum.photos/seed/lc-waterloo-dusk/1200/800',
  '06': 'https://picsum.photos/seed/lc-national-theatre/1200/800',
  '07': 'https://picsum.photos/seed/lc-southwark-pub/1200/800',
  '08': 'https://picsum.photos/seed/lc-bermondsey-neon/1200/800',
  '09': 'https://picsum.photos/seed/lc-london-streetlight/1200/800',
  '10': 'https://picsum.photos/seed/lc-tower-bridge-dawn/1200/800',
  '11': 'https://picsum.photos/seed/lc-guys-chapel/1200/800',
  '12': 'https://picsum.photos/seed/lc-elephant-castle/1200/800',
};

const DEFAULT_MESSAGE = 'M — walked home across Waterloo last night. The river caught. Thought of you in Lisbon. Six minutes of gold, then nothing.\n— A.';
const DEFAULT_RECIPIENT = {
  name: '',
  line1: '',
  line2: '',
  country: '',
};

function lcInitialState() {
  // Build stops from global STOPS + BODY_05, POSTCARD_05
  const stops = STOPS.map(stop => {
    const isStop05 = stop.n === '05';
    return {
      ...stop,
      body: isStop05 ? BODY_05 : [],
      postcard: isStop05 ? POSTCARD_05 : {
        message: '',
        recipient: { ...DEFAULT_RECIPIENT },
      },
      heroAssetId: null,
      assetIds: [],
    };
  });

  // Build assetsPool with image URLs
  const assetsPool = POOL_ASSETS.map(asset => ({
    ...asset,
    imageUrl: asset.stop ? STOP_IMAGES[asset.stop] : null,
  }));

  return {
    project: { ...PROJECT },
    stops,
    assetsPool,
    mediaTasks: SEED_TASKS.map(t => ({ ...t })),
    projects: {}, // archive of saved projects: id -> { id, project, stops, assetsPool, mediaTasks, createdAt }
    ui: {
      mode: 'fashion',
      drawerOpen: true,
      drawerTab: 'assets',
      publishOpen: false,
      activeStopId: '05',
      tour: { active: false, step: 0 },
    },
    openai: {
      sessionKey: null,
    },
  };
}

function lcMigrateV2ToV3(v2State) {
  // Migrate from flat V2 shape to nested V3.
  // V2 had: project, assets[], stops[], assetsPool[], mediaTasks[], postcardVersions
  // V3 needs: full nested shape with ui, openai, restructured stops with postcard objects
  const stops = (v2State.stops || []).map(stop => {
    const isStop05 = stop.n === '05';
    return {
      ...stop,
      body: stop.body || (isStop05 ? BODY_05 : []),
      postcard: {
        message: stop.message || (isStop05 ? POSTCARD_05.message : ''),
        recipient: stop.recipient || (isStop05 ? POSTCARD_05.recipient : { ...DEFAULT_RECIPIENT }),
      },
      heroAssetId: stop.heroAssetId || null,
      assetIds: stop.assetIds || [],
    };
  });

  const assetsPool = (v2State.assetsPool || []).map(id => {
    const origAsset = POOL_ASSETS.find(a => a.id === id);
    return origAsset ? { ...origAsset, imageUrl: origAsset.stop ? STOP_IMAGES[origAsset.stop] : null } : null;
  }).filter(Boolean);

  return {
    project: v2State.project || PROJECT,
    stops,
    assetsPool,
    mediaTasks: v2State.mediaTasks || SEED_TASKS,
    projects: {},
    ui: {
      mode: 'fashion',
      drawerOpen: true,
      drawerTab: 'assets',
      publishOpen: false,
      activeStopId: '05',
      tour: { active: false, step: 0 },
    },
    openai: { sessionKey: null },
  };
}

function lcLoadStore() {
  try {
    // Try V3 key first
    let raw = localStorage.getItem(LC_STORE_KEY_V3);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Re-init ui + openai (never persisted)
      return {
        ...parsed,
        projects: (parsed && typeof parsed.projects === 'object' && parsed.projects) ? parsed.projects : {},
        ui: {
          mode: parsed.ui?.mode || 'fashion',
          drawerOpen: true,
          drawerTab: 'assets',
          publishOpen: false,
          activeStopId: parsed.ui?.activeStopId || '05',
          tour: { active: false, step: 0 },
        },
        openai: { sessionKey: null },
      };
    }

    // Fallback to V2 key for migration
    raw = localStorage.getItem(LC_STORE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      const upgraded = lcMigrateV2ToV3(parsed);
      // Persist under V3 key for next load
      lcPersist(upgraded, true);
      return upgraded;
    }

    // Fresh start
    return lcInitialState();
  } catch (e) {
    console.warn('[lc] store parse failed, resetting', e);
    return lcInitialState();
  }
}

// Persistence strategy:
//   • localStorage holds ONLY metadata (stops + project + assetsPool with
//     imageUrl stripped if it's a data: URL — replaced with `{_idb: true}`).
//   • IndexedDB holds the real data URLs keyed by asset.id. Much larger quota
//     (hundreds of MB → GB depending on browser).
//   • After load, `lcHydrateImages()` runs asynchronously and fills imageUrls
//     back in, triggering a store notification so UI re-renders with real pix.
//   • Writes to IDB are debounced 300ms and diff'd so only changed assets get
//     rewritten.

let __lcIdbPersistTimer = null;
let __lcIdbLastKeys = new Set();

function lcPersist(state) {
  // 1. Build lean metadata for localStorage (no data URLs)
  const leanAssets = state.assetsPool.map(a => {
    if (typeof a.imageUrl === 'string' && a.imageUrl.startsWith('data:')) {
      return { ...a, imageUrl: null, _idb: true };
    }
    return a;
  });
  // Lean the archived projects' assets too — their data URLs live in IDB keyed
  // by the archived (prefixed) asset id.
  const leanProjects = {};
  const archivedSrc = (state.projects && typeof state.projects === 'object') ? state.projects : {};
  for (const [id, p] of Object.entries(archivedSrc)) {
    if (!p) continue;
    leanProjects[id] = {
      ...p,
      assetsPool: Array.isArray(p.assetsPool) ? p.assetsPool.map(a => {
        if (typeof a.imageUrl === 'string' && a.imageUrl.startsWith('data:')) {
          return { ...a, imageUrl: null, _idb: true };
        }
        return a;
      }) : [],
    };
  }
  const leanState = {
    project: state.project,
    stops: state.stops,
    assetsPool: leanAssets,
    mediaTasks: state.mediaTasks,
    projects: leanProjects,
  };

  try {
    localStorage.setItem(LC_STORE_KEY_V3, JSON.stringify(leanState));
  } catch (e) {
    console.warn('[lc] localStorage persist failed', e?.message || e);
  }

  // 2. Debounce IDB write (data URLs only) — includes archived projects' assets.
  clearTimeout(__lcIdbPersistTimer);
  __lcIdbPersistTimer = setTimeout(() => {
    const all = [...state.assetsPool];
    for (const p of Object.values(archivedSrc)) {
      if (p && Array.isArray(p.assetsPool)) {
        for (const a of p.assetsPool) all.push(a);
      }
    }
    lcPersistAssetsToIdb(all);
  }, 300);
}

async function lcPersistAssetsToIdb(pool) {
  try {
    const current = new Map();
    for (const a of pool) {
      if (typeof a.imageUrl === 'string' && a.imageUrl.startsWith('data:')) {
        current.set(a.id, a.imageUrl);
      }
    }
    // Write new/changed
    for (const [id, url] of current) {
      try { await lcIdbPut(id, url); }
      catch (e) { console.warn('[lc] idb put failed for', id, e?.message); break; }
    }
    // Delete rows that were in IDB but are no longer in pool
    const existing = await lcIdbGetAllKeys();
    for (const key of existing) {
      if (!current.has(key)) {
        try { await lcIdbDelete(key); } catch {}
      }
    }
    __lcIdbLastKeys = new Set(current.keys());
  } catch (e) {
    console.warn('[lc] idb persist batch failed', e?.message || e);
  }
}

// After loading state from localStorage, re-hydrate large imageUrls from IDB.
// Runs async; triggers a store notification so subscribers (React) re-render
// once images are back in memory.
async function lcHydrateImagesFromIdb() {
  try {
    const needing = [];
    for (const a of __lcState.assetsPool) {
      if (a && a._idb && !a.imageUrl) needing.push(a.id);
    }
    const archived = (__lcState.projects && typeof __lcState.projects === 'object') ? __lcState.projects : {};
    for (const p of Object.values(archived)) {
      if (p && Array.isArray(p.assetsPool)) {
        for (const a of p.assetsPool) {
          if (a && a._idb && !a.imageUrl) needing.push(a.id);
        }
      }
    }
    if (needing.length === 0) return;
    const hydrated = await Promise.all(needing.map(async id => {
      try {
        const url = await lcIdbGet(id);
        return url ? { id, imageUrl: url } : null;
      } catch { return null; }
    }));
    const byId = new Map(hydrated.filter(Boolean).map(h => [h.id, h.imageUrl]));
    if (byId.size === 0) return;
    lcSetState(s => {
      const nextProjects = {};
      const src = (s.projects && typeof s.projects === 'object') ? s.projects : {};
      for (const [pid, p] of Object.entries(src)) {
        if (!p) { nextProjects[pid] = p; continue; }
        nextProjects[pid] = {
          ...p,
          assetsPool: Array.isArray(p.assetsPool) ? p.assetsPool.map(a =>
            byId.has(a.id) ? { ...a, imageUrl: byId.get(a.id), _idb: false } : a
          ) : [],
        };
      }
      return {
        ...s,
        assetsPool: s.assetsPool.map(a => byId.has(a.id) ? { ...a, imageUrl: byId.get(a.id), _idb: false } : a),
        projects: nextProjects,
      };
    });
    console.log(`[lc] hydrated ${byId.size} images from IndexedDB`);
  } catch (e) {
    console.warn('[lc] image hydration failed', e?.message || e);
  }
}

let __lcState = lcLoadStore();
const __lcSubs = new Set();

// Kick off async image hydration from IndexedDB. Non-blocking; UI shows
// placeholders until images land, then re-renders.
if (typeof window !== 'undefined') {
  setTimeout(() => { lcHydrateImagesFromIdb(); }, 0);
}

function lcGetState() {
  return __lcState;
}

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

// React hook using useSyncExternalStore (requires React 18+)
function useLCStore(selector) {
  return React.useSyncExternalStore(lcSubscribe, () => selector(__lcState));
}

// Helper: get hero image URL for a stop
function getStopImageUrl(stopId) {
  const stop = __lcState.stops.find(s => s.n === stopId);
  if (!stop) return null;
  if (stop.heroAssetId) {
    const asset = __lcState.assetsPool.find(a => a.id === stop.heroAssetId);
    return asset?.imageUrl || null;
  }
  return STOP_IMAGES[stopId] || null;
}

// Store actions
const storeActions = {
  setMode(mode) {
    lcSetState(s => ({
      ...s,
      ui: { ...s.ui, mode },
    }));
  },
  setActiveStop(id) {
    lcSetState(s => ({
      ...s,
      ui: { ...s.ui, activeStopId: id },
    }));
  },
  openDrawer(tab) {
    lcSetState(s => ({
      ...s,
      ui: { ...s.ui, drawerOpen: true, drawerTab: tab },
    }));
  },
  closeDrawer() {
    lcSetState(s => ({
      ...s,
      ui: { ...s.ui, drawerOpen: false, drawerTab: null },
    }));
  },
  openPublish() {
    lcSetState(s => ({
      ...s,
      ui: { ...s.ui, publishOpen: true },
    }));
  },
  closePublish() {
    lcSetState(s => ({
      ...s,
      ui: { ...s.ui, publishOpen: false },
    }));
  },
  setStopBody(stopId, body) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId ? { ...st, body } : st),
    }));
  },
  setPostcardMessage(stopId, text) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId
        ? { ...st, postcard: { ...st.postcard, message: text } }
        : st),
    }));
  },
  setPostcardArt(stopId, assetId) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId
        ? { ...st, postcard: { ...(st.postcard || {}), artAssetId: assetId } }
        : st),
    }));
  },
  setRecipient(stopId, recipient) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId
        ? { ...st, postcard: { ...st.postcard, recipient: { ...st.postcard.recipient, ...recipient } } }
        : st),
    }));
  },
  setStopStatus(stopId, patch) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId
        ? { ...st, status: { ...st.status, ...patch } }
        : st),
    }));
  },
  setVisibility(vis) {
    lcSetState(s => ({
      ...s,
      project: { ...s.project, visibility: vis },
    }));
  },
  setDefaultMode(mode) {
    lcSetState(s => ({
      ...s,
      project: { ...s.project, defaultMode: mode },
    }));
  },
  setSlug(slug) {
    lcSetState(s => ({
      ...s,
      project: { ...s.project, slug },
    }));
  },
  setTitle(title) {
    lcSetState(s => ({
      ...s,
      project: { ...s.project, title },
    }));
  },
  setHeroAssetId(stopId, assetId) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId ? { ...st, heroAssetId: assetId } : st),
    }));
  },
  // Focal point for hero image cropping. { x, y } in 0–100 percent.
  setHeroFocus(stopId, focus) {
    const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
    const f = { x: clamp(focus?.x ?? 50), y: clamp(focus?.y ?? 50) };
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId ? { ...st, heroFocus: f } : st),
    }));
  },
  addAssetToStop(stopId, assetId) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId
        ? { ...st, assetIds: [...new Set([...st.assetIds, assetId])] }
        : st),
    }));
  },
  removeAssetFromStop(stopId, assetId) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId
        ? { ...st, assetIds: st.assetIds.filter(id => id !== assetId) }
        : st),
    }));
  },
  setAssetImageUrl(assetId, url) {
    lcSetState(s => ({
      ...s,
      assetsPool: s.assetsPool.map(asset => asset.id === assetId
        ? { ...asset, imageUrl: url }
        : asset),
    }));
  },
  setGeneratedImage(stopId, { url, prompt, revisedPrompt }) {
    const newId = `gen-${stopId}-${Date.now()}`;
    lcSetState(s => {
      const newAsset = {
        id: newId,
        stop: stopId,
        tone: 'generated',
        imageUrl: url,
        generatedAt: Date.now(),
        prompt,
        revisedPrompt,
      };
      return {
        ...s,
        assetsPool: [...s.assetsPool, newAsset],
        stops: s.stops.map(st => st.n === stopId
          ? { ...st, heroAssetId: newId, status: { ...st.status, hero: true } }
          : st),
      };
    });
  },
  addGeneratedVariant(stopId, { url, prompt, revisedPrompt, quality, styleLabel, styleId, sourceIdentity }) {
    const newId = `gen-${stopId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    lcSetState(s => {
      const newAsset = {
        id: newId, stop: stopId, tone: 'generated', imageUrl: url,
        generatedAt: Date.now(), prompt, revisedPrompt, quality: quality || 'high',
        styleLabel: styleLabel || null, styleId: styleId || null,
        sourceIdentity: sourceIdentity || null,
      };
      return {
        ...s,
        assetsPool: [...s.assetsPool, newAsset],
        stops: s.stops.map(st => st.n === stopId
          ? { ...st, assetIds: [...new Set([...st.assetIds, newId])], status: { ...st.status, upload: true } }
          : st),
      };
    });
    // Persist to the IDB variant cache so future demo loads / page refreshes
    // can restore this variant without re-paying. Only save when we have a
    // stable source identity (e.g. filename) — ad-hoc heroes without one
    // just stay in-store. Fire and forget.
    if (sourceIdentity && styleId) {
      const cacheKey = lcVariantCacheKey(sourceIdentity, styleId);
      lcVariantCacheSave(cacheKey, {
        url, prompt, revisedPrompt, quality: quality || 'low',
        styleLabel: styleLabel || null, styleId,
        sourceIdentity,
      }).catch(() => {});
    }
    return newId;
  },
  // Restore cached variants into the active project's assetsPool. Call this
  // after a demo load: for each stop with a hero that has `sourceName`, look
  // up every style's cache entry and inject matching variants as assets. The
  // UI's VariantsRow picks them up automatically (filters by stop + tone).
  async restoreCachedVariantsForCurrent() {
    const s = __lcState;
    const styles = (typeof window !== 'undefined' && window.POSTCARD_STYLES) || [];
    if (!styles.length) return 0;
    // Build lookup of each stop's hero source identity. We accept either
    // asset.sourceName (explicit) or derive from imageUrl for seed-image
    // paths (last path segment of the URL).
    const deriveIdentity = (asset) => {
      if (!asset) return null;
      if (asset.sourceName) return asset.sourceName;
      const url = asset.imageUrl;
      if (typeof url !== 'string') return null;
      if (url.startsWith('data:')) return null;  // no stable key
      const m = url.match(/\/([^\/?#]+)(?:\?|#|$)/);
      return m ? m[1] : null;
    };
    const jobs = [];
    for (const stop of s.stops) {
      if (!stop.heroAssetId) continue;
      const asset = s.assetsPool.find(a => a.id === stop.heroAssetId);
      const sourceIdentity = deriveIdentity(asset);
      if (!sourceIdentity) continue;
      // Skip stops that already have generated variants — don't double-add.
      const existingGen = s.assetsPool.filter(a => a.stop === stop.n && a.tone === 'generated');
      const existingKeys = new Set(existingGen.map(a =>
        (a.styleId ? a.styleId : null) || (a.styleLabel ? 'lbl:' + a.styleLabel : null)
      ).filter(Boolean));
      for (const style of styles) {
        const key = lcVariantCacheKey(sourceIdentity, style.id);
        // Skip if variant for this style already exists in the pool.
        if (existingKeys.has(style.id) || existingKeys.has('lbl:' + style.label)) continue;
        jobs.push({ stopId: stop.n, sourceIdentity, styleId: style.id, styleLabel: style.label, cacheKey: key, prompt: style.prompt });
      }
    }
    if (!jobs.length) return 0;
    // Lookup + inject.
    let restored = 0;
    const additions = [];
    for (const j of jobs) {
      const hit = await lcVariantCacheGet(j.cacheKey);
      if (!hit || !hit.url) continue;
      const newId = `gen-${j.stopId}-cache-${Date.now()}-${additions.length}-${Math.floor(Math.random() * 1000)}`;
      additions.push({
        stopId: j.stopId,
        asset: {
          id: newId,
          stop: j.stopId,
          tone: 'generated',
          imageUrl: hit.url,
          generatedAt: hit.ts || Date.now(),
          prompt: hit.prompt || j.prompt,
          revisedPrompt: hit.revisedPrompt || null,
          quality: hit.quality || 'low',
          styleLabel: hit.styleLabel || j.styleLabel,
          styleId: hit.styleId || j.styleId,
          sourceIdentity: j.sourceIdentity,
        },
      });
      restored++;
    }
    if (additions.length) {
      lcSetState(st => ({
        ...st,
        assetsPool: [...st.assetsPool, ...additions.map(a => a.asset)],
        stops: st.stops.map(s2 => {
          const mine = additions.filter(a => a.stopId === s2.n).map(a => a.asset.id);
          if (!mine.length) return s2;
          return { ...s2, assetIds: [...new Set([...(s2.assetIds || []), ...mine])] };
        }),
      }));
    }
    return restored;
  },
  clearUnusedVariants(stopId) {
    lcSetState(s => {
      const stop = s.stops.find(st => st.n === stopId);
      const keepId = stop?.heroAssetId;
      const toRemove = new Set(s.assetsPool
        .filter(a => a.stop === stopId && a.tone === 'generated' && a.id !== keepId)
        .map(a => a.id));
      return {
        ...s,
        assetsPool: s.assetsPool.filter(a => !toRemove.has(a.id)),
        stops: s.stops.map(st => st.n === stopId
          ? { ...st, assetIds: st.assetIds.filter(id => !toRemove.has(id)) }
          : st),
      };
    });
  },
  deleteAsset(assetId) {
    lcSetState(s => ({
      ...s,
      assetsPool: s.assetsPool.filter(a => a.id !== assetId),
      stops: s.stops.map(st => ({
        ...st,
        heroAssetId: st.heroAssetId === assetId ? null : st.heroAssetId,
        status: st.heroAssetId === assetId ? { ...st.status, hero: false } : st.status,
        assetIds: st.assetIds.filter(id => id !== assetId),
      })),
    }));
  },
  // ---- Tour ----
  startTour() {
    lcSetState(s => ({ ...s, ui: { ...s.ui, tour: { active: true, step: 0 } } }));
    try { sessionStorage.setItem('lc_tour_active', '1'); } catch {}
    try { localStorage.setItem('lc_demo_seen', '1'); } catch {}
  },
  setTourStep(step) {
    lcSetState(s => ({ ...s, ui: { ...s.ui, tour: { ...s.ui.tour, step } } }));
    try { sessionStorage.setItem('lc_tour_step', String(step)); } catch {}
  },
  endTour() {
    lcSetState(s => ({ ...s, ui: { ...s.ui, tour: { active: false, step: 0 } } }));
    try { sessionStorage.removeItem('lc_tour_active'); sessionStorage.removeItem('lc_tour_step'); } catch {}
    try { localStorage.setItem('lc_demo_seen', '1'); } catch {}
  },
  setOpenaiSessionKey(key) {
    lcSetState(s => ({
      ...s,
      openai: { ...s.openai, sessionKey: key },
    }));
  },
  // ---- Body nodes CRUD ----
  insertBodyNode(stopId, node, index) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => {
        if (st.n !== stopId) return st;
        const body = st.body || [];
        const idx = (index == null || index > body.length) ? body.length : Math.max(0, index);
        const nextBody = [...body.slice(0, idx), node, ...body.slice(idx)];
        return { ...st, body: nextBody, status: { ...st.status, body: nextBody.length > 0 } };
      }),
    }));
  },
  updateBodyNode(stopId, index, patch) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => {
        if (st.n !== stopId) return st;
        const body = (st.body || []).map((n, i) => i === index ? { ...n, ...patch } : n);
        return { ...st, body };
      }),
    }));
  },
  deleteBodyNode(stopId, index) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => {
        if (st.n !== stopId) return st;
        const body = (st.body || []).filter((_, i) => i !== index);
        return { ...st, body, status: { ...st.status, body: body.length > 0 } };
      }),
    }));
  },
  moveBodyNode(stopId, from, to) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => {
        if (st.n !== stopId) return st;
        const body = [...(st.body || [])];
        if (from < 0 || from >= body.length || to < 0 || to >= body.length) return st;
        const [node] = body.splice(from, 1);
        body.splice(to, 0, node);
        return { ...st, body };
      }),
    }));
  },
  // ---- Stop CRUD ----
  setStopTitle(stopId, title) {
    lcSetState(s => ({
      ...s,
      stops: s.stops.map(st => st.n === stopId ? { ...st, title } : st),
    }));
  },
  // Fully resets to a clean slate: 1 blank stop, 0 assets, 0 tasks, new title.
  createBlankProject({ title = 'Untitled', defaultMode = 'fashion', area = 'LONDON' } = {}) {
    const slug = (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || 'untitled';
    const blankStop = {
      n: '01', code: area.toUpperCase(), title: 'New stop',
      time: '12:00', mood: 'Neutral', tone: 'warm',
      lat: 51.5074, lng: -0.1276,
      label: (area || 'LONDON').toUpperCase() + ' · STOP 01',
      status: { upload: false, hero: false, body: false, media: null },
      body: [],
      postcard: { message: '', recipient: { name: '', line1: '', line2: '', country: '' } },
      heroAssetId: null,
      assetIds: [],
    };
    lcSetState(s => ({
      ...s,
      project: {
        title, author: 'You', subtitle: '',
        coverLabel: (area || 'LONDON').toUpperCase(),
        tags: [area || 'LONDON'],
        published: null, reads: 0, saves: 0,
        duration: '', slug, visibility: 'draft', defaultMode,
      },
      stops: [blankStop],
      assetsPool: [],
      mediaTasks: [],
      ui: {
        ...s.ui,
        mode: defaultMode, activeStopId: '01',
        drawerOpen: true, drawerTab: 'assets', publishOpen: false,
      },
    }));
    // Wipe IDB images from the previous project, but preserve anything
    // referenced by archived projects (multi-project support).
    lcIdbGetAllKeys().then(keys => {
      const keep = new Set();
      const archived = __lcState.projects || {};
      for (const p of Object.values(archived)) {
        if (p && Array.isArray(p.assetsPool)) {
          for (const a of p.assetsPool) keep.add(a.id);
        }
      }
      return Promise.all(keys.filter(k => !keep.has(k)).map(k => lcIdbDelete(k)));
    }).catch(() => {});
  },
  addStop(partial = {}) {
    const newN = (() => {
      const existing = new Set(__lcState.stops.map(s => parseInt(s.n, 10)).filter(n => !isNaN(n)));
      let i = 1;
      while (existing.has(i)) i++;
      return String(i).padStart(2, '0');
    })();
    const defaults = {
      n: newN,
      code: 'SE1 0XX',
      title: 'New stop',
      time: '12:00',
      mood: 'Neutral',
      tone: 'warm',
      lat: 51.5050,
      lng: -0.0950,
      label: 'NEW STOP',
      status: { upload: false, hero: false, body: false, media: null },
      body: [],
      postcard: { message: '', recipient: { name: '', line1: '', line2: '', country: '' } },
      heroAssetId: null,
      assetIds: [],
    };
    const stop = { ...defaults, ...partial, n: partial.n || newN };
    lcSetState(s => ({
      ...s,
      stops: [...s.stops, stop],
      ui: { ...s.ui, activeStopId: stop.n },
    }));
    return stop.n;
  },
  removeStop(stopId) {
    lcSetState(s => {
      const idx = s.stops.findIndex(st => st.n === stopId);
      if (idx < 0 || s.stops.length <= 1) return s;
      const nextStops = s.stops.filter(st => st.n !== stopId);
      const nextActive = s.ui.activeStopId === stopId
        ? nextStops[Math.max(0, idx - 1)]?.n || nextStops[0]?.n
        : s.ui.activeStopId;
      return {
        ...s,
        stops: nextStops,
        // Detach assets that referenced this stop
        assetsPool: s.assetsPool.map(a => a.stop === stopId ? { ...a, stop: null } : a),
        ui: { ...s.ui, activeStopId: nextActive },
      };
    });
  },
  moveStop(stopId, direction) {
    lcSetState(s => {
      const idx = s.stops.findIndex(st => st.n === stopId);
      if (idx < 0) return s;
      const to = direction === 'up' ? idx - 1 : idx + 1;
      if (to < 0 || to >= s.stops.length) return s;
      const stops = [...s.stops];
      [stops[idx], stops[to]] = [stops[to], stops[idx]];
      return { ...s, stops };
    });
  },
  // ---- Media task actions ----
  retryTask(taskId) {
    lcSetState(s => ({
      ...s,
      mediaTasks: s.mediaTasks.map(t => t.id === taskId
        ? { ...t, state: 'running', progress: 0.05 }
        : t),
    }));
  },
  advanceRunningTasks() {
    const hasRunning = __lcState.mediaTasks.some(t => t.state === 'running');
    if (!hasRunning) return;
    lcSetState(s => ({
      ...s,
      mediaTasks: s.mediaTasks.map(t => {
        if (t.state !== 'running') return t;
        const next = t.progress + 0.02 + Math.random() * 0.025;
        if (next >= 1) {
          return { ...t, state: 'done', progress: 1 };
        }
        return { ...t, progress: next };
      }),
    }));
  },
  // ---- Asset pool ----
  addUploadedAsset({ stop = null, tone = 'warm', imageUrl }) {
    const newId = `up-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    lcSetState(s => ({
      ...s,
      assetsPool: [...s.assetsPool, { id: newId, stop, tone, imageUrl }],
    }));
    return newId;
  },
  getStopImageUrl,
  // ---- Publish ----
  publishProject() {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    lcSetState(s => ({
      ...s,
      project: { ...s.project, visibility: 'public', published: today },
    }));
  },
  // ---- Archive: multi-project support ----
  // Snapshot the currently-active project+stops+assetsPool+mediaTasks into
  // state.projects[id] so the user can switch between multiple projects
  // without losing data. Returns the archive id (or null if nothing to
  // archive — e.g. an untouched empty-ish initial state).
  //
  // Asset-id collision strategy: on archive, we PREFIX each asset id with the
  // archive id (e.g. `ARCH:oldid`). We also remap all references (heroAssetId,
  // assetIds, body.assetId, postcard.artAssetId). That way IndexedDB keys
  // never collide across archived projects — even if both used `vp-0`, the
  // archived copy is stored under `ARCH:vp-0`.
  archiveCurrentProject() {
    const st = __lcState;
    const proj = st.project || {};
    // Skip if there's nothing interesting — no assets AND only the default
    // single "05" stop with untouched body. (Heuristic.) Caller can still
    // call loadProjectFromArchive for a known id.
    if ((!st.assetsPool || st.assetsPool.length === 0) && (!st.stops || st.stops.length === 0)) {
      return null;
    }
    const baseId = (proj.slug && String(proj.slug)) || ('proj-' + Date.now().toString(36));
    // Ensure unique across existing archive.
    let archiveId = baseId;
    let n = 2;
    const existing = st.projects || {};
    while (existing[archiveId]) {
      archiveId = baseId + '-' + n;
      n++;
    }
    // Build prefixed asset ids and remap references.
    const idMap = new Map();
    for (const a of st.assetsPool || []) {
      idMap.set(a.id, archiveId + ':' + a.id);
    }
    const archivedAssets = (st.assetsPool || []).map(a => ({
      ...a,
      id: idMap.get(a.id) || a.id,
    }));
    const archivedStops = (st.stops || []).map(stop => {
      const nextStop = { ...stop };
      if (stop.heroAssetId && idMap.has(stop.heroAssetId)) {
        nextStop.heroAssetId = idMap.get(stop.heroAssetId);
      }
      if (Array.isArray(stop.assetIds)) {
        nextStop.assetIds = stop.assetIds.map(id => idMap.get(id) || id);
      }
      if (Array.isArray(stop.body)) {
        nextStop.body = stop.body.map(node => {
          if (node && node.assetId && idMap.has(node.assetId)) {
            return { ...node, assetId: idMap.get(node.assetId) };
          }
          return node;
        });
      }
      if (stop.postcard && stop.postcard.artAssetId && idMap.has(stop.postcard.artAssetId)) {
        nextStop.postcard = { ...stop.postcard, artAssetId: idMap.get(stop.postcard.artAssetId) };
      }
      return nextStop;
    });
    const entry = {
      id: archiveId,
      project: { ...proj },
      stops: archivedStops,
      assetsPool: archivedAssets,
      mediaTasks: (st.mediaTasks || []).map(t => ({ ...t })),
      createdAt: Date.now(),
    };
    lcSetState(s => ({
      ...s,
      projects: { ...(s.projects || {}), [archiveId]: entry },
    }));
    return archiveId;
  },
  // Load an archived project back into the top-level slots. Archives the
  // currently-active one first so nothing is lost. Reassigns fresh unique
  // asset ids on load so there can be no collision with the (now archived)
  // active project's ids in IDB.
  loadProjectFromArchive(id) {
    const st = __lcState;
    const archived = st.projects && st.projects[id];
    if (!archived) {
      console.warn('[lc] loadProjectFromArchive: no such archive', id);
      return false;
    }
    // First: archive current (non-destructive) so it survives the swap.
    storeActions.archiveCurrentProject();
    // Re-read state (archive may have mutated it).
    const s2 = __lcState;
    const toLoad = s2.projects && s2.projects[id];
    if (!toLoad) return false;
    // Reassign fresh unique asset ids so they don't collide with any other
    // archive / any future demo load.
    const idMap = new Map();
    const freshAssets = (toLoad.assetsPool || []).map((a, i) => {
      const fresh = `a-${Date.now().toString(36)}-${i}-${Math.floor(Math.random() * 10000)}`;
      idMap.set(a.id, fresh);
      return { ...a, id: fresh };
    });
    const freshStops = (toLoad.stops || []).map(stop => {
      const next = { ...stop };
      if (stop.heroAssetId && idMap.has(stop.heroAssetId)) {
        next.heroAssetId = idMap.get(stop.heroAssetId);
      }
      if (Array.isArray(stop.assetIds)) {
        next.assetIds = stop.assetIds.map(xid => idMap.get(xid) || xid).filter(Boolean);
      }
      if (Array.isArray(stop.body)) {
        next.body = stop.body.map(node => {
          if (node && node.assetId && idMap.has(node.assetId)) {
            return { ...node, assetId: idMap.get(node.assetId) };
          }
          return node;
        });
      }
      if (stop.postcard && stop.postcard.artAssetId && idMap.has(stop.postcard.artAssetId)) {
        next.postcard = { ...stop.postcard, artAssetId: idMap.get(stop.postcard.artAssetId) };
      }
      return next;
    });
    // Copy IDB data for the prefixed archived ids → the fresh ids. Fire and
    // forget; the hydrator will fill in once writes land.
    (async () => {
      try {
        for (const [oldId, newId] of idMap) {
          const url = await lcIdbGet(oldId);
          if (url) {
            try { await lcIdbPut(newId, url); } catch {}
          }
        }
        // Trigger a re-hydration pass so freshly-written urls land in memory.
        lcHydrateImagesFromIdb();
      } catch (e) {
        console.warn('[lc] load-from-archive idb remap failed', e?.message || e);
      }
    })();
    // Now remove the chosen archive entry (it's "live" again) and write
    // top-level fields.
    lcSetState(s => {
      const nextArchive = { ...(s.projects || {}) };
      delete nextArchive[id];
      const firstStopN = (freshStops[0] && freshStops[0].n) || '01';
      return {
        ...s,
        project: { ...(toLoad.project || {}) },
        stops: freshStops,
        assetsPool: freshAssets,
        mediaTasks: (toLoad.mediaTasks || []).map(t => ({ ...t })),
        projects: nextArchive,
        ui: {
          ...s.ui,
          mode: (toLoad.project && toLoad.project.defaultMode) || s.ui.mode,
          activeStopId: firstStopN,
          drawerOpen: true,
          drawerTab: 'assets',
          publishOpen: false,
        },
      };
    });
    return true;
  },
  deleteArchivedProject(id) {
    lcSetState(s => {
      const next = { ...(s.projects || {}) };
      if (!next[id]) return s;
      // Also clean up its IDB entries (prefixed keys).
      const entry = next[id];
      if (entry && Array.isArray(entry.assetsPool)) {
        (async () => {
          for (const a of entry.assetsPool) {
            try { await lcIdbDelete(a.id); } catch {}
          }
        })();
      }
      delete next[id];
      return { ...s, projects: next };
    });
  },
  listArchivedProjects() {
    const archived = (__lcState.projects && typeof __lcState.projects === 'object') ? __lcState.projects : {};
    return Object.values(archived).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
};

// Start a global interval to advance running tasks across the app
if (typeof window !== 'undefined' && !window.__lcTaskTickerStarted) {
  window.__lcTaskTickerStarted = true;
  setInterval(() => { storeActions.advanceRunningTasks(); }, 450);
}

Object.assign(window, {
  LCStore: { getState: lcGetState, setState: lcSetState, subscribe: lcSubscribe, reset: lcResetStore },
  useLCStore,
  storeActions,
  getStopImageUrl,
  DEFAULT_MESSAGE,
  DEFAULT_RECIPIENT,
  STOP_IMAGES,
  // Variant cache helpers — consumed by prestyle, hackathon-demo, seed-demo
  // and postcard-editor so every path uses the same cache key format.
  lcVariantCacheKey, lcVariantCacheSave, lcVariantCacheGet,
  lcVariantCacheList, lcVariantCacheClear, lcVariantCacheGetMany,
});
