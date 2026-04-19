// public-project.jsx — Unified Public scroll:
//   Hero (overview) → Atlas band → Stop detail.
// No hard page breaks — the three were separate screens in V1; here they
// are sections of a single scrolling surface with sticky chrome.

function PublicProject({ mode, onMode, onExit }) {
  const [hover, setHover] = React.useState(null);
  const [selectedStop, setSelectedStop] = React.useState('05');
  const stopRef = React.useRef(null);

  const handlePick = (n) => {
    setSelectedStop(n);
    setTimeout(() => stopRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 30);
  };

  return (
    <div className="page" data-mode={mode}>
      {/* Sticky public nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--mode-bg)',
        borderBottom: '1px solid oklch(from currentColor l c h / 0.15)',
      }}>
        <div className="row items-center between" style={{ padding: '14px 40px', maxWidth: 1680, margin: '0 auto' }}>
          <div className="row items-center gap-16">
            <Roundel />
            <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15 }}>LONDON CUTS</div>
            <span className="mono-sm" style={{ opacity: 0.5 }}>@ana · A Year in SE1</span>
          </div>
          <div className="row items-center gap-16">
            <ModePill mode={mode} onMode={onMode} />
            <button className="btn btn-sm" onClick={onExit}>Back to handoff</button>
          </div>
        </div>
      </div>

      {/* 1. HERO / OVERVIEW */}
      <section className="pp-hero">
        <div className="pp-hero-txt">
          <div>
            <div className="eyebrow">Ed. 01 · Apr 2026 · by Ana Ishii</div>
            <h1 style={{
              fontFamily: 'var(--mode-display-font)',
              fontSize: mode === 'punk' ? 132 : 116,
              lineHeight: 0.88, marginTop: 28, letterSpacing: '-0.02em',
              textTransform: mode === 'punk' ? 'uppercase' : 'none',
              fontStyle: mode === 'fashion' ? 'italic' : 'normal',
            }}>
              {mode === 'punk'    && <>Twelve<br/>cuts of<br/>SE1.</>}
              {mode === 'fashion' && <>Twelve walks,<br/>one postcode.</>}
              {mode === 'cinema'  && <>Twelve<br/>scenes<br/>in SE1.</>}
            </h1>
            <div className="n-para" style={{ marginTop: 24, maxWidth: '38ch', opacity: 0.85 }}>
              A year walking between Bermondsey and Waterloo. Twelve stops, three
              ways to read them — chosen by you, switched at the top.
            </div>
          </div>
          <div className="row between items-end">
            <div className="mono-sm" style={{ opacity: 0.6 }}>
              12 STOPS · 48 MIN · ED.01 · APR 2026
            </div>
            <div className="mono-sm" style={{ opacity: 0.6 }}>
              Scroll ↓ for the map
            </div>
          </div>
        </div>
        <div className="pp-hero-img" style={{ position: 'relative' }}>
          <Img label={PROJECT.coverLabel}
               tone={mode === 'cinema' ? 'dark' : mode === 'punk' ? 'punk' : 'warm'}
               style={{ height: '100%', aspectRatio: 'auto' }} />
          {mode === 'cinema' && (
            <>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, background: 'black' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'black' }} />
              <div style={{ position: 'absolute', bottom: 60, left: 24, right: 24, textAlign: 'center' }}>
                <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.5)', padding: '6px 14px',
                              fontFamily: 'var(--f-mono)', fontSize: 13, color: 'oklch(0.88 0.14 90)' }}>
                  EXT. SOUTH BANK — GOLDEN HOUR
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 2. ATLAS BAND */}
      <section className="pp-atlas-band" id="atlas">
        <div className="row between items-end" style={{ marginBottom: 20 }}>
          <div>
            <div className="eyebrow">The Atlas</div>
            <h2 style={{
              fontFamily: 'var(--mode-display-font)', fontSize: 56, lineHeight: 0.95,
              marginTop: 10, letterSpacing: '-0.02em',
              textTransform: mode === 'punk' ? 'uppercase' : 'none',
              fontStyle: mode === 'fashion' ? 'italic' : 'normal',
            }}>
              Placed on SE1.
            </h2>
          </div>
          <div className="mono-sm" style={{ opacity: 0.65 }}>
            Pan, zoom, click a marker → jump to that stop below.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div className="atlas-map-wrap pp-atlas-map" data-mode={mode}>
            <StylizedMap mode={mode} hover={hover} setHover={setHover} onPick={handlePick} selectedStop={selectedStop} />
            {mode === 'cinema' && (
              <>
                <div className="atlas-letterbox atlas-letterbox-top" />
                <div className="atlas-letterbox atlas-letterbox-bottom" />
              </>
            )}
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>All stops</div>
            <div className="col">
              {STOPS.map(s => (
                <div key={s.n} className="row between items-center"
                     style={{ padding: '10px 0', borderBottom: '1px solid oklch(from currentColor l c h / 0.12)', cursor: 'pointer',
                              background: selectedStop === s.n ? 'oklch(from currentColor l c h / 0.06)' : 'transparent' }}
                     onClick={() => handlePick(s.n)}
                     onMouseEnter={() => setHover(s.n)}
                     onMouseLeave={() => setHover(null)}>
                  <div className="row items-center gap-12">
                    <span className="mono-sm" style={{ width: 24, opacity: 0.5 }}>{s.n}</span>
                    <span style={{ fontFamily: 'var(--mode-display-font)', fontSize: 14, lineHeight: 1.15 }}>{s.title}</span>
                  </div>
                  <span className="mono-sm" style={{ opacity: 0.55 }}>{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. STOP DETAIL — scroll-anchored to selection */}
      <section className="pp-stop-detail" ref={stopRef}>
        <StopDetail stop={STOPS.find(s => s.n === selectedStop)} mode={mode} />
      </section>
    </div>
  );
}

// --- Stylized stand-in for MapLibre (uses real SE1 coord bounds) ---
// This is the prototype version — the engineering spec in HANDOFF-V2
// ships the MapLibre style JSON per mode.
function StylizedMap({ mode, hover, setHover, onPick, selectedStop }) {
  // Project SE1 coords into viewBox 0..1000 × 0..600
  const lats = STOPS.map(s => s.lat), lngs = STOPS.map(s => s.lng);
  const minLat = Math.min(...lats) - 0.006, maxLat = Math.max(...lats) + 0.006;
  const minLng = Math.min(...lngs) - 0.006, maxLng = Math.max(...lngs) + 0.006;
  const x = lng => ((lng - minLng) / (maxLng - minLng)) * 1000;
  const y = lat => (1 - (lat - minLat) / (maxLat - minLat)) * 600;

  const bg = mode === 'cinema' ? '#050a18' : mode === 'punk' ? '#f0ece0' : '#f7f1e6';
  const stroke = mode === 'cinema' ? '#16213a' : mode === 'punk' ? '#1a1a1a' : '#bfa886';
  const river  = mode === 'cinema' ? '#0a1628' : mode === 'punk' ? '#d8d4c4' : '#e8d9b8';
  const label  = mode === 'cinema' ? '#8a93a8' : mode === 'punk' ? '#4a4a4a' : '#9a7f54';

  // A simple polyline for the Thames meander through SE1
  const thames = 'M 40 180  C 200 140, 320 260, 480 220  S 780 300, 980 240';

  return (
    <div className="atlas-map" style={{ background: bg, position: 'relative' }}>
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* grid roads */}
        <g stroke={stroke} strokeWidth={mode === 'punk' ? 1.2 : 0.8} opacity={mode === 'cinema' ? 0.25 : 0.35}>
          {Array.from({length: 16}).map((_, i) => (
            <line key={'h'+i} x1={0} x2={1000} y1={i * 40} y2={i * 40} />
          ))}
          {Array.from({length: 25}).map((_, i) => (
            <line key={'v'+i} x1={i * 44} x2={i * 44} y1={0} y2={600} />
          ))}
        </g>
        {/* major avenues */}
        <g stroke={stroke} strokeWidth={mode === 'punk' ? 3.2 : 2.2} opacity={0.8}>
          <line x1={0}   y1={320} x2={1000} y2={260} />
          <line x1={260} y1={0}   x2={360}  y2={600} />
          <line x1={680} y1={0}   x2={580}  y2={600} />
        </g>
        {/* Thames */}
        <path d={thames} fill="none" stroke={river} strokeWidth={mode === 'punk' ? 28 : 36} strokeLinecap="round" />
        <path d={thames} fill="none" stroke={stroke} strokeWidth={0.6} opacity={0.35} strokeDasharray={mode === 'punk' ? '2 3' : '0'} />
        {/* Borough labels */}
        <g fontFamily="var(--f-mono)" fontSize={mode === 'cinema' ? 10 : 11} fill={label} letterSpacing="2">
          <text x={120} y={520} opacity={0.6}>BERMONDSEY</text>
          <text x={420} y={90}  opacity={0.6}>BOROUGH</text>
          <text x={760} y={140} opacity={0.6}>LAMBETH</text>
          <text x={860} y={520} opacity={0.5}>WALWORTH</text>
        </g>
      </svg>

      {/* Markers */}
      {STOPS.map(s => (
        <div
          key={s.n}
          className="atlas-marker"
          data-mode={mode}
          style={{
            position: 'absolute',
            left: `calc(${x(s.lng) / 10}% - 15px)`,
            top:  `calc(${y(s.lat) / 6}% - 15px)`,
            zIndex: selectedStop === s.n ? 20 : (hover === s.n ? 15 : 5),
            transform: selectedStop === s.n
              ? (mode === 'punk' ? 'rotate(-4deg) scale(1.25)' : 'scale(1.25)')
              : undefined,
            outline: selectedStop === s.n ? `2px solid var(--mode-accent)` : undefined,
            outlineOffset: selectedStop === s.n ? 3 : undefined,
          }}
          onClick={() => onPick(s.n)}
          onMouseEnter={() => setHover(s.n)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="atlas-marker-n">{s.n}</span>
        </div>
      ))}

      {/* Hover preview card */}
      {hover && (() => {
        const s = STOPS.find(x => x.n === hover);
        return s ? (
          <div className="atlas-map-hover">
            <div className="mono-sm" style={{ opacity: 0.6 }}>STOP {s.n} · {s.code}</div>
            <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 18, marginTop: 4, lineHeight: 1.15 }}>{s.title}</div>
            <div className="mono-sm" style={{ marginTop: 4, opacity: 0.7 }}>{s.time} · {s.mood}</div>
          </div>
        ) : null;
      })()}

      {/* attribution */}
      <div className="atlas-attribution">© OpenStreetMap © CARTO</div>
    </div>
  );
}

