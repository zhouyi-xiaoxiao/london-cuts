// snapshot.jsx — ship pre-generated variants with the repo.
//
// Export side: walks the IDB `variants` store, packs every cached variant
// into a single .zip (one PNG per variant + manifest.json). User extracts to
// app/generated-images/ and commits. Ships with the repo.
//
// Import side: on load, fetches generated-images/manifest.json. For each
// entry, fetches the PNG and writes it into the IDB variant cache under the
// existing `<sourceIdentity>::<styleId>` key. The London-Remembered demo's
// auto-restore + pregen-skip logic then picks them up with zero API calls.

(function () {
  const SNAPSHOT_DIR = 'generated-images';
  const MANIFEST_PATH = SNAPSHOT_DIR + '/manifest.json';

  function slugify(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
  }

  function dataUrlToBytes(dataUrl) {
    if (typeof dataUrl !== 'string') return null;
    const i = dataUrl.indexOf(',');
    if (i < 0) return null;
    const b64 = dataUrl.slice(i + 1);
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
      return bytes;
    } catch (e) { return null; }
  }

  async function fetchAsDataUrl(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error || new Error('read fail'));
      r.readAsDataURL(blob);
    });
  }

  // ---- minimal zip writer (STORE only — PNGs are already compressed) ----
  let __crcTable = null;
  function crc32(bytes) {
    if (!__crcTable) {
      __crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : (c >>> 1);
        __crcTable[n] = c;
      }
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ __crcTable[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  const utf8 = (s) => new TextEncoder().encode(s);

  function buildZip(entries) {
    const chunks = [];
    const central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() & 0x1F) << 11) | ((now.getMinutes() & 0x3F) << 5) | ((now.getSeconds() >>> 1) & 0x1F);
    const dosDate = (((now.getFullYear() - 1980) & 0x7F) << 9) | (((now.getMonth() + 1) & 0x0F) << 5) | (now.getDate() & 0x1F);

    for (const e of entries) {
      const nameBytes = utf8(e.name);
      const crc = crc32(e.bytes);
      const size = e.bytes.length;

      const lh = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);          // UTF-8 name
      lv.setUint16(8, 0, true);               // STORE
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);
      chunks.push(lh, e.bytes);

      const cd = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      cd.set(nameBytes, 46);
      central.push(cd);

      offset += lh.length + e.bytes.length;
    }

    const cdStart = offset;
    let cdSize = 0;
    for (const cd of central) cdSize += cd.length;

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, cdStart, true);

    chunks.push(...central, eocd);
    return new Blob(chunks, { type: 'application/zip' });
  }

  // ---- export ----
  async function LCExportSnapshot() {
    if (!window.lcVariantCacheList || !window.lcVariantCacheGet) {
      alert('Store not ready — reload and try again.');
      return { count: 0 };
    }
    const keys = await window.lcVariantCacheList();
    if (!keys.length) {
      alert('No generated variants cached yet. Generate some styles first, then export.');
      return { count: 0 };
    }

    const entries = [];
    const manifest = [];
    const seen = new Set();

    for (const key of keys) {
      const val = await window.lcVariantCacheGet(key);
      if (!val || !val.url) continue;
      const bytes = dataUrlToBytes(val.url);
      if (!bytes) continue;
      const sep = String(key).indexOf('::');
      if (sep < 0) continue;
      const sourceIdentity = String(key).slice(0, sep);
      const styleId = String(key).slice(sep + 2);

      const srcBase = sourceIdentity.replace(/\.[^.]+$/, '');
      let name = slugify(srcBase) + '__' + slugify(styleId) + '.png';
      let n = 1;
      while (seen.has(name)) name = slugify(srcBase) + '__' + slugify(styleId) + '-' + (++n) + '.png';
      seen.add(name);

      entries.push({ name, bytes });
      manifest.push({
        file: name,
        sourceIdentity,
        styleId,
        styleLabel: val.styleLabel || null,
        quality: val.quality || null,
        prompt: val.prompt || null,
        revisedPrompt: val.revisedPrompt || null,
      });
    }

    if (!entries.length) {
      alert('No exportable variants.');
      return { count: 0 };
    }

    const manifestJson = JSON.stringify({
      version: 1,
      generatedAt: new Date().toISOString(),
      entries: manifest,
    }, null, 2);
    entries.push({ name: 'manifest.json', bytes: utf8(manifestJson) });

    const blob = buildZip(entries);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'london-cuts-snapshot.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    console.log('[snapshot] exported', manifest.length, 'variants → london-cuts-snapshot.zip');
    console.log('[snapshot] next: extract into app/generated-images/ (replace any old files), commit, reload');
    return { count: manifest.length };
  }

  // ---- import ----
  async function LCImportSnapshotFromDisk() {
    if (!window.lcVariantCacheKey || !window.lcVariantCacheSave || !window.lcVariantCacheGet) {
      return { count: 0, reason: 'store-not-ready' };
    }
    let res;
    try { res = await fetch(MANIFEST_PATH, { cache: 'no-cache' }); }
    catch (e) { return { count: 0, reason: 'no-manifest' }; }
    if (!res.ok) return { count: 0, reason: 'no-manifest' };

    let manifest;
    try { manifest = await res.json(); }
    catch (e) { console.warn('[snapshot] manifest not parseable'); return { count: 0, reason: 'bad-manifest' }; }

    const list = (manifest && Array.isArray(manifest.entries)) ? manifest.entries : [];
    if (!list.length) return { count: 0, reason: 'empty' };

    const results = await Promise.all(list.map(async (entry) => {
      try {
        const dataUrl = await fetchAsDataUrl(SNAPSHOT_DIR + '/' + entry.file);
        return { entry, dataUrl };
      } catch (e) {
        return { entry, error: e };
      }
    }));

    let imported = 0;
    for (const { entry, dataUrl, error } of results) {
      if (error) { console.warn('[snapshot] missing', entry.file, error.message || error); continue; }
      const key = window.lcVariantCacheKey(entry.sourceIdentity, entry.styleId);
      if (!key) continue;
      const existing = await window.lcVariantCacheGet(key);
      if (existing && existing.url) continue;
      await window.lcVariantCacheSave(key, {
        url: dataUrl,
        prompt: entry.prompt || null,
        revisedPrompt: entry.revisedPrompt || null,
        quality: entry.quality || 'low',
        styleLabel: entry.styleLabel || null,
        styleId: entry.styleId,
        sourceIdentity: entry.sourceIdentity,
      });
      imported++;
    }

    if (imported) {
      console.log('[snapshot] imported', imported, 'variants from', SNAPSHOT_DIR + '/');
      // If a demo is already loaded, re-run the restore pass so chips appear now.
      try {
        if (window.storeActions?.restoreCachedVariantsForCurrent) {
          const n = await window.storeActions.restoreCachedVariantsForCurrent();
          if (n > 0) console.log('[snapshot] restored', n, 'variants into active project');
        }
      } catch (e) { /* ignore */ }
    }
    return { count: imported };
  }

  // ---- tiny export button (bottom-left so it doesn't overlap prestyle badge) ----
  function mountExportButton() {
    if (document.getElementById('lc-snapshot-btn')) return;
    const b = document.createElement('button');
    b.id = 'lc-snapshot-btn';
    b.title = 'Download a zip of every generated variant. Extract to app/generated-images/ and commit.';
    b.textContent = '📦 Snapshot';
    b.style.cssText = [
      'position:fixed',
      'left:16px',
      'bottom:16px',
      'z-index:9998',
      'background:oklch(0.22 0.01 60)',
      'color:oklch(0.98 0.005 60)',
      'border:1px solid oklch(0.98 0.005 60 / 0.25)',
      'border-radius:8px',
      'padding:6px 10px',
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace',
      'font-size:11px',
      'cursor:pointer',
      'opacity:0.7',
      'transition:opacity 150ms',
    ].join(';');
    b.onmouseenter = () => { b.style.opacity = '1'; };
    b.onmouseleave = () => { b.style.opacity = '0.7'; };
    b.onclick = async () => {
      b.disabled = true;
      const orig = b.textContent;
      b.textContent = 'Exporting…';
      try { await LCExportSnapshot(); }
      catch (e) { console.warn('[snapshot] export failed', e); alert('Export failed: ' + (e.message || e)); }
      b.textContent = orig;
      b.disabled = false;
    };
    document.body.appendChild(b);
  }

  window.LCExportSnapshot = LCExportSnapshot;
  window.LCImportSnapshotFromDisk = LCImportSnapshotFromDisk;

  // Kick off the import ASAP so cache is warm before any demo load. Store
  // globals are exposed at the bottom of store.jsx, which this file loads
  // after — so it's safe to call immediately. Retry once if we're too early.
  function runImport() {
    LCImportSnapshotFromDisk().catch(e => console.warn('[snapshot] import error', e));
  }
  if (window.lcVariantCacheKey) runImport();
  else setTimeout(runImport, 50);

  // Mount the button once the body is ready.
  if (document.body) mountExportButton();
  else window.addEventListener('DOMContentLoaded', mountExportButton);
})();
