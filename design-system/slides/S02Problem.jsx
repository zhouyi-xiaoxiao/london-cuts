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
        <span className="pageno">02 / 06</span>
      </div>

      <div style={{ marginTop: 80 }}>
        <div className="eyebrow">The state of writing online</div>
        <h2 className="fashion" style={{ fontSize: 132, margin: '24px 0 0', maxWidth: 1500 }}>
          The places we<br />used to read<br />have forgotten<br />how.
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 96, marginTop: 56, marginBottom: 80 }}>
        {/* Writer column */}
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 28 }}>The writer</div>
          <p className="body" style={{ margin: 0, fontSize: 28, lineHeight: 1.5 }}>
            I have a thing I want to put somewhere.<br />
            Not a newsletter. Not a tweet. Not a<br />
            <em style={{ fontStyle: 'italic', fontFamily: 'var(--f-fashion)' }}>think-piece</em>. Just twelve walks<br />
            around my borough, photographed,<br />
            written down, read the way a<br />
            magazine used to be read.
          </p>
          <div className="mono" style={{ fontSize: 13, opacity: 0.55, marginTop: 36 }}>— ADA, SE1</div>
        </div>

        {/* Reader column */}
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 28 }}>The reader</div>
          <p className="body" style={{ margin: 0, fontSize: 28, lineHeight: 1.5 }}>
            Every link someone sends me looks<br />
            the same. White background, sixteen-<br />
            pixel sans-serif, a hero image I'll<br />
            forget in thirty seconds. I open four<br />
            tabs on Sunday and remember<br />
            <em style={{ fontStyle: 'italic', fontFamily: 'var(--f-fashion)' }}>none of them</em> by Tuesday.
          </p>
          <div className="mono" style={{ fontSize: 13, opacity: 0.55, marginTop: 36 }}>— M, LISBON</div>
        </div>
      </div>

      <div className="mono" style={{ position: 'absolute', left: 120, right: 120, bottom: 56, fontSize: 14, opacity: 0.5, borderTop: '1px solid var(--rule)', paddingTop: 20, textAlign: 'center' }}>
        THE FORM HAS FLATTENED · EVERY PIECE NOW READS LIKE EVERY OTHER PIECE
      </div>
    </section>
  );
}

window.S02Problem = S02Problem;
