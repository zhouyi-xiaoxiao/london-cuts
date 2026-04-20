// prestyle.jsx — background pre-generation of all postcard styles for every stop.
//
// After a user loads photos, this can fire off all 8 POSTCARD_STYLES for every
// stop with a hero at quality='low', so the postcard editor opens with every
// style chip already cached. Runs with concurrency=2 (same as vision pipeline).
//
// Exposed on window:
//   pregenerateAllStyles({ stops?, styles? })
//   pregenerateStopStyles(stopId)
//   __lcPrestyleRunning   — boolean
//   __lcPrestyleAbort     — cancel current batch
//
// UI: a small floating badge at bottom-right with progress + pause button.
// Deliberately does NOT auto-trigger — ~$4/load is too aggressive without consent.

(function () {
  // ---------- orientation detection (shares cache with workspace.jsx) ----------
  async function detectOrientation(imageUrl) {
    window.__lcOrientationCache = window.__lcOrientationCache || {};
    if (!imageUrl) return 'landscape';
    const cached = window.__lcOrientationCache[imageUrl];
    if (cached) return cached;
    // Prefer the EXIF-aware detector from workspace.jsx when available.
    if (typeof window.detectOrientationAsync === 'function') {
      try {
        const ori = await window.detectOrientationAsync(imageUrl);
        window.__lcOrientationCache[imageUrl] = ori;
        return ori;
      } catch (_) { /* fall through */ }
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const ori = img.naturalHeight > img.naturalWidth * 1.08 ? 'portrait'
                  : img.naturalWidth  > img.naturalHeight * 1.08 ? 'landscape'
                  : 'square';
        window.__lcOrientationCache[imageUrl] = ori;
        resolve(ori);
      };
      img.onerror = () => resolve('landscape');
      img.src = imageUrl;
    });
  }

  function sizeForOrientation(ori) {
    if (ori === 'portrait')  return '1024x1536';
    if (ori === 'landscape') return '1536x1024';
    return '1024x1024';
  }

  // ---------- helpers ----------
  function heroUrlForStop(stop, assets) {
    if (!stop) return null;
    if (stop.heroAssetId) {
      const a = assets.find(x => x.id === stop.heroAssetId);
      if (a && a.imageUrl) return a.imageUrl;
    }
    return (window.STOP_IMAGES && window.STOP_IMAGES[stop.n]) || null;
  }

  // Resolve a stable "identity" for a stop's hero so the variant cache key is
  // reproducible across demo reloads. Uses asset.sourceName if present, else
  // the last path segment of imageUrl.
  function sourceIdentityFor(stop, assets) {
    if (!stop || !stop.heroAssetId) return null;
    const a = assets.find(x => x.id === stop.heroAssetId);
    if (!a) return null;
    if (a.sourceName) return a.sourceName;
    const url = a.imageUrl;
    if (typeof url !== 'string' || url.startsWith('data:')) return null;
    const m = url.match(/\/([^\/?#]+)(?:\?|#|$)/);
    return m ? m[1] : null;
  }

  // Checks whether the store already has a 'generated' variant matching this
  // style for this stop. We match by prompt equality (the authoritative field),
  // with a styleLabel fallback in case the store ever persists it.
  function hasVariantForStyle(stopId, style) {
    const state = (window.LCStore && window.LCStore.getState)
      ? window.LCStore.getState()
      : null;
    if (!state) return false;
    return state.assetsPool.some(a =>
      a.stop === stopId &&
      a.tone === 'generated' &&
      (a.prompt === style.prompt || a.styleLabel === style.label || a.styleId === style.id)
    );
  }

  // ---------- badge UI (rendered into a floating div, no React tree coupling) ----------
  const BADGE_ID = 'lc-prestyle-badge';
  function ensureBadge() {
    let el = document.getElementById(BADGE_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = BADGE_ID;
    el.style.cssText = [
      'position:fixed',
      'right:20px',
      'bottom:20px',
      'z-index:9999',
      'background:oklch(0.18 0.01 60)',
      'color:oklch(0.98 0.005 60)',
      'padding:10px 14px',
      'border-radius:10px',
      'box-shadow:0 8px 24px rgba(0,0,0,0.22)',
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace',
      'font-size:12px',
      'line-height:1.4',
      'display:flex',
      'align-items:center',
      'gap:12px',
      'max-width:320px',
      'transition:opacity 300ms ease',
    ].join(';');
    document.body.appendChild(el);
    return el;
  }
  function renderBadge({ done, total, status, onPause }) {
    const el = ensureBadge();
    el.style.opacity = '1';
    const label = status === 'done'
      ? 'All done \u2713'
      : status === 'paused'
      ? `Paused \u00b7 ${done} / ${total}`
      : `\u{1f3a8} Pre-generating styles \u00b7 ${done} / ${total}`;
    const showPause = status === 'running';
    el.innerHTML = '';
    const text = document.createElement('span');
    text.textContent = label;
    el.appendChild(text);
    if (showPause) {
      const btn = document.createElement('button');
      btn.textContent = 'Pause';
      btn.style.cssText = [
        'background:transparent',
        'color:inherit',
        'border:1px solid oklch(0.98 0.005 60 / 0.4)',
        'border-radius:6px',
        'padding:3px 8px',
        'font:inherit',
        'cursor:pointer',
      ].join(';');
      btn.onclick = () => { try { onPause && onPause(); } catch (_) {} };
      el.appendChild(btn);
    }
  }
  function hideBadge(delayMs = 0) {
    const el = document.getElementById(BADGE_ID);
    if (!el) return;
    const go = () => {
      el.style.opacity = '0';
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
    };
    if (delayMs > 0) setTimeout(go, delayMs);
    else go();
  }

  // ---------- concurrency pool ----------
  async function runPool(items, workerFn, concurrency, isAborted) {
    let next = 0;
    async function runner() {
      while (true) {
        if (isAborted && isAborted()) return;
        const i = next++;
        if (i >= items.length) return;
        try { await workerFn(items[i], i); } catch (_) { /* swallow per-job */ }
      }
    }
    const runners = [];
    for (let k = 0; k < Math.min(concurrency, items.length); k++) runners.push(runner());
    await Promise.all(runners);
  }

  // ---------- main engine ----------
  async function pregenerateAllStyles(options) {
    options = options || {};
    if (window.__lcPrestyleRunning) {
      console.warn('[prestyle] already running');
      return;
    }
    if (!window.LCStore || !window.LCStore.getState) {
      console.warn('[prestyle] no store');
      return;
    }
    const POSTCARD_STYLES = window.POSTCARD_STYLES;
    if (!POSTCARD_STYLES || !POSTCARD_STYLES.length) {
      console.warn('[prestyle] POSTCARD_STYLES not loaded yet');
      return;
    }

    const styles = options.styles || POSTCARD_STYLES;
    const state = window.LCStore.getState();
    const allStops = state.stops || [];
    const assets = state.assetsPool || [];

    const targetStops = (options.stops && options.stops.length)
      ? options.stops
      : allStops.filter(s => s.heroAssetId || (window.STOP_IMAGES && window.STOP_IMAGES[s.n]));

    // Build job list — one per (stop, style) that isn't already generated.
    // Each job carries a stable `sourceIdentity` so we can hit the IDB cache.
    const jobs = [];
    for (const stop of targetStops) {
      const heroUrl = heroUrlForStop(stop, assets);
      if (!heroUrl) continue;
      const sourceIdentity = sourceIdentityFor(stop, assets);
      for (const style of styles) {
        if (hasVariantForStyle(stop.n, style)) continue;
        jobs.push({ stopId: stop.n, style, heroUrl, sourceIdentity });
      }
    }

    if (!jobs.length) {
      renderBadge({ done: 0, total: 0, status: 'done' });
      hideBadge(2000);
      return;
    }

    // Session flags.
    let aborted = false;
    let done = 0;
    const total = jobs.length;
    window.__lcPrestyleRunning = true;
    window.__lcPrestyleAbort = () => { aborted = true; };
    const onPause = () => {
      aborted = true;
      renderBadge({ done, total, status: 'paused' });
      hideBadge(3000);
    };

    renderBadge({ done, total, status: 'running', onPause });

    await runPool(jobs, async (job) => {
      if (aborted) return;
      try {
        // Cache-first: if we've previously generated this (source, style) pair,
        // restore it for $0 instead of hitting OpenAI again.
        const cacheKey = (job.sourceIdentity && window.lcVariantCacheKey)
          ? window.lcVariantCacheKey(job.sourceIdentity, job.style.id)
          : null;
        let cached = null;
        if (cacheKey && window.lcVariantCacheGet) {
          try { cached = await window.lcVariantCacheGet(cacheKey); } catch (_) {}
        }
        if (cached && cached.url) {
          if (aborted) return;
          window.storeActions?.addGeneratedVariant(job.stopId, {
            url: cached.url,
            prompt: cached.prompt || job.style.prompt,
            revisedPrompt: cached.revisedPrompt || null,
            quality: cached.quality || 'low',
            styleLabel: cached.styleLabel || job.style.label,
            styleId: job.style.id,
            sourceIdentity: job.sourceIdentity,
          });
          return;
        }
        const ori = await detectOrientation(job.heroUrl);
        const size = sizeForOrientation(ori);
        const result = await window.LCGenerateImage({
          prompt: job.style.prompt,
          sourceUrl: job.heroUrl,
          quality: 'low',
          size,
        });
        if (aborted) return;
        if (window.storeActions && window.storeActions.addGeneratedVariant) {
          window.storeActions.addGeneratedVariant(job.stopId, {
            url: result.url,
            prompt: job.style.prompt,
            revisedPrompt: result.revisedPrompt,
            quality: 'low',
            styleLabel: job.style.label,
            styleId: job.style.id,
            sourceIdentity: job.sourceIdentity,
          });
        }
      } catch (err) {
        console.warn('[prestyle] job failed', job.stopId, job.style.id, err && err.message);
      } finally {
        done++;
        if (!aborted) renderBadge({ done, total, status: 'running', onPause });
      }
    }, 3, () => aborted);

    window.__lcPrestyleRunning = false;
    window.__lcPrestyleAbort = null;
    if (!aborted) {
      renderBadge({ done, total, status: 'done' });
      hideBadge(3000);
    }
  }

  async function pregenerateStopStyles(stopId) {
    const state = (window.LCStore && window.LCStore.getState) ? window.LCStore.getState() : null;
    if (!state) return;
    const stop = state.stops.find(s => s.n === stopId);
    if (!stop) return;
    // For a single-stop regen we want all 8, so clear the dedup by passing a
    // dummy style set that won't match existing variants — simplest is to skip
    // dedup entirely here by deleting existing generated variants for this stop.
    // We leave the store alone; instead we just enqueue all styles regardless.
    const POSTCARD_STYLES = window.POSTCARD_STYLES;
    if (!POSTCARD_STYLES) return;
    // Use pregenerateAllStyles with explicit stops + a dedup override: mark
    // existing ones as duplicates is the default. For "regenerate" semantics
    // we bypass by calling the engine directly on just this stop.
    return pregenerateAllStyles({ stops: [stop] });
  }

  window.pregenerateAllStyles = pregenerateAllStyles;
  window.pregenerateStopStyles = pregenerateStopStyles;
  window.__lcPrestyleRunning = false;
  window.__lcPrestyleAbort = null;
})();
