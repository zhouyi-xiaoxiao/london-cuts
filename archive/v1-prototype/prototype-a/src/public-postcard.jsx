// public-postcard.jsx — Postcard detail page
// Shows a generated postcard front/back + meta + save/share actions

function Postcard({ mode, onMode, onNav }) {
  const [flipped, setFlipped] = React.useState(false);
  const [busy, setBusy] = React.useState(null);
  const download = async (side) => {
    setBusy(side);
    try {
      if (side === 'both') await exportPostcardBoth({ mode });
      else await exportPostcardPNG({ mode, side });
      storeActions.addPostcardVersion('05', {
        versionId: 'v' + Date.now().toString(36),
        ts: Date.now(), durationMs: 0, mode, side,
      });
    } finally { setBusy(null); }
  };
  return (
    <div className="page" data-mode={mode}>
      <PublicNav mode={mode} onMode={onMode} screen="postcard" onNav={onNav} />

      <div className="max-wide" style={{ padding: '40px' }}>
        <div className="row between items-baseline" style={{ marginBottom: 24 }}>
          <div>
            <div className="eyebrow">Postcard · Stop 05 · Waterloo Bridge</div>
            <h1 style={{ fontFamily: 'var(--mode-display-font)', fontSize: 48, lineHeight: 1, marginTop: 8, letterSpacing: '-0.02em' }}>
              Greetings from SE1.
            </h1>
          </div>
          <div className="row gap-12">
            <button className="btn" onClick={() => setFlipped(!flipped)}>Flip card ↻</button>
            <button className="btn" onClick={() => download(flipped ? 'back' : 'front')} disabled={!!busy}>
              {busy === (flipped ? 'back' : 'front') ? 'Rendering…' : 'Download PNG'}
            </button>
            <button className="btn" onClick={() => download('both')} disabled={!!busy}>
              {busy === 'both' ? 'Rendering…' : 'Download front + back'}
            </button>
            <button className="btn btn-solid" onClick={() => navigator.share
              ? navigator.share({ title: 'Postcard from SE1', text: 'Greetings from SE1.', url: location.href }).catch(() => {})
              : navigator.clipboard?.writeText(location.href).then(() => alert('Link copied.'))
            }>Share</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 32, alignItems: 'flex-start' }}>
          {/* Postcard stage */}
          <div style={{ padding: 60, background: 'var(--paper-2)', borderRadius: 4, minHeight: 620, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ perspective: 2000, width: '100%', maxWidth: 680 }}>
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '7/5',
                transformStyle: 'preserve-3d',
                transition: 'transform 700ms cubic-bezier(0.2, 0.8, 0.3, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}>
                {/* FRONT */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)' }}>
                  <PostcardFront mode={mode} />
                </div>
                {/* BACK */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}>
                  <PostcardBack mode={mode} />
                </div>
              </div>
              <div className="row center gap-8" style={{ marginTop: 16 }}>
                <span className="mono-sm" style={{ opacity: 0.6 }}>{flipped ? 'BACK' : 'FRONT'}</span>
                <span className="mono-sm" style={{ opacity: 0.3 }}>·</span>
                <span className="mono-sm" style={{ opacity: 0.6 }}>148 × 105 mm · 350gsm matte</span>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="col gap-24">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Generated from</div>
              <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 20, lineHeight: 1.2 }}>Stop 05 · Waterloo bridge, facing east</div>
              <div className="mono-sm" style={{ opacity: 0.6, marginTop: 4 }}>A Year in SE1 · by Ana Ishii</div>
            </div>
            <div className="rule" />
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Details</div>
              <div className="col gap-8">
                {[
                  ['Location', 'Waterloo Bridge, SE1 7PB'],
                  ['Captured', '17:19, 28 Oct 2025'],
                  ['Weather', 'Clear · 8°C · light SW'],
                  ['Mode', mode[0].toUpperCase() + mode.slice(1)],
                  ['Source images', '3 of 12 stop images'],
                  ['Generated', '2.4s · Media module v3'],
                ].map(([k, v]) => (
                  <div key={k} className="row between">
                    <span className="mono-sm" style={{ opacity: 0.5 }}>{k}</span>
                    <span style={{ fontSize: 13, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rule" />
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Versions</div>
              <PostcardVersions mode={mode} stopId="05" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostcardFront({ mode }) {
  if (mode === 'punk') {
    return (
      <div style={{ width: '100%', height: '100%', background: 'black', position: 'relative', overflow: 'hidden' }}>
        <Img label="WATERLOO · DUSK" tone="punk" style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', height: '100%' }} />
        <div style={{ position: 'absolute', top: 20, left: 20, background: 'oklch(0.62 0.24 25)', color: 'white', padding: '6px 10px', fontFamily: 'var(--f-display)', fontSize: 20, transform: 'rotate(-3deg)' }}>SE1!!</div>
        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, fontFamily: 'var(--f-display)', fontSize: 56, color: 'white', textTransform: 'uppercase', lineHeight: 0.9, textShadow: '3px 3px 0 oklch(0.62 0.24 25)' }}>
          Greetings<br/>from<br/>Waterloo
        </div>
      </div>
    );
  }
  if (mode === 'cinema') {
    return (
      <div style={{ width: '100%', height: '100%', background: 'oklch(0.1 0.015 250)', position: 'relative', overflow: 'hidden' }}>
        <Img label="WATERLOO · 17:19 · DUSK" tone="dark" style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', height: '100%' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: 'black' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'black' }} />
        <div style={{ position: 'absolute', bottom: 56, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.5)', padding: '6px 14px', fontFamily: 'var(--f-mono)', fontSize: 13, color: 'oklch(0.88 0.14 90)' }}>
            — The river is the only thing in London that tells the time.
          </div>
        </div>
        <div style={{ position: 'absolute', top: 50, left: 20, fontFamily: 'var(--f-mono)', fontSize: 10, color: 'oklch(0.88 0.14 90)', letterSpacing: '0.2em' }}>
          SE1 · SCENE 05 · 17:19
        </div>
      </div>
    );
  }
  // Fashion
  return (
    <div style={{ width: '100%', height: '100%', background: 'oklch(0.98 0.008 75)', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '2fr 3fr' }}>
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="mono-sm" style={{ letterSpacing: '0.3em' }}>LONDON · SE1</div>
        <div>
          <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 48, fontStyle: 'italic', lineHeight: 1, color: 'oklch(0.2 0.02 40)' }}>
            Waterloo<br/><em style={{ fontWeight: 300 }}>Bridge</em>
          </div>
          <div className="mono-sm" style={{ marginTop: 16, opacity: 0.6 }}>ED. 01 / 05 OF 10</div>
        </div>
      </div>
      <Img label="BRIDGE · EAST · 17:19" tone="warm" style={{ height: '100%', aspectRatio: 'auto' }} />
    </div>
  );
}

function PostcardBack({ mode }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'oklch(0.96 0.008 60)', color: 'oklch(0.15 0.008 60)', padding: 32, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, fontFamily: 'var(--f-mono)' }}>
      <div style={{ borderRight: '1px solid oklch(0.8 0.008 60)', paddingRight: 24 }}>
        <div style={{ fontFamily: 'var(--f-hand)', fontSize: 22, lineHeight: 1.5, color: 'oklch(0.25 0.02 240)' }}>
          M — walked home across Waterloo last night. The river caught. Thought of you in Lisbon. Six minutes of gold, then nothing. <br/><br/>— A.
        </div>
      </div>
      <div className="col between">
        <div>
          <div className="mono-sm" style={{ letterSpacing: '0.25em', marginBottom: 12 }}>LONDON CUTS · ED.01 / 05</div>
          <div style={{ borderBottom: '1px solid oklch(0.4 0.008 60)', padding: '4px 0', fontSize: 12 }}>Matteo Ricci</div>
          <div style={{ borderBottom: '1px solid oklch(0.4 0.008 60)', padding: '4px 0', fontSize: 12 }}>Rua das Flores 28</div>
          <div style={{ borderBottom: '1px solid oklch(0.4 0.008 60)', padding: '4px 0', fontSize: 12 }}>1200-195 Lisboa</div>
          <div style={{ borderBottom: '1px solid oklch(0.4 0.008 60)', padding: '4px 0', fontSize: 12 }}>Portugal</div>
        </div>
        <div style={{ width: 60, height: 76, border: '1px dashed oklch(0.4 0.008 60)', alignSelf: 'flex-end', padding: 6, textAlign: 'center', fontSize: 8, lineHeight: 1.2 }}>
          1ST<br/>CLASS<br/>—<br/>SE1
        </div>
      </div>
    </div>
  );
}

