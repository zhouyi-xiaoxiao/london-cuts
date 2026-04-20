// Roadshow 12 — Roadmap · 30 / 60 / 90
// Three vertical columns, one per horizon, each with shipped / shipping /
// next items. A ruled timeline on the side gives the chronology.

function R12Roadmap() {
  const horizons = [
    {
      n: '30',
      label: 'SHIP THE SHELL',
      eyebrow: 'April → May',
      items: [
        { status: 'SHIPPED', text: 'Studio editor, three modes, Postcard publish, Atlas map — all running in the prototype you\u2019ll see today.' },
        { status: 'SHIPPING', text: 'Provider adapter abstracting OpenAI / Flux / Anthropic, with a mock that ships with every demo.' },
        { status: 'NEXT',    text: 'Ten design-partner trips (London, Bristol, Kyoto volunteers) onboarded and live on the Atlas.' },
      ],
    },
    {
      n: '60',
      label: 'OPEN THE STUDIO',
      eyebrow: 'May → June',
      items: [
        { status: 'NEXT', text: 'Self-serve onboarding — any traveller can draft a Postcard in under 30 minutes without a designer.' },
        { status: 'NEXT', text: 'Two new modes co-designed with partners: <em style="font-family:var(--f-fashion); font-style:italic;">Field Notes</em> (documentary) and <em style="font-family:var(--f-fashion); font-style:italic;">Ransom</em> (collage).' },
        { status: 'NEXT', text: 'Shareable Postcard URL with OpenGraph magazine preview. The link-in-bio of travel content.' },
      ],
    },
    {
      n: '90',
      label: 'SHIP THE READER',
      eyebrow: 'June → July',
      items: [
        { status: 'NEXT', text: 'iOS reader app — the Postcard becomes an object on the home screen, not just a tab.' },
        { status: 'NEXT', text: 'Paid creator program: pro modes, custom typography, the <em style="font-family:var(--f-fashion); font-style:italic;">masthead</em> tier.' },
        { status: 'NEXT', text: 'Atlas becomes the network — a walk-through map of every published trip, cross-linked by mood, city, and time of day.' },
      ],
    },
  ];

  const badge = (status) => {
    const map = {
      'SHIPPED':  { bg: 'var(--ink)',       fg: 'var(--paper)' },
      'SHIPPING': { bg: 'var(--accent)',    fg: 'var(--paper)' },
      'NEXT':     { bg: 'transparent',      fg: 'var(--ink)',  border: '1px solid var(--ink)' },
    };
    const s = map[status] || map.NEXT;
    return (
      <span style={{
        background: s.bg, color: s.fg,
        border: s.border || 'none',
        padding: '2px 8px',
        fontFamily: 'var(--f-mono)',
        fontSize: 10,
        letterSpacing: '0.22em',
      }}>{status}</span>
    );
  };

  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>12 · ROADMAP</span>
        </div>
        <span className="pageno">12 / 14</span>
      </div>

      <div style={{ marginTop: 64 }}>
        <div className="eyebrow">30 · 60 · 90</div>
        <h2 className="fashion" style={{ fontSize: 108, margin: '20px 0 0', lineHeight: 0.98 }}>
          From the shell<br />
          <span style={{ color: 'var(--accent)' }}>to the reader's pocket.</span>
        </h2>
      </div>

      {/* Horizon columns */}
      <div style={{
        marginTop: 56,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 40,
        flex: 1,
        paddingBottom: 140,
        position: 'relative',
      }}>
        {/* A thin rule connecting all three columns near the top */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 32, height: 1, background: 'var(--rule)' }} />

        {horizons.map((h, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', paddingTop: 20 }}>
            {/* Horizon dot */}
            <div style={{
              position: 'absolute',
              top: 14,
              left: `calc(${(i * 100) / 3}% + ${((100 / 3) / 2)}%)`,
              transform: 'translateX(-50%)',
              width: 36, height: 36,
              display: 'grid', placeItems: 'center',
              borderRadius: '50%',
              background: i === 0 ? 'var(--ink)' : 'var(--paper)',
              border: '2px solid var(--ink)',
              color: i === 0 ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--f-mono)', fontSize: 13, letterSpacing: '0.08em',
              zIndex: 2,
            }}>
              {h.n}
            </div>

            {/* Column header */}
            <div style={{ marginTop: 32 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.24em', opacity: 0.55, marginBottom: 6 }}>
                {h.eyebrow}
              </div>
              <div className="fashion" style={{ fontSize: 44, lineHeight: 1 }}>
                <span style={{ color: 'var(--accent)' }}>{h.n}</span> days
              </div>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', marginTop: 8, opacity: 0.7 }}>
                {h.label}
              </div>
            </div>

            {/* Items */}
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
              {h.items.map((item, j) => (
                <div key={j} style={{
                  borderTop: '1px solid var(--rule)',
                  paddingTop: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {badge(item.status)}
                  <div
                    className="body"
                    style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)' }}
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom meta */}
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
          DESIGN PARTNERS · 10 · OPEN FROM WEEK 02
        </span>
        <span className="fashion" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--accent)' }}>
          — Our first hundred readers come from this deck.
        </span>
      </div>
    </section>
  );
}

window.R12Roadmap = R12Roadmap;
