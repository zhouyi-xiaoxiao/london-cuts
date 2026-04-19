// publish.jsx — Publish as a slide-over (60vw from right).
// Replaces V1 screen 12 as a contextual action that never leaves the workspace.

function PublishSlideover({ mode, onClose }) {
  const summary = projectSummary(STOPS);
  const [slug, setSlug] = React.useState(PROJECT.slug);
  const [visibility, setVisibility] = React.useState(PROJECT.visibility);
  const blockers = [];
  STOPS.forEach(s => {
    if (!s.status.upload) blockers.push({ stop: s, kind: 'Missing uploads' });
    if (!s.status.hero)   blockers.push({ stop: s, kind: 'No hero image' });
    if (!s.status.body)   blockers.push({ stop: s, kind: 'Body empty' });
  });

  return (
    <>
      <div className="slideover-scrim" onClick={onClose} />
      <div className="slideover" data-mode={mode}>
        <div className="slideover-hdr">
          <div>
            <div className="eyebrow">Publish — Ed.01</div>
            <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 26, marginTop: 6, lineHeight: 1 }}>
              {PROJECT.title}
            </div>
          </div>
          <div className="row gap-12">
            <button className="btn" onClick={onClose}>Back to workspace</button>
            <button className="btn btn-solid" disabled={blockers.length > 0}>
              {blockers.length === 0 ? 'Publish →' : `${blockers.length} issues block publish`}
            </button>
          </div>
        </div>

        <div className="slideover-body">
          <div className="slideover-col">
            <div className="eyebrow">Pre-flight · {blockers.length ? `${blockers.length} issues` : 'all clear'}</div>
            <div style={{ marginTop: 12 }}>
              {STOPS.map(s => {
                const okAll = s.status.upload && s.status.hero && s.status.body;
                const issues = [];
                if (!s.status.upload) issues.push('needs uploads');
                if (!s.status.hero)   issues.push('no hero');
                if (!s.status.body)   issues.push('body empty');
                return (
                  <div key={s.n} className="checklist-item" data-ok={okAll}>
                    <span className="checklist-dot" />
                    <div>
                      <div className="checklist-label">
                        <span className="mono-sm" style={{ opacity: 0.6, marginRight: 8 }}>{s.n}</span>
                        {s.title}
                      </div>
                      {!okAll && (
                        <div className="mono-sm" style={{ opacity: 0.65, marginTop: 2 }}>{issues.join(' · ')}</div>
                      )}
                    </div>
                    <span className="checklist-jump">Jump →</span>
                  </div>
                );
              })}
            </div>

            <div className="overline-divider">Settings</div>
            <div className="col gap-12">
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Slug</div>
                <div className="row items-center gap-4 mono-sm" style={{ fontSize: 12 }}>
                  <span style={{ opacity: 0.6 }}>londoncuts.com/@ana/</span>
                  <input value={slug} onChange={e => setSlug(e.target.value)}
                         style={{ borderBottom: '1px solid currentColor', padding: '2px 4px', minWidth: 180 }} />
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Visibility</div>
                <div className="row gap-8">
                  {['public', 'unlisted', 'private'].map(v => (
                    <button key={v} className={'chip ' + (visibility === v ? 'chip-solid' : '')} onClick={() => setVisibility(v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Default mode for readers</div>
                <ModePill mode={mode} onMode={() => {}} />
                <div className="mono-sm" style={{ opacity: 0.5, marginTop: 6 }}>
                  Readers can override client-side.
                </div>
              </div>
            </div>

            <div className="overline-divider">Share</div>
            <div className="col gap-8">
              <button className="btn btn-sm">Copy public link</button>
              <button className="btn btn-sm">Open in new tab ↗</button>
              <button className="btn btn-sm">Download postcard sheet (6 × PNG)</button>
            </div>
          </div>

          <div className="slideover-col">
            <div className="eyebrow">Live preview · {mode}</div>
            <div style={{
              marginTop: 12, border: '1px solid oklch(from currentColor l c h / 0.2)',
              aspectRatio: '3/4', overflow: 'hidden', position: 'relative',
            }}>
              {/* A tiny scaled preview of the Public project hero */}
              <div style={{
                transform: 'scale(0.42)', transformOrigin: 'top left',
                width: '238%', height: '238%',
                pointerEvents: 'none',
              }}>
                <PublicProjectHeroPreview mode={mode} />
              </div>
            </div>
            <div className="mono-sm" style={{ opacity: 0.55, marginTop: 8 }}>
              Reflects current workspace state · updates as you edit.
            </div>

            <div className="overline-divider">Summary</div>
            <table className="token-table" style={{ marginTop: 0 }}>
              <tbody>
                <tr><td>Stops</td><td>{summary.total}</td></tr>
                <tr><td>Ready</td><td>{summary.totalComplete}</td></tr>
                <tr><td>Missing heroes</td><td>{summary.missingHeroes}</td></tr>
                <tr><td>Missing bodies</td><td>{summary.missingBodies}</td></tr>
                <tr><td>Default mode</td><td>{mode}</td></tr>
                <tr><td>Visibility</td><td>{visibility}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// Tiny preview used inside the slide-over
function PublicProjectHeroPreview({ mode }) {
  return (
    <div className="page" data-mode={mode} style={{ minHeight: 0 }}>
      <div className="pp-hero" style={{ minHeight: 760 }}>
        <div className="pp-hero-txt">
          <div>
            <div className="eyebrow">A year in SE1 · Ed.01 · by Ana Ishii</div>
            <h1 style={{ fontFamily: 'var(--mode-display-font)', fontSize: 92, lineHeight: 0.9, marginTop: 24, letterSpacing: '-0.02em' }}>
              {mode === 'punk' ? 'TWELVE CUTS OF SE1' : mode === 'fashion' ? 'Twelve walks,\none postcode.' : 'Twelve scenes\nin SE1.'}
            </h1>
          </div>
          <div className="mono-sm" style={{ opacity: 0.65 }}>
            12 STOPS · 48 MIN READ · ED.01 · APR 2026
          </div>
        </div>
        <div className="pp-hero-img">
          <Img label={PROJECT.coverLabel} tone={mode === 'cinema' ? 'dark' : 'warm'} style={{ height: '100%', aspectRatio: 'auto' }} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PublishSlideover });