// Stop detail renders content nodes in the current mode.
function StopDetail({ stop, mode }) {
  // Demo body for Stop 05; other stops get a short placeholder.
  const body = stop.n === '05' ? BODY_05 : [
    { type: 'metaRow',   content: [stop.time, stop.mood, stop.code, stop.label] },
    { type: 'heroImage', assetId: 'hero-' + stop.n, caption: stop.label },
    { type: 'paragraph', content: `Stop ${stop.n}: ${stop.title}. This chapter is still in draft.` },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div className="row items-baseline between" style={{ marginBottom: 24 }}>
        <div>
          <div className="eyebrow">Stop {stop.n} · {stop.code} · {stop.time}</div>
          <h2 style={{
            fontFamily: 'var(--mode-display-font)',
            fontSize: mode === 'punk' ? 80 : 72,
            lineHeight: 0.92, marginTop: 12, letterSpacing: '-0.02em',
            textTransform: mode === 'punk' ? 'uppercase' : 'none',
            fontStyle: mode === 'fashion' ? 'italic' : 'normal',
          }}>{stop.title}</h2>
        </div>
      </div>

      <div style={{ maxWidth: mode === 'cinema' ? 780 : 920 }}>
        {body.map((node, i) => (
          <ContentNode key={i} node={node} selected={false} onSelect={() => {}} mode={mode} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PublicProject });
