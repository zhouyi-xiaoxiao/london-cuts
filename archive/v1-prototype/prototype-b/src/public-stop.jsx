// public-stop.jsx — Stop / Chapter page and Postcard page
// Stop uses mode-specific grammars; postcard is a detail view for a generated postcard

function Stop({ mode, onMode, onNav }) {
  const stop = STOPS[4]; // Waterloo Bridge dusk
  return (
    <div className="page" data-mode={mode}>
      <PublicNav mode={mode} onMode={onMode} screen="stop" onNav={onNav} />

      {mode === 'punk' && <StopPunk stop={stop} onNav={onNav} />}
      {mode === 'fashion' && <StopFashion stop={stop} onNav={onNav} />}
      {mode === 'cinema' && <StopCinema stop={stop} onNav={onNav} />}

      {/* Prev / next chapter */}
      <div className="max-wide row between items-center" style={{ padding: '40px', borderTop: '1px solid currentColor', borderTopColor: 'oklch(from currentColor l c h / 0.2)' }}>
        <button onClick={() => onNav('public-project')} className="col items-start gap-4" style={{ textAlign: 'left' }}>
          <div className="mono-sm" style={{ opacity: 0.6 }}>← STOP 04</div>
          <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 22 }}>Thames at low tide</div>
        </button>
        <button onClick={() => onNav('postcard')} className="btn btn-solid">View generated postcard →</button>
        <button onClick={() => onNav('stop')} className="col items-end gap-4" style={{ textAlign: 'right' }}>
          <div className="mono-sm" style={{ opacity: 0.6 }}>STOP 06 →</div>
          <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 22 }}>The National Theatre façade</div>
        </button>
      </div>
    </div>
  );
}

function StopPunk({ stop, onNav }) {
  return (
    <div style={{ padding: '40px 0', background: 'oklch(0.97 0 0)' }}>
      <div className="max-wide" style={{ padding: '0 40px' }}>
        {/* Header strip */}
        <div className="row between items-baseline" style={{ marginBottom: 20, borderBottom: '2px solid black', paddingBottom: 8 }}>
          <div className="row items-baseline gap-16">
            <span className="mono" style={{ background: 'black', color: 'white', padding: '4px 8px' }}>STOP 05 / 10</span>
            <span className="mono">{stop.code} · {stop.time}</span>
          </div>
          <span style={{ fontFamily: 'var(--f-hand)', fontSize: 22 }}>— mood: {stop.mood.toLowerCase()} —</span>
        </div>

        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 140, lineHeight: 0.9, textTransform: 'uppercase', margin: '20px 0 40px' }}>
          <span style={{ background: 'oklch(0.62 0.24 25)', color: 'white', padding: '0 12px' }}>Waterloo br.</span><br/>
          <span style={{ marginLeft: 100 }}>facing east</span>
        </h1>

        {/* Collage of 4 images */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12, margin: '40px 0' }}>
          <div style={{ gridColumn: 'span 8', transform: 'rotate(-0.5deg)', boxShadow: '0 6px 12px rgba(0,0,0,0.2)' }}>
            <Img label="MAIN SHOT · DUSK · SOUTH LOOK" tone="warm" ratio="16/9" />
          </div>
          <div style={{ gridColumn: 'span 4', transform: 'rotate(2deg)', boxShadow: '0 6px 12px rgba(0,0,0,0.2)' }}>
            <Img label="ST PAUL'S" tone="cool" ratio="2/3" />
          </div>
          <div style={{ gridColumn: 'span 3', transform: 'rotate(-2deg)', boxShadow: '0 6px 12px rgba(0,0,0,0.2)' }}>
            <Img label="HANDS" tone="punk" ratio="1/1" />
          </div>
          <div style={{ gridColumn: 'span 5', transform: 'rotate(1deg)' }}>
            <Img label="BRIDGE LAMP · CLOSE" tone="warm" ratio="16/9" />
          </div>
          <div style={{ gridColumn: 'span 4', transform: 'rotate(-1deg)' }}>
            <Img label="SKYLINE CROP" tone="cool" ratio="4/3" />
          </div>
        </div>

        {/* Two-column typewriter body with pull quote */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, fontFamily: 'var(--f-mono)', fontSize: 14, lineHeight: 1.7 }}>
          <div>
            <p style={{ marginBottom: 12 }}><span style={{ float: 'left', fontFamily: 'var(--f-display)', fontSize: 72, lineHeight: 0.85, marginRight: 8 }}>T</span>HE BRIDGE catches the sun for about six minutes before it tips into the river. I've walked it three dozen times and every time it looks like someone cut a different film from the same reel.</p>
            <p style={{ marginBottom: 12 }}>People walk it briskly, with intent, which is why the slow ones stand out — tourists mostly, and one or two lovers who've stopped mattering to the city.</p>
            <div style={{ background: 'black', color: 'oklch(0.62 0.24 25)', padding: 16, margin: '24px 0', transform: 'rotate(-0.5deg)', fontFamily: 'var(--f-display)', fontSize: 28, textTransform: 'uppercase', lineHeight: 1.1 }}>
              The river is the only thing in London that tells the time.
            </div>
          </div>
          <div>
            <p style={{ marginBottom: 12 }}>I came here after a shift at Tas and sat with a bottle of water and a camera I didn't turn on. St Paul's was burning from the side and the water was matte.</p>
            <p style={{ marginBottom: 12 }}>A busker played a harmonica badly. Good, actually. Good badly.</p>
            <div className="mono" style={{ marginTop: 20, background: 'oklch(0.9 0 0)', padding: 12 }}>
              GEO: 51.5086, -0.1167 · ALT: 8M · LIGHT: 640 LUX · WEATHER: CLEAR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StopFashion({ stop, onNav }) {
  return (
    <div style={{ background: 'oklch(0.98 0.008 75)', padding: '80px 0' }}>
      <div className="max-narrow" style={{ marginBottom: 60, textAlign: 'center' }}>
        <div className="mono-sm" style={{ marginBottom: 20, opacity: 0.6, letterSpacing: '0.3em' }}>CHAPTER FIVE · OF TEN</div>
        <h1 style={{ fontFamily: 'var(--f-fashion)', fontSize: 96, lineHeight: 1, fontStyle: 'italic', fontWeight: 300, letterSpacing: '-0.02em' }}>
          Waterloo bridge,<br/>facing east
        </h1>
        <div className="mono-sm" style={{ marginTop: 24, opacity: 0.6 }}>{stop.code} · {stop.time} · {stop.mood.toUpperCase()}</div>
      </div>

      {/* Full-bleed single image */}
      <div style={{ padding: '0 80px' }}>
        <Img label="BRIDGE · FACING EAST · 17:19" tone="warm" ratio="21/9" />
        <div className="mono-sm" style={{ textAlign: 'right', marginTop: 8, opacity: 0.5 }}>— PH. A.ISHII / ED.01 / 05</div>
      </div>

      <div className="max-narrow" style={{ padding: '80px 40px 0' }}>
        <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 28, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.4, marginBottom: 40, color: 'oklch(0.3 0.02 40)' }}>
          The bridge catches the sun for about six minutes before it tips into the river. I've walked it three dozen times and every time it looks like someone cut a different film from the same reel.
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20 }}>
          People walk it briskly, with intent, which is why the slow ones stand out — tourists mostly, and one or two lovers who've stopped mattering to the city.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20 }}>
          I came here after a shift at Tas and sat with a bottle of water and a camera I didn't turn on. St Paul's was burning from the side and the water was matte.
        </p>
      </div>

      {/* Asymmetric two images */}
      <div className="max-wide" style={{ padding: '60px 40px', display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 32 }}>
        <Img label="ST PAUL'S · DISTANT" tone="cool" ratio="4/5" />
        <div className="col" style={{ justifyContent: 'flex-end' }}>
          <Img label="BRIDGE LAMP · DETAIL" tone="warm" ratio="1/1" />
          <div className="mono-sm" style={{ marginTop: 12, opacity: 0.6 }}>FIG. 5.2 — The east lamp, 17:23. A minute after St Paul's turned.</div>
        </div>
      </div>
    </div>
  );
}

