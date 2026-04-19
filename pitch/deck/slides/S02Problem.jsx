// Slide 02 — Problem
// A diptych of quotations — writer's voice on the left, reader's on the
// right — rendered like margin-notes. No data chart; the editorial tone
// argues the problem through voice.

function S02Problem() {
  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>02 · PROBLEM</span>
        </div>
        <span className="pageno">02 / 07</span>
      </div>

      <div style={{ marginTop: 64 }}>
        <div className="eyebrow">The state of writing online</div>
        <h2 className="fashion" style={{ fontSize: 108, margin: '20px 0 0', maxWidth: 1500, lineHeight: 0.98 }}>
          The places we used to read<br />have forgotten how.
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 96, marginTop: 48, marginBottom: 120 }}>
        {/* Writer column */}
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 22 }}>The writer</div>
          <p className="body" style={{ margin: 0, fontSize: 22, lineHeight: 1.5 }}>
            I have a thing I want to put somewhere. Not a newsletter. Not a tweet. Not a <em style={{ fontStyle: 'italic', fontFamily: 'var(--f-fashion)' }}>think-piece</em>. Just twelve walks around my borough, photographed, written down, read the way a magazine used to be read.
          </p>
          <div className="mono" style={{ fontSize: 13, opacity: 0.55, marginTop: 24 }}>— ADA, SE1</div>
        </div>

        {/* Reader column */}
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 22 }}>The reader</div>
          <p className="body" style={{ margin: 0, fontSize: 22, lineHeight: 1.5 }}>
            Every link someone sends me looks the same. White background, sixteen-pixel sans-serif, a hero image I'll forget in thirty seconds. I open four tabs on Sunday and remember <em style={{ fontStyle: 'italic', fontFamily: 'var(--f-fashion)' }}>none of them</em> by Tuesday.
          </p>
          <div className="mono" style={{ fontSize: 13, opacity: 0.55, marginTop: 24 }}>— M, LISBON</div>
        </div>
      </div>

      <div className="mono" style={{ position: 'absolute', left: 120, right: 120, bottom: 56, fontSize: 14, opacity: 0.5, borderTop: '1px solid var(--rule)', paddingTop: 20, textAlign: 'center' }}>
        THE FORM HAS FLATTENED · EVERY PIECE NOW READS LIKE EVERY OTHER PIECE
      </div>
    </section>
  );
}

window.S02Problem = S02Problem;
