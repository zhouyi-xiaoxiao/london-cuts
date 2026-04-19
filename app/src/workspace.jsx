// workspace.jsx — real editable workspace.
// Reads stops / assets / tasks from the store; every edit writes back.
// Spine (left) · Canvas (middle) · Drawers (right, tabbed). Drag-drop is real.

const MIME_ASSET = 'application/x-lc-asset';
const MIME_TASK  = 'application/x-lc-task';

// Returns 'portrait' | 'landscape' based on loaded image dimensions.
// Caches per URL in window.__lcOrientationCache. Returns 'landscape' while
// loading. Reads EXIF Orientation via exifr so phone-shot portrait JPEGs
// (orientation 5/6/7/8 stored as wide pixels) are correctly classified as
// portrait — not all browsers report post-rotation naturalWidth/Height.
async function detectOrientationAsync(url) {
  if (!url) return 'landscape';
  // Try to read EXIF orientation first. exifr accepts dataURLs, blobs, URLs.
  let exifRotated = false;
  try {
    if (window.exifr && window.exifr.parse) {
      const exif = await window.exifr.parse(url, { pick: ['Orientation'] }).catch(() => null);
      const ori = exif && exif.Orientation;
      if (ori === 5 || ori === 6 || ori === 7 || ori === 8) exifRotated = true;
    }
  } catch (_) {}
  // Then measure the actual decoded dimensions.
  const dims = await new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
  if (!dims) return 'landscape';
  let { w, h } = dims;
  // If EXIF rotation flips the frame 90°, swap dims for orientation math.
  // (Browsers that ALREADY apply exif rotation to naturalWidth/Height will
  // have given us post-rotation values, making this a no-op in the same
  // logical direction — we still end up classifying correctly because we
  // compare h > w*1.08 either way. If the browser applied rotation AND we
  // swap, we'd double-flip; guard by only swapping if w > h AND exifRotated.)
  if (exifRotated && w > h) { [w, h] = [h, w]; }
  return h > w * 1.08 ? 'portrait' : 'landscape';
}

function useImageOrientation(imageUrl) {
  const [orientation, setOrientation] = React.useState(() => {
    if (!imageUrl || !window.__lcOrientationCache) return 'landscape';
    return window.__lcOrientationCache[imageUrl] || 'landscape';
  });
  React.useEffect(() => {
    if (!imageUrl) { setOrientation('landscape'); return; }
    window.__lcOrientationCache = window.__lcOrientationCache || {};
    if (window.__lcOrientationCache[imageUrl]) {
      setOrientation(window.__lcOrientationCache[imageUrl]);
      return;
    }
    let cancelled = false;
    detectOrientationAsync(imageUrl).then(ori => {
      if (cancelled) return;
      window.__lcOrientationCache[imageUrl] = ori;
      setOrientation(ori);
    });
    return () => { cancelled = true; };
  }, [imageUrl]);
  return orientation;
}

function heroUrlFor(stop, assetsPool) {
  if (!stop) return null;
  if (stop.heroAssetId) {
    const a = assetsPool.find(x => x.id === stop.heroAssetId);
    if (a && a.imageUrl) return a.imageUrl;
  }
  // STOP_IMAGES is the legacy picsum fallback used only for the very first-
  // visit default seed project (where `status.hero: true` is preset but no
  // upload exists yet). For any user-created / user-modified project we
  // suppress it — otherwise a fresh blank stop would mysteriously show a
  // random Borough-Market picsum. If the stop's status.hero is explicitly
  // false, or the project has been archived-and-reloaded (no STOP_IMAGES
  // match), we return null and let the UI show the "upload" prompt.
  if (stop.status && stop.status.hero === false) return null;
  return (window.STOP_IMAGES && window.STOP_IMAGES[stop.n]) || null;
}

// The image shown on POSTCARD views (editor preview, mini, PDF export).
// Priority: stop.postcard.artAssetId (AI art the user explicitly picked) →
// heroUrl (the real photograph) → null. Keeps every postcard render in sync.
function postcardFrontUrlFor(stop, assetsPool) {
  if (!stop) return null;
  const artId = stop.postcard?.artAssetId;
  if (artId) {
    const a = assetsPool.find(x => x.id === artId);
    if (a && a.imageUrl) return a.imageUrl;
  }
  return heroUrlFor(stop, assetsPool);
}

function Workspace({ mode, onMode, onOpenPublish, onExitToProjects }) {
  const stops    = useLCStore(s => s.stops);
  const project  = useLCStore(s => s.project);
  const assets   = useLCStore(s => s.assetsPool);
  const active   = useLCStore(s => s.ui.activeStopId) || '05';
  const drawerOpen = useLCStore(s => s.ui.drawerOpen !== false);
  const drawerTab  = useLCStore(s => s.ui.drawerTab) || 'assets';
  const stop = stops.find(s => s.n === active) || stops[0];
  const summary = projectSummary(stops);

  // On workspace mount (or slug change), restore cached variants from IDB so
  // any (source, style) pair we've generated before shows up instantly — $0.
  // Fires once per (slug, session) with a tiny delay so IDB hydration wins.
  React.useEffect(() => {
    if (!project?.slug) return;
    const seenKey = 'lc_cache_restore_' + project.slug;
    try { if (sessionStorage.getItem(seenKey) === '1') return; } catch (_) {}
    const t = setTimeout(async () => {
      try {
        if (window.storeActions?.restoreCachedVariantsForCurrent) {
          const n = await window.storeActions.restoreCachedVariantsForCurrent();
          if (n > 0) console.log('[workspace] restored', n, 'cached variants');
        }
        try { sessionStorage.setItem(seenKey, '1'); } catch (_) {}
      } catch (_) {}
    }, 600);
    return () => clearTimeout(t);
  }, [project?.slug]);

  // Auto-kick pre-generation of all 6 postcard styles per stop, once per
  // project slug per session. Fires when (a) at least 3 stops have heroes,
  // (b) some stops are missing variants, (c) POSTCARD_STYLES is loaded, and
  // (d) this session hasn't already triggered for this slug. Delayed so the
  // cache-restore step above runs first.
  React.useEffect(() => {
    if (!project?.slug) return;
    try {
      const seenKey = 'lc_auto_pregen_' + project.slug;
      if (sessionStorage.getItem(seenKey) === '1') return;
      const heroCount = stops.filter(s => s.heroAssetId).length;
      if (heroCount < 3) return;
      if (!window.POSTCARD_STYLES || !window.pregenerateAllStyles) return;
      if (window.__lcPrestyleRunning) return;
      const t = setTimeout(() => {
        // Re-check: user may have left the workspace in the meantime
        const cur = window.LCStore?.getState?.();
        if (!cur || cur.project?.slug !== project.slug) return;
        // Only run if there are STILL style gaps after cache restore.
        const styles = window.POSTCARD_STYLES || [];
        const heroes = (cur.stops || []).filter(s => s.heroAssetId);
        const hasGaps = heroes.some(s => {
          const variants = (cur.assetsPool || []).filter(a => a.stop === s.n && a.tone === 'generated');
          const have = new Set(variants.map(v => v.styleId).filter(Boolean));
          return styles.some(st => !have.has(st.id));
        });
        if (!hasGaps) return;
        sessionStorage.setItem(seenKey, '1');
        try { window.pregenerateAllStyles({ auto: true }); } catch (e) {}
      }, 2000);
      return () => clearTimeout(t);
    } catch (_) {}
  }, [project?.slug, stops.length]);

  const setDrawerTab = (t) => storeActions.openDrawer(t);
  const toggleDrawer = () => {
    if (drawerOpen) storeActions.closeDrawer();
    else storeActions.openDrawer(drawerTab || 'assets');
  };

  // Responsive viewport tracking. We need to know whether the drawer is
  // currently in "overlay" mode (CSS media query <1280px) so that (a) we
  // can render a backdrop behind it, (b) tapping outside the drawer (or
  // pressing Escape) dismisses it, and (c) on first load at narrow widths
  // we auto-close so the canvas is visible.
  const [isNarrow, setIsNarrow] = React.useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 1280
  );
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsNarrow(window.innerWidth < 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // One-time auto-close on first narrow-mount so the canvas is visible.
  React.useEffect(() => {
    if (isNarrow && drawerOpen) {
      try {
        const seen = sessionStorage.getItem('lc_autoclose_drawer');
        if (!seen) {
          sessionStorage.setItem('lc_autoclose_drawer', '1');
          storeActions.closeDrawer();
        }
      } catch (_) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Escape-to-close for overlay mode.
  React.useEffect(() => {
    if (!isNarrow || !drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') storeActions.closeDrawer(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isNarrow, drawerOpen]);

  return (
    <div className="page" data-mode={mode} style={{ overflow: 'auto', height: '100vh' }}>
      {isNarrow && drawerOpen && (
        <div
          className="lc-drawer-backdrop"
          onClick={() => storeActions.closeDrawer()}
          title="Close panels"
        />
      )}
      <div className="ws-topbar">
        <div className="row items-center gap-16">
          <button className="mono-sm" onClick={onExitToProjects} style={{ opacity: 0.6 }}>← Projects</button>
          <Roundel />
          <TitleEditor value={project.title} onChange={v => storeActions.setTitle(v)} />
          <span className="mono-sm" style={{ opacity: 0.45 }}>
            {project.visibility === 'public' ? 'PUBLISHED' : 'DRAFT'} · ED.01 · {summary.totalComplete}/{summary.total} STOPS READY
          </span>
        </div>
        <div className="row items-center gap-16">
          <button className="btn btn-sm" title="Start demo tour" onClick={() => storeActions.startTour()}>?</button>
          <button
            className="btn btn-sm"
            title="Use gpt-4o vision to rewrite every stop's title / body / postcard to match its hero photo"
            onClick={() => window.openRegenerateFromPhotos?.()}
          >🔄 Re-analyze photos</button>
          <button
            className="btn btn-sm"
            title="Pre-generate all 8 postcard styles for every stop (background, quality=low, ~$0.16 per stop)"
            onClick={() => window.pregenerateAllStyles?.()}
          >🎨 Pre-gen styles</button>
          <ShareButton project={project} />
          <ModePill mode={mode} onMode={onMode} />
          <button className="btn" onClick={toggleDrawer}>{drawerOpen ? 'Hide panels →' : '← Show panels'}</button>
          <button
            className="btn btn-solid"
            title={`Publish makes your project public at /#public. Needs every stop to have upload + hero + body. Currently ${summary.totalComplete}/${summary.total} ready.`}
            onClick={onOpenPublish}
          >Publish →</button>
        </div>
      </div>

      <div className="ws-shell" style={{ gridTemplateColumns: drawerOpen ? `var(--spine-w) 1fr var(--drawer-w)` : `var(--spine-w) 1fr` }}>
        <Spine stops={stops} selected={active} onSelect={(n) => storeActions.setActiveStop(n)} summary={summary} />
        <WSCanvas mode={mode} stop={stop} assets={assets} key={active} />
        {drawerOpen && (
          <WSDrawers tab={drawerTab} onTab={setDrawerTab} selectedStop={active} mode={mode} />
        )}
      </div>
    </div>
  );
}

// 🔗 Share — a popover revealing the public URL. Auto-selects on open, with
// Copy, Open new tab, and (if a draft) a gentle "publish first" hint. Lives
// in the top bar so users don't have to hunt inside the Publish slideover.
function ShareButton({ project }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef(null);
  const popRef = React.useRef(null);

  const publicUrl = `${location.origin}${location.pathname}#public`;
  const isPublished = project?.visibility === 'public' && project?.published;

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.select();
    }
  }, [open]);

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(publicUrl); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ position: 'relative' }} ref={popRef}>
      <button
        className="btn btn-sm"
        title="Share the public link for this project"
        onClick={() => setOpen(o => !o)}
      >🔗 Share</button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 120,
          width: 360, background: 'var(--mode-bg, white)', color: 'var(--mode-ink, #1a1a1a)',
          border: '1px solid currentColor',
          padding: 14, boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
        }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Public link</div>
          <input
            ref={inputRef}
            readOnly
            value={publicUrl}
            onFocus={(e) => e.target.select()}
            style={{
              width: '100%', padding: '6px 8px',
              fontFamily: 'var(--f-mono)', fontSize: 11,
              border: '1px solid oklch(from currentColor l c h / 0.25)',
              background: 'oklch(from currentColor l c h / 0.04)',
              marginBottom: 8,
            }}
          />
          {!isPublished && (
            <div className="mono-sm" style={{ opacity: 0.7, marginBottom: 8, lineHeight: 1.5 }}>
              ⚠️ This project is still a draft. Friends will only see content if you publish from the Publish → panel.
            </div>
          )}
          <div className="row gap-8">
            <button className="btn btn-sm btn-solid" style={{ flex: 1 }} onClick={handleCopy}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => window.open(publicUrl, '_blank')}>
              Open in tab ↗
            </button>
          </div>
          <div className="mono-sm" style={{ opacity: 0.55, marginTop: 10, lineHeight: 1.5 }}>
            Tip: for friends on other networks, use the cloudflared tunnel URL you were given in the terminal.
          </div>
        </div>
      )}
    </div>
  );
}

