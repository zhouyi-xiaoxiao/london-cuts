// Slide 06 — How it works (the loop)
// A small process diagram rendered in type. Walk → Studio → Postcard.
// Four steps each accompanied by a seed photograph from the SE1 walk.

function S06How() {
  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>06 · HOW IT WORKS</span>
        </div>
        <span className="pageno">06 / 08</span>
      </div>

      <div style={{ marginTop: 80 }}>
        <div className="eyebrow">The loop</div>
        <h2 className="fashion" style={{ fontSize: 120, margin: '24px 0 0' }}>
          Walk, draft, publish —<br />read in your voice.
        </h2>
      </div>

      {/* Four-step horizontal flow */}
      <div style={{ marginTop: 80, display: 'grid', gridTemplateColumns: '1fr 60px 1fr 60px 1fr 60px 1fr', alignItems: 'stretch', gap: 0 }}>
        {[
          { n: '01', label: 'CAPTURE', title: 'Walk',     body: 'Twelve photographs, a fieldnote, a time of day. The studio reads your roll and lays it out.',    img: 'seed-golden-hour.jpg',   filter: 'saturate(0.95) contrast(1.05)' },
          { n: '02', label: 'DRAFT',   title: 'Studio',   body: 'Write in margins. Pull quotes with a gesture. The paper remembers everything you do.',            img: 'seed-borough-market.jpg', filter: 'saturate(0.85) brightness(1.02)' },
          { n: '03', label: 'TUNE',    title: 'Mode',     body: 'Pick a grammar — Fashion, Punk, Cinema — or let the piece decide based on its mood words.',       img: 'seed-thames.jpg',         filter: 'saturate(0.8) contrast(1.08)' },
          { n: '04', label: 'PUBLISH', title: 'Postcard', body: 'One URL. Loads in under a second. Feels like a magazine that landed on a desk.',                  img: 'seed-market-detail.jpg',  filter: 'saturate(1.0) contrast(1.1)' },
        ].map((step, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="mono" style={{ fontSize: 12, opacity: 0.45 }}>{step.n} · {step.label}</div>
              <div className="fashion" style={{ fontSize: 64, margin: '14px 0 18px', lineHeight: 1 }}>{step.title}</div>
              <div style={{ height: 140, marginBottom: 20, background: '#000', overflow: 'hidden', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
                {step.img && <img src={`../assets/${step.img}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: step.filter }} />}
              </div>
              <div className="body" style={{ fontSize: 17, lineHeight: 1.45, color: 'var(--ink-2)' }}>{step.body}</div>
            </div>
            {i < 3 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
                <span className="fashion" style={{ fontSize: 48, opacity: 0.4, fontStyle: 'italic' }}>→</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ position: 'absolute', left: 120, right: 120, bottom: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="mono" style={{ fontSize: 14, opacity: 0.55 }}>WRITER KEEPS THE VOICE · THE STUDIO KEEPS THE CRAFT</span>
        <span className="fashion" style={{ fontSize: 28, fontStyle: 'italic', color: 'var(--accent)' }}>— thirty minutes, start to finish.</span>
      </div>
    </section>
  );
}

window.S06How = S06How;
