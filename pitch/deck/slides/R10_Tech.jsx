// Roadshow 10 — AI & Architecture
// Three AI pillars + the adapter pattern.

function R10Tech() {
  const pillars = [
    {
      n: '01',
      tag: 'TEXT',
      title: 'Rewriter',
      engine: 'LLM · GPT-4.1 / Claude 4.7',
      body: 'Same paragraph, three registers. Fashion: italic, restrained. Punk: short, shouted, red. Cinema: scripted, subtitled. Prompts are curated by the editors; users tune via mood words.',
      metric: '~1.8s · p95',
    },
    {
      n: '02',
      tag: 'IMAGE',
      title: 'Restyler',
      engine: 'image-to-image · Flux · Nano Banana',
      body: 'Each mode has a reference palette, crop grammar, and filter stack. The restyler applies them per-photo, preserving composition. Runs through a provider adapter — swap models without touching product.',
      metric: '~4.2s · per image',
    },
    {
      n: '03',
      tag: 'LAYOUT',
      title: 'Composer',
      engine: 'deterministic · React + tokens',
      body: 'The Postcard layout is not a model — it is typography. Tokens in a design-system pick spacing, type scale, and page rhythm per mode. Predictable, brand-safe, regenerable.',
      metric: '~0ms · pure CSS',
    },
  ];

  return (
    <section className="slide">
      <div className="chrome">
        <div className="chrome-left">
          <span className="roundel" />
          <span>10 · AI × ARCHITECTURE</span>
        </div>
        <span className="pageno">10 / 14</span>
      </div>

      <div style={{ marginTop: 64 }}>
        <div className="eyebrow">What we actually built</div>
        <h2 className="fashion" style={{ fontSize: 108, margin: '20px 0 0', lineHeight: 0.98 }}>
          Three pillars.<br />
          <span style={{ color: 'var(--accent)' }}>One adapter between them.</span>
        </h2>
      </div>

      {/* Three pillars */}
      <div style={{
        marginTop: 56,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 32,
        flex: 1,
        paddingBottom: 180,
      }}>
        {pillars.map((p) => (
          <div key={p.n} style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--paper-2)',
            border: '1px solid var(--rule)',
            padding: 28,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', opacity: 0.55 }}>Nº {p.n}</span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.22em', background: 'var(--ink)', color: 'var(--paper)', padding: '4px 10px' }}>{p.tag}</span>
            </div>

            <div className="fashion" style={{ fontSize: 64, lineHeight: 1, marginBottom: 10 }}>
              {p.title}
            </div>

            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'none', color: 'var(--accent)', marginBottom: 18 }}>
              {p.engine}
            </div>

            <p className="body" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)', margin: 0 }}>
              {p.body}
            </p>

            <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: '1px dashed var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', opacity: 0.5 }}>LATENCY</span>
              <span className="mono" style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'none', color: 'var(--ink)' }}>{p.metric}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Adapter band */}
      <div style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 100,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 24,
      }}>
        <div style={{ height: 2, background: 'var(--ink)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 10px' }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.3em', opacity: 0.55 }}>PROVIDER ADAPTER</span>
          <span className="fashion" style={{ fontSize: 26, fontStyle: 'italic', color: 'var(--accent)' }}>
            openai · anthropic · replicate · mock
          </span>
        </div>
        <div style={{ height: 2, background: 'var(--ink)' }} />
      </div>

      <div style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 48,
        borderTop: '1px solid var(--rule)',
        paddingTop: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', opacity: 0.55 }}>
          SWAP A MODEL · TOUCH NOTHING ELSE
        </span>
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', opacity: 0.55 }}>
          MOCK PROVIDER SHIPS WITH EVERY DEMO
        </span>
      </div>
    </section>
  );
}

window.R10Tech = R10Tech;
