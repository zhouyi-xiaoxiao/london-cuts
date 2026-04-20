// vision-pipeline.jsx — "New project from photos" pipeline.
//
// User picks multiple local photos → we read EXIF, auto-rotate/resize each to a
// JPEG data URL, send to gpt-4o vision for title/paragraph/pullQuote/postcard,
// then build a full project (stops + assets) and hydrate window.LCStore.
//
// Exports on window:
//   - window.analyzePhotosAndCreateProject(files)
//   - window.VisionProgressModal
//   - window.openVisionPipeline()

// ---------- small helpers ----------

function vpGetOpenAIKey() {
  try {
    return sessionStorage.getItem('lc_openai_key') || window.__LC_OPENAI_KEY_DEFAULT;
  } catch {
    return window.__LC_OPENAI_KEY_DEFAULT;
  }
}

function vpPad2(n) { return String(n).padStart(2, '0'); }

function vpFormatHHMM(dt) {
  if (!dt) return '';
  const d = (dt instanceof Date) ? dt : new Date(dt);
  if (isNaN(d.getTime())) return '';
  return vpPad2(d.getHours()) + ':' + vpPad2(d.getMinutes());
}

function vpFormatDate(dt) {
  if (!dt) return '';
  const d = (dt instanceof Date) ? dt : new Date(dt);
  if (isNaN(d.getTime())) return '';
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return vpPad2(d.getDate()) + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// Very simple GPS → London-ish borough code. If it's outside a rough London
// bounding box, we just return null so the caller falls back to 'LONDON'.
function vpGuessCodeFromGPS(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  // London bounding box (rough).
  if (lat < 51.28 || lat > 51.70 || lng < -0.52 || lng > 0.35) return null;
  // Very rough quadrants.
  const north = lat >= 51.52;
  const east  = lng >= -0.10;
  if (north && east)  return 'E1';
  if (north && !east) return 'N1';
  if (!north && east) return 'SE1';
  return 'SW8';
}

// Resize + auto-rotate. Returns { dataUrl, width, height } or throws.
async function vpLoadToJpegDataUrl(file, orientation, maxEdge = 1600) {
  // Try createImageBitmap first (handles HEIC on Safari/macOS).
  let bitmap = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch (e) {
    // Fallback to HTMLImageElement via object URL (HEIC will fail on Chrome).
    const url = URL.createObjectURL(file);
    try {
      bitmap = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('image decode failed (HEIC requires Safari or pre-converted JPEG)'));
        img.src = url;
      });
    } finally {
      // Revoke after draw; for safety we revoke now — the Image element still holds the bitmap.
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 2000);
    }
  }

  const srcW = bitmap.width  || bitmap.naturalWidth;
  const srcH = bitmap.height || bitmap.naturalHeight;
  if (!srcW || !srcH) throw new Error('zero-size image');

  const swap = orientation === 6 || orientation === 8;
  const logicalW = swap ? srcH : srcW;
  const logicalH = swap ? srcW : srcH;

  // Scale to max edge on the logical (post-rotation) orientation.
  const scale = Math.min(1, maxEdge / Math.max(logicalW, logicalH));
  const outW = Math.max(1, Math.round(logicalW * scale));
  const outH = Math.max(1, Math.round(logicalH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2D context unavailable');

  // Apply rotation by mapping logical output → source draw.
  ctx.save();
  if (orientation === 3) {
    ctx.translate(outW, outH);
    ctx.rotate(Math.PI);
  } else if (orientation === 6) {
    ctx.translate(outW, 0);
    ctx.rotate(Math.PI / 2);
  } else if (orientation === 8) {
    ctx.translate(0, outH);
    ctx.rotate(-Math.PI / 2);
  }
  // After rotation, we draw the bitmap sized to srcW/srcH (scaled into the
  // rotated logical box). Because post-transform the "drawing space" for
  // orientations 6/8 is (outH × outW), we draw into that space.
  const drawW = swap ? outH : outW;
  const drawH = swap ? outW : outH;
  ctx.drawImage(bitmap, 0, 0, drawW, drawH);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  return { dataUrl, width: outW, height: outH };
}

async function vpReadExif(file) {
  if (!window.exifr || typeof window.exifr.parse !== 'function') {
    return { lat: null, lng: null, dateOriginal: null, orientation: 1 };
  }
  let meta = null;
  try {
    meta = await window.exifr.parse(file, { gps: true, exif: true, ifd0: true, orientation: true });
  } catch (e) {
    meta = null;
  }
  const lat = meta && typeof meta.latitude === 'number' ? meta.latitude
            : (meta && typeof meta.GPSLatitude === 'number' ? meta.GPSLatitude : null);
  const lng = meta && typeof meta.longitude === 'number' ? meta.longitude
            : (meta && typeof meta.GPSLongitude === 'number' ? meta.GPSLongitude : null);
  const dateOriginal = (meta && (meta.DateTimeOriginal || meta.CreateDate || meta.DateTime)) || null;
  let orientation = (meta && meta.Orientation) || 1;
  if (typeof orientation !== 'number') orientation = 1;
  return { lat, lng, dateOriginal, orientation };
}

// ---------- Persistent description cache ----------
// Saves gpt-4o vision results per-photo to localStorage so re-loading a demo
// or reopening the app doesn't re-spend $0.02 per shot. Keyed by a stable
// identity string (filename + size for uploaded files, raw URL for URL-based
// fetches). Cached entries are shaped identically to vpVisionDescribe's return.
const LC_VISION_CACHE_KEY = 'lc_vision_cache_v1';

function vpReadCache() {
  try {
    const raw = localStorage.getItem(LC_VISION_CACHE_KEY);
    return raw ? (JSON.parse(raw) || {}) : {};
  } catch { return {}; }
}
function vpWriteCache(map) {
  try { localStorage.setItem(LC_VISION_CACHE_KEY, JSON.stringify(map)); }
  catch (e) { console.warn('[vision-pipeline] cache write failed', e?.message || e); }
}
function vpGetCached(key) {
  if (!key) return null;
  const m = vpReadCache();
  return m[key] || null;
}
function vpSetCached(key, value) {
  if (!key || !value) return;
  const m = vpReadCache();
  m[key] = { ...value, ts: Date.now() };
  vpWriteCache(m);
}

// Stable cache key: for File objects, use name+size (two files of same name
// but different content still differ); for URL strings, use the URL as-is.
function vpCacheKeyForFile(file) {
  if (!file) return null;
  if (typeof file === 'string') return 'url:' + file;
  return 'file:' + (file.name || 'unknown') + ':' + (file.size || 0);
}
function vpCacheKeyForUrl(url) { return url ? ('url:' + url) : null; }

// Public: expose clear + inspect on window so you can wipe from devtools.
function vpClearVisionCache() { try { localStorage.removeItem(LC_VISION_CACHE_KEY); } catch {} }
function vpVisionCacheSize() { const m = vpReadCache(); return Object.keys(m).length; }

// ---------- OpenAI vision call ----------

async function vpVisionDescribe(dataUrl) {
  const key = vpGetOpenAIKey();
  if (!key) throw new Error('NO_KEY');

  const body = {
    model: 'gpt-4o',
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You analyze personal travel/memory photographs. Respond in JSON only with fields: title (5-8 words), paragraph (40-70 words describing what is actually visible), pullQuote (under 15 words, evocative), postcardMessage (1-2 short sentences, first-person, like a note to a friend), mood (single evocative word like "Amber", "Steel", "Ember"), tone ("warm"|"cool"|"punk"), locationHint (neighborhood/landmark if recognizable from the image).',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this photo. Return JSON.' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  };

  // Retry with exponential backoff on 429 (rate-limit) and 5xx (server).
  // Three attempts: immediate, 2s, 6s. Gives the rate limiter time to refill
  // without making the user re-trigger the whole pipeline.
  let resp = null;
  let lastErrText = '';
  const delays = [0, 2000, 6000];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));
    resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (resp.ok) break;
    lastErrText = await resp.text().catch(() => '');
    // 4xx other than 429 won't benefit from retry.
    if (resp.status !== 429 && resp.status < 500) break;
  }

  if (!resp.ok) {
    throw new Error('OpenAI ' + resp.status + ': ' + lastErrText.slice(0, 240));
  }

  const payload = await resp.json();
  const content = payload && payload.choices && payload.choices[0]
                && payload.choices[0].message && payload.choices[0].message.content;
  if (!content) throw new Error('empty response');

  let parsed = null;
  try { parsed = JSON.parse(content); } catch { parsed = null; }
  if (!parsed || typeof parsed !== 'object') parsed = {};

  return {
    title:           typeof parsed.title           === 'string' ? parsed.title           : 'Untitled stop',
    paragraph:       typeof parsed.paragraph       === 'string' ? parsed.paragraph       : '(no description generated)',
    pullQuote:       typeof parsed.pullQuote       === 'string' ? parsed.pullQuote       : '',
    postcardMessage: typeof parsed.postcardMessage === 'string' ? parsed.postcardMessage : '',
    mood:            typeof parsed.mood            === 'string' ? parsed.mood            : 'Amber',
    tone:            (parsed.tone === 'warm' || parsed.tone === 'cool' || parsed.tone === 'punk') ? parsed.tone : 'warm',
    locationHint:    typeof parsed.locationHint    === 'string' ? parsed.locationHint    : '',
  };
}