function TitleEditor({ value, onChange }) {
  const [editing, setEditing] = React.useState(false);
  const [buf, setBuf] = React.useState(value);
  React.useEffect(() => { setBuf(value); }, [value]);
  if (!editing) {
    return (
      <div
        style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15, lineHeight: 1, cursor: 'text' }}
        onClick={() => setEditing(true)}
        title="Click to rename"
      >{value}</div>
    );
  }
  return (
    <input
      autoFocus
      value={buf}
      onChange={e => setBuf(e.target.value)}
      onBlur={() => { onChange(buf.trim() || value); setEditing(false); }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') { setBuf(value); setEditing(false); }
      }}
      style={{
        fontFamily: 'var(--mode-display-font)', fontSize: 15, lineHeight: 1,
        borderBottom: '1px solid currentColor', minWidth: 220, padding: '2px 0',
      }}
    />
  );
}

// ---- Spine ----------------------------------------------------------------
function Spine({ stops, selected, onSelect, summary }) {
  return (
    <aside className="spine">
      <div className="spine-hdr">
        <div className="eyebrow">{stops.length} stops</div>
        <div className="eyebrow" style={{ opacity: 0.6 }}>{summary.totalComplete}/{summary.total}</div>
      </div>
      {stops.map((s, idx) => (
        <SpineRow
          key={s.n}
          s={s}
          idx={idx}
          total={stops.length}
          selected={selected === s.n}
          onSelect={() => onSelect(s.n)}
        />
      ))}
      <div style={{ padding: '12px 14px', display: 'flex', gap: 6 }}>
        <button
          className="btn btn-sm"
          style={{ flex: 1 }}
          title="Add a new stop after the last"
          onClick={() => storeActions.addStop()}
        >+ Add stop</button>
      </div>
      <div className="spine-foot">
        <div>{summary.missingHeroes} stops without hero · {summary.missingBodies} without body</div>
        <div style={{ marginTop: 6 }}>{summary.missingUploads ? `${summary.missingUploads} stops need uploads` : 'All stops have uploads'}</div>
      </div>
    </aside>
  );
}

function SpineRow({ s, selected, onSelect, idx, total }) {
  const [over, setOver] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes(MIME_ASSET) || e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setOver(true);
    }
  };
  const onDrop = (e) => {
    setOver(false);
    const assetId = e.dataTransfer.getData(MIME_ASSET);
    if (assetId) {
      e.preventDefault();
      storeActions.addAssetToStop(s.n, assetId);
      const a = (window.LCStore.getState().assetsPool || []).find(x => x.id === assetId);
      if (a) storeActions.setStopStatus(s.n, { upload: true });
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      e.preventDefault();
      [...e.dataTransfer.files].forEach(file => handleFileAsset(file, s.n));
    }
  };
  return (
    <div
      className="spine-row"
      data-active={selected}
      data-drop={over || undefined}
      onClick={onSelect}
      onDragOver={onDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', ...(over ? { outline: '2px dashed var(--mode-accent)', outlineOffset: -2 } : {}) }}
    >
      <span className="spine-n">{s.n}</span>
      <span className="spine-title">{s.title}</span>
      <Pips status={s.status} />
      <div className="spine-meta-row">
        <span>{s.code}</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <span>{s.time}</span>
      </div>
      {(hover || selected) && (
        <div style={{
          position: 'absolute', right: 6, top: 4, display: 'flex', gap: 2,
          background: 'var(--mode-bg, white)', padding: 2,
          border: '1px solid oklch(from currentColor l c h / 0.2)',
          zIndex: 5,
        }}>
          {idx > 0 && (
            <button className="mono-sm" title="Move up"
                    onClick={(e) => { e.stopPropagation(); storeActions.moveStop(s.n, 'up'); }}
                    style={{ padding: '2px 5px' }}>↑</button>
          )}
          {idx < total - 1 && (
            <button className="mono-sm" title="Move down"
                    onClick={(e) => { e.stopPropagation(); storeActions.moveStop(s.n, 'down'); }}
                    style={{ padding: '2px 5px' }}>↓</button>
          )}
          {total > 1 && (
            <button className="mono-sm" title="Delete stop"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete Stop ${s.n} "${s.title}"? Its body, postcard, and hero will be lost. Assigned assets will become loose.`)) {
                        storeActions.removeStop(s.n);
                      }
                    }}
                    style={{ padding: '2px 5px', color: 'var(--status-failed)' }}>✕</button>
          )}
        </div>
      )}
    </div>
  );
}

// Handle a dropped file — read as data URL, add to pool
function handleFileAsset(file, stopId) {
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const tone = (window.LCStore.getState().stops.find(s => s.n === stopId)?.tone) || 'warm';
    const id = storeActions.addUploadedAsset({ stop: stopId, tone, imageUrl: String(reader.result) });
    storeActions.addAssetToStop(stopId, id);
    storeActions.setStopStatus(stopId, { upload: true });
  };
  reader.readAsDataURL(file);
}

// ---- Canvas ---------------------------------------------------------------
function WSCanvas({ mode, stop, assets }) {
  const heroUrl = heroUrlFor(stop, assets);
  return (
    <main className="canvas">
      <div className="canvas-inner">
        <CanvasHeader stop={stop} mode={mode} />
        <SectionHeader
          title={`Hero & assets for stop ${stop.n}`}
          help={<>
            <b>Hero</b> = the cover image readers see at the top of this stop and on the postcard.
            One per stop. Pick the strongest shot — it sets the mood for everything below.
            Use <b>Variants</b> to generate multiple candidates with AI, then click <i>Use as hero</i>.
          </>}
        />
        <HeroSlot stop={stop} mode={mode} heroUrl={heroUrl} />
        <VariantsRow stop={stop} mode={mode} />
        <AssetStrip stop={stop} assets={assets} />
        <SectionHeader
          title="Body"
          help={<>
            <b>Body</b> = the words and images readers see after the hero.
            Click a block to edit; press <b>+ add block</b> to insert a paragraph, pull quote, inline image, media embed, or meta row.
            Drag ↑↓ to reorder, ✕ to delete.
          </>}
        />
        <StoryEditor stopId={stop.n} mode={mode} assets={assets} />
        <SectionHeader
          title="Postcard preview"
          help={<>
            <b>Postcard</b> = a 7:5 card (front + back) auto-generated from your hero and a short note.
            Readers can click any stop's postcard on the public page. Click <i>Open editor →</i> to write the message and recipient.
          </>}
        />
        <PostcardTile stop={stop} mode={mode} heroUrl={heroUrl} />
      </div>
    </main>
  );
}

// Reusable section header with a ? tooltip
function SectionHeader({ title, help }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="overline-divider" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ flex: 1 }}>{title}</span>
      {help && (
        <>
          <button
            className="mono-sm"
            title="What does this mean?"
            onClick={() => setOpen(o => !o)}
            style={{
              width: 18, height: 18, border: '1px solid currentColor',
              borderRadius: 9, lineHeight: 1, fontSize: 10,
              display: 'grid', placeItems: 'center',
              opacity: open ? 1 : 0.6, cursor: 'pointer',
            }}
          >?</button>
        </>
      )}
      {open && (
        <div style={{
          position: 'absolute', right: 40, marginTop: 8, zIndex: 20,
          maxWidth: 340, padding: '10px 12px',
          background: 'var(--paper, white)', color: 'var(--ink)',
          border: '1px solid currentColor',
          fontSize: 12, lineHeight: 1.5, letterSpacing: 'normal',
          textTransform: 'none', fontWeight: 400, fontFamily: 'var(--f-sans)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }} onClick={() => setOpen(false)}>
          {help}
        </div>
      )}
    </div>
  );
}

function CanvasHeader({ stop, mode }) {
  const [titleEditing, setTitleEditing] = React.useState(false);
  const [buf, setBuf] = React.useState(stop.title);
  React.useEffect(() => { setBuf(stop.title); }, [stop.title]);
  const bodyLen = (stop.body || []).length;
  return (
    <div className="canvas-hdr">
      <div>
        <div className="eyebrow" style={{ opacity: 0.75 }}>
          Stop {stop.n} · {stop.code} · {stop.time} · {stop.mood}
          {typeof stop.lat === 'number' && typeof stop.lng === 'number' && (
            <>
              {' · '}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`}
                target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                title={`${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)} · open in Google Maps`}
              >📍 Google Maps</a>
              {' · '}
              <a
                href={`https://maps.apple.com/?ll=${stop.lat},${stop.lng}&q=${encodeURIComponent(stop.title)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                title="Open in Apple Maps"
              >Apple</a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${stop.lat},${stop.lng}`);
                }}
                style={{ marginLeft: 6, fontSize: 'inherit', letterSpacing: 'inherit', fontFamily: 'inherit', opacity: 0.65, cursor: 'pointer', background: 'none', border: 'none', padding: 0, textTransform: 'inherit' }}
                title="Copy coordinates"
              >📋</button>
            </>
          )}
        </div>
        {titleEditing ? (
          <input
            autoFocus
            value={buf}
            onChange={e => setBuf(e.target.value)}
            onBlur={() => { storeActions.setStopTitle(stop.n, buf.trim() || stop.title); setTitleEditing(false); }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setBuf(stop.title); setTitleEditing(false); } }}
            className="canvas-title"
            style={{ marginTop: 10, width: '100%', borderBottom: '1px solid currentColor' }}
          />
        ) : (
          <h1 className="canvas-title" style={{ marginTop: 10, cursor: 'text' }} onClick={() => setTitleEditing(true)} title="Click to edit title">{stop.title}</h1>
        )}
      </div>
      <div className="col items-end gap-8" style={{ flexShrink: 0 }}>
        <span className="mono-sm" style={{ opacity: 0.65 }}>
          {bodyLen > 0 ? `Body: ${bodyLen} block${bodyLen === 1 ? '' : 's'}` : 'Body: empty'}
        </span>
        <span className="mono-sm" style={{ opacity: 0.65 }}>
          Media task: {stop.status.media ?? '—'}
        </span>
      </div>
    </div>
  );
}

// Rotate a data-URL / http-URL image 90° clockwise per tap.
// Returns a fresh data URL ready to stash in the store.
async function rotateImageDataUrl(src, degrees = 90) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const rad = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      canvas.width  = img.naturalWidth  * cos + img.naturalHeight * sin;
      canvas.height = img.naturalWidth  * sin + img.naturalHeight * cos;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

