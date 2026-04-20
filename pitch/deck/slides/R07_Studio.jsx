// Roadshow 07 — Studio deep-dive
// Annotated workbench. Three-panel sketch of the editor with callouts.

function R07Studio() {
  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>07 · STUDIO</span>
        </div>
        <span className="pageno">07 / 14</span>
      </div>

      <div style={{ marginTop: 64 }}>
        <div className="eyebrow">The editor's workbench</div>
        <h2 className="fashion" style={{ fontSize: 108, margin: '20px 0 0', lineHeight: 0.98 }}>
          Not a post box.<br />
          <span style={{ color: 'var(--accent)' }}>An editing table.</span>
        </h2>
      </div>

      {/* Three-panel editor sketch */}
      <div style={{
        marginTop: 48,
        display: 'grid',
        gridTemplateColumns: '180px 1fr 260px',
        gap: 0,
        flex: 1,
        paddingBottom: 120,
        background: 'var(--paper-2)',
        border: '1px solid var(--rule)',
        minHeight: 560,
      }}>
        {/* Left · Timeline */}
        <div style={{ borderRight: '1px solid var(--rule)', padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', opacity: 0.55 }}>TIMELINE</div>
          {[
            { t: '15:20', p: 'Waterloo' },
            { t: '15:48', p: 'Southbank' },
            { t: '16:12', p: 'Blackfriars' },
            { t: '16:42', p: 'Tate Modern' },
            { t: '17:05', p: 'Borough Mkt' },
            { t: '17:34', p: 'Bermondsey' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3, borderLeft: i === 3 ? '3px solid var(--accent)' : '1px solid var(--rule)', paddingLeft: 10 }}>
              <span className="mono" style={{ fontSize: 11, opacity: 0.6 }}>{s.t}</span>
              <span className="fashion" style={{ fontSize: 17, lineHeight: 1, fontStyle: i === 3 ? 'italic' : 'normal' }}>{s.p}</span>
            </div>
          ))}
          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.22em', opacity: 0.42, marginTop: 'auto' }}>
            12 STOPS · 45 MIN
          </div>
        </div>

        {/* Middle · Paper */}
        <div style={{ padding: '34px 44px', position: 'relative', overflow: 'hidden' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', opacity: 0.45, marginBottom: 22 }}>FOLIO · AMBER · DRAFT 03</div>

          <div className="fashion" style={{ fontSize: 54, lineHeight: 0.98, marginBottom: 20 }}>
            A late light,<br />a long street.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 22, alignItems: 'start' }}>
            <div className="body" style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--ink-2)' }}>
              The sun has given up on being clever about it; it is simply warm, and low, and about to go. Walking east from Southwark Street I pass the chalkboard at Jose — tapas, £4, a hand-drawn fish. Two women are already inside. I keep walking.
              <span style={{
                background: 'oklch(0.94 0.10 90)',
                padding: '1px 4px',
              }}> A pulled quote: warm, and low, and about to go.</span>
            </div>
            {/* Photo drop */}
            <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', border: '1px solid var(--rule)', boxShadow: '0 3px 0 var(--rule)' }}>
              <img src="../assets/seed-golden-hour.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="mono" style={{ position: 'absolute', left: 6, bottom: 6, fontSize: 8, letterSpacing: '0.18em', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '2px 6px' }}>16:42 · BERMONDSEY</div>
            </div>
          </div>

          {/* Marginalia */}
          <div style={{ position: 'absolute', right: 14, top: 120, width: 130, transform: 'rotate(2deg)', fontFamily: 'var(--f-hand)', fontSize: 22, color: 'var(--accent)', lineHeight: 1.1 }}>
            ← cut this?<br />keep verb
          </div>
        </div>

        {/* Right · Meta */}
        <div style={{ borderLeft: '1px solid var(--rule)', padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', opacity: 0.55 }}>META</div>

          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.5, marginBottom: 6 }}>MOOD</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['AMBER', 'WARM', 'LATE', 'SLOW'].map((t, i) => (
                <span key={i} style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '3px 8px', fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.14em' }}>{t}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.5, marginBottom: 6 }}>SUGGESTED MODE</div>
            <div className="fashion" style={{ fontSize: 28, color: 'var(--accent)' }}>Fashion</div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', opacity: 0.5, marginTop: 4 }}>BASED ON MOOD · 82% MATCH</div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.5, marginBottom: 6 }}>PULL QUOTES · AI</div>
            <ul style={{ margin: 0, paddingLeft: 14, fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)' }}>
              <li>"warm, and low, and about to go"</li>
              <li>"two women are already inside"</li>
            </ul>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ background: 'var(--accent)', color: 'var(--paper)', padding: '8px 10px', fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.2em', textAlign: 'center' }}>PUBLISH POSTCARD →</span>
          </div>
        </div>
      </div>

      {/* Callout rule bottom */}
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
          TIMELINE · PAPER · META — THE THREE PANELS
        </span>
        <span className="fashion" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--accent)' }}>
          Photos reflow with the text. Pull quotes drawn by AI. Mood words pick the mode.
        </span>
      </div>
    </section>
  );
}

window.R07Studio = R07Studio;