// ---------- concurrency pool ----------

async function vpRunPool(items, workerFn, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = await workerFn(items[i], i);
      } catch (e) {
        results[i] = { __error: e };
      }
    }
  }
  const runners = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) runners.push(runner());
  await Promise.all(runners);
  return results;
}

// ---------- main entry ----------

async function analyzePhotosAndCreateProject(files) {
  if (!files || !files.length) return;

  // Initial state.
  const rows = Array.from(files).map(f => ({
    name: f.name,
    status: 'queued',
    title: '',
    err: '',
  }));
  vpEmitProgress(rows);

  const worker = async (file, idx) => {
    try {
      rows[idx].status = 'reading';
      vpEmitProgress(rows);

      const exif = await vpReadExif(file);

      let dataUrl = null;
      try {
        const out = await vpLoadToJpegDataUrl(file, exif.orientation || 1, 1600);
        dataUrl = out.dataUrl;
      } catch (e) {
        const msg = (e && e.message) || String(e);
        rows[idx].status = 'error';
        rows[idx].err = 'decode failed: ' + msg;
        vpEmitProgress(rows);
        return null;
      }

      // Check the persistent cache before paying for another vision call.
      const cacheKey = vpCacheKeyForFile(file);
      const cached = vpGetCached(cacheKey);
      let described = cached;
      if (described) {
        rows[idx].status = 'cached';
        vpEmitProgress(rows);
      } else {
        rows[idx].status = 'analyzing';
        vpEmitProgress(rows);
        try {
          described = await vpVisionDescribe(dataUrl);
          vpSetCached(cacheKey, described);
        } catch (e) {
          const msg = (e && e.message) || String(e);
          if (msg === 'NO_KEY') throw e; // propagate
          rows[idx].status = 'error';
          rows[idx].err = 'vision: ' + msg;
          vpEmitProgress(rows);
          return null;
        }
      }

      rows[idx].status = 'done';
      rows[idx].title = described.title;
      vpEmitProgress(rows);

      return {
        file,
        exif,
        dataUrl,
        described,
        inputIndex: idx,
      };
    } catch (e) {
      if (e && e.message === 'NO_KEY') throw e;
      rows[idx].status = 'error';
      rows[idx].err = (e && e.message) || String(e);
      vpEmitProgress(rows);
      return null;
    }
  };

  let pool;
  try {
    // Concurrency of 2: low enough to avoid TPM rate-limit bursts, high enough
    // to keep latency reasonable. 28 photos → ~14 parallel rounds × 15-20s each.
    pool = await vpRunPool(Array.from(files), worker, 2);
  } catch (e) {
    if (e && e.message === 'NO_KEY') {
      vpEmitError('Missing OpenAI key. Set sessionStorage["lc_openai_key"] or window.__LC_OPENAI_KEY_DEFAULT.');
      return;
    }
    throw e;
  }

  const successful = pool.filter(r => r && !r.__error);
  if (!successful.length) {
    vpEmitError('No photos could be processed.');
    return;
  }

  // Sort by EXIF DateTimeOriginal ascending (photos without dates go to end).
  successful.sort((a, b) => {
    const ad = a.exif.dateOriginal ? new Date(a.exif.dateOriginal).getTime() : Number.MAX_SAFE_INTEGER;
    const bd = b.exif.dateOriginal ? new Date(b.exif.dateOriginal).getTime() : Number.MAX_SAFE_INTEGER;
    return ad - bd;
  });

  // Build stops + assets.
  const stops = [];
  const assets = [];
  successful.forEach((r, i) => {
    const n = vpPad2(i + 1);
    const assetId = 'vp-' + i;
    const d = r.described;
    const hhmm = vpFormatHHMM(r.exif.dateOriginal);
    const dateStr = vpFormatDate(r.exif.dateOriginal);
    const locLabel = (d.locationHint || 'London').toUpperCase();
    const code = vpGuessCodeFromGPS(r.exif.lat, r.exif.lng) || 'LONDON';

    const stop = {
      n,
      code,
      title: d.title,
      time: hhmm,
      mood: d.mood,
      tone: d.tone || 'warm',
      lat: r.exif.lat,
      lng: r.exif.lng,
      label: locLabel,
      status: { upload: true, hero: true, body: true, media: null },
      body: [
        { type: 'metaRow',    content: [hhmm, dateStr, d.mood, locLabel] },
        { type: 'heroImage',  assetId, caption: d.title },
        { type: 'paragraph',  content: d.paragraph },
        { type: 'pullQuote',  content: d.pullQuote },
      ],
      postcard: {
        message: d.postcardMessage,
        recipient: { name: '', line1: '', line2: '', country: '' },
      },
      heroAssetId: assetId,
      assetIds: [assetId],
      _debugPrompt: d.paragraph,
    };
    stops.push(stop);

    assets.push({
      id: assetId,
      stop: n,
      tone: d.tone || 'warm',
      imageUrl: r.dataUrl,
      aiCaption: d.title,
    });
  });

  // Hydrate store.
  const folderTitle = vpTitleFromFiles(files);
  const slug = 'photos-' + Date.now().toString(36);

  if (!window.LCStore || !window.LCStore.setState) {
    vpEmitError('LCStore not ready.');
    return;
  }

  // Multi-project: archive whatever was loaded before we clobber it.
  try { window.storeActions?.archiveCurrentProject?.(); } catch (e) { console.warn('[vision-pipeline] archive failed', e); }

  window.LCStore.setState(s => ({
    ...s,
    project: {
      ...s.project,
      title: folderTitle,
      author: 'You',
      subtitle: stops.length + ' photos, auto-described.',
      slug,
      defaultMode: 'fashion',
      visibility: 'draft',
      published: null,
      coverLabel: (stops[0] && stops[0].label) || 'LONDON',
    },
    stops,
    assetsPool: assets,
    mediaTasks: [],
    ui: {
      ...s.ui,
      mode: 'fashion',
      activeStopId: stops[0].n,
      drawerOpen: true,
      drawerTab: 'assets',
      publishOpen: false,
    },
  }));

  vpEmitDone(stops.length);
}

