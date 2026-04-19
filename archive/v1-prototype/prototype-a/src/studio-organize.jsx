// studio-upload.jsx + studio-organize.jsx merged — Upload memories + Organize stops

// Tiny classifier: kind from mime + lightweight sniff on name.
function __lcKindFromFile(f) {
  const m = (f.type || '').toLowerCase();
  const n = (f.name || '').toLowerCase();
  if (m.startsWith('image/')) return 'photo';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'voice';
  if (m.startsWith('text/') || n.endsWith('.txt') || n.endsWith('.md')) return 'text';
  if (n.endsWith('.heic') || n.endsWith('.heif')) return 'photo';
  return 'photo';
}

function __lcHumanSize(b) {
  if (b < 1024) return b + 'B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + 'KB';
  if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + 'MB';
  return (b / 1024 / 1024 / 1024).toFixed(2) + 'GB';
}

function ingestFiles(fileList) {
  const arr = Array.from(fileList || []);
  if (arr.length === 0) return [];
  const photoExt = (name) => {
    const n = name.toLowerCase();
    return ['.jpg','.jpeg','.png','.webp','.heic','.heif','.gif'].some(e => n.endsWith(e));
  };
  const assets = arr.map((f, i) => {
    const kind = __lcKindFromFile(f);
    const asset = {
      id: `a_${Date.now().toString(36)}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      name: f.name || `file-${i}`,
      mime: f.type || 'application/octet-stream',
      size: f.size || 0,
      lastModified: f.lastModified || Date.now(),
      kind,
      blobUrl: (kind === 'photo' && photoExt(f.name || '')) || kind === 'video'
        ? URL.createObjectURL(f)
        : null,
      meta: {
        ext: (f.name || '').split('.').pop()?.toUpperCase() || '',
      },
    };
    // Read text fragments straight into meta so Organize can cluster by content later.
    if (kind === 'text' && f.size < 200 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '').slice(0, 2000);
        lcSetState(s => ({
          ...s,
          assets: s.assets.map(a => a.id === asset.id ? { ...a, meta: { ...a.meta, text } } : a),
        }));
      };
      reader.readAsText(f);
    }
    return asset;
  });
  storeActions.addAssets(assets);
  return assets;
}

function UploadMemories({ onNav, mode, onMode }) {
  const assets = useStore(s => s.assets);
  const fileRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const counts = React.useMemo(() => {
    const by = { photo: 0, video: 0, voice: 0, text: 0 };
    assets.forEach(a => { by[a.kind] = (by[a.kind] || 0) + 1; });
    return by;
  }, [assets]);

  const totalBytes = React.useMemo(() => assets.reduce((s, a) => s + (a.size || 0), 0), [assets]);
  const timeRange = React.useMemo(() => {
    if (assets.length === 0) return '—';
    const dates = assets.map(a => new Date(a.lastModified)).sort((a, b) => a - b);
    const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    return fmt(dates[0]) + ' – ' + fmt(dates[dates.length - 1]);
  }, [assets]);
  const missingGeo = assets.filter(a => a.kind === 'photo').length; // stub — mock provider has no EXIF; every photo is "missing geo"

  const onPick = () => fileRef.current?.click();
  const onFiles = (fl) => {
    const added = ingestFiles(fl);
    if (added.length === 0) return;
  };
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    onFiles(e.dataTransfer?.files);
  };
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const loadSeed = () => {
    if (assets.length > 0) return;
    // generate a synthetic memory set so demos aren't empty
    const now = Date.now();
    const seed = Array.from({ length: 30 }).map((_, i) => {
      const kinds = ['photo', 'photo', 'photo', 'photo', 'video', 'photo', 'photo', 'voice', 'photo', 'text'];
      const kind = kinds[i % kinds.length];
      const ts = now - (i * 36 + Math.random() * 24) * 60 * 60 * 1000;
      return {
        id: `seed_${i}_${now.toString(36)}`,
        name: kind === 'voice' ? `note-${String(i + 1).padStart(2, '0')}.m4a`
          : kind === 'video' ? `clip-${String(i + 1).padStart(2, '0')}.mp4`
          : kind === 'text' ? `fragment-${String(i + 1).padStart(2, '0')}.txt`
          : `IMG_${String(1840 + i).padStart(4, '0')}.jpg`,
        mime: kind === 'voice' ? 'audio/m4a' : kind === 'video' ? 'video/mp4' : kind === 'text' ? 'text/plain' : 'image/jpeg',
        size: 200_000 + Math.random() * 8_000_000,
        lastModified: ts,
        kind,
        blobUrl: null,
        meta: { seed: true, ext: kind === 'voice' ? 'M4A' : kind === 'video' ? 'MP4' : kind === 'text' ? 'TXT' : 'JPG' },
      };
    });
    storeActions.addAssets(seed);
  };

  const clear = () => {
    assets.forEach(a => a.blobUrl && URL.revokeObjectURL(a.blobUrl));
    storeActions.clearAssets();
  };

  return (
    <StudioShell
      screen="upload" onNav={onNav} mode={mode} onMode={onMode}
      title="Upload memory set"
      breadcrumb="A Year in SE1 › Upload"
      actions={<>
        <button className="btn" onClick={clear} disabled={assets.length === 0}>Clear set</button>
        <button className="btn btn-solid" onClick={() => onNav('organize')} disabled={assets.length === 0}>Continue to organize →</button>
      </>}
    >
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,text/plain,.txt,.md,.heic,.heif"
        style={{ display: 'none' }}
        onChange={(e) => onFiles(e.target.files)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        <div>
          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            style={{
              border: `2px dashed ${dragOver ? 'var(--ink)' : 'var(--rule)'}`,
              padding: 48, textAlign: 'center',
              background: dragOver ? 'var(--paper-3)' : 'var(--paper-2)',
              marginBottom: 24,
              transition: 'background 150ms, border-color 150ms',
            }}>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 32, marginBottom: 4 }}>
              {dragOver ? 'Drop to add to set' : 'Drop your memory set here.'}
            </div>
            <div style={{ opacity: 0.6, marginBottom: 20 }}>Photos, screenshots, short videos, voice notes, written fragments. JPG / PNG / HEIC / MP4 / M4A / TXT.</div>
            <div className="row gap-12 center">
              <button className="btn btn-solid" onClick={onPick}>Browse files</button>
              <button className="btn" onClick={loadSeed} disabled={assets.length > 0}>Load demo set</button>
            </div>
            <div className="mono-sm" style={{ marginTop: 20, opacity: 0.5 }}>— OR DRAG FILES FROM FINDER / EXPLORER —</div>
          </div>

          <div className="row between items-baseline" style={{ marginBottom: 12 }}>
            <div className="row gap-16 items-baseline">
              <div style={{ fontFamily: 'var(--f-serif)', fontSize: 24 }}>Memory set · {assets.length} items</div>
              <div className="mono-sm" style={{ opacity: 0.6 }}>
                {counts.photo || 0} photos · {counts.video || 0} videos · {counts.voice || 0} voice · {counts.text || 0} texts · {__lcHumanSize(totalBytes)}
              </div>
            </div>
            <div className="row gap-12 mono-sm" style={{ opacity: 0.7 }}>
              <span>Sort: Timestamp ▾</span>
              <span>Filter: All ▾</span>
            </div>
          </div>

          {assets.length === 0 ? (
            <div style={{ padding: '40px 24px', border: '1px dashed var(--rule)', textAlign: 'center', opacity: 0.6, fontSize: 14 }}>
              Memory set is empty. Browse files, drop onto the zone above, or load the demo set.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {assets.slice(0, 60).map((a) => (
                <div key={a.id} style={{ position: 'relative' }} title={`${a.name} · ${__lcHumanSize(a.size)}`}>
                  {a.blobUrl ? (
                    a.kind === 'video'
                      ? <video src={a.blobUrl} muted playsInline style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', background: '#000' }} />
                      : <img src={a.blobUrl} alt={a.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <Img
                      label={a.name.length > 16 ? a.name.slice(0, 14) + '…' : a.name}
                      tone={a.kind === 'video' ? 'dark' : a.kind === 'voice' ? 'punk' : a.kind === 'text' ? 'cool' : ['warm', 'cool', 'warm', 'dark'][Math.floor((a.lastModified || 0) / 1e7) % 4]}
                      ratio="1/1"
                    />
                  )}
                  <div className="mono-sm" style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 4px', fontSize: 9 }}>{a.meta?.ext || a.kind.toUpperCase()}</div>
                  {a.kind === 'video' && <div style={{ position: 'absolute', inset: 0, background: 'oklch(0.2 0.02 240 / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24 }}>▶</div>}
                  {a.kind === 'voice' && <div style={{ position: 'absolute', inset: 0, background: 'oklch(0.6 0.14 40 / 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22 }}>♪</div>}
                </div>
              ))}
              {assets.length > 60 && (
                <div style={{ border: '1px dashed var(--rule)', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mono-sm">+{assets.length - 60} MORE</div>
              )}
            </div>
          )}
        </div>

        <div className="col gap-20">
          <div style={{ padding: 20, border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>What the system will do</div>
            <div className="col gap-8" style={{ fontSize: 13 }}>
              <div className="row gap-8"><span className="mono-sm" style={{ opacity: 0.5, width: 16 }}>01</span><span>Extract EXIF: location, timestamp, device, exposure. (stub)</span></div>
              <div className="row gap-8"><span className="mono-sm" style={{ opacity: 0.5, width: 16 }}>02</span><span>Transcribe voice notes and text fragments. (stub)</span></div>
              <div className="row gap-8"><span className="mono-sm" style={{ opacity: 0.5, width: 16 }}>03</span><span>Cluster images by place + time into candidate stops.</span></div>
              <div className="row gap-8"><span className="mono-sm" style={{ opacity: 0.5, width: 16 }}>04</span><span>Propose a walking sequence you can reorder.</span></div>
            </div>
          </div>

          <div style={{ padding: 20, border: '1px solid var(--rule)' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Detected so far</div>
            <div className="col gap-12">
              {[
                ['Items', assets.length === 0 ? '—' : String(assets.length)],
                ['Total size', assets.length === 0 ? '—' : __lcHumanSize(totalBytes)],
                ['Time range', timeRange],
                ['Candidate stops', assets.length === 0 ? '—' : `${Math.max(1, Math.ceil(assets.length / 6))} clusters`],
                ['Missing geo', assets.length === 0 ? '—' : `${missingGeo} photos`],
              ].map(([k, v]) => (
                <div key={k} className="row between">
                  <span className="mono-sm" style={{ opacity: 0.6 }}>{k}</span>
                  <span style={{ fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {missingGeo > 0 && (
            <div style={{ padding: 20, border: '1px solid oklch(0.55 0.14 40)', color: 'oklch(0.35 0.14 40)', background: 'oklch(0.97 0.03 50)' }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>⚠ {missingGeo} photos without geo</div>
              <div style={{ fontSize: 13 }}>EXIF parsing is stubbed. In production, geo comes from the real EXIF reader — we'll ask you to place missing ones on the map in Organize, or skip them.</div>
            </div>
          )}
        </div>
      </div>
    </StudioShell>
  );
}

function OrganizeStops({ onNav, mode, onMode }) {
  const [selected, setSelected] = React.useState(4);
  return (
    <StudioShell
      screen="organize" onNav={onNav} mode={mode} onMode={onMode}
      title="Organize stops"
      breadcrumb="A Year in SE1 › Organize"
      actions={<>
        <button className="btn">Re-cluster</button>
        <button className="btn btn-solid" onClick={() => onNav('editor')}>Continue to editor →</button>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 360px', gap: 0, border: '1px solid var(--rule)', minHeight: 640 }}>
        {/* Stop list — draggable */}
        <div style={{ borderRight: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--rule)' }} className="row between items-center">
            <div className="eyebrow">Stops · 10</div>
            <button className="mono-sm" style={{ opacity: 0.7 }}>+ Add</button>
          </div>
          <div>
            {STOPS.map((s, i) => (
              <div key={s.n} onClick={() => setSelected(i)} style={{
                display: 'grid', gridTemplateColumns: '20px 40px 1fr',
                gap: 10, padding: '10px 12px',
                borderBottom: '1px solid var(--rule)',
                background: selected === i ? 'var(--paper)' : 'transparent',
                borderLeft: selected === i ? '3px solid var(--ink)' : '3px solid transparent',
                cursor: 'pointer',
              }}>
                <div style={{ color: 'oklch(0.6 0 0)', fontSize: 14 }}>⋮⋮</div>
                <div className="mono" style={{ opacity: 0.7 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 13, lineHeight: 1.2 }}>{s.title}</div>
                  <div className="mono-sm" style={{ opacity: 0.55, marginTop: 2 }}>{s.code} · {s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map + timeline */}
        <div className="col">
          <div style={{ flex: 1, padding: 20, background: 'oklch(0.95 0.008 60)', position: 'relative', minHeight: 400, borderBottom: '1px solid var(--rule)' }}>
            <svg viewBox="0 0 600 400" style={{ width: '100%', height: '100%' }}>
              <path d="M 0 200 C 100 190, 160 150, 240 180 S 360 260, 440 230 S 560 180, 600 200 L 600 260 C 560 250, 460 220, 380 280 S 240 290, 160 240 S 40 240, 0 260 Z" fill="oklch(0.82 0.04 240)" opacity="0.5" />
              {/* route line */}
              <path d="M 80 160 L 140 180 L 210 210 L 290 240 L 340 220 L 410 230 L 460 200 L 510 170 L 530 130 L 480 100" stroke="oklch(0.45 0.12 25)" strokeWidth="2" fill="none" strokeDasharray="3 3" />
              {[
                [80, 160], [140, 180], [210, 210], [290, 240], [340, 220],
                [410, 230], [460, 200], [510, 170], [530, 130], [480, 100],
              ].map(([x, y], i) => (
                <g key={i} onClick={() => setSelected(i)} style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r={selected === i ? 14 : 9} fill="white" stroke="oklch(0.15 0 0)" strokeWidth="2" />
                  <text x={x} y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700">{i + 1}</text>
                </g>
              ))}
            </svg>
            <div className="mono-sm" style={{ position: 'absolute', top: 16, left: 16, opacity: 0.6 }}>SE1 · ROUTE · 10 STOPS · 4.2KM</div>
          </div>

          {/* Timeline */}
          <div style={{ padding: 20, background: 'var(--paper)' }}>
            <div className="row between items-baseline" style={{ marginBottom: 10 }}>
              <div className="eyebrow">Time of day</div>
              <div className="mono-sm" style={{ opacity: 0.6 }}>06:00 → 24:00</div>
            </div>
            <div style={{ position: 'relative', height: 50, background: 'linear-gradient(90deg, oklch(0.88 0.05 250), oklch(0.95 0.06 80), oklch(0.7 0.12 60), oklch(0.3 0.04 260))', borderRadius: 2 }}>
              {STOPS.map((s, i) => {
                const h = parseInt(s.time.split(':')[0]) + parseInt(s.time.split(':')[1]) / 60;
                const pct = ((h - 6) / 18) * 100;
                return (
                  <div key={i} onClick={() => setSelected(i)} style={{ position: 'absolute', left: `${pct}%`, top: -2, cursor: 'pointer' }}>
                    <div style={{ width: 2, height: 54, background: selected === i ? 'var(--ink)' : 'rgba(255,255,255,0.7)' }} />
                    <div className="mono-sm" style={{ position: 'absolute', top: 60, left: '-50%', whiteSpace: 'nowrap', fontSize: 9 }}>{s.time}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div style={{ borderLeft: '1px solid var(--rule)', background: 'var(--paper-2)', padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Stop inspector</div>
          <Img label={STOPS[selected].label} tone={STOPS[selected].tone} ratio="3/2" />
          <div className="col gap-4" style={{ marginTop: 12 }}>
            <div className="mono-sm" style={{ opacity: 0.5 }}>STOP {STOPS[selected].n}</div>
            <input defaultValue={STOPS[selected].title} style={{ fontFamily: 'var(--f-serif)', fontSize: 22, padding: '4px 0', borderBottom: '1px solid var(--rule)' }} />
            <div className="row gap-12 mono-sm" style={{ opacity: 0.6, marginTop: 6 }}>
              <span>{STOPS[selected].code}</span>
              <span>·</span>
              <span>{STOPS[selected].time}</span>
              <span>·</span>
              <span>{STOPS[selected].mood}</span>
            </div>
          </div>
          <div className="rule" style={{ margin: '16px 0' }} />
          <div className="eyebrow" style={{ marginBottom: 8 }}>Source images · 7</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Img key={i} label="" tone={['warm', 'cool', 'dark'][i % 3]} ratio="1/1" />
            ))}
            <div style={{ border: '1px dashed var(--rule)', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, opacity: 0.5 }}>+</div>
          </div>
          <div className="rule" style={{ margin: '16px 0' }} />
          <div className="eyebrow" style={{ marginBottom: 8 }}>Cluster confidence</div>
          <div style={{ height: 5, background: 'var(--paper-3)' }}>
            <div style={{ height: '100%', width: '88%', background: 'oklch(0.55 0.14 140)' }} />
          </div>
          <div className="mono-sm" style={{ marginTop: 6, opacity: 0.6 }}>88% · Time + geo match</div>
          <button className="btn btn-sm" style={{ marginTop: 16, width: '100%' }}>Split this stop</button>
          <button className="btn btn-sm" style={{ marginTop: 8, width: '100%' }}>Merge with neighbor</button>
        </div>
      </div>
    </StudioShell>
  );
}

Object.assign(window, { UploadMemories, OrganizeStops, ingestFiles });
