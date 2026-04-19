// public-project.jsx — Public project page
// Mode switching CHANGES THE LAYOUT GRAMMAR, not just color.

function PublicProject({ mode = 'fashion', onMode, onNav, onStopClick }) {
  return (
    <div className="page" data-mode={mode}>
      <PublicNav mode={mode} onMode={onMode} screen="public-project" onNav={onNav} />

      {mode === 'punk' && <ProjectPunk mode={mode} onNav={onNav} onStopClick={onStopClick} />}
      {mode === 'fashion' && <ProjectFashion mode={mode} onNav={onNav} onStopClick={onStopClick} />}
      {mode === 'cinema' && <ProjectCinema mode={mode} onNav={onNav} onStopClick={onStopClick} />}
    </div>
  );
}

// ———————————— PUNK: collage / zine / taped / ransom-note ————————————
function ProjectPunk({ mode, onNav, onStopClick }) {
  const handleStopListClick = (stop) => {
    if (onStopClick) onStopClick(stop);
    else onNav('stop');
  };

  return (
    <div style={{ padding: '24px 0 80px', background: 'oklch(0.97 0 0)' }}>
      <div className="max-wide">
        {/* Ransom-note headline */}
        <div style={{ position: 'relative', padding: '40px 0 20px', minHeight: 400 }}>
          <div className="mono" style={{ position: 'absolute', top: 40, left: 0, transform: 'rotate(-4deg)', background: 'black', color: 'white', padding: '6px 10px' }}>ISSUE 01 // SE1</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 180, lineHeight: 0.82, textTransform: 'uppercase', marginTop: 60 }}>
            <span style={{ background: 'black', color: 'white', padding: '0 12px', display: 'inline-block', transform: 'rotate(-1deg)' }}>A YEAR</span><br/>
            <span style={{ display: 'inline-block', transform: 'rotate(1deg)', marginLeft: 40 }}>in</span>&nbsp;
            <span style={{ background: 'oklch(0.62 0.24 25)', color: 'white', padding: '0 12px', display: 'inline-block', transform: 'rotate(-2deg)' }}>SE1\!\!</span>
          </div>
          <div style={{ position: 'absolute', right: 40, top: 80, transform: 'rotate(6deg)', width: 200 }}>
            <Img label="ANA · B&amp;W" tone="punk" ratio="3/4" />
            <div className="mono-sm" style={{ marginTop: 6, textAlign: 'center' }}>— BY ANA ISHII, 10 CUTS</div>
          </div>
        </div>

        {/* MapLibre Atlas — replacing static collage */}
        <div style={{ position: 'relative', margin: '40px 0', aspectRatio: '4/3', border: '1px solid black', overflow: 'hidden' }}>
          <StopAtlas mode={mode} onStopClick={handleStopListClick} />
        </div>

        {/* List of stops — zine style, typewriter */}
        <div style={{ margin: '60px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <div className="mono" style={{ background: 'black', color: 'white', padding: '6px 10px', display: 'inline-block', marginBottom: 16 }}>THE WALK · 10 STOPS</div>
            <div className="col gap-4">
              {STOPS.map(s => (
                <div key={s.n} className="row between items-baseline" style={{ borderBottom: '1px dashed black', padding: '10px 0', cursor: 'pointer' }} onClick={() => handleStopListClick(s)}>
                  <div className="row items-baseline gap-12">
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: 24 }}>{s.n}</span>
                    <span style={{ fontFamily: 'var(--f-hand)', fontSize: 24 }}>{s.title}</span>
                  </div>
                  <span className="mono-sm">{s.code} · {s.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 14, lineHeight: 1.7 }}>
            <div style={{ background: 'oklch(0.62 0.24 25)', color: 'white', padding: 16, marginBottom: 16, transform: 'rotate(-0.5deg)' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, textTransform: 'uppercase', marginBottom: 6 }}>A year. Ten walks.</div>
              <div>Between Bermondsey and Waterloo. On foot. At all hours. Between Feb and Dec.</div>
            </div>
            <p style={{ marginBottom: 12 }}>I GREW UP looking at this city from across the river. Now I live in it. These are the cuts I kept.</p>
            <p style={{ marginBottom: 12 }}>&mdash; NOT A TOURIST GUIDE. NOT A LIST. A ZINE.</p>
            <div className="row gap-8" style={{ marginTop: 20 }}>
              <button className="btn" style={{ background: 'black', color: 'white', borderColor: 'black' }} onClick={() => handleStopListClick(STOPS[0])}>READ &rarr;</button>
              <button className="btn">SAVE</button>
              <button className="btn">SHARE</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ———————————— FASHION: whitespace, serif, single big crop + map ————————————
function ProjectFashion({ mode, onNav, onStopClick }) {
  const handleStopListClick = (stop) => {
    if (onStopClick) onStopClick(stop);
    else onNav('stop');
  };

  return (
    <div style={{ padding: '0 0 120px', background: 'oklch(0.98 0.008 75)' }}>
      {/* Huge hero with serif and bold crop */}
      <div className="max-wide" style={{ padding: '80px 40px 40px' }}>
        <div className="row between items-end" style={{ marginBottom: 80 }}>
          <div className="mono">SE1 · ED. 01 · 2026</div>
          <div className="mono">A YEAR IN TEN CUTS</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 48, alignItems: 'center', minHeight: 560 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 20 }}>Cover story</div>
            <h1 style={{
              fontFamily: 'var(--f-fashion)',
              fontSize: 120, lineHeight: 0.92,
              fontWeight: 400, fontStyle: 'italic',
              letterSpacing: '-0.03em',
            }}>A Year<br/>in SE1</h1>
            <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 20, fontStyle: 'italic', marginTop: 20, maxWidth: 380 }}>
              Ten walks between Bermondsey and Waterloo, assembled by Ana Ishii across a year on foot.
            </div>
            <div className="row gap-12" style={{ marginTop: 32 }}>
              <button className="btn btn-solid" onClick={() => handleStopListClick(STOPS[0])}>Read the walk →</button>
              <button className="btn">Save</button>
            </div>
          </div>
          <div>
            <Img label="ANA · WATERLOO BRIDGE · DUSK" tone="warm" ratio="3/4" style={{ height: 640 }} />
          </div>
        </div>
      </div>

      {/* Metadata row */}
      <div className="max-wide" style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        {[
          ['Author', 'Ana Ishii'],
          ['Stops', '10 across SE1'],
          ['Mode', 'Fashion · editorial'],
          ['Reading time', '42 minutes'],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="eyebrow">{k}</div>
            <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 28, fontStyle: 'italic', marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* MapLibre Atlas — replacing static layout */}
      <div className="max-wide" style={{ padding: '40px' }}>
        <div style={{ position: 'relative', aspectRatio: '16/9', border: '1px solid var(--rule)', overflow: 'hidden', marginBottom: 40 }}>
          <StopAtlas mode={mode} onStopClick={handleStopListClick} />
        </div>
      </div>

      {/* Spread: full-bleed image + centered caption */}
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 56, fontStyle: 'italic', fontWeight: 300, maxWidth: 900, margin: '0 auto', lineHeight: 1.2 }}>
          &ldquo;The river is the only thing in London that tells the time.&rdquo;
        </div>
        <div className="mono-sm" style={{ marginTop: 24, opacity: 0.6 }}>— STOP 05 / WATERLOO BRIDGE / 17:19</div>
      </div>

      {/* Index of stops */}
      <div className="max-wide" style={{ padding: '0 40px 40px' }}>
        <div className="row between items-end" style={{ borderBottom: '1px solid currentColor', paddingBottom: 14, marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 32, fontStyle: 'italic' }}>The ten stops</div>
          <div className="mono-sm">Index</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
          {STOPS.map((s, i) => (
            <div key={s.n} onClick={() => handleStopListClick(s)} style={{
              display: 'grid', gridTemplateColumns: '60px 1fr auto',
              gap: 16, padding: '18px 0',
              borderBottom: '1px solid var(--rule)',
              borderRight: i % 2 === 0 ? '1px solid var(--rule)' : 'none',
              paddingRight: i % 2 === 0 ? 24 : 0,
              paddingLeft: i % 2 === 1 ? 24 : 0,
              alignItems: 'center', cursor: 'pointer',
            }}>
              <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 44, fontStyle: 'italic', fontWeight: 300 }}>{parseInt(s.n, 10)}</div>
              <div>
                <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 22, fontStyle: 'italic' }}>{s.title}</div>
                <div className="mono-sm" style={{ opacity: 0.6, marginTop: 4 }}>{s.code} · {s.time}</div>
              </div>
              <div className="mono-sm" style={{ opacity: 0.5 }}>→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ———————————— CINEMA: dark, letterbox, subtitle captions + map ————————————
