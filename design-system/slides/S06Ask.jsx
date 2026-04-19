// Slide 06 — Ask / close
// Quiet, confident close. Three "what we need" columns + a hand-lettered
// thank-you in Caveat. Contact line in mono.

function S06Ask() {
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 120, marginTop: 96, flex: 1 }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow">What we're asking for</div>
          <h2 className="fashion" style={{ fontSize: 168, margin: '24px 0 0', lineHeight: 0.9 }}>
            Read it.<br />
            <span style={{ color: 'var(--accent)' }}>Write it.</span><br />
            Judge it<br />kindly.
          </h2>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="rule-accent" />
            <div className="fashion" style={{ fontSize: 38, fontStyle: 'italic', maxWidth: 720, color: 'var(--ink-2)' }}>
              We made a studio because the places we used to read got boring. Give us the prize and we'll give the boroughs back their magazines.
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36, marginTop: 20 }}>
          {[
            { n: '01', label: 'Best-in-show', body: 'Put London Cuts on the front page of the Demo Day site. Our first hundred readers come from here.' },
            { n: '02', label: 'Three design partners', body: 'Writers, curators, anyone with twelve photographs of one street. We\u2019ll build the next three modes with them.' },
            { n: '03', label: 'A postcard back', body: 'Try the Postcard at londoncuts.studio. If it makes you want to walk somewhere, tell us.' },
          ].map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--rule)', paddingTop: 22 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
                <span className="mono" style={{ fontSize: 14, opacity: 0.45 }}>{item.n}</span>
                <span className="mono" style={{ fontSize: 16, letterSpacing: '0.18em' }}>{item.label.toUpperCase()}</span>
              </div>
              <p className="body" style={{ fontSize: 22, lineHeight: 1.5, color: 'var(--ink-2)', margin: '14px 0 0' }}>{item.body}</p>
            </div>
          ))}

          {/* Hand-lettered signature */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 28 }}>
            <span style={{ fontFamily: 'var(--f-hand)', fontSize: 72, color: 'var(--accent)', lineHeight: 1 }}>Thank you.</span>
            <span className="roundel" style={{ transform: 'scale(1.3)' }} />
          </div>
        </div>

      </div>

      {/* Footer meta */}
      <div style={{ position: 'absolute', left: 120, right: 120, bottom: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--rule)', paddingTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="roundel" />
          <span className="mono" style={{ fontSize: 14 }}>LONDON CUTS · EDITORIAL STUDIO</span>
        </div>
        <span className="mono" style={{ fontSize: 14, opacity: 0.6 }}>LONDONCUTS.STUDIO · SE1 · 2026</span>
      </div>
    </section>
  );
}

window.S06Ask = S06Ask;