// Draggable hero image. Wraps an <img> with objectFit: cover + objectPosition
// driven by a { x, y } focus (0-100%). User clicks + drags to pan the visible
// crop of the image. Saves to store on pointer up.
// For portrait-oriented photos we switch to a two-layer "letterbox glow"
// render: a blurred cover-fit copy fills the 16:9 frame as a backdrop while a
// contain-fit copy shows the full subject on top. Drag is disabled in that
// mode since nothing is being cropped.
function HeroDraggable({ src, focus, onFocusChange, height, stopLabel, stopTone }) {
  const orientation = useImageOrientation(src);
  const isPortrait = orientation === 'portrait';
  const [local, setLocal] = React.useState(focus);
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef(null);

  React.useEffect(() => { setLocal(focus); }, [focus?.x, focus?.y]);

  const onPointerDown = (e) => {
    if (isPortrait) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, fx: local.x, fy: local.y, w: rect.width, h: rect.height };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging || !dragRef.current) return;
    const d = dragRef.current;
    // Moving the mouse RIGHT should shift focus LEFT (image pans right) so we
    // subtract. Scale by 2 so a small drag feels responsive.
    const dx = (e.clientX - d.startX) / d.w * 200;
    const dy = (e.clientY - d.startY) / d.h * 200;
    const nx = Math.max(0, Math.min(100, d.fx - dx));
    const ny = Math.max(0, Math.min(100, d.fy - dy));
    setLocal({ x: nx, y: ny });
  };
  const onPointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    onFocusChange(local);
  };

  const recenter = () => {
    setLocal({ x: 50, y: 50 });
    onFocusChange({ x: 50, y: 50 });
  };

  if (isPortrait) {
    return (
      <div
        style={{
          width: '100%', height, overflow: 'hidden', position: 'relative',
          cursor: 'default',
          background: '#000',
        }}
        title="Portrait photo — shown in full"
      >
        {/* Blurred backdrop fills the 16:9 frame with a soft cinema-screen glow */}
        <img
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 50%',
            filter: 'blur(40px) brightness(0.7) saturate(1.3)',
            transform: 'scale(1.15)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
        {/* Main image, fully contained so the whole subject stays visible */}
        <img
          src={src}
          alt={stopLabel || 'hero'}
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain',
            objectPosition: `${local.x}% ${local.y}%`,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={recenter}
      style={{
        width: '100%', height, overflow: 'hidden', position: 'relative',
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      title="Drag to reposition · double-click to recenter"
    >
      <img
        src={src}
        alt={stopLabel || 'hero'}
        draggable={false}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: `${local.x}% ${local.y}%`,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
      {dragging && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8,
          background: 'rgba(0,0,0,0.55)', color: 'white',
          padding: '4px 8px', fontFamily: 'var(--f-mono)', fontSize: 10,
          letterSpacing: '0.08em',
        }}>
          FOCUS · {Math.round(local.x)}% × {Math.round(local.y)}%
        </div>
      )}
    </div>
  );
}

function HeroSlot({ stop, mode, heroUrl }) {
  const [showKeyModal, setShowKeyModal] = React.useState(false);
  const [dropActive, setDropActive] = React.useState(false);
  const [rotating, setRotating] = React.useState(false);

  const handleRotate = async (degrees) => {
    if (!stop.heroAssetId || !heroUrl) return;
    setRotating(true);
    try {
      // Rotate from the current asset's imageUrl (fetch if remote + CORS-tainted)
      let src = heroUrl;
      if (!src.startsWith('data:')) {
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          src = await new Promise(r => {
            const fr = new FileReader();
            fr.onload = () => r(String(fr.result));
            fr.readAsDataURL(blob);
          });
        } catch {}
      }
      const rotated = await rotateImageDataUrl(src, degrees);
      storeActions.setAssetImageUrl(stop.heroAssetId, rotated);
    } catch (e) {
      console.warn('[lc] rotate failed', e);
    }
    setRotating(false);
  };

  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes(MIME_ASSET) || e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setDropActive(true);
    }
  };
  const onDrop = (e) => {
    setDropActive(false);
    const assetId = e.dataTransfer.getData(MIME_ASSET);
    if (assetId) {
      e.preventDefault();
      storeActions.setHeroAssetId(stop.n, assetId);
      storeActions.setStopStatus(stop.n, { hero: true, upload: true });
      storeActions.addAssetToStop(stop.n, assetId);
      return;
    }
    if (e.dataTransfer.files?.length) {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const id = storeActions.addUploadedAsset({ stop: stop.n, tone: stop.tone, imageUrl: String(reader.result) });
          storeActions.addAssetToStop(stop.n, id);
          storeActions.setHeroAssetId(stop.n, id);
          storeActions.setStopStatus(stop.n, { hero: true, upload: true });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const height = mode === 'cinema' ? 360 : 440;

  return (
    <div
      style={{ position: 'relative', width: '100%', minHeight: heroUrl ? undefined : 280 }}
      onDragOver={onDragOver}
      onDragLeave={() => setDropActive(false)}
      onDrop={onDrop}
    >
      {heroUrl ? (
        <>
          <HeroDraggable
            src={heroUrl}
            focus={stop.heroFocus || { x: 50, y: 50 }}
            onFocusChange={(f) => storeActions.setHeroFocus(stop.n, f)}
            height={height}
            stopLabel={stop.label}
            stopTone={stop.tone}
          />
          <button
            className="lc-gen-button"
            style={{ right: 140 }}
            title="Rotate 90° counter-clockwise"
            disabled={rotating}
            onClick={() => handleRotate(-90)}
          >↺</button>
          <button
            className="lc-gen-button"
            style={{ right: 94 }}
            title="Rotate 90° clockwise"
            disabled={rotating}
            onClick={() => handleRotate(90)}
          >↻</button>
          <button
            className="lc-gen-button"
            style={{ right: 48 }}
            title="Remove hero"
            onClick={() => { storeActions.setHeroAssetId(stop.n, null); storeActions.setStopStatus(stop.n, { hero: false }); }}
          >✕</button>
          {rotating && <div className="lc-gen-loading">Rotating…</div>}
        </>
      ) : (
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center', borderStyle: 'dashed', border: '1px dashed currentColor', minHeight: 280 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div className="mono-sm" style={{ opacity: 0.65 }}>Drag an asset here, upload a file, or use the Variants row below ↓</div>
            <label className="btn btn-sm" style={{ opacity: 0.85, cursor: 'pointer' }}>
              Upload image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                const f = e.target.files?.[0]; if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const id = storeActions.addUploadedAsset({ stop: stop.n, tone: stop.tone, imageUrl: String(reader.result) });
                  storeActions.addAssetToStop(stop.n, id);
                  storeActions.setHeroAssetId(stop.n, id);
                  storeActions.setStopStatus(stop.n, { hero: true, upload: true });
                };
                reader.readAsDataURL(f);
              }} />
            </label>
          </div>
        </div>
      )}
      {dropActive && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '2px dashed var(--mode-accent)', background: 'oklch(from currentColor l c h / 0.08)' }} />
      )}
      {showKeyModal && <KeyPasteModal onClose={() => setShowKeyModal(false)} onUseDefault={() => setShowKeyModal(false)} />}
    </div>
  );
}

// Persistent Variants row — parallel generations, each with pending placeholder.
// Below the hero slot, above the asset strip.
const VARIANT_COST = { low: 0.02, medium: 0.04, high: 0.19, auto: 0.08 };

