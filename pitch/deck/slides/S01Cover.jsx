// Slide 01 — Cover
// Full-bleed Waterloo Bridge dusk photograph. Mode-pill sits on the image
// as the UI of the product itself. The brand roundel stamps the top-left.

function S01Cover() {
  return (
    <section className="slide full">
      <img
        src="../assets/seed-waterloo-bridge.jpg"
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.75) 100%)' }} />

      {/* Top-left brand */}
      <div style={{ position: 'absolute', left: 80, top: 72, display: 'flex', alignItems: 'center', gap: 22, color: '#fff' }}>
        <span className="roundel roundel-lg" style={{ borderColor: '#fff' }}>
          <span style={{ content: '', position: 'absolute', left: -12, right: -12, top: '50%', height: 7.5, background: '#fff', transform: 'translateY(-50%)', display: 'block' }} />
        </span>
        <div>
          <div className="mono" style={{ fontSize: 16, opacity: 0.85 }}>LONDON CUTS</div>
          <div className="mono" style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>EDITORIAL STUDIO · SE1</div>
        </div>
      </div>

      {/* Top-right meta */}
      <div style={{ position: 'absolute', right: 80, top: 72, color: '#fff', textAlign: 'right' }}>
        <div className="mono" style={{ fontSize: 13, opacity: 0.75 }}>DEMO DAY · 2026</div>
        <div className="mono" style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>5 MINUTES · 6 SLIDES</div>
      </div>

      {/* Center title block — left aligned, quiet */}
      <div style={{ position: 'absolute', left: 120, right: 120, bottom: 180, color: '#fff' }}>
        <div className="mono" style={{ fontSize: 14, letterSpacing: '0.22em', opacity: 0.72, marginBottom: 24 }}>WATERLOO BR · 17:19 · DUSK</div>
        <h1 className="fashion" style={{ fontSize: 220, margin: 0, lineHeight: 0.9 }}>
          Writing,<br /><span style={{ opacity: 0.82 }}>re-read.</span>
        </h1>
        <div style={{ marginTop: 36, display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <div className="rule-accent" style={{ background: '#fff', width: 72, height: 2 }} />
          <div className="body" style={{ fontSize: 28, fontFamily: 'var(--f-fashion)', fontStyle: 'italic', opacity: 0.92, maxWidth: 760 }}>
            A studio for small editorial walks — one piece of writing, three ways to be read.
          </div>
        </div>
      </div>

      {/* Bottom-right page number */}
      <div style={{ position: 'absolute', right: 80, bottom: 48, color: '#fff', opacity: 0.7 }} className="mono">
        01 / 07
      </div>
    </section>
  );
}

window.S01Cover = S01Cover;