function PostcardVersions({ mode, stopId }) {
  const versions = useStore(s => s.postcardVersions[stopId] || []);
  const showSeedIfEmpty = versions.length === 0;
  const items = showSeedIfEmpty
    ? [
        { versionId: 'seed-3', ts: Date.now() - 120000, mode: 'fashion', side: 'front', seed: true, label: 'v3 · Tighter crop' },
        { versionId: 'seed-2', ts: Date.now() - 960000, mode: 'fashion', side: 'front', seed: true, label: 'v2 · First pass' },
        { versionId: 'seed-1', ts: Date.now() - 1920000, mode: 'fashion', side: 'front', seed: true, label: 'v1 · Initial' },
      ]
    : versions.slice(0, 6).map((v, i) => ({
        ...v,
        label: `v${versions.length - i} · ${v.mode || mode} · ${v.side || 'front'}`,
      }));
  return (
    <div className="col gap-8">
      {items.map((v, i) => (
        <div key={v.versionId} className="row between items-center" style={{ padding: '6px 8px', background: i === 0 ? 'var(--paper-3)' : 'transparent' }}>
          <span className="mono-sm">{v.label}</span>
          {i === 0 && <span className="chip chip-solid">Active</span>}
        </div>
      ))}
      <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => exportPostcardPNG({ mode, side: 'front' })}>
        Render new version →
      </button>
    </div>
  );
}

Object.assign(window, { Postcard, PostcardVersions });
