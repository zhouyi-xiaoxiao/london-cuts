// projects-list.jsx — V1 screens 06 + 07 merged.
// Cards grid + "New project" opens a modal (not a separate page).

function ProjectsList({ onOpenWorkspace, onExit }) {
  const [modal, setModal] = React.useState(false);
  return (
    <div className="page" data-mode="fashion">
      <div className="ws-topbar">
        <div className="row items-center gap-16">
          <Roundel />
          <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15 }}>London Cuts Studio</div>
          <span className="mono-sm" style={{ opacity: 0.5 }}>Ana Ishii</span>
        </div>
        <div className="row items-center gap-16">
          <button className="btn btn-sm" onClick={onExit}>Back to handoff</button>
          <button className="btn btn-solid" onClick={() => setModal(true)}>+ New project</button>
        </div>
      </div>

      <div style={{ padding: '48px 40px', maxWidth: 1680, margin: '0 auto' }}>
        <div className="row between items-end" style={{ marginBottom: 32 }}>
          <div>
            <div className="eyebrow">Studio · 3 projects</div>
            <h1 style={{ fontFamily: 'var(--f-fashion)', fontSize: 72, fontStyle: 'italic', lineHeight: 1, marginTop: 8, letterSpacing: '-0.02em' }}>Your work.</h1>
          </div>
          <div className="row gap-16 mono-sm" style={{ opacity: 0.65 }}>
            <span>Sort: Last edited ▾</span>
            <span>Status: All ▾</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {/* Active project — A Year in SE1 */}
          <div
            onClick={onOpenWorkspace}
            style={{ cursor: 'pointer', border: '1px solid var(--rule)', padding: 16 }}
          >
            <Img label="SE1 · COVER" tone="warm" ratio="4/3" />
            <div className="row between items-baseline" style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.1 }}>A Year in SE1</div>
              <span className="chip chip-solid">Draft</span>
            </div>
            <div className="mono-sm" style={{ marginTop: 6, opacity: 0.65 }}>12 STOPS · 7/12 READY · MODE: FASHION</div>
            <div className="mono-sm" style={{ marginTop: 2, opacity: 0.55 }}>Updated 2 minutes ago</div>
            <div style={{ marginTop: 12, height: 4, background: 'var(--paper-3)' }}>
              <div style={{ width: '58%', height: '100%', background: 'var(--ink)' }} />
            </div>
          </div>

          {/* Published project */}
          <div style={{ cursor: 'pointer', border: '1px solid var(--rule)', padding: 16 }}>
            <Img label="E1 · BRICK LANE" tone="punk" ratio="4/3" />
            <div className="row between items-baseline" style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.1 }}>Brick Lane after rain</div>
              <span className="chip">Published</span>
            </div>
            <div className="mono-sm" style={{ marginTop: 6, opacity: 0.65 }}>9 STOPS · LIVE · MODE: PUNK</div>
            <div className="mono-sm" style={{ marginTop: 2, opacity: 0.55 }}>Published 2 weeks ago · 624 reads</div>
          </div>

          {/* Archived */}
          <div style={{ cursor: 'pointer', border: '1px solid var(--rule)', padding: 16, opacity: 0.75 }}>
            <Img label="N1 · CANAL" tone="cool" ratio="4/3" />
            <div className="row between items-baseline" style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.1 }}>Regent's Canal (draft)</div>
              <span className="chip">Archived</span>
            </div>
            <div className="mono-sm" style={{ marginTop: 6, opacity: 0.65 }}>4 STOPS · 2/4 READY · MODE: CINEMA</div>
            <div className="mono-sm" style={{ marginTop: 2, opacity: 0.55 }}>Last touched 3 months ago</div>
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Activity</div>
          <div className="col" style={{ fontSize: 13 }}>
            {[
              ['2 MIN AGO',  'Postcard v3 rendered for Stop 05 · Waterloo Bridge'],
              ['14 MIN AGO', 'img2img done for Stop 01 · Borough Market'],
              ['1 HR AGO',   'Uploaded 12 assets to Assets pool'],
              ['YESTERDAY',  'Changed default mode from cinema → fashion'],
              ['2 DAYS AGO', 'Published: Brick Lane after rain'],
            ].map(([t, msg], i) => (
              <div key={i} className="row gap-24" style={{ padding: '10px 0', borderBottom: '1px dashed var(--rule)' }}>
                <span className="mono-sm" style={{ opacity: 0.55, width: 100 }}>{t}</span>
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && <NewProjectModal onClose={() => setModal(false)} onCreate={onOpenWorkspace} />}
    </div>
  );
}

function NewProjectModal({ onClose, onCreate }) {
  const [title, setTitle] = React.useState('New walk');
  const [defaultMode, setDefaultMode] = React.useState('fashion');
  return (
    <>
      <div className="slideover-scrim" onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 560, maxWidth: '92vw',
        background: 'var(--paper)', color: 'var(--ink)',
        border: '1px solid var(--ink)',
        zIndex: 102,
        padding: 28,
      }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>New project</div>
        <div style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 32, lineHeight: 1 }}>Start a walk.</div>

        <div className="col gap-16" style={{ marginTop: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Title</div>
            <input value={title} onChange={e => setTitle(e.target.value)}
                   style={{ width: '100%', borderBottom: '1.5px solid var(--ink)', padding: '6px 0', fontSize: 18 }} />
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Default mode for readers</div>
            <ModePill mode={defaultMode} onMode={setDefaultMode} />
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Postcode area</div>
            <div className="row gap-8">
              {['SE1', 'E1', 'N1', 'SW8', 'other'].map(c => (
                <button key={c} className={'chip ' + (c === 'SE1' ? 'chip-solid' : '')}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="row gap-12" style={{ marginTop: 28, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-solid" onClick={onCreate}>Create &amp; open workspace →</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { ProjectsList });
