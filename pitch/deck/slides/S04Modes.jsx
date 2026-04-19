// Slide 04 — Three Modes (the hero moment)
// Three columns, each a Postcard rendered in its mode. Same walk, three
// grammars. This is the "aha" — keep it dense with typographic personality.

function S04Modes() {
  const sample = {
    place: 'BERMONDSEY ST',
    time: '16:42',
    mood: 'AMBER',
  };

  return (
    <section className="slide full">
      {/* Slim chrome on paper strip at top */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 100, background: 'var(--paper)', display: 'flex', alignItems: 'center', padding: '0 80px', justifyContent: 'space-between', zIndex: 3, borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span className="roundel" />
          <span className="mono" style={{ fontSize: 15 }}>04 · THREE MODES</span>
        </div>
        <div className="fashion" style={{ fontSize: 36, fontStyle: 'italic' }}>Same walk. Three grammars.</div>
        <div className="mono" style={{ fontSize: 14, opacity: 0.55 }}>04 / 07</div>
      </div>

      <div style={{ position: 'absolute', top: 100, left: 0, right: 0, bottom: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

        {/* ── FASHION ─────────────────────────── */}
        <div style={{ background: 'var(--paper)', color: 'var(--ink)', padding: 56, position: 'relative', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.24em' }}>ISSUE ·  AMBER </span>
            <span className="mono" style={{ fontSize: 11, opacity: 0.55 }}>FASHION</span>
          </div>
          <div style={{ height: 1, background: 'var(--ink)', margin: '18px 0 40px' }} />

          <div className="fashion" style={{ fontSize: 80, lineHeight: 0.95, fontStyle: 'italic' }}>
            A late<br />light,<br />a long<br />street.
          </div>

          <div style={{ marginTop: 36, height: 280, overflow: 'hidden' }}>
            <img src="../assets/seed-southbank.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.88)' }} />
          </div>

          <div style={{ marginTop: 22 }} className="mono" >
            <div style={{ fontSize: 10, letterSpacing: '0.22em', opacity: 0.7 }}>{sample.place} · {sample.time} · {sample.mood}</div>
          </div>

          <div className="fashion" style={{ fontSize: 22, lineHeight: 1.35, marginTop: 24, fontStyle: 'italic', color: 'var(--ink-2)' }}>
            The sun has given up on being clever about it; it is simply warm, and low, and about to go.
          </div>
        </div>

        {/* ── PUNK ─────────────────────────── */}
        <div style={{ background: 'var(--punk-bg)', color: 'var(--punk-ink)', padding: 56, position: 'relative', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--punk-ink)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.24em', background: 'var(--punk-ink)', color: 'var(--punk-bg)', padding: '4px 8px' }}>ISSUE · AMBER</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--punk-red)' }}>PUNK</span>
          </div>
          <div style={{ height: 4, background: 'var(--punk-ink)', margin: '14px 0 32px' }} />

          <div style={{ fontFamily: 'var(--f-punk)', fontSize: 108, lineHeight: 0.88, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            LATE<br />LIGHT<br /><span style={{ color: 'var(--punk-red)' }}>LONG</span><br />STREET
          </div>

          <div style={{ marginTop: 28, height: 240, overflow: 'hidden', boxShadow: '6px 6px 0 var(--punk-ink)', border: '2px solid var(--punk-ink)' }}>
            <img src="../assets/seed-southbank.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.25) saturate(1.1)' }} />
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[sample.place, sample.time, sample.mood, 'SE1', 'WARM'].map((t, i) => (
              <span key={i} style={{ background: i === 2 ? 'var(--punk-red)' : 'var(--punk-ink)', color: 'var(--punk-bg)', padding: '4px 8px', fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.14em' }}>{t}</span>
            ))}
          </div>

          <div style={{ fontFamily: 'var(--f-body)', fontWeight: 700, fontSize: 20, lineHeight: 1.3, marginTop: 22, textTransform: 'uppercase' }}>
            SUN QUIT · TOO WARM · TOO LOW · <span style={{ color: 'var(--punk-red)' }}>GONE IN TEN.</span>
          </div>
        </div>

        {/* ── CINEMA ─────────────────────────── */}
        <div style={{ background: 'var(--cinema-bg)', color: 'var(--cinema-fg)', padding: 56, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.24em', opacity: 0.7 }}>ISSUE · AMBER</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--cinema-accent)' }}>CINEMA</span>
          </div>
          <div style={{ height: 1, background: 'oklch(0.45 0.02 250)', margin: '18px 0 40px' }} />

          <div className="display" style={{ fontSize: 56, lineHeight: 1.02, fontFamily: 'var(--f-display)', letterSpacing: '-0.01em' }}>
            EXT. BERMONDSEY<br />STREET — DUSK
          </div>

          {/* Letterboxed still */}
          <div style={{ marginTop: 32, position: 'relative', height: 260, overflow: 'hidden', background: '#000' }}>
            <img src="../assets/seed-southbank.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.7) contrast(1.1) brightness(0.85)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 26, background: '#000' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, background: '#000' }} />
            {/* Subtitle */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 36, textAlign: 'center', color: 'var(--cinema-accent)', fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.04em', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              "The sun, giving up."
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', opacity: 0.6 }}>16:42:07 · {sample.place} · ROLL 04</div>
          </div>

          <div className="display" style={{ fontSize: 22, lineHeight: 1.4, marginTop: 24, color: 'var(--cinema-fg)', opacity: 0.88, fontFamily: 'var(--f-display)', fontStyle: 'italic' }}>
            She walks east. The light is already gone from the shop windows. Cut to the river.
          </div>
        </div>
      </div>
    </section>
  );
}

window.S04Modes = S04Modes;
