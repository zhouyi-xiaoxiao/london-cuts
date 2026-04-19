// workspace.jsx — Unified workspace shell for screens 08–12 (Upload, Organize, Editor, Media, Publish)
//
// New 5-screen IA: Landing, Public (02+03+04), Postcard, Projects (06+07), Workspace (08+09+10+11+12)
//
// Layout:
// ┌─────────────────────────────────────────────────┐
// │ Top bar: mode switch | title | Publish button   │
// ├──────┬──────────────────────────────┬──────────────┤
// │      │                              │   Assets     │
// │Spine │    Main canvas               │   pool (A)   │
// │(10)  │                              ├──────────────┤
// │stops │                              │   Media      │
// │      │                              │   queue (B)  │
// └──────┴──────────────────────────────┴──────────────┘
//
// Responsive: <= 1280 → right drawers become bottom sheets; <= 768 → left spine becomes top strip

function Workspace({ mode, onMode, onNav }) {
  const [activeStop, setActiveStop] = React.useState(STOPS[0]?.n || '01');
  const [rightDrawerOpen, setRightDrawerOpen] = React.useState(false);
  const [publishOpen, setPublishOpen] = React.useState(false);
  const state = useStore();
  const project = state.project || {};
  const stops = state.stops || [];
  const assets = state.assets || [];
  const assetsPool = state.assetsPool || [];
  const mediaTasks = state.mediaTasks || [];

  const activeSt = stops.find(s => s.n === activeStop);
  const poolAssets = assets.filter(a => assetsPool.includes(a.id));

  // Get stop data by ID
  const getStop = (n) => stops.find(s => s.n === n);

  // TODO: Add project title editor — would need a new store action setProjectTitle or local state + manual persist
  // TODO: Add mode sync to store if a setMode action exists in storeActions

  return (
    <div className="workspace" data-mode={mode}>
      {/* Top bar */}
      <div className="workspace-topbar">
        <div className="workspace-topbar-left">
          <ModeSwitcher mode={mode} onMode={onMode} />
        </div>
        <div className="workspace-topbar-center">
          <h1 className="workspace-title" contentEditable suppressContentEditableWarning title="Click to edit project title">
            {project.title || 'Untitled Project'}
          </h1>
        </div>
        <div className="workspace-topbar-right">
          <button className="btn workspace-publish-btn" onClick={() => setPublishOpen(true)}>
            PUBLISH
          </button>
        </div>
      </div>

      {/* Main layout grid */}
      <div className="workspace-grid">
        {/* Left spine: stop list */}
        <div className="workspace-spine">
          <div className="workspace-spine-list">
            {stops.map(st => {
              const isActive = st.n === activeStop;
              // Progress strip: 4 pips for [hero, uploads, body, postcard]
              const heroOk = \!\!st.heroAssetId;
              const assetsOk = (st.assetIds?.length || 0) > 0;
              const bodyOk = st.body?.content?.length > 0;
              const postcardOk = \!\!st.message; // simplified: if message is set
              const progress = [heroOk, assetsOk, bodyOk, postcardOk];

              return (
                <div
                  key={st.n}
                  className="workspace-spine-row"
                  data-active={isActive}
                  onClick={() => setActiveStop(st.n)}
                >
                  <div className="workspace-spine-badge">{st.n}</div>
                  <div className="workspace-spine-info">
                    <div className="workspace-spine-title">{st.title}</div>
                    <div className="workspace-spine-code">{st.code}</div>
                  </div>
                  <div className="workspace-spine-progress">
                    {progress.map((done, i) => (
                      <span key={i} className="progress-pip" data-done={done} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main canvas */}
        <div className="workspace-canvas">
          {activeSt ? (
            <div className="workspace-sections">
              {/* 1. Hero image slot */}
              <section className="workspace-section hero-section">
                <h3 className="section-label">Hero image</h3>
                {activeSt.heroAssetId ? (
                  <div className="workspace-hero-display">
                    <div className="img-ph" data-tone={activeSt.tone} data-label={activeSt.label} style={{ height: 300 }} />
                    <button className="btn-sm" onClick={() => storeActions.setHero(activeSt.n, null)}>Change</button>
                  </div>
                ) : (
                  <div className="workspace-hero-placeholder">
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)' }}>
                      <div className="mono" style={{ marginBottom: 10 }}>No hero assigned</div>
                      <div style={{ fontSize: '14px', marginBottom: 20 }}>Drag an asset from the pool or upload a new image</div>
                      {/* TODO: DnD target area for hero assignment */}
                    </div>
                  </div>
                )}
              </section>

              {/* 2. Upload / drag-drop zone */}
              <section className="workspace-section upload-section">
                <h3 className="section-label">Upload assets</h3>
                <div className="workspace-dropzone">
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-3)' }}>
                    <div className="mono" style={{ marginBottom: 10 }}>DRAG FILES HERE</div>
                    <div style={{ fontSize: '14px' }}>or click to browse</div>
                    {/* TODO: Implement file upload + preview */}
                  </div>
                </div>
              </section>

              {/* 3. Asset strip (stop-specific) */}
              <section className="workspace-section assets-section">
                <h3 className="section-label">Assets ({activeSt.assetIds?.length || 0})</h3>
                {(activeSt.assetIds?.length || 0) > 0 ? (
                  <div className="workspace-asset-strip">
                    {activeSt.assetIds?.map(assetId => {
                      const asset = assets.find(a => a.id === assetId);
                      return (
                        <div key={assetId} className="asset-thumb">
                          <div className="img-ph" style={{ height: 60, width: 60 }} />
                          {/* TODO: Click to inspect, drag to reorder */}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '20px', color: 'var(--ink-3)', textAlign: 'center' }}>
                    <span className="mono-sm">No assets yet</span>
                  </div>
                )}
              </section>

              {/* 4. Body text region */}
              <section className="workspace-section body-section">
                <h3 className="section-label">Story text</h3>
                <div className="workspace-body">
                  {activeSt.body?.content?.length > 0 ? (
                    <div className="workspace-body-display">{JSON.stringify(activeSt.body)}</div>
                  ) : (
                    <div className="workspace-body-placeholder">Write here…</div>
                  )}
                  {/* TODO: Implement contenteditable or TipTap editor */}
                </div>
              </section>

              {/* 5. Postcard preview */}
              <section className="workspace-section postcard-preview-section">
                <h3 className="section-label">Postcard preview</h3>
                <div className="workspace-postcard-preview">
                  {/* TODO: Render Postcard component in view mode for this stop */}
                  <div style={{ padding: '40px', background: 'var(--paper-2)', textAlign: 'center', color: 'var(--ink-3)' }}>
                    <div className="mono-sm" style={{ marginBottom: 10 }}>Postcard for stop {activeSt.n}</div>
                    <div style={{ fontSize: '12px' }}>Message: {activeSt.message?.substring(0, 40) || '(empty)'}…</div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)' }}>
              No stop selected
            </div>
          )}
        </div>

        {/* Right drawers (collapsible) */}
        <div className="workspace-right-rail">
          {/* Drawer A: Assets pool */}
          <div className="workspace-drawer assets-pool-drawer">
            <div className="workspace-drawer-header">
              <h3 className="section-label">Assets pool</h3>
            </div>
            <div className="workspace-drawer-content">
              {poolAssets.length > 0 ? (
                <div className="assets-pool-list">
                  {poolAssets.map(asset => (
                    <div key={asset.id} className="pool-asset-row" title={asset.name}>
                      <div className="pool-asset-thumb">
                        <div className="img-ph" style={{ height: 40, width: 40 }} />
                      </div>
                      <div className="pool-asset-meta">
                        <div className="mono-sm">{asset.name?.substring(0, 20)}</div>
                        {/* TODO: Drag to assign to current stop */}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)' }}>
                  <div className="mono-sm">Drop files here</div>
                </div>
              )}
            </div>
          </div>

          {/* Drawer B: Media queue */}
          <div className="workspace-drawer media-queue-drawer">
            <div className="workspace-drawer-header">
              <h3 className="section-label">Media queue</h3>
            </div>
            <div className="workspace-drawer-content">
              {mediaTasks.length > 0 ? (
                <div className="media-tasks-list">
                  {mediaTasks.map(task => (
                    <div key={task.id} className="media-task-row">
                      <div className="media-task-status" data-state={task.state}>
                        <span className="mono-sm">{task.state || 'queued'}</span>
                      </div>
                      <div className="media-task-meta">
                        <div style={{ fontSize: '12px' }}>Stop {task.stop_id}</div>
                        <div className="mono-sm" style={{ opacity: 0.6 }}>{task.kind}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)' }}>
                  <div className="mono-sm">No tasks</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publish slide-over */}
      {publishOpen && (
        <PublishSlideOver
          project={project}
          stops={stops}
          onClose={() => setPublishOpen(false)}
          onNav={onNav}
        />
      )}
    </div>
  );
}

// ———————————— Publish slide-over ————————————
function PublishSlideOver({ project, stops, onClose, onNav }) {
  const [slug, setSlug] = React.useState(project.slug || '');
  const [visibility, setVisibility] = React.useState(project.visibility || 'public');

  // Pre-flight checks
  const missingHeroes = stops.filter(s => \!s.heroAssetId).length;
  const missingText = stops.filter(s => \!s.body?.content?.length).length;

  return (
    <>
      {/* Backdrop */}
      <div className="publish-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="publish-panel">
        <div className="publish-header">
          <h2 className="section-label">Publish</h2>
          <button className="publish-close" onClick={onClose}>✕</button>
        </div>

        <div className="publish-content">
          {/* Pre-flight checklist */}
          <div className="publish-section">
            <h3 className="eyebrow">Pre-flight</h3>
            <div className="checklist">
              <div className="checklist-row" data-ok={missingHeroes === 0}>
                <span className="checklist-icon">{missingHeroes === 0 ? '✓' : '⚠'}</span>
                <span>Heroes: {missingHeroes === 0 ? 'All stops set' : `${missingHeroes} missing`}</span>
              </div>
              <div className="checklist-row" data-ok={missingText === 0}>
                <span className="checklist-icon">{missingText === 0 ? '✓' : '⚠'}</span>
                <span>Text: {missingText === 0 ? 'All stops written' : `${missingText} missing`}</span>
              </div>
            </div>
          </div>

          {/* Slug editor */}
          <div className="publish-section">
            <label className="eyebrow">URL slug</label>
            <input
              type="text"
              className="publish-slug-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-project"
            />
          </div>

          {/* Visibility toggle */}
          <div className="publish-section">
            <label className="eyebrow">Visibility</label>
            <div className="visibility-options">
              {['public', 'unlisted', 'private'].map(v => (
                <label key={v} className="visibility-option">
                  <input
                    type="radio"
                    name="visibility"
                    value={v}
                    checked={visibility === v}
                    onChange={(e) => setVisibility(e.target.value)}
                  />
                  <span className="mono">{v}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Share affordances */}
          <div className="publish-section">
            <h3 className="eyebrow">Share</h3>
            <div className="publish-buttons">
              <button className="btn" onClick={() => {
                // TODO: Actual URL generation
                const url = `https://london-cuts.example/@${project.author}/${slug}`;
                navigator.clipboard.writeText(url);
                alert('Copied to clipboard\!');
              }}>
                COPY LINK
              </button>
              <button className="btn" onClick={() => onNav('public')}>
                VIEW PUBLIC
              </button>
            </div>
          </div>

          {/* Live preview placeholder */}
          <div className="publish-section">
            <h3 className="eyebrow">Preview</h3>
            <div className="publish-preview">
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-3)' }}>
                <div className="mono-sm">Live preview</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ———————————— Mode switcher component ————————————
function ModeSwitcher({ mode, onMode }) {
  return (
    <div className="mode-switcher" role="radiogroup">
      {['punk', 'fashion', 'cinema'].map(m => (
        <button
          key={m}
          className="mode-pill"
          data-active={mode === m}
          onClick={() => onMode(m)}
          aria-checked={mode === m}
          title={`Switch to ${m} mode`}
        >
          <span className="mode-label">{m}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { Workspace });