function ProjectCinema({ mode, onNav, onStopClick }) {
  const handleStopListClick = (stop) => {
    if (onStopClick) onStopClick(stop);
    else onNav('stop');
  };

  return (
    <div style={{ background: 'oklch(0.12 0.015 250)', color: 'oklch(0.92 0.01 80)', padding: '0 0 80px' }}>
      {/* Title card — letterbox */}
      <div style={{ position: 'relative', minHeight: 640, overflow: 'hidden' }}>
        <Img label="COLD OPEN · SE1 · 06:34 AM" tone="dark" style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', height: '100%' }} />
        {/* letterbox bars */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, black 0%, transparent 30%, transparent 70%, black 100%)' }} />
        {/* top letterbox bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'black' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'black' }} />

        {/* Center title */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
          <div className="mono" style={{ opacity: 0.7, marginBottom: 24, letterSpacing: '0.3em' }}>LONDON CUTS PRESENTS</div>
          <div style={{ fontFamily: 'var(--f-serif)', fontSize: 110, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1 }}>
            A Year in SE1
          </div>
          <div className="mono" style={{ marginTop: 20, letterSpacing: '0.3em', opacity: 0.7 }}>DIRECTED BY ANA ISHII · 10 SCENES</div>
        </div>

        {/* Subtitle */}
        <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.6)', padding: '10px 20px', fontFamily: 'var(--f-mono)', fontSize: 16, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            — Between Bermondsey and Waterloo. On foot. At all hours.
          </div>
        </div>
      </div>

      {/* MapLibre Atlas with letterbox */}
      <div className="max-wide" style={{ padding: '40px' }}>
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', marginBottom: 40 }}>
          <StopAtlas mode={mode} onStopClick={handleStopListClick} />
        </div>
      </div>

      {/* Scene list as shot sequence */}
      <div className="max-wide" style={{ padding: '60px 40px' }}>
        <div className="row between items-baseline" style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--f-serif)', fontSize: 48 }}>Shot sequence</div>
          <div className="mono-sm" style={{ opacity: 0.6 }}>10 SCENES · 42 MIN</div>
        </div>

        <div className="col gap-24">
          {STOPS.map((s, i) => (
            <div key={s.n} onClick={() => handleStopListClick(s)} style={{
              display: 'grid', gridTemplateColumns: '100px 280px 1fr',
              gap: 32, alignItems: 'center',
              padding: '16px 0',
              borderTop: '1px solid oklch(0.3 0.02 250)',
              cursor: 'pointer',
            }}>
              <div>
                <div className="mono-sm" style={{ opacity: 0.6 }}>SCENE</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 32, marginTop: 4 }}>{s.n}</div>
              </div>
              <Img label={s.label} tone="dark" ratio="16/9" />
              <div>
                <div style={{ fontFamily: 'var(--f-serif)', fontSize: 28, marginBottom: 8 }}>{s.title}</div>
                <div className="mono-sm" style={{ opacity: 0.7 }}>INT/EXT · {s.code} · {s.time} · {s.mood.toUpperCase()}</div>
                <div style={{ marginTop: 10, fontFamily: 'var(--f-mono)', fontSize: 13, opacity: 0.8, maxWidth: 520 }}>
                  — A slow push-in on the market arches. Amber glow. Vendors setting up crates.
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PublicProject });