function StopCinema({ stop, onNav }) {
  return (
    <div style={{ background: 'oklch(0.12 0.015 250)', color: 'oklch(0.92 0.01 80)', padding: '40px 0' }}>
      <div className="max-wide" style={{ padding: '0 40px' }}>
        {/* Slate */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, padding: '20px 24px', border: '1px solid oklch(0.4 0.02 250)', marginBottom: 32 }}>
          {[
            ['SCENE', '05'],
            ['INT/EXT', 'EXT · BRIDGE'],
            ['TIME', '17:19 · DUSK'],
            ['MOOD', stop.mood],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="mono-sm" style={{ opacity: 0.5 }}>{k}</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 20, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>

        <h1 style={{ fontFamily: 'var(--f-serif)', fontSize: 88, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 8 }}>
          Waterloo bridge, facing east
        </h1>
        <div className="mono-sm" style={{ opacity: 0.6, letterSpacing: '0.25em', marginBottom: 40 }}>— A WALK, IN SEVEN SHOTS —</div>

        {/* Shot sequence — letterboxed frames with subtitles */}
        <div className="col gap-48">
          {[
            { label: 'WIDE · SOUTH LOOK · DUSK', sub: 'She steps onto the bridge. St Paul\'s burns in the distance, sideways.' },
            { label: 'MID · ST PAUL\'S THROUGH RAIL', sub: 'A moment held. The traffic sound thins.' },
            { label: 'INSERT · BRIDGE LAMP · ON', sub: '[camera pan right, following a cyclist]' },
            { label: 'TRACKING · FOLLOWING HER', sub: 'The river is the only thing in London that tells the time.' },
            { label: 'WIDE · SILHOUETTE · REVERSE', sub: 'She turns. The city goes violet behind her.' },
          ].map((s, i) => (
            <div key={i}>
              <div className="row between items-end" style={{ marginBottom: 10 }}>
                <div className="mono-sm" style={{ opacity: 0.6 }}>SHOT {String(i + 1).padStart(2, '0')}</div>
                <div className="mono-sm" style={{ opacity: 0.6 }}>{s.label}</div>
              </div>
              <div style={{ position: 'relative' }}>
                <Img label={s.label} tone="dark" ratio="21/9" />
                {/* subtitle */}
                <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.55)', padding: '8px 16px', fontFamily: 'var(--f-mono)', fontSize: 15, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Stop });
