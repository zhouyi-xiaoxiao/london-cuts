// hackathon-demo.jsx — Second demo loader. INSTANT mode: fetches 28 hackathon
// photos from seed-images/hackathon/ and drops them straight into a new
// project as assets + one stop per photo with filename-based titles. NO vision
// calls on initial load — so clicking the button takes ~2s (parallel fetch)
// instead of the old ~60s gpt-4o pipeline.
//
// If the user wants AI-generated titles/bodies afterwards, the workspace has a
// "🔄 Re-analyze photos" button that runs the old vision pipeline on demand.

(function () {
  const HACKATHON_FILES = [
    'IMG_1010.JPG', 'IMG_1115.JPG', 'IMG_1145_2.JPG', 'IMG_1194_2.JPG',
    'IMG_1327.JPG', 'IMG_1335.JPG', 'IMG_1348.JPG', 'IMG_1396.JPG',
    'IMG_1412.JPG', 'IMG_1445.JPG', 'IMG_1835.JPG', 'IMG_2443.JPG',
    'IMG_3446.JPG', 'IMG_3535.JPG', 'IMG_3660.JPG', 'IMG_3778.JPG',
    'IMG_3874.JPG',
    'photo_001.jpg', 'photo_002.jpg', 'photo_003.jpg', 'photo_004.jpg',
    'photo_005.jpg', 'photo_006.jpg', 'photo_007.jpg', 'photo_008.jpg',
    'photo_009.jpg', 'photo_010.jpg', 'photo_011.jpg',
  ];

  // Use current origin so it works both locally AND via cloudflared / any tunnel.
  const BASE_URL = (typeof location !== 'undefined' ? location.origin : '') + '/seed-images/hackathon/';

  // Minimal loading toast shown during the initial file fetch.
  function showToast(text, ms) {
    let el = document.getElementById('lc-hackathon-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lc-hackathon-toast';
      el.style.cssText = [
        'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
        'z-index:1500',
        'background:#1a1a1a', 'color:white',
        'padding:12px 20px',
        'font-family:monospace', 'font-size:12px',
        'letter-spacing:0.1em', 'text-transform:uppercase',
        'box-shadow:0 8px 24px rgba(0,0,0,0.25)',
        'border-radius:2px',
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = text;
    if (ms) setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, ms);
  }
  function hideToast() {
    const el = document.getElementById('lc-hackathon-toast');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // Fetch a URL and return its dataURL representation (so it can survive store
  // persistence via IDB). Returns null on any failure.
  async function fetchAsDataUrl(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  // Batch-fetch with progress toast.
  async function fetchAllDataUrls(names) {
    const out = new Array(names.length);
    const BATCH = 6;
    let done = 0;
    for (let i = 0; i < names.length; i += BATCH) {
      const slice = names.slice(i, i + BATCH);
      const results = await Promise.all(slice.map(async (name, j) => {
        const url = await fetchAsDataUrl(BASE_URL + name);
        return { idx: i + j, name, url };
      }));
      for (const r of results) {
        out[r.idx] = r;
        done++;
        showToast(`Loading hackathon photos… ${done} / ${names.length}`);
      }
    }
    return out;
  }

  // Filename → readable title. IMG_1010 → "Frame 1010", photo_001 → "Frame 01".
  function titleFromFile(name) {
    const base = name.replace(/\.[Jj][Pp][Ee]?[Gg]$/, '');
    const m = base.match(/(\d+)/);
    const num = m ? String(parseInt(m[1], 10)) : base;
    return `Frame ${num}`;
  }

  // Two-digit stop index per photo (01, 02, ...). We clamp at 28 just in case.
  function nForIndex(i) {
    return String(i + 1).padStart(2, '0');
  }

  // Build a single stop entry from a photo file. If a previous gpt-4o vision
  // analysis was cached (keyed by filename), restore its title/body/mood/etc.
  // automatically — the user pays only ONCE for a given photo.
  function buildStop(i, name) {
    const n = nForIndex(i);
    const assetId = `hack-${n}`;
    const placeholderTitle = titleFromFile(name);

    // Check vision cache (keyed on `file:<name>:<size>` or `file:<name>` depending
    // on source). Here we only have the filename — try `file:<name>` directly.
    let cached = null;
    if (typeof window.vpGetCached === 'function') {
      // Try filename-only lookup first (matches `regenerateContentFromPhotos`
      // path which uses asset.sourceName).
      cached = window.vpGetCached('file:' + name);
    }

    const title = (cached && cached.title) || placeholderTitle;
    const mood = (cached && cached.mood) || 'Unclassified';
    const tone = (cached && cached.tone) || (i % 3 === 0 ? 'warm' : i % 3 === 1 ? 'cool' : 'punk');
    const locLabel = ((cached && cached.locationHint) || 'HACKATHON').toUpperCase();

    const body = cached ? [
      { type: 'metaRow',   content: ['HACKATHON', name, mood, locLabel] },
      { type: 'heroImage', assetId, caption: title },
      { type: 'paragraph', content: cached.paragraph || '' },
      ...(cached.pullQuote ? [{ type: 'pullQuote', content: cached.pullQuote }] : []),
    ] : [
      { type: 'metaRow',   content: ['HACKATHON', name, `FRAME ${n}`, '—'] },
      { type: 'paragraph', content: `Frame ${n} from the hackathon build day. Click "🔄 Re-analyze photos" in the top bar to have gpt-4o describe this shot.` },
    ];

    const postcardMessage = (cached && cached.postcardMessage) || '';

    return {
      n,
      code: `HACK · ${n}`,
      title,
      time: '',
      mood,
      tone,
      lat: null,
      lng: null,
      label: `HACKATHON · ${title.toUpperCase()}`,
      status: { upload: true, hero: true, body: true, media: null },
      body,
      postcard: { message: postcardMessage, recipient: { name: '', line1: '', line2: '', country: '' } },
      heroAssetId: assetId,
      assetIds: [assetId],
    };
  }

  async function loadHackathonDemo() {
    // Multi-project: save whatever's currently loaded before replacing it.
    try { window.storeActions?.archiveCurrentProject?.(); } catch (e) { console.warn('[hackathon-demo] archive failed', e); }

    showToast(`Loading hackathon photos… 0 / ${HACKATHON_FILES.length}`);

    // Build stops + asset slots immediately (no fetch needed); swap in dataURLs
    // as they arrive so the UI renders as they come in. This makes the demo
    // feel "instant" — the workspace opens in ~200ms with placeholder tiles,
    // and photos fill in as the fetches land over the next ~2s.
    const stops = HACKATHON_FILES.map((name, i) => buildStop(i, name));
    const assetsPool = HACKATHON_FILES.map((name, i) => {
      const id = `hack-${nForIndex(i)}`;
      const tone = i % 3 === 0 ? 'warm' : i % 3 === 1 ? 'cool' : 'punk';
      return {
        id,
        stop: nForIndex(i),
        tone,
        // Kick off with the raw URL (works locally + via tunnel thanks to BASE_URL).
        // Persistence code will upgrade to dataURL-in-IDB on next persist tick.
        imageUrl: BASE_URL + name,
        // Stable identity so the vision-cache key is `file:<name>` across
        // reloads / re-analyses — avoids paying gpt-4o twice for the same photo.
        sourceName: name,
      };
    });

    // Set up the project synchronously so the workspace can open.
    if (window.LCStore && typeof window.LCStore.setState === 'function') {
      window.LCStore.setState(s => ({
        ...s,
        project: {
          ...s.project,
          title: 'Hackathon · Apr 18',
          author: 'Hackathon team',
          subtitle: `${HACKATHON_FILES.length} frames from a build day. Click 🔄 Re-analyze photos to describe them with gpt-4o.`,
          slug: 'hackathon-4-18',
          coverLabel: 'HACKATHON · 4/18',
          tags: ['Hackathon', 'London'],
          defaultMode: 'cinema',
          visibility: 'draft',
          published: null,
          reads: 0,
          saves: 0,
          duration: `${HACKATHON_FILES.length} frames`,
        },
        stops,
        assetsPool,
        mediaTasks: [],
        ui: {
          ...s.ui,
          mode: 'cinema',
          activeStopId: '01',
          drawerOpen: true,
          drawerTab: 'assets',
          publishOpen: false,
        },
      }));
    }

    // Navigate straight away — user sees the workspace populated with tiles
    // pointing at the local URLs, which load directly from the tunnel/origin.
    location.hash = '#workspace';

    // Restore any previously-cached variants immediately (free — IDB only).
    try {
      if (window.storeActions?.restoreCachedVariantsForCurrent) {
        const n = await window.storeActions.restoreCachedVariantsForCurrent();
        if (n > 0) console.log('[hackathon-demo] restored', n, 'cached variants from IDB');
      }
    } catch (e) { console.warn('[hackathon-demo] restore cache failed', e); }

    // In the background, upgrade each asset's imageUrl → dataURL so persistence
    // + IDB + EXIF reads work consistently. We batch with progress toast. If
    // any fetch fails (e.g. file missing), we leave the raw URL in place — the
    // image still displays, just won't survive a full reload without network.
    try {
      const results = await fetchAllDataUrls(HACKATHON_FILES);
      for (const r of results) {
        if (r && r.url && window.storeActions?.setAssetImageUrl) {
          storeActions.setAssetImageUrl(`hack-${nForIndex(r.idx)}`, r.url);
        }
      }
      showToast(`Hackathon demo ready · ${HACKATHON_FILES.length} frames`, 1800);
    } catch (err) {
      hideToast();
      console.warn('[hackathon-demo] background fetch failed', err);
    }
  }

  // Legacy AI path: re-run vision on all hackathon photos. Exposed separately
  // so the user can opt in from a "Re-analyze with AI" button.
  async function analyzeHackathonWithVision() {
    if (typeof window.analyzePhotosAndCreateProject !== 'function') {
      alert('Vision pipeline not loaded yet — please try again in a moment.');
      return;
    }
    try { window.storeActions?.archiveCurrentProject?.(); } catch (e) {}
    showToast(`Loading photos… 0 / ${HACKATHON_FILES.length}`);
    // Fetch as File (vision wants File objects).
    const files = [];
    for (let i = 0; i < HACKATHON_FILES.length; i++) {
      try {
        const r = await fetch(BASE_URL + HACKATHON_FILES[i]);
        if (!r.ok) continue;
        const blob = await r.blob();
        files.push(new File([blob], HACKATHON_FILES[i], { type: 'image/jpeg' }));
        showToast(`Loading photos… ${i + 1} / ${HACKATHON_FILES.length}`);
      } catch (_) {}
    }
    if (!files.length) {
      hideToast();
      alert('Could not fetch any hackathon photos.');
      return;
    }
    showToast(`Analyzing ${files.length} photos with gpt-4o…`);
    try {
      if (typeof window.analyzePhotosWithModal === 'function') {
        await window.analyzePhotosWithModal(files);
      } else {
        await window.analyzePhotosAndCreateProject(files);
      }
    } catch (err) {
      hideToast();
      alert('Vision pipeline failed: ' + err.message);
      return;
    }
    hideToast();
    if (window.LCStore && typeof window.LCStore.setState === 'function') {
      window.LCStore.setState(s => ({
        ...s,
        project: {
          ...s.project,
          title: 'Hackathon · Apr 18',
          author: 'Hackathon team',
          subtitle: `${files.length} frames from a build day. Auto-described by gpt-4o.`,
          slug: 'hackathon-4-18-ai',
          coverLabel: 'HACKATHON · 4/18',
          tags: ['Hackathon', 'London'],
          defaultMode: 'cinema',
        },
        ui: { ...s.ui, mode: 'cinema' },
      }));
    }
    location.hash = '#workspace';
  }

  window.loadHackathonDemo = loadHackathonDemo;
  window.analyzeHackathonWithVision = analyzeHackathonWithVision;
  window.HACKATHON_DEMO_AVAILABLE = true;
})();
