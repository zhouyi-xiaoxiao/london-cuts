// studio-upload.jsx + studio-organize.jsx merged — Upload memories + Organize stops

function UploadMemories({ onNav, mode, onMode }) {
  const uploaded = 87;
  return (
    <StudioShell
      screen="upload" onNav={onNav} mode={mode} onMode={onMode}
      title="Upload memory set"
      breadcrumb="A Year in SE1 › Upload"
      actions={<>
        <button className="btn">Skip for now</button>
        <button className="btn btn-solid" onClick={() => onNav('organize')}>Continue to organize →</button>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        <div>
          {/* Drop zone */}
          <div style={{
            border: '2px dashed var(--rule)',
            padding: 48, textAlign: 'center',
            background: 'var(--paper-2)',
            marginBottom: 24,
          }}>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 32, marginBottom: 4 }}>Drop your memory set here.</div>
            <div style={{ opacity: 0.6, marginBottom: 20 }}>Photos, screenshots, short videos, voice notes, written fragments. Up to 500 items. JPG / PNG / HEIC / MP4 / M4A / TXT.</div>
            <div className="row gap-12 center">
              <button className="btn btn-solid">Browse files</button>
              <button className="btn">Import from Photos</button>
              <button className="btn">Import from iCloud link</button>
            </div>
            <div className="mono-sm" style={{ marginTop: 20, opacity: 0.5 }}>— OR PASTE A SHARED ALBUM URL —</div>
          </div>

          <div className="row between items-baseline" style={{ marginBottom: 12 }}>
            <div className="row gap-16 items-baseline">
              <div style={{ fontFamily: 'var(--f-serif)', fontSize: 24 }}>Memory set · {uploaded} items</div>
              <div className="mono-sm" style={{ opacity: 0.6 }}>74 photos · 8 videos · 3 voice notes · 2 texts</div>
            </div>
            <div className="row gap-12 mono-sm" style={{ opacity: 0.7 }}>
              <span>Sort: Timestamp ▾</span>
              <span>Filter: All ▾</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const tones = ['warm', 'cool', 'punk', 'dark'];
              const types = ['JPG', 'JPG', 'JPG', 'JPG', 'MP4', 'JPG', 'JPG', 'M4A', 'JPG'];
              const t = types[i % types.length];
              return (
                <div key={i} style={{ position: 'relative' }}>
                  <Img label={`IMG_${String(1840 + i).padStart(4, '0')}`} tone={tones[i % 4]} ratio="1/1" />
                  <div className="mono-sm" style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 4px', fontSize: 9 }}>{t}</div>
                  {i === 4 && <div style={{ position: 'absolute', inset: 0, background: 'oklch(0.2 0.02 240 / 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24 }}>▶</div>}
                </div>
              );
            })}
            <div style={{ border: '1px dashed var(--rule)', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mono-sm">+57 MORE</div>
          </div>
        </div>

        <div className="col gap-20">
          <div style={{ padding: 20, border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>What the system will do</div>
            <div className="col gap-8" style={{ fontSize: 13 }}>
              <div className="row gap-8"><span className="mono-sm" style={{ opacity: 0.5, width: 16 }}>01</span><span>Extract EXIF: location, timestamp, device, exposure.</span></div>
              <div className="row gap-8"><span className="mono-sm" style={{ opacity: 0.5, width: 16 }}>02</span><span>Transcribe voice notes and text fragments.</span></div>
              <div className="row gap-8"><span className="mono-sm" style={{ opacity: 0.5, width: 16 }}>03</span><span>Cluster images by place + time into candidate stops.</span></div>
              <div className="row gap-8"><span className="mono-sm" style={{ opacity: 0.5, width: 16 }}>04</span><span>Propose a walking sequence you can reorder.</span></div>
            </div>
          </div>

          <div style={{ padding: 20, border: '1px solid var(--rule)' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Detected so far</div>
            <div className="col gap-12">
              {[
                ['Location range', 'SE1 · 8 blocks'],
                ['Time range', 'Feb 2025 – Apr 2026'],
                ['Times of day', 'Morning, dusk, night'],
                ['Candidate stops', '12 clusters'],
                ['Missing geo', '4 images'],
              ].map(([k, v]) => (
                <div key={k} className="row between">
                  <span className="mono-sm" style={{ opacity: 0.6 }}>{k}</span>
                  <span style={{ fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, border: '1px solid oklch(0.55 0.14 40)', color: 'oklch(0.35 0.14 40)', background: 'oklch(0.97 0.03 50)' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>⚠ 4 images without geo</div>
            <div style={{ fontSize: 13 }}>We'll ask you to place these on the map in the next step, or skip them.</div>
          </div>
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

Object.assign(window, { UploadMemories, OrganizeStops });