function vpTitleFromFiles(files) {
  if (!files || !files.length) return 'Your photos';
  // Try webkitRelativePath (folder pickers) or just fall back.
  const first = files[0];
  const rel = (first && first.webkitRelativePath) || '';
  if (rel && rel.indexOf('/') >= 0) {
    const folder = rel.split('/')[0];
    if (folder) return folder;
  }
  return 'Your photos';
}

// ---------- progress / modal plumbing ----------

// We keep a single module-level listener set by the modal so that worker calls
// can emit updates without prop-drilling.
let vpProgressListener = null;
let vpErrorListener = null;
let vpDoneListener = null;

function vpEmitProgress(rows) {
  if (vpProgressListener) vpProgressListener(rows.map(r => ({ ...r })));
}
function vpEmitError(msg) {
  if (vpErrorListener) vpErrorListener(msg);
}
function vpEmitDone(stopCount) {
  if (vpDoneListener) vpDoneListener(stopCount);
}

function VisionProgressModal({ onClose }) {
  const [rows, setRows]     = React.useState([]);
  const [error, setError]   = React.useState('');
  const [done, setDone]     = React.useState(0); // 0 = running, N = count of stops

  React.useEffect(() => {
    vpProgressListener = setRows;
    vpErrorListener    = setError;
    vpDoneListener     = setDone;
    return () => {
      vpProgressListener = null;
      vpErrorListener    = null;
      vpDoneListener     = null;
    };
  }, []);

  const totalDone = rows.filter(r => r.status === 'done').length;
  const totalErr  = rows.filter(r => r.status === 'error').length;
  const allFinished = rows.length > 0 && rows.every(r => r.status === 'done' || r.status === 'error');

  const openWorkspace = () => {
    location.hash = '#workspace';
    onClose && onClose();
  };

  return (
    <>
      <div className="slideover-scrim" style={{ zIndex: 200 }} onClick={allFinished || error ? onClose : undefined} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 640, maxWidth: '92vw', maxHeight: '86vh', overflow: 'auto',
        background: 'var(--paper, white)', color: 'var(--ink, #1a1a1a)',
        border: '1px solid var(--ink, #1a1a1a)',
        zIndex: 201,
        padding: 28,
      }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>New project from photos</div>
        <div style={{ fontFamily: 'var(--f-fashion, serif)', fontStyle: 'italic', fontSize: 28, lineHeight: 1.1 }}>
          Analyzing {rows.length} {rows.length === 1 ? 'photo' : 'photos'}…
        </div>
        <div className="mono-sm" style={{ opacity: 0.65, marginTop: 8 }}>
          {totalDone} done · {totalErr} error · {rows.length - totalDone - totalErr} pending
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #c00', color: '#c00', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 20, borderTop: '1px solid var(--rule, #ddd)' }}>
          {rows.map((r, i) => (
            <div key={i} className="row between items-center" style={{
              padding: '10px 0', borderBottom: '1px dashed var(--rule, #ddd)', gap: 12,
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.name}
                </div>
                {r.status === 'done' && r.title && (
                  <div className="mono-sm" style={{ opacity: 0.7, marginTop: 2 }}>
                    → {r.title}
                  </div>
                )}
                {r.status === 'error' && (
                  <div className="mono-sm" style={{ color: '#c00', marginTop: 2 }}>
                    {r.err || 'error'}
                  </div>
                )}
              </div>
              <div className="mono-sm" style={{
                opacity: 0.7,
                textTransform: 'uppercase',
                color: r.status === 'error' ? '#c00' : (r.status === 'done' ? '#060' : undefined),
              }}>
                {r.status}
              </div>
            </div>
          ))}
        </div>

        <div className="mono-sm" style={{ marginTop: 14, opacity: 0.55 }}>
          HEIC note: Safari on macOS decodes HEIC via the OS. Chrome does not — export as JPEG first.
        </div>

        <div className="row gap-12" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
          {!allFinished && !error && (
            <button className="btn" onClick={onClose}>Hide</button>
          )}
          {allFinished && !error && done > 0 && (
            <button className="btn btn-solid" onClick={openWorkspace}>
              Open workspace →
            </button>
          )}
          {(allFinished && done === 0) || error ? (
            <button className="btn" onClick={onClose}>Close</button>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ---------- entry: open file picker + mount modal ----------

function vpEnsureRoot() {
  let el = document.getElementById('lc-vision-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'lc-vision-root';
    document.body.appendChild(el);
  }
  return el;
}

let vpActiveRoot = null;

function vpMountModal() {
  const el = vpEnsureRoot();
  if (vpActiveRoot) {
    try { vpActiveRoot.unmount(); } catch {}
    vpActiveRoot = null;
  }
  const root = ReactDOM.createRoot(el);
  vpActiveRoot = root;
  const close = () => {
    try { root.unmount(); } catch {}
    if (vpActiveRoot === root) vpActiveRoot = null;
  };
  root.render(<VisionProgressModal onClose={close} />);
  return close;
}

// Public: mount progress modal + run the pipeline on a pre-fetched File[].
// Used by one-click demo loaders (伦敦记忆 / 黑客松) so the user always sees
// progress immediately, not just after fetch + decode.
async function analyzePhotosWithModal(files) {
  vpMountModal();
  try {
    await analyzePhotosAndCreateProject(files);
  } catch (e) {
    const msg = (e && e.message) || String(e);
    if (msg === 'NO_KEY') {
      vpEmitError('Missing OpenAI key. Set sessionStorage["lc_openai_key"] or window.__LC_OPENAI_KEY_DEFAULT.');
    } else {
      vpEmitError(msg);
    }
  }
}

function openVisionPipeline() {
  // File picker.
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*,.heic,.HEIC';
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);

  input.addEventListener('change', async () => {
    const files = Array.from(input.files || []);
    try { document.body.removeChild(input); } catch {}
    if (!files.length) return;

    vpMountModal();
    try {
      await analyzePhotosAndCreateProject(files);
    } catch (e) {
      const msg = (e && e.message) || String(e);
      if (msg === 'NO_KEY') {
        vpEmitError('Missing OpenAI key. Set sessionStorage["lc_openai_key"] or window.__LC_OPENAI_KEY_DEFAULT.');
      } else {
        vpEmitError(msg);
      }
    }
  }, { once: true });

  input.click();
}

// ---------- Regenerate content from existing photos ----------
//
// Your store already has stops + assets in it, but the titles/body don't match
// the photos anymore (e.g. old seed stops + newly uploaded images). This walks
// each stop that has a hero image, runs gpt-4o vision on that hero, and
// rewrites the stop's title / body / postcard to match what's actually shown.
//
// Progress is reported via an optional callback: onProgress({ stopId, state, title?, err? })
//   state: 'running' | 'done' | 'error'
//
// Returns a summary { updated, skipped, failed }.
async function regenerateContentFromPhotos(onProgress) {
  const state = window.LCStore?.getState?.();
  if (!state) throw new Error('LCStore not ready');

  const assetsById = new Map(state.assetsPool.map(a => [a.id, a]));
  const work = state.stops
    .map(s => ({ stop: s, asset: s.heroAssetId ? assetsById.get(s.heroAssetId) : null }))
    .filter(w => w.asset && typeof w.asset.imageUrl === 'string' && w.asset.imageUrl.length > 0);

  let updated = 0, failed = 0;
  const skipped = state.stops.length - work.length;

  await vpRunPool(work, async ({ stop, asset }) => {
    onProgress && onProgress({ stopId: stop.n, state: 'running' });
    // Build a cache key BEFORE any fetch. Prefer the asset's sourceName
    // (e.g. "IMG_1010.JPG" set by the Hackathon seeder) so re-loading the demo
    // reuses results. Fall back to the raw imageUrl for ad-hoc hero images.
    const origUrl = asset.imageUrl;
    const cacheKey = asset.sourceName
      ? ('file:' + asset.sourceName)
      : vpCacheKeyForUrl(origUrl);
    const cached = vpGetCached(cacheKey);

    let imageUrl = origUrl;
    // If it's not already a data URL, fetch + convert (for http/picsum etc).
    // Skip the fetch entirely when we have a cache hit — we don't even need
    // to re-send the image to gpt-4o.
    if (!cached && !imageUrl.startsWith('data:')) {
      try {
        const resp = await fetch(imageUrl);
        const blob = await resp.blob();
        imageUrl = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(blob);
        });
      } catch (e) {
        failed++;
        onProgress && onProgress({ stopId: stop.n, state: 'error', err: 'fetch failed' });
        return;
      }
    }
    try {
      let info = cached;
      if (!info) {
        info = await vpVisionDescribe(imageUrl);
        vpSetCached(cacheKey, info);
      }
      // Rewrite body: keep any non-text nodes (inlineImage, mediaEmbed) that the
      // user may have manually inserted, but replace metaRow/heroImage/paragraph/pullQuote
      // with fresh content. Simplest: replace the whole body with a 4-node layout.
      const newBody = [
        { type: 'metaRow',   content: [stop.time || '', stop.date || '', info.mood || stop.mood || '', (info.locationHint || stop.label || '').toUpperCase()] },
        { type: 'heroImage', assetId: asset.id, caption: info.title },
        { type: 'paragraph', content: info.paragraph },
      ];
      if (info.pullQuote) newBody.push({ type: 'pullQuote', content: info.pullQuote });

      window.LCStore.setState(s => ({
        ...s,
        stops: s.stops.map(st => st.n === stop.n ? {
          ...st,
          title: info.title || st.title,
          mood: info.mood || st.mood,
          tone: info.tone || st.tone,
          label: (info.locationHint || st.label || '').toUpperCase() || st.label,
          body: newBody,
          status: { ...st.status, body: true, hero: true, upload: true },
          postcard: {
            ...(st.postcard || { recipient: { name: '', line1: '', line2: '', country: '' } }),
            message: info.postcardMessage || (st.postcard && st.postcard.message) || '',
          },
        } : st),
      }));
      updated++;
      onProgress && onProgress({ stopId: stop.n, state: 'done', title: info.title });
    } catch (e) {
      failed++;
      onProgress && onProgress({ stopId: stop.n, state: 'error', err: String((e && e.message) || e).slice(0, 120) });
    }
  }, 4);

  return { updated, failed, skipped };
}

// Minimal progress UI — mount via openRegenerateFromPhotos. Shows one row per
// stop; advances each as vision completes.
function RegenerateProgressModal() {
  const stops = useLCStore(s => s.stops);
  const [rows, setRows] = React.useState(() => stops.map(s => ({ n: s.n, title: s.title, state: 'queued' })));
  const [summary, setSummary] = React.useState(null);
  const [error, setError] = React.useState(null);

  const close = () => {
    const root = document.getElementById('lc-regen-root');
    if (root) { root.remove(); }
  };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await regenerateContentFromPhotos(({ stopId, state, title, err }) => {
          if (cancelled) return;
          setRows(prev => prev.map(r => r.n === stopId ? { ...r, state, title: title || r.title, err } : r));
        });
        if (!cancelled) setSummary(res);
      } catch (e) {
        if (!cancelled) setError(String((e && e.message) || e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={summary ? close : undefined} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 520, maxWidth: '92vw', maxHeight: '86vh', overflow: 'auto',
        background: 'var(--paper, white)', color: 'var(--ink)',
        border: '1px solid var(--ink, #1a1a1a)',
        padding: 24, zIndex: 1001,
      }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Regenerate content</div>
        <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 26, fontStyle: 'italic', lineHeight: 1 }}>
          Re-analyze each hero with AI
        </div>
        <div className="mono-sm" style={{ opacity: 0.6, marginTop: 8, lineHeight: 1.5 }}>
          gpt-4o looks at every stop's hero image and rewrites title, body, mood, and postcard message to match. ~15–25s each, run in parallel (4 at a time).
        </div>

        {error && (
          <div className="mono-sm" style={{ marginTop: 16, color: 'var(--status-failed)' }}>
            {error}
          </div>
        )}

        <div className="col" style={{ marginTop: 16, gap: 4 }}>
          {rows.map(r => (
            <div key={r.n} className="row items-center gap-12" style={{ padding: '6px 0', borderBottom: '1px dashed var(--rule)' }}>
              <span className="mono-sm" style={{ width: 32, opacity: 0.6 }}>{r.n}</span>
              <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.title}
              </span>
              <span className="mono-sm" style={{ width: 80, textAlign: 'right',
                color: r.state === 'done' ? 'var(--status-done, #2a8)' :
                       r.state === 'running' ? 'var(--status-running, #c80)' :
                       r.state === 'error' ? 'var(--status-failed, #c33)' : 'inherit',
                opacity: r.state === 'queued' ? 0.4 : 1 }}>
                {r.state === 'done' ? '✓ done' : r.state === 'running' ? '… running' : r.state === 'error' ? 'error' : 'queued'}
              </span>
            </div>
          ))}
        </div>

        <div className="row gap-12" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
          {summary ? (
            <>
              <div className="mono-sm" style={{ flex: 1, opacity: 0.7 }}>
                {summary.updated} updated · {summary.failed} failed · {summary.skipped} skipped (no hero)
              </div>
              <button className="btn btn-solid" onClick={close}>Close</button>
            </>
          ) : (
            <div className="mono-sm" style={{ opacity: 0.55 }}>Running… don't close the tab.</div>
          )}
        </div>
      </div>
    </>
  );
}

function openRegenerateFromPhotos() {
  if (!document.getElementById('lc-regen-root')) {
    const root = document.createElement('div');
    root.id = 'lc-regen-root';
    document.body.appendChild(root);
    ReactDOM.createRoot(root).render(React.createElement(RegenerateProgressModal));
  }
}

Object.assign(window, {
  analyzePhotosAndCreateProject,
  VisionProgressModal,
  openVisionPipeline,
  analyzePhotosWithModal,
  regenerateContentFromPhotos,
  RegenerateProgressModal,
  openRegenerateFromPhotos,
  // Persistent vision-cache utilities — exposed so other demo loaders can warm
  // stops with cached content instead of placeholder text, and so devtools can
  // inspect / clear the cache.
  vpGetCached, vpSetCached,
  vpCacheKeyForFile, vpCacheKeyForUrl,
  vpClearVisionCache, vpVisionCacheSize,
});
