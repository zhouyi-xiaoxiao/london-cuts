// Roadshow 11 — Beyond London
// The grammar travels. Four city cards showing how the same product speaks
// about other places. Typographic — no photography required.

function R11Beyond() {
  const cities = [
    {
      city: 'KYOTO',
      coord: '35.0116 · 135.7681',
      mode: 'FASHION',
      accent: 'var(--accent)',
      bg: 'var(--paper)',
      ink: 'var(--ink)',
      headline: 'A quiet light, a long corridor.',
      lead: 'Tea at 16:40. The stones remember the rain.',
      mood: ['QUIET', 'AMBER', 'STONE'],
      font: 'var(--f-fashion)',
      italic: true,
      size: 52,
    },
    {
      city: 'TBILISI',
      coord: '41.7151 · 44.8271',
      mode: 'PUNK',
      accent: 'var(--punk-red)',
      bg: 'var(--punk-bg)',
      ink: 'var(--punk-ink)',
      headline: 'OLD TOWN · RED SIGN · ONE COIN.',
      lead: 'BASEMENT TAVERN · WINE IN CLAY · NO MENU.',
      mood: ['SHARP', 'HOT', 'CHEAP'],
      font: 'var(--f-punk)',
      italic: false,
      size: 40,
    },
    {
      city: 'REYKJAVÍK',
      coord: '64.1466 · −21.9426',
      mode: 'CINEMA',
      accent: 'var(--cinema-accent)',
      bg: 'var(--cinema-bg)',
      ink: 'var(--cinema-fg)',
      headline: 'EXT. BLACK SAND — DUSK. The ocean keeps score.',
      lead: 'Wide shot. A single figure, west-facing.',
      mood: ['COLD', 'SLOW', 'HUGE'],
      font: 'var(--f-display)',
      italic: true,
      size: 36,
    },
    {
      city: 'LONDON',
      coord: '51.5023 · −00.0807',
      mode: 'ORIGINAL',
      accent: 'var(--accent)',
      bg: 'var(--paper-2)',
      ink: 'var(--ink)',
      headline: 'Where it started. Bermondsey · Amber.',
      lead: 'One trip, three Londons. The template the other cities inherit.',
      mood: ['WARM', 'LATE', 'HOME'],
      font: 'var(--f-fashion)',
      italic: true,
      size: 44,
    },
  ];

  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>11 · THE GRAMMAR TRAVELS</span>
        </div>
        <span className="pageno">11 / 14</span>
      </div>

      <div style={{ marginTop: 64 }}>
        <div className="eyebrow">London is the prototype — not the ceiling</div>
        <h2 className="fashion" style={{ fontSize: 108, margin: '20px 0 0', lineHeight: 0.98 }}>
          Same product.<br />
          <span style={{ color: 'var(--accent)' }}>Other cities, in their own voice.</span>
        </h2>
      </div>

      <div style={{
        marginTop: 52,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 26,
        flex: 1,
        paddingBottom: 120,
      }}>
        {cities.map((c, i) => (
          <div key={i} style={{
            background: c.bg,
            color: c.ink,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            border: c.mode === 'CINEMA' ? '1px solid oklch(0.35 0.02 250)' : '1px solid var(--rule)',
            position: 'relative',
          }}>
            {/* Top meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span className="mono" style={{ fontSize: 14, letterSpacing: '0.24em', color: c.accent }}>{c.city}</span>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', opacity: 0.55 }}>{c.coord}</span>
              </div>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', background: c.accent, color: c.bg, padding: '3px 8px' }}>
                {c.mode}
              </span>
            </div>

            {/* Rule */}
            <div style={{ height: 1, background: c.mode === 'CINEMA' ? 'oklch(0.45 0.02 250)' : 'var(--rule)', marginBottom: 22 }} />

            {/* Headline */}
            <div style={{
              fontFamily: c.font,
              fontStyle: c.italic ? 'italic' : 'normal',
              fontSize: c.size,
              lineHeight: 1.05,
              letterSpacing: c.mode === 'PUNK' ? '-0.01em' : '-0.015em',
              marginBottom: 18,
            }}>
              {c.headline}
            </div>

            {/* Lead */}
            <p className="body" style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: c.mode === 'CINEMA' ? c.ink : 'var(--ink-2)',
              opacity: c.mode === 'CINEMA' ? 0.85 : 1,
              margin: 0,
              fontFamily: c.mode === 'PUNK' ? 'var(--f-mono)' : 'var(--f-body)',
              textTransform: c.mode === 'PUNK' ? 'uppercase' : 'none',
              letterSpacing: c.mode === 'PUNK' ? '0.04em' : '0',
            }}>
              {c.lead}
            </p>

            {/* Mood tags */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 18 }}>
              {c.mood.map((t, j) => (
                <span key={j} style={{
                  background: c.mode === 'CINEMA' ? 'rgba(255,255,255,0.1)' : c.ink,
                  color: c.mode === 'CINEMA' ? c.ink : c.bg,
                  padding: '3px 8px',
                  fontFamily: 'var(--f-mono)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 48,
        borderTop: '1px solid var(--rule)',
        paddingTop: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', opacity: 0.55 }}>
          FOUR CITIES · ONE ENGINE
        </span>
        <span className="fashion" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--accent)' }}>
          — The grammar travels farther than we do.
        </span>
      </div>
    </section>
  );
}

window.R11Beyond = R11Beyond;
