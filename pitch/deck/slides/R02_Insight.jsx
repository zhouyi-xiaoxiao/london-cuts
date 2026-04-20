// Roadshow 02 — The Insight
// "London is three cities." Three horizontal bands, each cast in one mode's
// palette and type. Sets up the whole deck in one page.

function R02Insight() {
  const rows = [
    {
      tag: 'FASHION',
      label: "London's editorial afternoons",
      quote: 'Bermondsey at three — long light, longer streets.',
      img: '../assets/seed-bermondsey.jpg',
      bg: 'var(--paper)',
      ink: 'var(--ink)',
      accent: 'var(--accent)',
      font: 'var(--f-fashion)',
      italic: true,
      extra: 'saturate(0.85)',
    },
    {
      tag: 'PUNK',
      label: "London's red-paint mornings",
      quote: 'CAMDEN WALL · RED PAINT · FOUR WORDS THAT MEAN IT.',
      img: '../assets/seed-night-neon.jpg',
      bg: 'var(--punk-bg)',
      ink: 'var(--punk-ink)',
      accent: 'var(--punk-red)',
      font: 'var(--f-punk)',
      italic: false,
      extra: 'contrast(1.2) saturate(1.1)',
    },
    {
      tag: 'CINEMA',
      label: "London's after-hours",
      quote: 'A night bus crosses the Thames. The river keeps its own time.',
      img: '../assets/seed-thames.jpg',
      bg: 'var(--cinema-bg)',
      ink: 'var(--cinema-fg)',
      accent: 'var(--cinema-accent)',
      font: 'var(--f-display)',
      italic: true,
      extra: 'saturate(0.65) brightness(0.82) contrast(1.1)',
    },
  ];

  return (
    <section className="slide full" style={{ background: 'var(--paper)' }}>
      {/* Slim chrome on paper */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 92, background: 'var(--paper)', display: 'flex', alignItems: 'center', padding: '0 80px', justifyContent: 'space-between', zIndex: 3, borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span className="roundel" />
          <span className="mono" style={{ fontSize: 15 }}>02 · THE INSIGHT</span>
        </div>
        <div className="fashion" style={{ fontSize: 30, fontStyle: 'italic' }}>London is three cities.</div>
        <span className="mono pageno" style={{ fontSize: 14, opacity: 0.55 }}>02 / 14</span>
      </div>

      {/* Three horizontal bands */}
      <div style={{ position: 'absolute', top: 92, left: 0, right: 0, bottom: 0, display: 'grid', gridTemplateRows: '1fr 1fr 1fr' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ position: 'relative', background: r.bg, color: r.ink, display: 'grid', gridTemplateColumns: '1.1fr 1fr', borderBottom: i < 2 ? '1px solid var(--rule)' : 'none', overflow: 'hidden' }}>
            {/* Left photo */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img src={r.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: r.extra }} />
              <div style={{ position: 'absolute', left: 24, top: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  background: r.accent,
                  color: r.bg,
                  padding: '4px 10px',
                }}>{r.tag}</span>
              </div>
            </div>

            {/* Right copy */}
            <div style={{ padding: '38px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', opacity: 0.65, color: r.accent, marginBottom: 14 }}>
                {r.label}
              </div>
              <div style={{
                fontFamily: r.font,
                fontStyle: r.italic ? 'italic' : 'normal',
                fontSize: r.tag === 'PUNK' ? 46 : 52,
                lineHeight: 1.08,
                letterSpacing: r.tag === 'PUNK' ? '-0.01em' : '-0.015em',
              }}>
                {r.quote}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom strap */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '14px 80px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 4,
      }}>
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.24em', opacity: 0.72 }}>THE THESIS</span>
        <span className="fashion" style={{ fontSize: 26, fontStyle: 'italic' }}>
          Your trip should bring all three home.
        </span>
      </div>
    </section>
  );
}

window.R02Insight = R02Insight;
