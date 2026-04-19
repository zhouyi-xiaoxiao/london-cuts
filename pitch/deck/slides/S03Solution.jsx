// Slide 03 — Solution
// Three-row manifesto. Each row is one promise. Mono labels + serif
// proper nouns. The roundel repeats as a rhythmic mark.

function S03Solution() {
  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>03 · SOLUTION</span>
        </div>
        <span className="pageno">03 / 07</span>
      </div>

      <div style={{ marginTop: 80 }}>
        <div className="eyebrow">London Cuts is</div>
        <h2 className="fashion" style={{ fontSize: 156, margin: '24px 0 0', letterSpacing: '-0.02em' }}>
          a studio for small<br />editorial walks.
        </h2>
      </div>

      <div style={{ marginTop: 72, display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
        {[
          { n: '01', label: 'For the writer', text: 'A workspace that treats a piece of writing as a physical object — photographs, fieldnotes, marginalia, pull-quotes, timing.' },
          { n: '02', label: 'For the reader', text: 'A Postcard — a single published walk with its own typography, its own weather. Not a post. Not a page. A Postcard.' },
          { n: '03', label: 'For the form', text: 'Three modes of reading the same piece: Fashion, Punk, Cinema. The writing doesn\u2019t change. The grammar does.' },
        ].map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 280px 1fr', alignItems: 'baseline', gap: 48, padding: '36px 0', borderTop: '1px solid var(--rule)', borderBottom: i === 2 ? '1px solid var(--rule)' : 'none' }}>
            <div className="mono" style={{ fontSize: 16, opacity: 0.45 }}>{row.n}</div>
            <div className="mono" style={{ fontSize: 17, letterSpacing: '0.14em' }}>{row.label}</div>
            <div className="fashion" style={{ fontSize: 40, opacity: 0.85 }}>
              {i === 0 ? 'Studio' : i === 1 ? 'Postcard' : 'Three modes'}
            </div>
            <div className="body" style={{ fontSize: 22, lineHeight: 1.45, color: 'var(--ink-2)' }}>{row.text}</div>
          </div>
        ))}
      </div>

      <div className="mono" style={{ position: 'absolute', left: 120, bottom: 60, fontSize: 14, opacity: 0.55 }}>
        ONE PIECE · THREE VOICES · WRITTEN BY ONE PERSON
      </div>
    </section>
  );
}

window.S03Solution = S03Solution;
