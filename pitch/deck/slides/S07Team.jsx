// Slide 07 — Team (The Masthead)
// Editorial masthead. Every text fragment from the source Word doc is
// preserved verbatim on each card: name, affiliation, role descriptor,
// and contact handles.

function S07Team() {
  const team = [
    {
      n: '01',
      tag: 'SHIP',
      photo: '../assets/team-huiru.jpg',
      name: 'Huiru Jiao',
      subtitle: null,
      lines: [
        'UCL Student',
        '3x Hackathon Winner',
      ],
      handles: [],
    },
    {
      n: '02',
      tag: 'SIGNAL',
      photo: '../assets/team-zan.png',
      name: 'Zan C.',
      subtitle: null,
      lines: [
        'MSc @ LSE',
        'From Psychology, Crypto to AI',
      ],
      handles: [],
    },
    {
      n: '03',
      tag: 'FORM',
      photo: '../assets/team-kiki.jpg',
      name: 'Xu Ziqi (Kiki)',
      subtitle: null,
      lines: [
        'BA Architecture Central Saint Martins London',
        'Research Assistant @ HKUST',
      ],
      handles: [
        { k: 'WeChat', v: 'Xzq_Kiki_wiki' },
        { k: 'ins',    v: 'ziqi_xu_kiki' },
      ],
    },
    {
      n: '04',
      tag: 'CRAFT',
      photo: '../assets/team-xiaoxiao.jpg',
      name: 'ZhouyiXiaoxiao',
      subtitle: '(LinkedIn / Instagram)',
      lines: [
        'PhD in Math @ Uni of Bristol',
        'AI enthusiast · Life documenter',
      ],
      handles: [
        { k: '视频号', v: '周易潇潇' },
        { k: 'WeChat', v: '12315752' },
      ],
    },
  ];

  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>05 · MASTHEAD</span>
        </div>
        <span className="pageno">05 / 06</span>
      </div>

      {/* Eyebrow + thin rule (no big headline — give the portraits room) */}
      <div style={{ marginTop: 72, display: 'flex', alignItems: 'baseline', gap: 22 }}>
        <div className="eyebrow">The masthead</div>
        <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', opacity: 0.55 }}>
          SS 2026 · LONDON
        </span>
      </div>

      {/* Four-column masthead */}
      <div style={{
        marginTop: 40,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 32,
        flex: 1,
        paddingBottom: 110,
      }}>
        {team.map((m) => (
          <div
            key={m.n}
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--paper-2)',
              border: '1px solid var(--rule)',
              padding: 20,
              position: 'relative',
            }}
          >
            {/* Top meta row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.22em', opacity: 0.5 }}>Nº {m.n}</span>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  padding: '3px 8px',
                }}
              >
                {m.tag}
              </span>
            </div>

            {/* Portrait — enlarged (nearly 1:1) */}
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1.1',
                background: '#000',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--rule)',
                boxShadow: '0 2px 0 var(--rule)',
                marginBottom: 18,
              }}
            >
              <img
                src={m.photo}
                alt={m.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'saturate(0.82) contrast(1.05)',
                }}
              />
              <div
                className="mono"
                style={{
                  position: 'absolute',
                  left: 8,
                  bottom: 8,
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  color: '#fff',
                  background: 'rgba(0,0,0,0.55)',
                  padding: '3px 7px',
                }}
              >
                PORTRAIT · {m.n}
              </div>
            </div>

            {/* Name */}
            <div
              className="fashion"
              style={{
                fontSize: 40,
                lineHeight: 1.02,
                marginBottom: m.subtitle ? 4 : 10,
              }}
            >
              {m.name}
            </div>

            {/* Subtitle (e.g. "(LinkedIn / Instagram)") */}
            {m.subtitle && (
              <div
                className="mono"
                style={{
                  fontSize: 13,
                  letterSpacing: '0.12em',
                  color: 'var(--accent)',
                  textTransform: 'none',
                  marginBottom: 10,
                }}
              >
                {m.subtitle}
              </div>
            )}

            {/* Info lines — verbatim from source doc */}
            <div
              style={{
                borderTop: '1px solid var(--rule)',
                paddingTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: m.handles.length ? 12 : 0,
              }}
            >
              {m.lines.map((line, i) => (
                <div
                  key={i}
                  className="body"
                  style={{
                    fontSize: 17,
                    lineHeight: 1.45,
                    color: 'var(--ink-2)',
                    fontFamily: 'var(--f-body)',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Handles (WeChat / ins / 视频号) — mono key-value strip */}
            {m.handles.length > 0 && (
              <div
                style={{
                  marginTop: 'auto',
                  borderTop: '1px dashed var(--rule)',
                  paddingTop: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {m.handles.map((h, i) => (
                  <div
                    key={i}
                    className="mono"
                    style={{
                      fontSize: 14,
                      letterSpacing: '0.06em',
                      textTransform: 'none',
                      color: 'var(--ink)',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'baseline',
                    }}
                  >
                    <span style={{ color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: 12 }}>
                      {h.k}
                    </span>
                    <span>{h.v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Colophon footer */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          bottom: 52,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--rule)',
          paddingTop: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="roundel" />
          <span className="mono" style={{ fontSize: 13, letterSpacing: '0.22em' }}>
            LONDON CUTS · MASTHEAD · SS 2026
          </span>
        </div>
        <span
          className="fashion"
          style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--accent)' }}
        >
          — Edited at SE1, over one weekend.
        </span>
      </div>
    </section>
  );
}

window.S07Team = S07Team;
