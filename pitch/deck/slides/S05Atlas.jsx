// Slide 05 — Atlas (navigation + map markers)
// The product's map view: twelve stops, rendered three ways. Each mode has
// its own marker grammar. Left: a stylised SE1 map with all three marker
// styles co-existing. Right: the grammar explained and the 12-stop manifest.

function S05Atlas() {
  // Twelve stops along the SE1 walk. (i % 3) assigns each a mode.
  const stops = [
    { n: '01', name: 'Waterloo Bridge',    mode: 'fashion', x: 110, y: 210 },
    { n: '02', name: 'National Theatre',   mode: 'punk',    x: 175, y: 175 },
    { n: '03', name: 'Southbank',          mode: 'cinema',  x: 245, y: 210 },
    { n: '04', name: 'Blackfriars',        mode: 'fashion', x: 305, y: 150 },
    { n: '05', name: 'Tate Modern',        mode: 'cinema',  x: 360, y: 230 },
    { n: '06', name: 'Millennium',         mode: 'punk',    x: 410, y: 195 },
    { n: '07', name: 'Borough Market',     mode: 'fashion', x: 475, y: 265 },
    { n: '08', name: 'The Shard',          mode: 'cinema',  x: 525, y: 305 },
    { n: '09', name: 'London Bridge',      mode: 'punk',    x: 575, y: 250 },
    { n: '10', name: 'Bermondsey Street',  mode: 'fashion', x: 625, y: 325 },
    { n: '11', name: 'Tower of London',    mode: 'cinema',  x: 690, y: 230 },
    { n: '12', name: 'Tower Bridge',       mode: 'punk',    x: 750, y: 290 },
  ];

  // Mode-specific marker component
  const Marker = ({ stop, size = 34 }) => {
    const s = size;
    const base = {
      position: 'absolute',
      left: stop.x - s / 2,
      top: stop.y - s / 2,
      width: s,
      height: s,
      display: 'grid',
      placeItems: 'center',
      fontSize: s * 0.38,
    };
    if (stop.mode === 'fashion') {
      return (
        <span style={{
          ...base,
          background: 'oklch(0.98 0.004 60)',
          color: 'var(--accent)',
          border: '1.5px solid var(--accent)',
          borderRadius: '50%',
          fontFamily: 'var(--f-fashion)',
          fontStyle: 'italic',
          fontWeight: 500,
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }}>{stop.n}</span>
      );
    }
    if (stop.mode === 'punk') {
      return (
        <span style={{
          ...base,
          background: 'var(--punk-red)',
          color: '#fff',
          border: '2px solid oklch(0.12 0.008 60)',
          boxShadow: '2px 2px 0 oklch(0.12 0.008 60)',
          transform: 'rotate(-4deg)',
          fontFamily: 'var(--f-punk)',
          fontWeight: 700,
        }}>{stop.n}</span>
      );
    }
    // cinema
    return (
      <span style={{
        ...base,
        background: 'var(--cinema-bg)',
        color: 'var(--cinema-accent)',
        border: '1.5px solid var(--cinema-accent)',
        borderRadius: '50%',
        boxShadow: '0 0 14px oklch(0.85 0.14 90 / 0.55)',
        fontFamily: 'var(--f-mono)',
        fontSize: s * 0.32,
      }}>{stop.n}</span>
    );
  };

  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>05 · ATLAS</span>
        </div>
        <span className="pageno">05 / 08</span>
      </div>

      <div style={{ marginTop: 64 }}>
        <div className="eyebrow">Navigation</div>
        <h2 className="fashion" style={{ fontSize: 104, margin: '20px 0 0', lineHeight: 0.98 }}>
          Twelve stops.<br />The map re-draws itself.
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 72, marginTop: 44, flex: 1, paddingBottom: 90 }}>

        {/* ── MAP PANEL ─────────────────────────── */}
        <div style={{ position: 'relative', background: 'var(--paper-2)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', minHeight: 540 }}>
          {/* Map label */}
          <div className="mono" style={{ position: 'absolute', top: 14, left: 18, fontSize: 11, opacity: 0.55 }}>SE1 · LONDON · 1 MILE</div>
          <div className="mono" style={{ position: 'absolute', top: 14, right: 18, fontSize: 11, opacity: 0.55 }}>N ↑</div>

          {/* Stylised SE1 map (SVG) */}
          <svg viewBox="0 0 840 490" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {/* Thames */}
            <path
              d="M -10 240 Q 140 180 300 220 Q 460 260 620 220 Q 720 195 860 260"
              stroke="oklch(0.80 0.02 240)"
              strokeWidth="52"
              fill="none"
              strokeLinecap="round"
              opacity="0.45"
            />
            <path
              d="M -10 240 Q 140 180 300 220 Q 460 260 620 220 Q 720 195 860 260"
              stroke="var(--accent)"
              strokeWidth="0.8"
              fill="none"
              opacity="0.3"
            />
            {/* Street hairlines */}
            <g stroke="var(--rule)" strokeWidth="0.8" fill="none" opacity="0.65">
              <line x1="0"   y1="110" x2="840" y2="120" />
              <line x1="0"   y1="380" x2="840" y2="360" />
              <line x1="120" y1="0"   x2="155" y2="490" />
              <line x1="300" y1="0"   x2="275" y2="490" />
              <line x1="470" y1="0"   x2="490" y2="490" />
              <line x1="660" y1="0"   x2="640" y2="490" />
              <line x1="820" y1="0"   x2="790" y2="490" />
            </g>
            {/* Block stippling */}
            <g fill="var(--rule)" opacity="0.35">
              {Array.from({ length: 80 }, (_, i) => {
                const cx = 20 + (i * 53) % 820;
                const cy = 30 + Math.floor(i / 16) * 65 + ((i * 7) % 30);
                return <circle key={i} cx={cx} cy={cy} r="0.8" />;
              })}
            </g>
            {/* Walking path connecting stops */}
            <polyline
              points={stops.map(s => `${s.x},${s.y}`).join(' ')}
              stroke="var(--ink-3)"
              strokeWidth="1.2"
              fill="none"
              strokeDasharray="3 5"
              opacity="0.55"
            />
            {/* River label */}
            <text x="220" y="206" fontFamily="var(--f-fashion)" fontStyle="italic" fontSize="18" fill="var(--ink-3)" opacity="0.7">River Thames</text>
          </svg>

          {/* Markers (rendered as absolutely-positioned spans over the SVG) */}
          {stops.map(s => <Marker key={s.n} stop={s} size={34} />)}

          {/* Compass / caption strip bottom */}
          <div className="mono" style={{ position: 'absolute', left: 18, right: 18, bottom: 14, display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.6 }}>
            <span>THE WALK — 12 STOPS — APPROX 45 MIN</span>
            <span>PATH: WATERLOO → TOWER BRIDGE</span>
          </div>
        </div>

        {/* ── SIDEBAR ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div className="eyebrow">Three marker grammars</div>

          {/* Fashion marker sample */}
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16, display: 'flex', gap: 22, alignItems: 'center' }}>
            <span style={{
              width: 44, height: 44, display: 'grid', placeItems: 'center',
              background: 'oklch(0.98 0.004 60)', color: 'var(--accent)',
              border: '2px solid var(--accent)', borderRadius: '50%',
              fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontWeight: 500, fontSize: 19,
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)', flexShrink: 0,
            }}>03</span>
            <div>
              <div className="mono" style={{ fontSize: 13, letterSpacing: '0.18em' }}>FASHION · RING</div>
              <div style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 4, fontFamily: 'var(--f-body)', lineHeight: 1.4 }}>Quiet circle. Italic number. Drops into the margin like a footnote.</div>
            </div>
          </div>

          {/* Punk marker sample */}
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16, display: 'flex', gap: 22, alignItems: 'center' }}>
            <span style={{
              width: 44, height: 44, display: 'grid', placeItems: 'center',
              background: 'var(--punk-red)', color: '#fff',
              border: '2px solid oklch(0.12 0.008 60)',
              boxShadow: '3px 3px 0 oklch(0.12 0.008 60)',
              transform: 'rotate(-4deg)',
              fontFamily: 'var(--f-punk)', fontWeight: 700, fontSize: 17,
              flexShrink: 0,
            }}>06</span>
            <div>
              <div className="mono" style={{ fontSize: 13, letterSpacing: '0.18em', color: 'var(--punk-red)' }}>PUNK · RANSOM</div>
              <div style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 4, fontFamily: 'var(--f-body)', lineHeight: 1.4 }}>Zine block. Hard offset shadow. Tilted like it was pasted down.</div>
            </div>
          </div>

          {/* Cinema marker sample */}
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16, display: 'flex', gap: 22, alignItems: 'center' }}>
            <span style={{
              width: 40, height: 40, display: 'grid', placeItems: 'center',
              background: 'var(--cinema-bg)', color: 'var(--cinema-accent)',
              border: '1.5px solid var(--cinema-accent)', borderRadius: '50%',
              boxShadow: '0 0 16px oklch(0.85 0.14 90 / 0.55)',
              fontFamily: 'var(--f-mono)', fontSize: 12, flexShrink: 0,
            }}>10</span>
            <div>
              <div className="mono" style={{ fontSize: 13, letterSpacing: '0.18em', color: '#7a6432' }}>CINEMA · GLOW</div>
              <div style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 4, fontFamily: 'var(--f-body)', lineHeight: 1.4 }}>Night pin. Subtitle yellow. Letterboxed and glowing.</div>
            </div>
          </div>

          {/* The 12-stop manifest */}
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16, marginTop: 4 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>The walk</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 28px', fontFamily: 'var(--f-mono)', fontSize: 13, lineHeight: 1.6 }}>
              {stops.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ opacity: 0.5 }}>{s.n}</span>
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mono" style={{ position: 'absolute', left: 120, right: 120, bottom: 52, fontSize: 14, opacity: 0.5, borderTop: '1px solid var(--rule)', paddingTop: 18, textAlign: 'center', letterSpacing: '0.22em' }}>
        ONE MILE · TWELVE STOPS · THE MAP RE-DRAWS ITSELF PER MODE
      </div>
    </section>
  );
}

window.S05Atlas = S05Atlas;