// Ask gpt-4o to write a re-imagination prompt for the given image.
// Returns a trimmed string on success, or null on any failure (missing key,
// network error, bad response). Caller handles fallback.
async function describePhotoForPrompt(imageDataUrl) {
  const key = sessionStorage.getItem('lc_openai_key') || window.__LC_OPENAI_KEY_DEFAULT;
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 120,
        messages: [
          { role: 'system', content: 'You describe photos to create re-imagination prompts for AI image editing. Respond with a single 25-40 word descriptive prompt describing lighting, composition, subject, mood. Suitable as input to an image-to-image model. No preamble.' },
          { role: 'user', content: [
            { type: 'text', text: 'Describe this image as an image-gen prompt.' },
            { type: 'image_url', image_url: { url: imageDataUrl } }
          ]}
        ]
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// Single source of truth for the 6 styles — same list we pre-generate,
// same chips the postcard editor shows. Always resolve via window.POSTCARD_STYLES
// at call time so lazy-loaded / later-updated lists flow through.
function getStylePresets() {
  if (window.POSTCARD_STYLES && window.POSTCARD_STYLES.length) {
    return window.POSTCARD_STYLES;
  }
  // Fallback (shouldn't hit — postcard-editor.jsx sets window.POSTCARD_STYLES on load).
  return [
    { id: 'film',        label: 'Film grain',       prompt: 'Transform this photo into a 35mm film still. Add grain, muted colors, slight vignette, analog warmth. Keep composition identical.' },
    { id: 'watercolor',  label: 'Watercolor',       prompt: 'Repaint this scene as a loose watercolor illustration. Soft washes, visible brush strokes, paper texture, pastel palette. Same composition.' },
  ];
}

function VariantsRow({ stop, mode }) {
  const assets = useLCStore(s => s.assetsPool);
  const variants = assets.filter(a => a.stop === stop.n && a.tone === 'generated');
  const heroId = stop.heroAssetId;
  const heroUrl = heroUrlFor(stop, assets);
  const [showStyleChips, setShowStyleChips] = React.useState(false);

  const fallbackPrompt = `Photograph of ${stop.title}, ${stop.code || 'London'}. ${stop.mood} mood, ${stop.time} time of day, cinematic composition, editorial style.`;
  const cachedPrompt = (window.__lcVisionCache && window.__lcVisionCache[stop.n]) || null;
  const [prompt, setPrompt] = React.useState(stop.aiPrompt || cachedPrompt || 'Make this image…');
  const [quality, setQuality] = React.useState('low');
  const [pending, setPending] = React.useState([]);
  const [showKeyModal, setShowKeyModal] = React.useState(false);
  const [lastError, setLastError] = React.useState(null);
  const [sourceImage, setSourceImage] = React.useState(null); // { file, dataUrl, label }
  const [describing, setDescribing] = React.useState(false);

  // Reset prompt + source when switching stops.
  React.useEffect(() => {
    const cache = (window.__lcVisionCache && window.__lcVisionCache[stop.n]) || null;
    setPrompt(stop.aiPrompt || cache || 'Make this image…');
    setSourceImage(null);
    setLastError(null);
  }, [stop.n]);

  // On mount / stop change, kick off a single gpt-4o vision call if we don't
  // already have a prompt cached for this stop and a hero exists. The cache
  // is persisted to localStorage under `lc_reimagine_prompt_cache_v1` so that
  // prompts survive reloads and we never re-pay for the same image.
  React.useEffect(() => {
    const REIM_KEY = 'lc_reimagine_prompt_cache_v1';
    if (!window.__lcVisionCache) {
      try { window.__lcVisionCache = JSON.parse(localStorage.getItem(REIM_KEY) || '{}'); }
      catch { window.__lcVisionCache = {}; }
    }
    // Prefer a heroUrl-keyed cache entry (survives stop renumbering) AND the
    // old stop.n key for back-compat. Writes now key on heroUrl.
    const urlKey = heroUrl ? ('url:' + heroUrl) : null;
    const cached = (urlKey && window.__lcVisionCache[urlKey]) || window.__lcVisionCache[stop.n];
    if (cached) {
      setPrompt(cached);
      return;
    }
    if (stop.aiPrompt) return;
    if (!heroUrl) return;
    let cancelled = false;
    setDescribing(true);
    (async () => {
      // Fetch hero as dataURL so gpt-4o can see it even for cross-origin URLs.
      let dataUrl = heroUrl;
      if (!dataUrl.startsWith('data:')) {
        try {
          const r = await fetch(heroUrl, { mode: 'cors' });
          const blob = await r.blob();
          dataUrl = await new Promise((resolve) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result));
            fr.onerror = () => resolve(null);
            fr.readAsDataURL(blob);
          });
        } catch {
          dataUrl = null;
        }
      }
      const described = dataUrl ? await describePhotoForPrompt(dataUrl) : null;
      if (cancelled) return;
      const finalPrompt = described || fallbackPrompt;
      window.__lcVisionCache[stop.n] = finalPrompt;
      if (urlKey) window.__lcVisionCache[urlKey] = finalPrompt;
      try { localStorage.setItem(REIM_KEY, JSON.stringify(window.__lcVisionCache)); } catch {}
      setPrompt(finalPrompt);
      setDescribing(false);
    })();
    return () => { cancelled = true; };
  }, [stop.n, heroUrl]);

  const totalCost = variants.reduce((sum, v) => sum + (VARIANT_COST[v.quality] || VARIANT_COST.high), 0);
  const effectiveSrcUrl = sourceImage?.dataUrl || heroUrl || null;

  // Resolve the stable sourceIdentity for this stop's hero (for cache keying).
  const heroAsset = heroId ? assets.find(a => a.id === heroId) : null;
  const stableSourceIdentity = (() => {
    if (heroAsset?.sourceName) return heroAsset.sourceName;
    if (heroUrl && !heroUrl.startsWith('data:')) {
      const m = heroUrl.match(/\/([^\/?#]+)(?:\?|#|$)/);
      return m ? m[1] : null;
    }
    return null;
  })();

  const fireGenerate = async (promptText, qlt, opts = {}) => {
    const pid = 'pending-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    setPending(p => [...p, { pid, prompt: promptText, quality: qlt, styleLabel: opts.styleLabel || null }]);

    // Cache check: if this (sourceIdentity, styleId) exists in IDB, restore
    // it for $0. Only for style-tagged calls — free-form re-imagines aren't
    // cacheable because the prompt is arbitrary.
    const sid = opts.sourceIdentity || stableSourceIdentity;
    if (sid && opts.styleId && window.lcVariantCacheGet) {
      try {
        const key = window.lcVariantCacheKey(sid, opts.styleId);
        const cached = await window.lcVariantCacheGet(key);
        if (cached && cached.url) {
          storeActions.addGeneratedVariant(stop.n, {
            url: cached.url,
            prompt: cached.prompt || promptText,
            revisedPrompt: cached.revisedPrompt,
            quality: cached.quality || qlt,
            styleLabel: cached.styleLabel || opts.styleLabel || null,
            styleId: opts.styleId,
            sourceIdentity: sid,
          });
          setPending(p => p.filter(x => x.pid !== pid));
          return;
        }
      } catch (_) {}
    }

    try {
      const args = { prompt: promptText, quality: qlt };
      if (opts.sourceFile) args.sourceFile = opts.sourceFile;
      else if (opts.sourceUrl) args.sourceUrl = opts.sourceUrl;
      else if (sourceImage) args.sourceFile = sourceImage.file;
      else if (heroUrl) args.sourceUrl = heroUrl;
      const result = await window.LCGenerateImage(args);
      storeActions.addGeneratedVariant(stop.n, {
        url: result.url, prompt: promptText, revisedPrompt: result.revisedPrompt, quality: qlt,
        styleLabel: opts.styleLabel || null,
        styleId: opts.styleId || null,
        sourceIdentity: sid,
      });
      setPending(p => p.filter(x => x.pid !== pid));
    } catch (err) {
      setPending(p => p.filter(x => x.pid !== pid));
      setLastError(err.message);
      if (err.message.includes('NO_KEY')) setShowKeyModal(true);
    }
  };

  const handleNew = () => fireGenerate(prompt.trim() || fallbackPrompt, quality);
  const handleRegenerate = (v) => fireGenerate(v.prompt || prompt, v.quality || quality, { styleLabel: v.styleLabel || null });
  const handleGenerateAllStyles = async () => {
    if (!sourceImage && !heroUrl) { setLastError('Need a source image or hero first.'); return; }
    const sourceArg = sourceImage ? { sourceFile: sourceImage.file } : { sourceUrl: heroUrl };
    const presets = getStylePresets();
    // Dedup: skip styles where a variant with the same prompt already exists.
    const missing = presets.filter(style =>
      !variants.some(v => v.prompt === style.prompt || v.styleLabel === style.label || v.styleId === style.id)
    );
    for (const style of missing) {
      fireGenerate(style.prompt, 'low', { ...sourceArg, styleLabel: style.label, styleId: style.id });
    }
  };
  const handleSingleStyle = (style) => {
    if (!sourceImage && !heroUrl) { setLastError('Need a source image or hero first.'); return; }
    const sourceArg = sourceImage ? { sourceFile: sourceImage.file } : { sourceUrl: heroUrl };
    fireGenerate(style.prompt, 'low', { ...sourceArg, styleLabel: style.label, styleId: style.id });
  };

  // When the user opens a stop that has NO generated variants yet, auto-kick
  // the 6-style batch for just this stop. Cache-first: if all 6 are already
  // in IDB, we restore them instantly for $0. If the cache has partial hits,
  // we only generate the missing ones. One-shot per (stop, session), and —
  // critically — the session flag is only set if variants actually landed
  // (so rate-limit failures can be retried on next stop open).
  React.useEffect(() => {
    if (!heroUrl) return;
    if (variants.length >= getStylePresets().length) return;
    if (pending.length > 0) return;
    const sessionKey = 'lc_autogen_stop_' + (window.LCStore?.getState?.().project?.slug || 'x') + '_' + stop.n;
    try {
      if (sessionStorage.getItem(sessionKey) === '1') return;
    } catch (_) {}
    const t = setTimeout(async () => {
      // Re-check in case variants landed during the wait.
      const cur = window.LCStore?.getState?.();
      const existing = (cur?.assetsPool || []).filter(a => a.stop === stop.n && a.tone === 'generated');
      const presets = getStylePresets();
      const existingKeys = new Set(existing.map(v => v.styleId).filter(Boolean));
      const existingLabels = new Set(existing.map(v => v.styleLabel).filter(Boolean));
      const missing = presets.filter(s =>
        !existingKeys.has(s.id) && !existingLabels.has(s.label)
      );
      if (!missing.length) return;
      // Mark attempted so repeated stop visits don't re-queue 6 every time.
      try { sessionStorage.setItem(sessionKey, '1'); } catch (_) {}
      for (const style of missing) {
        fireGenerate(style.prompt, 'low', { sourceUrl: heroUrl, styleLabel: style.label, styleId: style.id });
      }
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop.n, heroUrl, variants.length]);
  const handleSourceUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage({ file, dataUrl: String(reader.result), label: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="lc-variants" data-mode={mode}>
      <div className="lc-variants-hdr">
        <div className="eyebrow">
          Re-imagine the hero
          {variants.length > 0 && <span style={{ marginLeft: 8, opacity: 0.7 }}>· {variants.length} variant{variants.length === 1 ? '' : 's'}</span>}
          {pending.length > 0 && <span style={{ marginLeft: 8, opacity: 0.7 }}>({pending.length} generating…)</span>}
          {variants.length > 0 && <span style={{ marginLeft: 10, opacity: 0.55 }}>≈${totalCost.toFixed(2)} spent</span>}
        </div>
        <div className="row gap-8 items-center">
          {variants.length > 1 && (
            <button className="mono-sm" style={{ opacity: 0.7 }} onClick={() => storeActions.clearUnusedVariants(stop.n)}>
              Clear unused
            </button>
          )}
        </div>
      </div>

      <div className="lc-variants-prompt">
        {!effectiveSrcUrl ? (
          <div className="row gap-8 items-center" style={{ padding: 12, border: '1px dashed currentColor', background: 'oklch(from currentColor l c h / 0.04)' }}>
            <div style={{ flex: 1 }} className="mono-sm">
              Upload a source image first — re-imagine needs a hero (or an uploaded source) to work from.
            </div>
            <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
              Upload source
              <input type="file" accept="image/*" style={{ display: 'none' }}
                     onChange={(e) => handleSourceUpload(e.target.files?.[0])} />
            </label>
          </div>
        ) : (
          <>
            <div className="row gap-8 items-start" style={{ marginBottom: 8 }}>
              <img src={effectiveSrcUrl} alt="source"
                   style={{ width: 60, height: 60, objectFit: 'cover', border: '1px solid currentColor', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={describing ? 'Describing the source image…' : 'How should this image be re-imagined?'}
                  rows={2}
                  style={{ width: '100%' }}
                />
                <div className="mono-sm" style={{ opacity: 0.55, marginTop: 2 }}>
                  SOURCE · {sourceImage ? sourceImage.label : 'current hero'}
                  {describing && <span style={{ marginLeft: 8 }}>· describing…</span>}
                  <label style={{ cursor: 'pointer', marginLeft: 8, textDecoration: 'underline' }}>
                    {sourceImage ? 'change' : 'upload different source'}
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                           onChange={(e) => handleSourceUpload(e.target.files?.[0])} />
                  </label>
                  {sourceImage && (
                    <button className="mono-sm" style={{ marginLeft: 8 }}
                            onClick={() => setSourceImage(null)}>revert to hero</button>
                  )}
                </div>
              </div>
            </div>
            <div className="row gap-8 items-center" style={{ marginTop: 8 }}>
              <div className="row gap-4 items-center">
                {['low', 'medium', 'high'].map(q => (
                  <button key={q} className={'chip ' + (quality === q ? 'chip-solid' : '')} onClick={() => setQuality(q)}>
                    {q} · ${VARIANT_COST[q].toFixed(2)}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <div className="row gap-4 items-center">
                <button className="btn btn-sm" onClick={handleNew}>
                  ⚡ Re-imagine
                </button>
                <button className="btn btn-solid btn-sm lc-gen-cta" onClick={handleGenerateAllStyles}
                        title="Generate one low-quality variant per preset (6 images, ~$0.12)">
                  🎨 Generate 6 styles ($0.12)
                </button>
              </div>
            </div>
            <div className="row gap-4 items-center" style={{ marginTop: 6 }}>
              <button className="mono-sm" style={{ opacity: 0.65, textDecoration: 'underline' }}
                      onClick={() => setShowStyleChips(s => !s)}>
                {showStyleChips ? 'hide quick styles' : 'pick specific style ▾'}
              </button>
              {showStyleChips && (
                <div className="row gap-4 items-center" style={{ flexWrap: 'wrap', marginLeft: 8 }}>
                  {STYLE_PRESETS.map(s => (
                    <button key={s.id} className="chip"
                            title={s.prompt}
                            onClick={() => handleSingleStyle(s)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {lastError && (
          <div className="mono-sm" style={{ color: 'var(--status-failed)', marginTop: 6 }}>
            {lastError} <button className="mono-sm" onClick={() => setLastError(null)} style={{ marginLeft: 8 }}>dismiss</button>
          </div>
        )}
      </div>

      {(variants.length > 0 || pending.length > 0) && (
        <div className="lc-variants-grid">
          {pending.map(p => (
            <div key={p.pid} className="lc-variant-cell" data-pending="true">
              <div className="lc-variant-spinner" />
              <div className="mono-sm" style={{ opacity: 0.7, marginTop: 8 }}>generating…</div>
              {p.styleLabel && (
                <div className="mono-sm" style={{ opacity: 0.7, marginTop: 2, fontSize: 10 }}>{p.styleLabel}</div>
              )}
              <div className="mono-sm" style={{ opacity: 0.45, marginTop: 4, fontSize: 9 }}>{p.quality}</div>
            </div>
          ))}
          {variants.map(v => (
            <div key={v.id} className="lc-variant-cell" data-hero={v.id === heroId}>
              <Img src={v.imageUrl} label="VARIANT" tone="warm" ratio="1/1" style={{ aspectRatio: 'auto', height: 120 }} />
              {v.styleLabel && (
                <div className="mono-sm" style={{ opacity: 0.75, marginTop: 2, fontSize: 10, fontWeight: 600 }}>
                  {v.styleLabel}
                </div>
              )}
              <div className="lc-variant-actions">
                {v.id === heroId
                  ? <span className="mono-sm lc-variant-badge">HERO</span>
                  : <button className="mono-sm" title="Use as the hero for this stop" onClick={() => { storeActions.setHeroAssetId(stop.n, v.id); storeActions.setStopStatus(stop.n, { hero: true }); }}>Use as hero</button>
                }
                {v.id === stop.postcard?.artAssetId
                  ? <span className="mono-sm lc-variant-badge" style={{ background: 'var(--mode-accent, #8a3a2a)', color: '#fff' }}>POSTCARD</span>
                  : <button className="mono-sm" title="Use this AI art as the postcard front" onClick={() => { if (window.storeActions?.setPostcardArt) window.storeActions.setPostcardArt(stop.n, v.id); }}>✉️ Postcard</button>
                }
                <button className="mono-sm" title="Regenerate with same prompt" onClick={() => handleRegenerate(v)}>Regen</button>
                <button className="mono-sm" style={{ color: 'var(--status-failed)' }} onClick={() => storeActions.deleteAsset(v.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showKeyModal && <KeyPasteModal onClose={() => setShowKeyModal(false)} onUseDefault={() => setShowKeyModal(false)} />}
    </div>
  );
}

// ---- Asset strip (per-stop) -----------------------------------------------
function AssetStrip({ stop, assets }) {
  const assigned = assets.filter(a => (stop.assetIds || []).includes(a.id) || a.stop === stop.n);
  const heroId = stop.heroAssetId;
  const setHero = (id) => { storeActions.setHeroAssetId(stop.n, id); storeActions.setStopStatus(stop.n, { hero: true }); };
  const onDragStart = (e, id) => {
    e.dataTransfer.setData(MIME_ASSET, id);
    e.dataTransfer.effectAllowed = 'copyMove';
  };
  const handleDelete = (a, ev) => {
    ev.stopPropagation();
    const isHero = a.id === heroId;
    const msg = isHero
      ? `Delete "${a.id}"? It's the current hero — the stop will lose its hero.`
      : `Delete asset "${a.id}" permanently?`;
    if (confirm(msg)) storeActions.deleteAsset(a.id);
  };
  if (assigned.length === 0) {
    return (
      <div className="mono-sm" style={{ opacity: 0.55, padding: '8px 2px' }}>
        No assets here yet. Drag from the Assets pool → or drop a file on the hero slot.
      </div>
    );
  }
  return (
    <div className="asset-strip">
      {assigned.map(a => (
        <AssetStripCell
          key={a.id}
          asset={a}
          isHero={a.id === heroId}
          onDragStart={onDragStart}
          onSetHero={() => setHero(a.id)}
          onDelete={handleDelete}
        />
      ))}
      <label className="cell" style={{ borderStyle: 'dashed', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
        <span className="mono-sm" style={{ opacity: 0.55 }}>+ upload</span>
        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => {
          [...(e.target.files || [])].forEach(file => handleFileAsset(file, stop.n));
          e.target.value = '';
        }} />
      </label>
    </div>
  );
}

function AssetStripCell({ asset, isHero, onDragStart, onSetHero, onDelete }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      className="cell"
      data-hero={isHero}
      draggable
      onDragStart={(e) => onDragStart(e, asset.id)}
      onClick={onSetHero}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Click to set as hero · drag to move · hover → × to delete"
      style={{ cursor: 'grab', position: 'relative' }}
    >
      {asset.imageUrl
        ? <Img src={asset.imageUrl} label={asset.id.toUpperCase()} tone={asset.tone} ratio="1/1" style={{ aspectRatio: 'auto', height: '100%' }} />
        : <Img label={asset.id.toUpperCase()} tone={asset.tone} ratio="1/1" style={{ aspectRatio: 'auto', height: '100%' }} />
      }
      {hover && (
        <button
          className="mono-sm"
          title="Delete this asset permanently"
          onClick={(e) => onDelete(asset, e)}
          style={{
            position: 'absolute', top: 4, right: 4,
            padding: '1px 6px', fontSize: 10, background: 'rgba(190,40,40,0.92)', color: 'white',
            border: 'none', cursor: 'pointer', lineHeight: 1.2,
          }}
        >×</button>
      )}
    </div>
  );
}

// ---- Story editor (real, editable) ----------------------------------------
const NODE_TEMPLATES = {
  paragraph:   { type: 'paragraph',   content: '' },
  heroImage:   { type: 'heroImage',   assetId: null, caption: '' },
  inlineImage: { type: 'inlineImage', assetId: null, caption: '', align: 'left' },
  pullQuote:   { type: 'pullQuote',   content: '' },
  mediaEmbed:  { type: 'mediaEmbed',  taskId: null, caption: '' },
  metaRow:     { type: 'metaRow',     content: ['', '', '', ''] },
};

function StoryEditor({ stopId, mode, assets }) {
  const body = useLCStore(s => s.stops.find(st => st.n === stopId)?.body || []);
  const tasks = useLCStore(s => s.mediaTasks);
  const [selectedIdx, setSelectedIdx] = React.useState(null);
  const [slashOpen, setSlashOpen]     = React.useState(false);

  const insert = (type, idx) => {
    const tpl = JSON.parse(JSON.stringify(NODE_TEMPLATES[type]));
    const at = idx == null ? body.length : idx;
    storeActions.insertBodyNode(stopId, tpl, at);
    setSelectedIdx(at);
    setSlashOpen(false);
  };
  const update = (idx, patch) => storeActions.updateBodyNode(stopId, idx, patch);
  const del    = (idx) => {
    storeActions.deleteBodyNode(stopId, idx);
    setSelectedIdx(null);
  };
  const move   = (from, to) => storeActions.moveBodyNode(stopId, from, to);

  return (
    <div style={{ position: 'relative' }}>
      {body.length === 0 && (
        <div style={{ padding: '28px 0' }}>
          <p className="n-para" style={{ opacity: 0.6, fontStyle: 'italic' }}>
            Nothing written for Stop {stopId} yet — click <strong style={{ opacity: 1, fontStyle: 'normal' }}>+ add block</strong> below to start.
          </p>
        </div>
      )}

      {body.map((node, i) => (
        <EditableNode
          key={i}
          idx={i}
          node={node}
          mode={mode}
          assets={assets}
          tasks={tasks}
          stopId={stopId}
          selected={selectedIdx === i}
          onSelect={() => setSelectedIdx(i)}
          onUpdate={(patch) => update(i, patch)}
          onDelete={() => del(i)}
          onMoveUp={() => i > 0 && move(i, i - 1)}
          onMoveDown={() => i < body.length - 1 && move(i, i + 1)}
          onInsertAfter={(type) => insert(type, i + 1)}
        />
      ))}

      <div style={{ position: 'relative', padding: '12px 0 4px' }}>
        <button
          className="mono-sm"
          style={{ opacity: 0.75, cursor: 'pointer', padding: '6px 0' }}
          onClick={() => setSlashOpen(o => !o)}
        >
          + add block <span style={{ marginLeft: 6, opacity: 0.8 }}>/</span>
        </button>
        {slashOpen && (
          <div className="slash" style={{ top: 34, left: 0, zIndex: 30 }}>
            {[
              ['Paragraph',   'paragraph',   'Enter'],
              ['Hero image',  'heroImage',   '/hero'],
              ['Inline image','inlineImage', '/img'],
              ['Pull quote',  'pullQuote',   '/quote'],
              ['Media embed', 'mediaEmbed',  '/embed'],
              ['Meta row',    'metaRow',     '/meta'],
            ].map(([label, type, kbd], i) => (
              <div key={type} className="slash-item" data-focus={i === 0} onClick={() => insert(type)}>
                <span>{label}</span>
                <span className="slash-kbd">{kbd}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// One editable body block; renders an editor by node.type
function EditableNode({ idx, node, mode, assets, tasks, stopId, selected, onSelect, onUpdate, onDelete, onMoveUp, onMoveDown, onInsertAfter }) {
  const hint = { paragraph: 'PARA', heroImage: 'HERO', inlineImage: 'INLINE', pullQuote: 'QUOTE', mediaEmbed: 'EMBED', metaRow: 'META' }[node.type] || 'NODE';
  return (
    <div className="node" data-selected={selected} onClick={(e) => { e.stopPropagation(); onSelect(); }} style={{ position: 'relative' }}>
      <NodeBody node={node} mode={mode} assets={assets} tasks={tasks} stopId={stopId} onUpdate={onUpdate} />
      <span className="node-hint">{hint}</span>
      {selected && (
        <div style={{
          position: 'absolute', top: -10, right: -10,
          display: 'flex', gap: 4, background: 'var(--mode-bg, white)',
          border: '1px solid currentColor', padding: 3, zIndex: 5,
        }}>
          <button className="mono-sm" title="Move up" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} style={{ padding: '2px 6px' }}>↑</button>
          <button className="mono-sm" title="Move down" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} style={{ padding: '2px 6px' }}>↓</button>
          <button className="mono-sm" title="Delete"   onClick={(e) => { e.stopPropagation(); onDelete(); }}   style={{ padding: '2px 6px', color: 'var(--mode-accent)' }}>✕</button>
        </div>
      )}
    </div>
  );
}

function NodeBody({ node, mode, assets, tasks, stopId, onUpdate }) {
  switch (node.type) {
    case 'paragraph':
      return (
        <AutoTextarea
          className="n-para"
          value={node.content || ''}
          placeholder="Write a paragraph…"
          onChange={v => onUpdate({ content: v })}
        />
      );
    case 'pullQuote':
      return (
        <AutoTextarea
          className="n-pull"
          value={node.content || ''}
          placeholder="A pull quote — short, load-bearing."
          onChange={v => onUpdate({ content: v })}
        />
      );
    case 'metaRow':
      return (
        <div className="n-meta">
          {(node.content || ['', '', '', '']).map((c, i) => (
            <input
              key={i}
              value={c}
              onChange={e => {
                const next = [...(node.content || ['', '', '', ''])];
                next[i] = e.target.value;
                onUpdate({ content: next });
              }}
              style={{ borderBottom: '1px dashed currentColor', width: '100%', padding: '2px 0' }}
              placeholder={['time', 'date', 'weather', 'where'][i] || ''}
            />
          ))}
        </div>
      );
    case 'heroImage': {
      const asset = assets.find(a => a.id === node.assetId);
      const url = asset?.imageUrl;
      return (
        <div className="n-hero" style={{ position: 'relative' }}>
          {url ? (
            <>
              <Img src={url} label={node.caption || 'HERO'} tone="warm" ratio={mode === 'cinema' ? '21/9' : '16/9'} className="frame" style={{ aspectRatio: 'auto', height: mode === 'cinema' ? 320 : 380 }} />
              <ImageReplaceOverlay
                assets={assets}
                stopId={stopId}
                currentAssetId={node.assetId}
                onPick={(id) => onUpdate({ assetId: id })}
                onClear={() => onUpdate({ assetId: null })}
              />
            </>
          ) : (
            <AssetPicker assets={assets} stopId={stopId} onPick={(id) => onUpdate({ assetId: id })} />
          )}
          <AutoInput
            className="n-hero-cap"
            value={node.caption || ''}
            placeholder="Caption…"
            onChange={v => onUpdate({ caption: v })}
          />
        </div>
      );
    }
    case 'inlineImage': {
      const asset = assets.find(a => a.id === node.assetId);
      const url = asset?.imageUrl;
      return (
        <div className="n-inline" style={{ position: 'relative' }}>
          {url ? (
            <>
              <Img src={url} label={(node.assetId || '').toUpperCase()} tone="warm" ratio="3/4" className="frame" style={{ aspectRatio: 'auto', height: 240 }} />
              <ImageReplaceOverlay
                assets={assets}
                stopId={stopId}
                currentAssetId={node.assetId}
                onPick={(id) => onUpdate({ assetId: id })}
                onClear={() => onUpdate({ assetId: null })}
                compact
              />
            </>
          ) : (
            <AssetPicker assets={assets} stopId={stopId} onPick={(id) => onUpdate({ assetId: id })} compact />
          )}
          <AutoInput
            className="cap"
            value={node.caption || ''}
            placeholder="Inline caption…"
            onChange={v => onUpdate({ caption: v })}
          />
        </div>
      );
    }
    case 'mediaEmbed': {
      const task = tasks.find(t => t.id === node.taskId);
      return (
        <div className="n-embed">
          <Img label={task ? `${task.kind.toUpperCase()} · ${task.state}` : 'EMBED — pick a task'} tone={mode === 'cinema' ? 'dark' : 'warm'} ratio="16/9" style={{ aspectRatio: 'auto', height: '100%' }} />
          {task
            ? <div className="n-embed-tag">{task.kind} · {task.state}</div>
            : <TaskPicker tasks={tasks} onPick={(id) => onUpdate({ taskId: id })} />
          }
          <AutoInput
            className="cap"
            value={node.caption || ''}
            placeholder={task ? task.prompt : 'Embed caption…'}
            onChange={v => onUpdate({ caption: v })}
            style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}
          />
        </div>
      );
    }
    default: return null;
  }
}

// AssetPicker — project-scoped image chooser. Shows this STOP's assets first
// (the common case: users want to pick from images they've attached to the
// stop they're editing), collapses "other assets in this project" below,
// and includes an inline upload button so they don't have to bounce to the
// Assets pool drawer.
//
// Image segmentation per stop:
//   • hero: the currently-set hero for this stop (highlighted)
//   • variants: AI-generated style variants for this stop
//   • other-attached: other assets attached to this stop (but not hero/variants)
//   • other-project: assets attached to OTHER stops (collapsed by default)
//   • loose: unattached assets
function AssetPicker({ assets, stopId, onPick, compact }) {
  const [open, setOpen] = React.useState(false);
  const [showOther, setShowOther] = React.useState(false);
  const fileInputRef = React.useRef(null);

  if (!open) {
    return (
      <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        {compact ? 'Pick image ▾' : 'Pick an image from this stop →'}
      </button>
    );
  }

  // Buckets.
  const stopState = window.LCStore?.getState?.()?.stops?.find(s => s.n === stopId);
  const heroId = stopState?.heroAssetId;
  const stopAssetIds = new Set(stopState?.assetIds || []);

  const attachedToThisStop = assets.filter(a =>
    a.stop === stopId || stopAssetIds.has(a.id)
  );
  const thisStopHero     = attachedToThisStop.filter(a => a.id === heroId);
  const thisStopVariants = attachedToThisStop.filter(a => a.tone === 'generated' && a.id !== heroId);
  const thisStopOther    = attachedToThisStop.filter(a => a.id !== heroId && a.tone !== 'generated');
  const loose            = assets.filter(a => a.stop === null && !stopAssetIds.has(a.id));
  const otherProject     = assets.filter(a =>
    !attachedToThisStop.includes(a) && !loose.includes(a)
  );

  const handleUpload = (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    let firstId = null;
    files.forEach((file, i) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const id = storeActions.addUploadedAsset({
          stop: stopId, tone: stopState?.tone || 'warm', imageUrl: String(reader.result),
        });
        storeActions.addAssetToStop(stopId, id);
        storeActions.setStopStatus(stopId, { upload: true });
        if (i === 0) { firstId = id; onPick(id); setOpen(false); }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const renderSection = (label, list, { highlight } = {}) => {
    if (!list.length) return null;
    return (
      <div style={{ marginBottom: 10 }}>
        <div className="eyebrow" style={{ marginBottom: 6, fontSize: 10, opacity: 0.7 }}>
          {label} <span style={{ opacity: 0.55 }}>· {list.length}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))', gap: 6 }}>
          {list.map(a => (
            <div
              key={a.id}
              style={{
                cursor: 'pointer',
                border: highlight === a.id ? '2px solid var(--mode-accent, currentColor)' : '1px solid var(--rule)',
                position: 'relative',
              }}
              onClick={(e) => { e.stopPropagation(); onPick(a.id); setOpen(false); }}
              title={a.styleLabel ? `${a.id} · ${a.styleLabel}` : a.id}
            >
              <Img src={a.imageUrl || undefined} label={a.id} tone={a.tone} ratio="1/1" style={{ aspectRatio: 'auto', height: 78 }} />
              {a.tone === 'generated' && (
                <div style={{
                  position: 'absolute', bottom: 2, left: 2, right: 2,
                  background: 'rgba(0,0,0,0.7)', color: 'white',
                  fontSize: 8, padding: '1px 3px', textAlign: 'center',
                  fontFamily: 'var(--f-mono)', textTransform: 'uppercase',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {a.styleLabel ? a.styleLabel.split(' ')[0] : 'AI'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        border: '1px solid currentColor', padding: 10, maxHeight: 460, overflowY: 'auto',
        background: 'var(--mode-bg, white)', minWidth: 300,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="row between items-center" style={{ marginBottom: 10 }}>
        <span className="mono-sm">Pick image for stop {stopId}</span>
        <button className="mono-sm" onClick={() => setOpen(false)}>Close ✕</button>
      </div>

      {/* Inline upload — most direct path. */}
      <div style={{ marginBottom: 10 }}>
        <label className="btn btn-sm btn-solid" style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}>
          ↑ Upload new image
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
        </label>
      </div>

      {renderSection('Current hero', thisStopHero, { highlight: heroId })}
      {renderSection('AI variants for this stop', thisStopVariants)}
      {renderSection('Other assets on this stop', thisStopOther)}
      {renderSection('Loose (unattached)', loose)}

      {otherProject.length > 0 && (
        <div>
          <button
            className="mono-sm"
            onClick={() => setShowOther(s => !s)}
            style={{ opacity: 0.7, marginTop: 6, marginBottom: 6, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showOther ? '− Hide' : '+ Show'} other project assets · {otherProject.length}
          </button>
          {showOther && renderSection('Attached to other stops', otherProject)}
        </div>
      )}

      {attachedToThisStop.length === 0 && loose.length === 0 && otherProject.length === 0 && (
        <div className="mono-sm" style={{ opacity: 0.55, padding: 12, textAlign: 'center' }}>
          No assets yet. Upload above, or drag files onto this stop from the Assets pool.
        </div>
      )}
    </div>
  );
}

// ImageReplaceOverlay — appears on hover over an already-set body image.
// Offers "Replace" (reopens picker) and "Remove" (clears the node). The
// picker it opens is the same project-scoped AssetPicker.
function ImageReplaceOverlay({ assets, stopId, currentAssetId, onPick, onClear, compact }) {
  const [hover, setHover] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', // children re-enable
      }}
    >
      {(hover || pickerOpen) && !pickerOpen && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          display: 'flex', gap: 4, pointerEvents: 'auto',
        }}>
          <button
            className="mono-sm"
            title="Replace with another image"
            onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
            style={{
              padding: '4px 10px', fontSize: 11,
              background: 'rgba(0,0,0,0.75)', color: 'white',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--f-mono)', letterSpacing: '0.05em',
            }}
          >↻ REPLACE</button>
          <button
            className="mono-sm"
            title="Remove this image (keeps the block, empty)"
            onClick={(e) => { e.stopPropagation(); if (confirm('Remove image from this block?')) onClear(); }}
            style={{
              padding: '4px 10px', fontSize: 11,
              background: 'rgba(190,40,40,0.88)', color: 'white',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--f-mono)', letterSpacing: '0.05em',
            }}
          >× REMOVE</button>
        </div>
      )}
      {pickerOpen && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 30,
          pointerEvents: 'auto',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
        }}>
          <InlinePickerPopover
            assets={assets}
            stopId={stopId}
            currentAssetId={currentAssetId}
            onPick={(id) => { onPick(id); setPickerOpen(false); }}
            onClose={() => setPickerOpen(false)}
            compact={compact}
          />
        </div>
      )}
    </div>
  );
}

// InlinePickerPopover — same UI as AssetPicker's open state, just opens
// immediately (no toggle) and used inline on image replace.
function InlinePickerPopover({ assets, stopId, currentAssetId, onPick, onClose, compact }) {
  const [showOther, setShowOther] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const stopState = window.LCStore?.getState?.()?.stops?.find(s => s.n === stopId);
  const heroId = stopState?.heroAssetId;
  const stopAssetIds = new Set(stopState?.assetIds || []);

  const attachedToThisStop = assets.filter(a =>
    a.stop === stopId || stopAssetIds.has(a.id)
  );
  const thisStopHero     = attachedToThisStop.filter(a => a.id === heroId);
  const thisStopVariants = attachedToThisStop.filter(a => a.tone === 'generated' && a.id !== heroId);
  const thisStopOther    = attachedToThisStop.filter(a => a.id !== heroId && a.tone !== 'generated');
  const loose            = assets.filter(a => a.stop === null && !stopAssetIds.has(a.id));
  const otherProject     = assets.filter(a =>
    !attachedToThisStop.includes(a) && !loose.includes(a)
  );

  const handleUpload = (e) => {
    const files = [...(e.target.files || [])];
    files.forEach((file, i) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const id = storeActions.addUploadedAsset({
          stop: stopId, tone: stopState?.tone || 'warm', imageUrl: String(reader.result),
        });
        storeActions.addAssetToStop(stopId, id);
        storeActions.setStopStatus(stopId, { upload: true });
        if (i === 0) onPick(id);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const renderSection = (label, list, { highlight } = {}) => {
    if (!list.length) return null;
    return (
      <div style={{ marginBottom: 10 }}>
        <div className="eyebrow" style={{ marginBottom: 6, fontSize: 10, opacity: 0.7 }}>
          {label} <span style={{ opacity: 0.55 }}>· {list.length}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 6 }}>
          {list.map(a => (
            <div
              key={a.id}
              style={{
                cursor: 'pointer',
                border: highlight === a.id ? '2px solid var(--mode-accent, currentColor)'
                     : currentAssetId === a.id ? '2px solid oklch(0.6 0.2 25)'
                     : '1px solid var(--rule)',
                position: 'relative',
              }}
              onClick={(e) => { e.stopPropagation(); onPick(a.id); }}
              title={a.styleLabel ? `${a.id} · ${a.styleLabel}` : a.id}
            >
              <Img src={a.imageUrl || undefined} label={a.id} tone={a.tone} ratio="1/1" style={{ aspectRatio: 'auto', height: 72 }} />
              {a.tone === 'generated' && (
                <div style={{
                  position: 'absolute', bottom: 2, left: 2, right: 2,
                  background: 'rgba(0,0,0,0.7)', color: 'white',
                  fontSize: 8, padding: '1px 3px', textAlign: 'center',
                  fontFamily: 'var(--f-mono)', textTransform: 'uppercase',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {a.styleLabel ? a.styleLabel.split(' ')[0] : 'AI'}
                </div>
              )}
              {currentAssetId === a.id && (
                <div style={{
                  position: 'absolute', top: 2, right: 2,
                  background: 'oklch(0.6 0.2 25)', color: 'white',
                  fontSize: 8, padding: '1px 4px',
                  fontFamily: 'var(--f-mono)',
                }}>CURRENT</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        border: '1px solid currentColor', padding: 10,
        maxHeight: 400, overflowY: 'auto',
        background: 'var(--mode-bg, white)', minWidth: 300, width: 360,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="row between items-center" style={{ marginBottom: 10 }}>
        <span className="mono-sm">Replace image · stop {stopId}</span>
        <button className="mono-sm" onClick={onClose}>Close ✕</button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label className="btn btn-sm btn-solid" style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}>
          ↑ Upload new image
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
        </label>
      </div>

      {renderSection('Current hero', thisStopHero, { highlight: heroId })}
      {renderSection('AI variants for this stop', thisStopVariants)}
      {renderSection('Other assets on this stop', thisStopOther)}
      {renderSection('Loose (unattached)', loose)}

      {otherProject.length > 0 && (
        <div>
          <button
            className="mono-sm"
            onClick={() => setShowOther(s => !s)}
            style={{ opacity: 0.7, marginTop: 6, marginBottom: 6, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showOther ? '− Hide' : '+ Show'} other project assets · {otherProject.length}
          </button>
          {showOther && renderSection('Attached to other stops', otherProject)}
        </div>
      )}
    </div>
  );
}

function TaskPicker({ tasks, onPick }) {
  return (
    <select
      onChange={(e) => e.target.value && onPick(e.target.value)}
      style={{ background: 'transparent', border: '1px solid currentColor', padding: '4px 6px', fontFamily: 'var(--f-mono)', fontSize: 11 }}
      defaultValue=""
    >
      <option value="">Pick a media task…</option>
      {tasks.map(t => (
        <option key={t.id} value={t.id}>{t.id} · stop {t.stopId} · {t.state}</option>
      ))}
    </select>
  );
}

function AutoTextarea({ value, onChange, placeholder, className, style }) {
  const ref = React.useRef(null);
  const resize = () => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };
  React.useEffect(resize, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      onChange={e => { onChange(e.target.value); resize(); }}
      onInput={resize}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '100%', resize: 'none', background: 'transparent',
        border: 'none', outline: 'none', padding: 0, margin: 0,
        minHeight: 24,
        fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit',
        ...style,
      }}
    />
  );
}

function AutoInput({ value, onChange, placeholder, className, style }) {
  return (
    <input
      className={className}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '100%', background: 'transparent', border: 'none', outline: 'none',
        borderBottom: '1px dashed currentColor', padding: '2px 0',
        ...style,
      }}
    />
  );
}

// ---- Postcard preview tile ------------------------------------------------
function PostcardTile({ stop, mode, heroUrl }) {
  const postcard = stop.postcard || { message: '', recipient: {} };
  const assets = useLCStore(s => s.assetsPool);
  const totalStops = useLCStore(s => s.stops.length);
  const palette = (typeof usePalette === 'function') ? usePalette(stop, assets) : [];
  // The front of the postcard may be AI art (if the user picked one in the
  // editor) or the plain hero. Use THAT url to drive the preview and to
  // decide portrait vs landscape — matches PDF export + editor behavior.
  const frontUrl = postcardFrontUrlFor(stop, assets);
  const orientation = useImageOrientation(frontUrl || heroUrl);
  const isPortrait = orientation === 'portrait';
  const aspect = isPortrait ? '5/7' : '7/5';
  const tileMaxWidth = isPortrait ? 360 : 520;
  return (
    <div className="lc-postcard-tile" style={{ maxWidth: tileMaxWidth }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="mono-sm" style={{ opacity: 0.55, marginBottom: 6 }}>FRONT</div>
          <div style={{ aspectRatio: aspect, boxShadow: '0 12px 28px rgba(0,0,0,0.14)', position: 'relative' }}>
            <PostcardFrontMini mode={mode} heroUrl={frontUrl || heroUrl} stop={stop} palette={palette} totalStops={totalStops} orientation={orientation} />
          </div>
        </div>
        <div>
          <div className="mono-sm" style={{ opacity: 0.55, marginBottom: 6 }}>BACK</div>
          <div style={{ aspectRatio: aspect, boxShadow: '0 12px 28px rgba(0,0,0,0.14)', position: 'relative' }}>
            <PostcardBackMini stop={stop} postcard={postcard} orientation={orientation} />
          </div>
        </div>
      </div>
      <div className="row between items-center" style={{ marginTop: 12 }}>
        <span className="mono-sm" style={{ opacity: 0.6 }}>Postcard · {mode} · {isPortrait ? '105×148 mm portrait' : '148×105 mm landscape'} · auto-regenerates on mode switch</span>
        <button className="btn btn-sm" onClick={() => { location.hash = '#postcard/' + stop.n; }}>Open editor →</button>
      </div>
    </div>
  );
}

function PostcardBackMini({ stop, postcard, orientation = 'landscape' }) {
  const message = postcard?.message || '';
  const recipient = postcard?.recipient || {};
  const isPortrait = orientation === 'portrait';
  if (isPortrait) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'oklch(0.96 0.008 60)',
        color: 'oklch(0.15 0.008 60)',
        padding: 12,
        display: 'grid', gridTemplateRows: '3fr 2fr', gap: 10,
        fontFamily: 'var(--f-mono)',
        overflow: 'hidden',
      }}>
        <div style={{ borderBottom: '1px solid oklch(0.82 0.01 60)', paddingBottom: 8 }}>
          {message ? (
            <div style={{ fontFamily: 'var(--f-hand)', fontSize: 13, lineHeight: 1.3, color: 'oklch(0.25 0.02 240)', whiteSpace: 'pre-wrap' }}>
              {message.length > 140 ? message.slice(0, 140) + '…' : message}
            </div>
          ) : (
            <div style={{ fontStyle: 'italic', opacity: 0.45, fontSize: 11 }}>
              Click "Open editor →" to write your note
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 7, letterSpacing: '0.2em', opacity: 0.6, marginBottom: 6 }}>LONDON CUTS · {stop.n}</div>
          {['name', 'line1', 'line2', 'country'].map(k => (
            <div key={k} style={{ borderBottom: '1px solid oklch(0.55 0.01 60 / 0.4)', fontSize: 9, padding: '2px 0', minHeight: 12 }}>
              {recipient[k] || <span style={{ opacity: 0.35 }}>—</span>}
            </div>
          ))}
          <div style={{
            position: 'absolute', right: 0, top: 0,
            width: 26, height: 32, border: '1px dashed oklch(0.55 0.01 60 / 0.5)',
            fontSize: 5, textAlign: 'center', lineHeight: 1.3, padding: 2,
          }}>
            1ST<br/>CLASS
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'oklch(0.96 0.008 60)',
      color: 'oklch(0.15 0.008 60)',
      padding: 12,
      display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 10,
      fontFamily: 'var(--f-mono)',
      overflow: 'hidden',
    }}>
      <div style={{ borderRight: '1px solid oklch(0.82 0.01 60)', paddingRight: 8 }}>
        {message ? (
          <div style={{ fontFamily: 'var(--f-hand)', fontSize: 13, lineHeight: 1.3, color: 'oklch(0.25 0.02 240)', whiteSpace: 'pre-wrap' }}>
            {message.length > 140 ? message.slice(0, 140) + '…' : message}
          </div>
        ) : (
          <div style={{ fontStyle: 'italic', opacity: 0.45, fontSize: 11 }}>
            Click "Open editor →" to write your note
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 7, letterSpacing: '0.2em', opacity: 0.6, marginBottom: 6 }}>LONDON CUTS · {stop.n}</div>
        {['name', 'line1', 'line2', 'country'].map(k => (
          <div key={k} style={{ borderBottom: '1px solid oklch(0.55 0.01 60 / 0.4)', fontSize: 9, padding: '2px 0', minHeight: 12 }}>
            {recipient[k] || <span style={{ opacity: 0.35 }}>—</span>}
          </div>
        ))}
        <div style={{
          width: 26, height: 32, border: '1px dashed oklch(0.55 0.01 60 / 0.5)',
          marginTop: 8, marginLeft: 'auto', fontSize: 5, textAlign: 'center', lineHeight: 1.3, padding: 2,
        }}>
          1ST<br/>CLASS
        </div>
      </div>
    </div>
  );
}

function PostcardFrontMini({ mode, heroUrl, stop, palette, totalStops, orientation }) {
  // Fallback: resolve palette + totalStops at usage time when not passed in
  // (e.g. if a future caller renders this without going through PostcardTile).
  const assets = useLCStore(s => s.assetsPool);
  const storeTotal = useLCStore(s => s.stops.length);
  const resolvedPalette = palette || ((typeof usePalette === 'function') ? usePalette(stop, assets) : []);
  const total = totalStops || storeTotal || 12;
  const autoOrientation = useImageOrientation(heroUrl);
  const effOrientation = orientation || autoOrientation;
  const isPortrait = effOrientation === 'portrait';

  const punkAccent     = resolvedPalette[2] || 'oklch(0.62 0.24 25)';
  const fashionInk     = resolvedPalette[0] || 'oklch(0.2 0.02 40)';
  const cinemaSubtitle = resolvedPalette[3] || 'oklch(0.88 0.14 90)';

  const img = heroUrl
    ? <img src={heroUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    : <Img label={stop.label} tone={mode === 'cinema' ? 'dark' : mode === 'punk' ? 'punk' : 'warm'} style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', height: '100%' }} />;

  // Text styles that MUST shrink with container. Every postcard render wraps
  // its outer container with `containerType: 'inline-size'`, and every sized
  // text block uses `cqw` units so nothing overflows at small preview sizes.
  const wrap = { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', containerType: 'inline-size' };
  const clampFs = (minPx, cqw, maxPx) => `clamp(${minPx}px, ${cqw}cqw, ${maxPx}px)`;
  const textSafe = { overflowWrap: 'break-word', wordBreak: 'break-word', hyphens: 'auto' };

  if (mode === 'punk') {
    const titleWord = (stop.label || stop.title || 'HERE').split('·')[0].trim().toUpperCase().split(' ').slice(0, 3).join(' ');
    // The taped "tag" in the corner — use the stop's code (first token), or
    // the first word of the label as a shorter fallback. No hardcoded 'SE1!!'.
    const tagWord = (() => {
      const code = (stop.code || '').split(' ')[0];
      if (code && code.length <= 6) return code;
      const firstWord = titleWord.split(' ')[0];
      return firstWord.slice(0, 8) || 'HERE';
    })();
    if (isPortrait) {
      return (
        <div style={{ ...wrap, background: 'black' }}>
          {img}
          <div style={{ position: 'absolute', top: '4cqw', right: '4cqw', background: punkAccent, color: 'white', padding: '1.5cqw 3cqw', fontFamily: 'var(--f-display)', fontSize: clampFs(10, 5, 18), transform: 'rotate(-3deg)', lineHeight: 1 }}>{tagWord}!!</div>
          <div style={{ position: 'absolute', top: '6cqw', left: '6cqw', right: '6cqw', fontFamily: 'var(--f-display)', fontSize: clampFs(12, 11, 42), color: 'white', textTransform: 'uppercase', lineHeight: 0.92, textShadow: `0.5cqw 0.5cqw 0 ${punkAccent}`, ...textSafe }}>
            GREETINGS<br/>FROM<br/>{titleWord}
          </div>
        </div>
      );
    }
    return (
      <div style={{ ...wrap, background: 'black' }}>
        {img}
        <div style={{ position: 'absolute', top: '3cqw', left: '3cqw', background: punkAccent, color: 'white', padding: '1cqw 2cqw', fontFamily: 'var(--f-display)', fontSize: clampFs(10, 3.5, 18), transform: 'rotate(-3deg)', lineHeight: 1 }}>{tagWord}!!</div>
        <div style={{ position: 'absolute', bottom: '4cqw', left: '4cqw', right: '4cqw', fontFamily: 'var(--f-display)', fontSize: clampFs(12, 8.5, 46), color: 'white', textTransform: 'uppercase', lineHeight: 0.9, textShadow: `0.5cqw 0.5cqw 0 ${punkAccent}`, ...textSafe }}>
          GREETINGS<br/>FROM<br/>{titleWord}
        </div>
      </div>
    );
  }
  if (mode === 'cinema') {
    if (isPortrait) {
      return (
        <div style={{ ...wrap, background: 'oklch(0.1 0.015 250)' }}>
          {img}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '5cqw', background: 'black' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '5cqw', background: 'black' }} />
          <div style={{ position: 'absolute', bottom: '3cqw', left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.5)', padding: '1cqw 3cqw', fontFamily: 'var(--f-mono)', fontSize: clampFs(8, 3, 13), color: cinemaSubtitle, maxWidth: '86%', ...textSafe }}>
              — {stop.mood} · {stop.time}
            </div>
          </div>
          <div style={{ position: 'absolute', top: '3cqw', left: '7cqw', right: '7cqw', fontFamily: 'var(--f-mono)', fontSize: clampFs(7, 2.4, 11), color: cinemaSubtitle, letterSpacing: '0.2em', ...textSafe }}>
            SCENE {stop.n} · {stop.time}
          </div>
        </div>
      );
    }
    return (
      <div style={{ ...wrap, background: 'oklch(0.1 0.015 250)' }}>
        {img}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5cqw', background: 'black' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '5cqw', background: 'black' }} />
        <div style={{ position: 'absolute', bottom: '7cqw', left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.5)', padding: '0.8cqw 2.5cqw', fontFamily: 'var(--f-mono)', fontSize: clampFs(8, 2.3, 13), color: cinemaSubtitle, maxWidth: '88%', ...textSafe }}>
            — {stop.mood} · {stop.time}
          </div>
        </div>
        <div style={{ position: 'absolute', top: '7cqw', left: '3cqw', right: '3cqw', fontFamily: 'var(--f-mono)', fontSize: clampFs(7, 1.8, 11), color: cinemaSubtitle, letterSpacing: '0.2em', ...textSafe }}>
          SCENE {stop.n} · {stop.time}
        </div>
      </div>
    );
  }
  const titleWord = stop.title.split(' ').slice(0, 2).join(' ');
  if (isPortrait) {
    return (
      <div style={{ ...wrap, background: 'oklch(0.98 0.008 75)', display: 'grid', gridTemplateRows: '3fr 2fr' }}>
        <div style={{ position: 'relative' }}>{img}</div>
        <div style={{ padding: '4.5cqw', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: clampFs(7, 2, 11), letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.7, ...textSafe }}>LONDON · {stop.code}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--f-fashion)', fontSize: clampFs(12, 7, 32), fontStyle: 'italic', lineHeight: 1, color: fashionInk, ...textSafe }}>
              {titleWord}
            </div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: clampFs(7, 2, 11), letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2cqw', opacity: 0.6 }}>ED. 01 / {stop.n} OF {total}</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...wrap, background: 'oklch(0.98 0.008 75)', display: 'grid', gridTemplateColumns: '2fr 3fr' }}>
      <div style={{ padding: '4cqw', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: clampFs(7, 1.8, 11), letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.7, ...textSafe }}>LONDON · {stop.code}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--f-fashion)', fontSize: clampFs(12, 6, 34), fontStyle: 'italic', lineHeight: 1, color: fashionInk, ...textSafe }}>
            {titleWord}
          </div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: clampFs(7, 1.8, 11), letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2cqw', opacity: 0.6 }}>ED. 01 / {stop.n} OF {total}</div>
        </div>
      </div>
      <div style={{ position: 'relative' }}>{img}</div>
    </div>
  );
}

// ---- Drawers (Assets pool · Media queue) ----------------------------------
function WSDrawers({ tab, onTab, selectedStop, mode }) {
  return (
    <aside className="drawers">
      <div className="drawer-tabs">
        <button className="drawer-tab" data-active={tab === 'assets'} onClick={() => onTab('assets')}>
          <TabGlyph char="A" />Assets pool
        </button>
        <button className="drawer-tab" data-active={tab === 'queue'} onClick={() => onTab('queue')}>
          <TabGlyph char="Q" />Media queue
        </button>
      </div>
      <div className="drawer-body">
        {tab === 'assets' ? <AssetsPoolDrawer selectedStop={selectedStop} /> : <MediaQueueDrawer selectedStop={selectedStop} mode={mode} />}
      </div>
    </aside>
  );
}

function AssetsPoolDrawer({ selectedStop }) {
  const assets = useLCStore(s => s.assetsPool);
  const loose    = assets.filter(a => a.stop === null);
  const assigned = assets.filter(a => a.stop !== null);

  const onDragStart = (e, id) => {
    e.dataTransfer.setData(MIME_ASSET, id);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDelete = (a, ev) => {
    ev.stopPropagation();
    const usedAsHero = a.stop && window.LCStore?.getState()?.stops.some(s => s.heroAssetId === a.id);
    const msg = usedAsHero
      ? `Delete asset "${a.id}"? It's the hero for stop ${a.stop} — that stop will lose its hero.`
      : `Delete asset "${a.id}" permanently?`;
    if (confirm(msg)) storeActions.deleteAsset(a.id);
  };

  const handleDetach = (a, ev) => {
    ev.stopPropagation();
    if (!a.stop) return;
    storeActions.removeAssetFromStop(a.stop, a.id);
    // Also detach from pool's stop field so it becomes "loose"
    window.LCStore.setState(s => ({
      ...s,
      assetsPool: s.assetsPool.map(x => x.id === a.id ? { ...x, stop: null } : x),
      stops: s.stops.map(st => st.heroAssetId === a.id ? { ...st, heroAssetId: null, status: { ...st.status, hero: false } } : st),
    }));
  };

  const uploadLoose = (e) => {
    [...(e.target.files || [])].forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        storeActions.addUploadedAsset({ stop: null, tone: 'warm', imageUrl: String(reader.result) });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = ''; // allow re-upload of same file
  };

  const uploadAssigned = (e) => {
    [...(e.target.files || [])].forEach(file => handleFileAsset(file, selectedStop));
    e.target.value = '';
  };

  return (
    <div className="col gap-16">
      <div>
        <div className="row between items-baseline">
          <div className="eyebrow">Uploads · {assets.length} items</div>
          <div className="row gap-8">
            <label className="mono-sm" style={{ opacity: 0.85, cursor: 'pointer' }} title="Upload to pool without attaching to any stop">
              + Loose
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={uploadLoose} />
            </label>
            <label className="mono-sm" style={{ opacity: 0.85, cursor: 'pointer' }} title={selectedStop ? `Upload and attach to stop ${selectedStop}` : 'Select a stop first'}>
              + To stop {selectedStop || ''}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={!selectedStop} onChange={uploadAssigned} />
            </label>
          </div>
        </div>
        <div className="mono-sm" style={{ opacity: 0.55, marginTop: 4 }}>
          Drag an asset onto a stop in the spine — or onto the hero slot. Hover an asset → × to delete, ⇥ to detach.
        </div>
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Loose · {loose.length}</div>
        {loose.length === 0 ? (
          <div className="mono-sm" style={{ opacity: 0.4, fontStyle: 'italic', fontSize: 11 }}>No loose uploads</div>
        ) : (
          <div className="pool-grid">
            {loose.map(a => (
              <AssetPoolCell
                key={a.id}
                asset={a}
                onDragStart={onDragStart}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Assigned · {assigned.length}</div>
        {assigned.length === 0 ? (
          <div className="mono-sm" style={{ opacity: 0.4, fontStyle: 'italic', fontSize: 11 }}>No assets attached to stops yet</div>
        ) : (
          <div className="pool-grid">
            {assigned.map(a => (
              <AssetPoolCell
                key={a.id}
                asset={a}
                onDragStart={onDragStart}
                onDelete={handleDelete}
                onDetach={handleDetach}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Single cell in the AssetsPoolDrawer — shows delete-on-hover controls.
function AssetPoolCell({ asset, onDragStart, onDelete, onDetach }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      className="pool-cell"
      data-assigned={asset.stop !== null}
      data-assigned-stop={asset.stop || undefined}
      draggable
      onDragStart={(e) => onDragStart(e, asset.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: 'grab', position: 'relative' }}
      title={asset.id + (asset.stop ? ' · stop ' + asset.stop : ' · loose')}
    >
      <Img src={asset.imageUrl || undefined} label={asset.id.toUpperCase()} tone={asset.tone} ratio="1/1" style={{ aspectRatio: 'auto', height: '100%' }} />
      {hover && (
        <div style={{ position: 'absolute', top: 3, right: 3, display: 'flex', gap: 2 }}>
          {onDetach && asset.stop && (
            <button
              className="mono-sm"
              title={`Detach from stop ${asset.stop} (make loose)`}
              onClick={(e) => onDetach(asset, e)}
              style={{
                padding: '1px 5px', fontSize: 10, background: 'rgba(0,0,0,0.7)', color: 'white',
                border: 'none', cursor: 'pointer', lineHeight: 1.2,
              }}
            >⇥</button>
          )}
          <button
            className="mono-sm"
            title="Delete this asset permanently"
            onClick={(e) => onDelete(asset, e)}
            style={{
              padding: '1px 6px', fontSize: 10, background: 'rgba(190,40,40,0.92)', color: 'white',
              border: 'none', cursor: 'pointer', lineHeight: 1.2,
            }}
          >×</button>
        </div>
      )}
    </div>
  );
}

function MediaQueueDrawer({ selectedStop, mode }) {
  const tasks = useLCStore(s => s.mediaTasks);
  const counts = {
    running: tasks.filter(t => t.state === 'running').length,
    queued:  tasks.filter(t => t.state === 'queued').length,
    done:    tasks.filter(t => t.state === 'done').length,
    failed:  tasks.filter(t => t.state === 'failed').length,
  };
  const handleInsert = (task) => {
    storeActions.insertBodyNode(task.stopId, { type: 'mediaEmbed', taskId: task.id, caption: task.prompt }, null);
    storeActions.setStopStatus(task.stopId, { media: 'done' });
    if (task.stopId !== selectedStop) storeActions.setActiveStop(task.stopId);
  };
  return (
    <div className="col gap-16">
      <div>
        <div className="eyebrow">Tasks · {tasks.length}</div>
        <div className="mono-sm" style={{ opacity: 0.55, marginTop: 4 }}>
          {counts.running} running · {counts.queued} queued · {counts.done} done · {counts.failed} failed
        </div>
      </div>
      <div>
        {tasks.map(t => (
          <div key={t.id} className="task-card" data-state={t.state}>
            <div className="task-card-hdr">
              <span className="mono-sm">
                <span className="task-dot" data-s={t.state} />
                STOP {t.stopId} · {t.kind}
              </span>
              <span className="mono-sm" style={{ opacity: 0.55 }}>{t.mode}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8, lineHeight: 1.4 }}>{t.prompt}</div>
            <div className="task-bar">
              <div className="task-bar-fill" style={{ width: `${Math.round((t.progress || 0) * 100)}%` }} />
            </div>
            <div className="row between" style={{ marginTop: 6 }}>
              <span className="mono-sm" style={{ opacity: 0.55 }}>
                {t.state === 'running' ? `${Math.round(t.progress * 100)}%` :
                 t.state === 'done'    ? 'result ready · insert →' :
                 t.state === 'failed'  ? 'failed · retry?' :
                 'waiting in queue'}
              </span>
              <div className="row gap-8">
                {t.state === 'failed' && <button className="mono-sm" style={{ color: 'var(--status-failed)' }} onClick={() => storeActions.retryTask(t.id)}>Retry</button>}
                {t.state === 'done'   && <button className="mono-sm" style={{ opacity: 0.85 }} onClick={() => handleInsert(t)}>Insert ↓</button>}
                {t.state === 'queued' && <button className="mono-sm" style={{ opacity: 0.85 }} onClick={() => storeActions.retryTask(t.id)}>Start</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-sm" onClick={() => {
        const id = 'tk_' + Date.now();
        const next = {
          id, kind: 'img2img', stopId: selectedStop || '05', mode,
          state: 'running', progress: 0.02,
          prompt: `New task for stop ${selectedStop || '05'}`,
        };
        window.LCStore.setState(s => ({ ...s, mediaTasks: [...s.mediaTasks, next] }));
      }}>+ New task for stop {selectedStop}</button>
    </div>
  );
}

Object.assign(window, { Workspace, heroUrlFor, postcardFrontUrlFor, MIME_ASSET, MIME_TASK, useImageOrientation, detectOrientationAsync });
