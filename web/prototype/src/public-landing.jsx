// public-landing.jsx — Landing page
// Editorial magazine-style with a London masthead and featured projects

function Landing({ mode, onMode, onNav }) {
  return (
    <div className="page" data-mode={mode}>
      <PublicNav mode={mode} onMode={onMode} screen="landing" onNav={onNav} />

      {/* Masthead */}
      <div className="max-wide" style={{ padding: '48px 40px 64px' }}>
        <div className="row between items-end" style={{ marginBottom: 40 }}>
          <div className="mono">Issue 01 · Stories from the city</div>
          <div className="mono">{new Date().toDateString().toUpperCase()}</div>
        </div>

        <h1 style={{
          fontFamily: 'var(--mode-display-font)',
          fontSize: 'clamp(80px, 13vw, 200px)',
          lineHeight: 0.88,
          letterSpacing: mode === 'fashion' ? '-0.04em' : '-0.03em',
          fontWeight: mode === 'punk' ? 900 : mode === 'fashion' ? 500 : 400,
          fontStyle: mode === 'fashion' ? 'italic' : 'normal',
          textTransform: mode === 'punk' ? 'uppercase' : 'none',
        }}>
          {mode === 'punk' && <>LONDON<br/>CUTS</>}
          {mode === 'fashion' && <>London,<br/><em style={{ fontStyle: 'italic' }}>in pieces</em></>}
          {mode === 'cinema' && <>London Cuts<br/><span style={{ fontSize: '0.4em', fontFamily: 'var(--f-mono)', opacity: 0.7, letterSpacing: '0.1em' }}>— A CITY, IN FRAMES</span></>}
        </h1>

        <div className="row between items-end" style={{ marginTop: 40 }}>
          <div style={{ maxWidth: 520, fontSize: 18, lineHeight: 1.5 }}>
            Photos, places, moments — reassembled by AI into multimedia stories of London.
            Browse the atlas, or build your own memory set.
          </div>
          <div className="row gap-12">
            <button className="btn btn-solid" onClick={() => onNav('studio')}>Start a project →</button>
            <button className="btn" onClick={() => onNav('atlas')}>Open the atlas</button>
          </div>
        </div>
      </div>

      <div className="rule" style={{ margin: '0 40px' }} />

      {/* Featured */}
      <div className="max-wide" style={{ padding: '56px 40px' }}>
        <div className="row between items-center" style={{ marginBottom: 28 }}>
          <div className="eyebrow">Featured this week</div>
          <button className="mono-sm" style={{ opacity: 0.6 }}>See all →</button>
        </div>

        {/* Hero project + two smaller */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
          <div onClick={() => onNav('public-project')} style={{ cursor: 'pointer' }}>
            <Img label="COVER · SOUTHWARK GOLDEN HOUR" tone="warm" ratio="3/2" />
            <div className="row between items-end" style={{ marginTop: 14 }}>
              <div>
                <div className="mono-sm" style={{ opacity: 0.6 }}>Ana Ishii · 10 stops · Fashion mode</div>
                <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 42, lineHeight: 1, marginTop: 6, letterSpacing: '-0.02em' }}>
                  A Year in SE1
                </div>
              </div>
              <div className="mono-sm">2.4K READS</div>
            </div>
          </div>
          <div className="col gap-24">
            {PROJECTS_FEED.slice(1, 3).map(p => (
              <div key={p.id} onClick={() => onNav('public-project')} style={{ cursor: 'pointer' }}>
                <Img label={p.label} tone={p.mode === 'punk' ? 'punk' : p.mode === 'cinema' ? 'dark' : 'warm'} ratio="4/3" />
                <div className="mono-sm" style={{ opacity: 0.6, marginTop: 10 }}>
                  {p.author} · {p.stops} stops · {p.mode[0].toUpperCase() + p.mode.slice(1)}
                </div>
                <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 22, lineHeight: 1.1, marginTop: 4 }}>{p.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rule" style={{ margin: '0 40px' }} />

      {/* Three-modes strip */}
      <div className="max-wide" style={{ padding: '56px 40px' }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>Three ways to tell it</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { id: 'punk', title: 'Punk', body: 'Zine cut-outs, raw grain, torn edges. Street energy, anti-establishment type.' },
            { id: 'fashion', title: 'Fashion', body: 'Editorial whitespace. Bold serif display, a single model image per spread.' },
            { id: 'cinema', title: 'Cinema', body: 'Scene cards and subtitle captions. Dark palette, moody pacing.' },
          ].map(m => (
            <button key={m.id} onClick={() => onMode(m.id)} style={{ textAlign: 'left', padding: 20, border: `1px solid ${mode === m.id ? 'currentColor' : 'var(--rule)'}`, background: mode === m.id ? 'oklch(from currentColor l c h / 0.05)' : 'transparent' }}>
              <div className="row between items-center">
                <div className="mono">{m.id.toUpperCase()}</div>
                {mode === m.id && <div className="chip chip-solid">Active</div>}
              </div>
              <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 36, marginTop: 14, letterSpacing: '-0.02em' }}>{m.title}</div>
              <div style={{ marginTop: 8, opacity: 0.75 }}>{m.body}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of projects */}
      <div className="max-wide" style={{ padding: '24px 40px 80px' }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>Recently published</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {PROJECTS_FEED.slice(3).map(p => (
            <div key={p.id} style={{ cursor: 'pointer' }} onClick={() => onNav('public-project')}>
              <Img label={p.label} tone={p.mode === 'punk' ? 'punk' : p.mode === 'cinema' ? 'dark' : 'cool'} ratio="4/3" />
              <div className="row between items-center" style={{ marginTop: 10 }}>
                <div className="mono-sm" style={{ opacity: 0.6 }}>{p.author} · {p.stops} stops</div>
                <div className="mono-sm">{p.reads}</div>
              </div>
              <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 24, lineHeight: 1.1, marginTop: 4 }}>{p.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--rule)', padding: '32px 40px', marginTop: 40 }}>
        <div className="max-wide row between items-center">
          <div className="mono-sm" style={{ opacity: 0.6 }}>London Cuts · Ed. 01 · Apr 2026</div>
          <div className="row gap-24 mono-sm" style={{ opacity: 0.6 }}>
            <span>About</span><span>Press</span><span>Terms</span><span>API</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Landing });
