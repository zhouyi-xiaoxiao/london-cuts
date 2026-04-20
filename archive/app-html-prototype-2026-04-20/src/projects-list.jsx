// projects-list.jsx — Projects dashboard. Multi-project: the currently-loaded
// project shows as "CURRENT" at top, and every archive in state.projects gets
// its own card below. Clicking an archived card archives the current one and
// loads the chosen one so switching never loses work.

function ProjectsList({ onSelectProject }) {
  const project = useLCStore(s => s.project);
  const stops   = useLCStore(s => s.stops);
  const assets  = useLCStore(s => s.assetsPool);
  const mode    = useLCStore(s => s.ui.mode || s.project.defaultMode || 'fashion');
  const archivedMap = useLCStore(s => s.projects || {});
  const summary = projectSummary(stops);
  const progress = Math.round(100 * summary.totalComplete / Math.max(1, summary.total));
  const coverStop = stops.find(s => s.heroAssetId) || stops[0];
  const coverUrl = heroUrlFor(coverStop, assets);
  const [modal, setModal] = React.useState(false);

  const archivedList = React.useMemo(() => {
    return Object.values(archivedMap || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [archivedMap]);

  const openWorkspace = () => { location.hash = '#workspace'; onSelectProject && onSelectProject(); };

  const loadArchived = (id) => {
    const ok = storeActions.loadProjectFromArchive(id);
    if (ok) {
      setTimeout(() => { location.hash = '#workspace'; onSelectProject && onSelectProject(); }, 50);
    }
  };

  const deleteArchived = (id, ev) => {
    ev.stopPropagation();
    if (confirm('Delete this archived project? This cannot be undone.')) {
      storeActions.deleteArchivedProject(id);
    }
  };

  const resetProject = () => {
    if (confirm('Reset this project to seed data? All your edits will be lost.')) {
      window.LCStore.reset();
    }
  };

  return (
    <div className="page" data-mode="fashion" style={{ overflow: 'auto', height: '100vh' }}>
      <div className="ws-topbar">
        <div className="row items-center gap-16">
          <Roundel />
          <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15 }}>London Cuts Studio</div>
          <span className="mono-sm" style={{ opacity: 0.5 }}>{project.author}</span>
        </div>
        <div className="row items-center gap-16">
          <button className="btn btn-sm btn-solid" title="Load the 13 London Memories photos + auto-populate all 13 stops"
                  onClick={() => { if (window.loadLondonMemoryDemo) { window.loadLondonMemoryDemo(); setTimeout(() => location.hash = '#workspace', 100); } }}>
            📷 Load London Memories demo
          </button>
          <button className="btn btn-sm btn-solid" title="28 hackathon photos — instant load, no AI. Use 🔄 Re-analyze in the workspace for gpt-4o descriptions."
                  onClick={() => { if (window.loadHackathonDemo) window.loadHackathonDemo(); }}>
            📷 Load Hackathon demo
          </button>
          <button className="btn btn-sm" onClick={() => storeActions.startTour()}>? Demo</button>
          <button className="btn btn-sm" onClick={resetProject}>Reset data</button>
          <button className="btn btn-sm btn-solid" title="Analyze a folder of photos with AI to auto-create stops"
                  onClick={() => window.openVisionPipeline?.()}>
            📁 New from photos
          </button>
          <button className="btn btn-solid" onClick={() => setModal(true)}>+ New project</button>
        </div>
      </div>

      <FirstVisitBanner />


      <div style={{ padding: '48px 40px', maxWidth: 1680, margin: '0 auto' }}>
        <div className="row between items-end" style={{ marginBottom: 32 }}>
          <div>
            <div className="eyebrow">Studio</div>
            <h1 style={{ fontFamily: 'var(--f-fashion)', fontSize: 72, fontStyle: 'italic', lineHeight: 1, marginTop: 8, letterSpacing: '-0.02em' }}>Your work.</h1>
            <div className="mono-sm" style={{ marginTop: 10, opacity: 0.55, maxWidth: 560 }}>
              {archivedList.length > 0
                ? `${archivedList.length + 1} project${archivedList.length === 0 ? '' : 's'} · click any card to switch. Loading a demo archives the current one so nothing is lost.`
                : 'Multi-project studio. Use the buttons above to start fresh, load a demo, or analyze your photo folder with AI.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {/* CURRENT active project */}
          <ProjectCard
            isCurrent
            coverUrl={coverUrl}
            coverLabel={project.coverLabel || 'UNTITLED'}
            title={project.title}
            subtitle={project.subtitle}
            visibility={project.visibility}
            published={project.published}
            stops={stops}
            assetsPool={assets}
            summary={summary}
            mode={mode}
            progress={progress}
            onClick={openWorkspace}
            tourAttr="active-project-card"
          />

          {/* Archived projects */}
          {archivedList.map(p => {
            const aSummary = projectSummary(p.stops || []);
            const aCoverStop = (p.stops || []).find(s => s.heroAssetId) || (p.stops || [])[0];
            const aCoverUrl = aCoverStop && p.assetsPool
              ? (() => {
                  if (aCoverStop.heroAssetId) {
                    const found = p.assetsPool.find(x => x.id === aCoverStop.heroAssetId);
                    if (found && found.imageUrl) return found.imageUrl;
                  }
                  const firstWithImg = p.assetsPool.find(x => x.imageUrl);
                  return (firstWithImg && firstWithImg.imageUrl) || null;
                })()
              : null;
            const aProgress = Math.round(100 * aSummary.totalComplete / Math.max(1, aSummary.total));
            return (
              <ProjectCard
                key={p.id}
                archiveId={p.id}
                coverUrl={aCoverUrl}
                coverLabel={(p.project && p.project.coverLabel) || 'UNTITLED'}
                title={(p.project && p.project.title) || 'Untitled'}
                subtitle={p.project && p.project.subtitle}
                visibility={p.project && p.project.visibility}
                published={p.project && p.project.published}
                stops={p.stops || []}
                assetsPool={p.assetsPool || []}
                summary={aSummary}
                mode={(p.project && p.project.defaultMode) || 'fashion'}
                progress={aProgress}
                onClick={() => loadArchived(p.id)}
                onDelete={(ev) => deleteArchived(p.id, ev)}
                createdAt={p.createdAt}
              />
            );
          })}
        </div>

        <div style={{ marginTop: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Activity</div>
          <div className="col" style={{ fontSize: 13 }}>
            {[
              ['NOW',         `${summary.totalComplete}/${summary.total} stops ready · ${summary.missingHeroes} need a hero`],
              ['TODAY',       `${assets.length} assets in pool · ${archivedList.length} archived project${archivedList.length === 1 ? '' : 's'}`],
              ['YESTERDAY',   `Default mode: ${mode}`],
              ['2 DAYS AGO',  'Sample: published Brick Lane after rain'],
            ].map(([t, msg], i) => (
              <div key={i} className="row gap-24" style={{ padding: '10px 0', borderBottom: '1px dashed var(--rule)' }}>
                <span className="mono-sm" style={{ opacity: 0.55, width: 100 }}>{t}</span>
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && <NewProjectModal onClose={() => setModal(false)} onCreate={(data) => {
        // Archive whatever's currently loaded before clobbering with a blank.
        try { storeActions.archiveCurrentProject?.(); } catch {}
        if (window.storeActions?.createBlankProject) {
          window.storeActions.createBlankProject({
            title: data.title, defaultMode: data.defaultMode, area: data.area,
          });
        } else {
          // Fallback (should not hit)
          storeActions.setTitle(data.title);
          storeActions.setDefaultMode(data.defaultMode);
          storeActions.setMode(data.defaultMode);
          storeActions.setSlug(data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
        }
        setModal(false);
        openWorkspace();
      }} />}
    </div>
  );
}

// One card per project (current or archived). Includes the variant strip:
// a 4-6 thumbnail row showing pre-generated style variants if any exist.
function ProjectCard({
  isCurrent, archiveId,
  coverUrl, coverLabel,
  title, subtitle,
  visibility, published,
  stops, assetsPool,
  summary, mode, progress,
  onClick, onDelete, createdAt, tourAttr,
}) {
  const variants = (assetsPool || []).filter(a => a && a.tone === 'generated' && a.imageUrl).slice(0, 6);
  const createdLabel = createdAt
    ? new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    : null;
  return (
    <div
      data-tour={tourAttr}
      onClick={onClick}
      style={{ cursor: 'pointer', border: '1px solid var(--rule)', padding: 20, position: 'relative' }}
    >
      {coverUrl
        ? <img src={coverUrl} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
        : <Img label={coverLabel || 'UNTITLED'} tone="warm" ratio="16/9" />
      }
      <div className="row between items-baseline" style={{ marginTop: 16, gap: 8 }}>
        <div style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 24, lineHeight: 1.05, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div className="row items-center gap-8" style={{ flexShrink: 0 }}>
          {isCurrent
            ? <span className="chip chip-solid" title="The project you are currently editing">CURRENT</span>
            : <span className="chip chip-solid" style={{ opacity: 0.75 }}>{visibility === 'public' && published ? 'LIVE' : 'DRAFT'}</span>
          }
        </div>
      </div>
      {subtitle && (
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.7, fontStyle: 'italic', fontFamily: 'var(--f-fashion)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{subtitle}</div>
      )}
      <div className="mono-sm" style={{ marginTop: 10, opacity: 0.65, fontSize: 11 }}>
        {(stops || []).length} STOPS · {summary.totalComplete}/{summary.total} READY · {String(mode || 'fashion').toUpperCase()}
        {published && ` · PUBLISHED ${published}`}
      </div>
      {createdLabel && !isCurrent && (
        <div className="mono-sm" style={{ marginTop: 2, opacity: 0.45, fontSize: 10 }}>
          ARCHIVED {createdLabel}
        </div>
      )}
      <div style={{ marginTop: 10, height: 3, background: 'var(--paper-3)' }}>
        <div style={{ width: progress + '%', height: '100%', background: 'var(--mode-accent)', transition: 'width 240ms ease' }} />
      </div>
      {/* Variant strip: pre-generated style previews for this project. */}
      {variants.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 12, overflowX: 'auto' }}>
          {variants.map(v => (
            <img
              key={v.id}
              src={v.imageUrl}
              alt=""
              title={v.styleLabel || (v.prompt ? String(v.prompt).slice(0, 30) : 'style variant')}
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 2, flexShrink: 0, border: '1px solid var(--rule)' }}
            />
          ))}
        </div>
      )}
      {/* Delete only on archived cards. */}
      {archiveId && onDelete && (
        <button
          className="btn btn-sm"
          title="Delete this archived project"
          onClick={onDelete}
          style={{ position: 'absolute', top: 8, right: 8, opacity: 0.7, fontSize: 11, padding: '2px 8px' }}
        >×</button>
      )}
    </div>
  );
}

function NewProjectModal({ onClose, onCreate }) {
  const [title, setTitle] = React.useState('New walk');
  const [defaultMode, setDefaultMode] = React.useState('fashion');
  const [area, setArea] = React.useState('SE1');

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
        <div className="mono-sm" style={{ opacity: 0.6, marginTop: 8 }}>
          Archives the current project so you can switch back to it later. Creates a single blank stop you can build on.
        </div>

        <div className="col gap-16" style={{ marginTop: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Title</div>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
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
                <button key={c} className={'chip ' + (area === c ? 'chip-solid' : '')} onClick={() => setArea(c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="row gap-12" style={{ marginTop: 28, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-solid" onClick={() => onCreate({ title: title.trim() || 'New walk', defaultMode, area })}>Create &amp; open workspace →</button>
        </div>
      </div>
    </>
  );
}

function FirstVisitBanner() {
  const [show, setShow] = React.useState(() => {
    try { return localStorage.getItem('lc_demo_seen') !== '1'; } catch { return false; }
  });
  if (!show) return null;
  const dismiss = () => {
    try { localStorage.setItem('lc_demo_seen', '1'); } catch {}
    setShow(false);
  };
  const start = () => {
    try { localStorage.setItem('lc_demo_seen', '1'); } catch {}
    setShow(false);
    storeActions.startTour();
  };
  return (
    <div style={{
      background: 'var(--mode-accent, oklch(0.55 0.14 20))',
      color: 'white', padding: '12px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div>
        <div className="mono-sm" style={{ opacity: 0.85 }}>FIRST VISIT · 2-MINUTE WALKTHROUGH</div>
        <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 18, fontStyle: 'italic', marginTop: 2 }}>
          Watch yourself build a walk end-to-end.
        </div>
      </div>
      <div className="row gap-8">
        <button className="btn btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} onClick={dismiss}>Skip</button>
        <button className="btn btn-sm btn-solid" onClick={start}>Start demo →</button>
      </div>
    </div>
  );
}

Object.assign(window, { ProjectsList });
