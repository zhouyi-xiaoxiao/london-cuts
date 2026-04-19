// public-atlas.jsx — Atlas page: London-wide map/index of all projects
// Tube-map-inspired wayfinding with project pins

function Atlas({ mode, onMode, onNav }) {
  const [selected, setSelected] = React.useState(null);
  return (
    <div className="page" data-mode={mode}>
      <PublicNav mode={mode} onMode={onMode} screen="atlas" onNav={onNav} />

      <div className="max-wide" style={{ padding: '32px 40px 20px' }}>
        <div className="row between items-end">
          <div>
            <div className="eyebrow">The Atlas</div>
            <h1 style={{ fontFamily: 'var(--mode-display-font)', fontSize: 72, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>
              Every cut of London, placed.
            </h1>
          </div>
          <div className="col items-end gap-8">
            <div className="mono-sm">2,487 projects · 31 boroughs</div>
            <div className="row gap-8">
              <button className="chip chip-solid">All modes</button>
              <button className="chip">Punk</button>
              <button className="chip">Fashion</button>
              <button className="chip">Cinema</button>
            </div>
          </div>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="max-wide" style={{ padding: '20px 40px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div style={{ position: 'relative', background: 'oklch(0.94 0.008 60)', aspectRatio: '4/3', border: '1px solid var(--rule)', overflow: 'hidden' }}>
          {/* Stylized Thames */}
          <svg viewBox="0 0 800 600" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {/* Thames ribbon */}
            <path d="M 0 340 C 120 330, 180 280, 260 310 S 380 420, 480 380 S 640 280, 720 320 L 800 340 L 800 400 C 720 380, 640 340, 560 410 S 420 470, 320 400 S 180 340, 80 400 L 0 400 Z"
              fill="oklch(0.82 0.04 240)" opacity="0.5"/>
            <path d="M 0 360 C 120 350, 180 300, 260 330 S 380 440, 480 400 S 640 300, 720 340 L 800 360"
              fill="none" stroke="oklch(0.55 0.08 240)" strokeWidth="1" opacity="0.5"/>
            {/* grid lines */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`v${i}`} x1={i*100} y1="0" x2={i*100} y2="600" stroke="oklch(0.88 0.006 60)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i*100} x2="800" y2={i*100} stroke="oklch(0.88 0.006 60)" strokeWidth="0.5" />
            ))}
            {/* Area labels */}
            <text x="180" y="180" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="oklch(0.5 0.01 60)" letterSpacing="1.5">W1</text>
            <text x="430" y="180" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="oklch(0.5 0.01 60)" letterSpacing="1.5">E1</text>
            <text x="310" y="500" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="oklch(0.5 0.01 60)" letterSpacing="1.5">SE1</text>
            <text x="560" y="500" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="oklch(0.5 0.01 60)" letterSpacing="1.5">SE15</text>
            <text x="90" y="500" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="oklch(0.5 0.01 60)" letterSpacing="1.5">SW8</text>
            <text x="620" y="280" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="oklch(0.5 0.01 60)" letterSpacing="1.5">E8</text>
            {/* Project pins */}
            {[
              { x: 320, y: 390, label: 'A Year in SE1', stops: 10, color: 'oklch(0.45 0.12 25)' },
              { x: 260, y: 410, label: 'Mudlark Diaries', stops: 14, color: 'oklch(0.62 0.24 25)' },
              { x: 610, y: 260, label: '48 Hours in E8', stops: 8, color: 'oklch(0.25 0.02 250)' },
              { x: 210, y: 320, label: 'Jubilee Walk', stops: 12, color: 'oklch(0.45 0.12 25)' },
              { x: 180, y: 220, label: 'Last Trains', stops: 7, color: 'oklch(0.25 0.02 250)' },
              { x: 480, y: 220, label: 'Brick Lane', stops: 9, color: 'oklch(0.62 0.24 25)' },
              { x: 380, y: 250, label: 'City walks', stops: 6, color: 'oklch(0.45 0.12 25)' },
              { x: 560, y: 420, label: 'Peckham cuts', stops: 11, color: 'oklch(0.62 0.24 25)' },
            ].map((p, i) => (
              <g key={i} onClick={() => setSelected(i)} style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r={selected === i ? 18 : 12} fill="white" stroke={p.color} strokeWidth="3" />
                <circle cx={p.x} cy={p.y} r={selected === i ? 6 : 4} fill={p.color} />
                {selected === i && (
                  <g transform={`translate(${p.x + 20}, ${p.y - 8})`}>
                    <rect x="0" y="0" width="180" height="44" fill="white" stroke={p.color} />
                    <text x="10" y="18" fontFamily="Bodoni Moda, serif" fontSize="14" fontStyle="italic">{p.label}</text>
                    <text x="10" y="34" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="1.5" opacity="0.6">{p.stops} STOPS</text>
                  </g>
                )}
              </g>
            ))}
          </svg>
          <div style={{ position: 'absolute', top: 16, left: 16 }} className="mono-sm">LONDON · ATLAS · 1:75000</div>
          <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'white', padding: 8 }} className="mono-sm">
            <div className="row gap-8 items-center"><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'oklch(0.62 0.24 25)' }} />PUNK</div>
            <div className="row gap-8 items-center"><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'oklch(0.45 0.12 25)' }} />FASHION</div>
            <div className="row gap-8 items-center"><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'oklch(0.25 0.02 250)' }} />CINEMA</div>
          </div>
        </div>

        {/* Sidebar: by borough */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>By borough</div>
          <div className="col">
            {[
              ['SE1 Southwark', 248],
              ['E1 Whitechapel', 184],
              ['E8 Hackney', 162],
              ['N1 Islington', 142],
              ['SW1 Westminster', 128],
              ['W1 Soho / Fitzrovia', 119],
              ['SE15 Peckham', 98],
              ['NW1 Camden', 87],
              ['E2 Bethnal Green', 74],
              ['SE8 Deptford', 52],
            ].map(([b, c], i) => (
              <div key={b} className="row between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)', cursor: 'pointer' }}>
                <div className="row items-center gap-12">
                  <span className="mono-sm" style={{ width: 24, opacity: 0.5 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontFamily: 'var(--mode-display-font)', fontSize: 18 }}>{b}</span>
                </div>
                <span className="mono-sm" style={{ opacity: 0.6 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter strip + grid of results */}
      <div className="max-wide" style={{ padding: '40px' }}>
        <div className="row between items-baseline" style={{ marginBottom: 20 }}>
          <div className="eyebrow">Showing 2,487 projects across London</div>
          <div className="row gap-16 mono-sm" style={{ opacity: 0.7 }}>
            <span>Sort: Latest ▾</span>
            <span>Time of day: Any ▾</span>
            <span>Length: Any ▾</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {PROJECTS_FEED.concat(PROJECTS_FEED).slice(0, 8).map((p, i) => (
            <div key={i} style={{ cursor: 'pointer' }} onClick={() => onNav('public-project')}>
              <Img label={p.label} tone={p.mode === 'punk' ? 'punk' : p.mode === 'cinema' ? 'dark' : 'warm'} ratio="1/1" />
              <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 18, marginTop: 8, lineHeight: 1.15 }}>{p.title}</div>
              <div className="mono-sm" style={{ opacity: 0.6, marginTop: 2 }}>{p.author} · {p.mode.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Atlas });
