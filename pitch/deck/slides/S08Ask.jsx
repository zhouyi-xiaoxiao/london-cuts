// Slide 08 — Ask / close
// Quiet, confident close. Three "what we need" columns + a hand-lettered
// thank-you in Caveat. Contact line in mono.

function S08Ask() {
  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>06 · THE ASK</span>
        </div>
        <span className="pageno">06 / 06</span>
      </div>

      {/* Big left headline, right column for the three asks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 96, marginTop: 80, paddingBottom: 160, flex: 1 }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow">What we're asking for</div>
          <h2 className="fashion" style={{ fontSize: 136, margin: '20px 0 0', lineHeight: 0.92 }}>
            Read it.<br />
            <span style={{ color: 'var(--accent)' }}>Switch it.</span><br />
            Then pack a bag.
          </h2>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="rule-accent" />
            <div className="fashion" style={{ fontSize: 28, fontStyle: 'italic', maxWidth: 760, color: 'var(--ink-2)', lineHeight: 1.35 }}>
              We made a studio because travel photos kept dying in camera rolls. Give us the prize — we’ll give the boroughs back their magazines.
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 14 }}>
          {[
            { n: '01', label: 'Switch a mode', body: 'Open the prototype and switch Fashion → Punk → Cinema with your own hand. Feel the same trip, three Londons.' },
            { n: '02', label: 'Three travel partners', body: 'Anyone with twelve photographs from one trip — Kyoto, Reykjavík, Tbilisi. We\u2019ll build the next three modes with you.' },
            { n: '03', label: 'A ticket back', body: 'If the Postcard makes you want to book a flight — tell us where.' },
          ].map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--rule)', paddingTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                <span className="mono" style={{ fontSize: 13, opacity: 0.45 }}>{item.n}</span>
                <span className="mono" style={{ fontSize: 15, letterSpacing: '0.18em' }}>{item.label.toUpperCase()}</span>
              </div>
              <p className="body" style={{ fontSize: 19, lineHeight: 1.5, color: 'var(--ink-2)', margin: '10px 0 0' }}>{item.body}</p>
            </div>
          ))}

          {/* Hand-lettered signature */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 22 }}>
            <span style={{ fontFamily: 'var(--f-hand)', fontSize: 60, color: 'var(--accent)', lineHeight: 1 }}>Thank you.</span>
            <span className="roundel" style={{ transform: 'scale(1.2)' }} />
          </div>
        </div>

      </div>

      {/* Footer meta */}
      <div style={{ position: 'absolute', left: 120, right: 120, bottom: 52, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--rule)', paddingTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="roundel" />
          <span className="mono" style={{ fontSize: 14 }}>LONDON CUTS · EDITORIAL STUDIO</span>
        </div>
        <span className="mono" style={{ fontSize: 14, opacity: 0.6 }}>LONDONCUTS.STUDIO · SE1 · 2026</span>
      </div>
    </section>
  );
}

window.S08Ask = S08Ask;
