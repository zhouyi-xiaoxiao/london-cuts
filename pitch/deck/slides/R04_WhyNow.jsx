// Roadshow 04 — Why Now
// Two-column argument. Left: content form flattened. Right: AI learned voice.
// Middle insight line.

function R04WhyNow() {
  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>04 · WHY NOW</span>
        </div>
        <span className="pageno">04 / 14</span>
      </div>

      <div style={{ marginTop: 64 }}>
        <div className="eyebrow">Two curves crossed in 2025</div>
        <h2 className="fashion" style={{ fontSize: 112, margin: '20px 0 0', lineHeight: 0.98 }}>
          Content flattened.<br />
          <span style={{ color: 'var(--accent)' }}>Voice, just got cheap.</span>
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 1fr',
        gap: 0,
        marginTop: 64,
        flex: 1,
        paddingBottom: 140,
        alignItems: 'stretch',
      }}>
        {/* Left — the downward curve */}
        <div style={{ borderTop: '2px solid var(--ink)', paddingTop: 28 }}>
          <div className="mono" style={{ fontSize: 13, letterSpacing: '0.22em', opacity: 0.55, marginBottom: 18 }}>CURVE 01 · FORM</div>
          <div className="fashion" style={{ fontSize: 56, lineHeight: 1, marginBottom: 24 }}>
            <span style={{ color: 'var(--accent)' }}>↘</span> Every feed<br />eats every feed.
          </div>
          <p className="body" style={{ fontSize: 20, lineHeight: 1.5, color: 'var(--ink-2)' }}>
            Twenty years of platform design made content look the same. A
            Substack post, an Instagram caption, a travel blog, a LinkedIn
            story — white background, sixteen-pixel sans-serif, one hero
            image. The grammar of reading collapsed into one flat voice.
          </p>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', opacity: 0.5, marginTop: 28, borderTop: '1px solid var(--rule)', paddingTop: 14 }}>
            SOURCE · TWO DECADES OF FEEDS
          </div>
        </div>

        {/* Middle — the crossing */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 96, color: 'var(--accent)', lineHeight: 1 }}>×</div>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.22em', opacity: 0.5, textAlign: 'center' }}>
            THE<br />CROSSING
          </div>
        </div>

        {/* Right — the upward curve */}
        <div style={{ borderTop: '2px solid var(--accent)', paddingTop: 28 }}>
          <div className="mono" style={{ fontSize: 13, letterSpacing: '0.22em', color: 'var(--accent)', marginBottom: 18 }}>CURVE 02 · VOICE</div>
          <div className="fashion" style={{ fontSize: 56, lineHeight: 1, marginBottom: 24 }}>
            <span style={{ color: 'var(--accent)' }}>↗</span> AI learned<br />to change <em style={{ color: 'var(--accent)' }}>how</em>.
          </div>
          <p className="body" style={{ fontSize: 20, lineHeight: 1.5, color: 'var(--ink-2)' }}>
            LLMs rewrite the same paragraph in any register. Image models
            restyle a photo in any palette. For the first time, a single
            writer can publish three versions of the same story —
            <strong style={{ fontWeight: 600 }}> at the cost of zero</strong>.
          </p>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', opacity: 0.5, marginTop: 28, borderTop: '1px solid var(--rule)', paddingTop: 14 }}>
            SOURCE · GPT-4 · NANO BANANA · VEO · FLUX
          </div>
        </div>
      </div>

      {/* Bottom thesis */}
      <div style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 48,
        borderTop: '1px solid var(--rule)',
        paddingTop: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <span className="mono" style={{ fontSize: 13, letterSpacing: '0.22em', opacity: 0.55 }}>
          THE OPPORTUNITY
        </span>
        <span className="fashion" style={{ fontSize: 26, fontStyle: 'italic', color: 'var(--accent)' }}>
          — The window opened. We walked in.
        </span>
      </div>
    </section>
  );
}

window.R04WhyNow = R04WhyNow;
