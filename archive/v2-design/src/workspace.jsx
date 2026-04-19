// workspace.jsx — the V2 project workspace.
// One screen that replaces V1's Upload + Organize + Editor + Media + Publish.
// Spine (left) · Canvas (middle) · Drawers A/B (right, tabbed).
//
// The workspace re-renders the SAME content in the three modes, with
// meaningfully different layout grammar per mode (brief §What changes → 1).

function Workspace({ mode, onMode, onOpenPublish, onExitToProjects }) {
  const [selected, setSelected] = React.useState('05');
  const [drawerTab, setDrawerTab] = React.useState('assets');  // assets | queue
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const stop = STOPS.find(s => s.n === selected);
  const summary = projectSummary(STOPS);

  return (
    <div className="page" data-mode={mode}>
      {/* top bar */}
      <div className="ws-topbar">
        <div className="row items-center gap-16">
          <button className="mono-sm" onClick={onExitToProjects} style={{ opacity: 0.6 }}>← Projects</button>
          <Roundel />
          <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15, lineHeight: 1 }}>
            {PROJECT.title}
          </div>
          <span className="mono-sm" style={{ opacity: 0.45 }}>DRAFT · ED.01 · {summary.totalComplete}/{summary.total} STOPS READY</span>
        </div>
        <div className="row items-center gap-16">
          <ModePill mode={mode} onMode={onMode} />
          <button className="btn" onClick={() => setDrawerOpen(o => !o)}>{drawerOpen ? 'Hide panels →' : '← Show panels'}</button>
          <button className="btn btn-solid" onClick={onOpenPublish}>Publish →</button>
        </div>
      </div>

      <div className="ws-shell" style={{ gridTemplateColumns: drawerOpen ? `var(--spine-w) 1fr var(--drawer-w)` : `var(--spine-w) 1fr` }}>
        <Spine selected={selected} onSelect={setSelected} />
        <WSCanvas mode={mode} stop={stop} key={selected /* reset per stop */} />
        {drawerOpen && (
          <WSDrawers tab={drawerTab} onTab={setDrawerTab} selectedStop={selected} mode={mode} />
        )}
      </div>
    </div>
  );
}

// ---- Spine ----------------------------------------------------------------
function Spine({ selected, onSelect }) {
  const summary = projectSummary(STOPS);
  return (
    <aside className="spine">
      <div className="spine-hdr">
        <div className="eyebrow">12 stops</div>
        <div className="eyebrow" style={{ opacity: 0.6 }}>{summary.totalComplete}/{summary.total}</div>
      </div>
      {STOPS.map(s => (
        <div
          key={s.n}
          className="spine-row"
          data-active={selected === s.n}
          onClick={() => onSelect(s.n)}
        >
          <span className="spine-n">{s.n}</span>
          <span className="spine-title">{s.title}</span>
          <Pips status={s.status} />
          <div className="spine-meta-row">
            <span>{s.code}</span>
            <span style={{ opacity: 0.6 }}>·</span>
            <span>{s.time}</span>
          </div>
        </div>
      ))}
      <div className="spine-foot">
        <div>{summary.missingHeroes} stops without hero · {summary.missingBodies} without body</div>
        <div style={{ marginTop: 6 }}>{summary.missingUploads ? `${summary.missingUploads} stops need uploads` : 'All stops have uploads'}</div>
      </div>
    </aside>
  );
}

// ---- Canvas (per-stop workspace body) -------------------------------------
function WSCanvas({ mode, stop }) {
  // Only Stop 05 carries the demo body / postcard state for the prototype.
  const isDemo = stop.n === '05';
  return (
    <main className="canvas">
      <div className="canvas-inner">
        <CanvasHeader stop={stop} mode={mode} />
        <div className="overline-divider">Hero &amp; assets for stop {stop.n}</div>
        <HeroSlot stop={stop} mode={mode} />
        <AssetStrip stop={stop} />
        <div className="overline-divider">Body</div>
        {isDemo
          ? <StoryEditorDemo mode={mode} />
          : <EmptyBodyHint stop={stop} mode={mode} />}
        <div className="overline-divider">Postcard preview</div>
        <PostcardTile stop={stop} mode={mode} />
      </div>
    </main>
  );
}

function CanvasHeader({ stop, mode }) {
  return (
    <div className="canvas-hdr">
      <div>
        <div className="eyebrow" style={{ opacity: 0.75 }}>
          Stop {stop.n} · {stop.code} · {stop.time} · {stop.mood}
        </div>
        <h1 className="canvas-title" style={{ marginTop: 10 }}>{stop.title}</h1>
      </div>
      <div className="col items-end gap-8" style={{ flexShrink: 0 }}>
        <span className="mono-sm" style={{ opacity: 0.65 }}>
          {stop.status.body ? 'Body: 3 paragraphs · 1 quote' : 'Body: empty'}
        </span>
        <span className="mono-sm" style={{ opacity: 0.65 }}>
          Media task: {stop.status.media ?? '—'}
        </span>
      </div>
    </div>
  );
}

function HeroSlot({ stop, mode }) {
  if (!stop.status.hero) {
    return (
      <div className="hero-slot" style={{
        display: 'grid', placeItems: 'center',
        borderStyle: 'dashed',
        minHeight: 280,
      }}>
        <div className="col items-center gap-8">
          <div className="mono-sm" style={{ opacity: 0.65 }}>Pick a hero from the asset strip</div>
          <button className="btn btn-sm">Drop image here</button>
        </div>
      </div>
    );
  }
  return <Img label={stop.label + ' · HERO'} tone={stop.tone} ratio="16/9" style={{ aspectRatio: 'auto', height: mode === 'cinema' ? 360 : 440 }} />;
}

function AssetStrip({ stop }) {
  const assigned = POOL_ASSETS.filter(a => a.stop === stop.n);
  const hero = assigned[0];
  if (assigned.length === 0) {
    return (
      <div className="mono-sm" style={{ opacity: 0.55, padding: '8px 2px' }}>
        No assets assigned yet. Drag from the Assets pool →
      </div>
    );
  }
  return (
    <div className="asset-strip">
      {assigned.map(a => (
        <div key={a.id} className="cell" data-hero={a.id === hero.id}>
          <Img label={a.id.toUpperCase()} tone={a.tone} ratio="1/1" style={{ aspectRatio: 'auto', height: '100%' }} />
        </div>
      ))}
      <div className="cell" style={{ borderStyle: 'dashed', display: 'grid', placeItems: 'center' }}>
        <span className="mono-sm" style={{ opacity: 0.55 }}>+ drop</span>
      </div>
    </div>
  );
}

function EmptyBodyHint({ stop, mode }) {
  return (
    <div style={{ padding: '28px 0' }}>
      <p className="n-para" style={{ opacity: 0.6, fontStyle: 'italic' }}>
        Nothing written for Stop {stop.n} yet. Press <kbd style={{
          fontFamily: 'var(--f-mono)', fontSize: 10,
          border: '1px solid currentColor', padding: '1px 5px', margin: '0 2px', opacity: 0.8,
        }}>/</kbd> to insert a block, or just start typing{stop.status.hero ? '.' : ' — a hero image would help.'}
      </p>
    </div>
  );
}

// ---- Story Editor demo (Stop 05) ------------------------------------------
function StoryEditorDemo({ mode }) {
  const [selected, setSelected] = React.useState(3);       // the pullQuote
  const [slashOpen, setSlashOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {BODY_05.map((node, i) => (
        <ContentNode
          key={i}
          node={node}
          selected={selected === i}
          onSelect={() => setSelected(i)}
          mode={mode}
        />
      ))}

      {/* trailing "/" affordance */}
      <div style={{ position: 'relative', padding: '12px 0 4px' }}>
        <div className="mono-sm" style={{ opacity: 0.55, cursor: 'pointer' }}
             onClick={() => setSlashOpen(o => !o)}>
          + add block  <span style={{ marginLeft: 6, opacity: 0.8 }}>/</span>
        </div>
        {slashOpen && (
          <div className="slash" style={{ top: 34, left: 0 }}>
            {[
              ['Paragraph',  'Enter'],
              ['Hero image', '/hero'],
              ['Inline image','/img'],
              ['Pull quote', '/quote'],
              ['Media embed','/embed'],
              ['Meta row',   '/meta'],
            ].map(([label, kbd], i) => (
              <div key={label} className="slash-item" data-focus={i === 0} onClick={() => setSlashOpen(false)}>
                <span>{label}</span>
                <span className="slash-kbd">{kbd}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Content node renderer ------------------------------------------------
function ContentNode({ node, selected, onSelect, mode }) {
  const hint = {
    paragraph: 'PARA',
    heroImage: 'HERO',
    inlineImage: 'INLINE',
    pullQuote: 'QUOTE',
    mediaEmbed: 'EMBED',
    metaRow: 'META',
  }[node.type];

  const body = (() => {
    switch (node.type) {
      case 'paragraph':
        return <p className="n-para">{node.content}</p>;
      case 'metaRow':
        return (
          <div className="n-meta">
            {node.content.map((c, i) => <span key={i}>{c}</span>)}
          </div>
        );
      case 'heroImage':
        return (
          <div className="n-hero">
            <Img label={node.caption} tone="warm" ratio={mode === 'cinema' ? '21/9' : '16/9'} className="frame" style={{ aspectRatio: 'auto', height: mode === 'cinema' ? 320 : 380 }} />
            <div className="n-hero-cap">{node.caption}</div>
          </div>
        );
      case 'inlineImage':
        return (
          <div className="n-inline">
            <Img label={node.assetId.toUpperCase()} tone="warm" ratio="3/4" className="frame" style={{ aspectRatio: 'auto', height: 240 }} />
            <div className="cap">{node.caption}</div>
          </div>
        );
      case 'pullQuote':
        return <blockquote className="n-pull">{node.content}</blockquote>;
      case 'mediaEmbed':
        return (
          <div className="n-embed">
            <Img label="IMG2VID · 03.0s" tone={mode === 'cinema' ? 'dark' : 'warm'} ratio="16/9" style={{ aspectRatio: 'auto', height: '100%' }} />
            <div className="n-embed-tag">img2vid · done</div>
            <div className="play">▶  play</div>
          </div>
        );
    }
  })();

  return (
    <div className="node" data-selected={selected} onClick={onSelect}>
      {body}
      <span className="node-hint">{hint}</span>
    </div>
  );
}

// ---- Postcard tile (preview, click to open editor) ------------------------
function PostcardTile({ stop, mode }) {
  const isDemo = stop.n === '05';
  if (!isDemo) {
    return (
      <div style={{
        aspectRatio: '7/5', maxWidth: 420,
        border: '1px dashed oklch(from currentColor l c h / 0.35)',
        display: 'grid', placeItems: 'center',
      }}>
        <div className="mono-sm" style={{ opacity: 0.6 }}>Postcard unavailable — needs hero + body</div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{
        aspectRatio: '7/5',
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        position: 'relative',
      }}>
        <PostcardFrontMini mode={mode} />
      </div>
      <div className="row between items-center" style={{ marginTop: 12 }}>
        <span className="mono-sm" style={{ opacity: 0.6 }}>Postcard v3 · auto-regenerates on mode switch</span>
        <button className="btn btn-sm">Open editor →</button>
      </div>
    </div>
  );
}

function PostcardFrontMini({ mode }) {
  if (mode === 'punk') {
    return (
      <div style={{ width: '100%', height: '100%', background: 'black', position: 'relative', overflow: 'hidden' }}>
        <Img label="WATERLOO · DUSK" tone="punk" style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', height: '100%' }} />
        <div style={{ position: 'absolute', top: 14, left: 14, background: 'oklch(0.62 0.24 25)', color: 'white', padding: '4px 8px', fontFamily: 'var(--f-display)', fontSize: 16, transform: 'rotate(-3deg)' }}>SE1!!</div>
        <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, fontFamily: 'var(--f-display)', fontSize: 40, color: 'white', textTransform: 'uppercase', lineHeight: 0.9, textShadow: '2px 2px 0 oklch(0.62 0.24 25)' }}>
          GREETINGS<br/>FROM<br/>WATERLOO
        </div>
      </div>
    );
  }
  if (mode === 'cinema') {
    return (
      <div style={{ width: '100%', height: '100%', background: 'oklch(0.1 0.015 250)', position: 'relative', overflow: 'hidden' }}>
        <Img label="WATERLOO · 17:19 · DUSK" tone="dark" style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', height: '100%' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, background: 'black' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, background: 'black' }} />
        <div style={{ position: 'absolute', bottom: 38, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', fontFamily: 'var(--f-mono)', fontSize: 11, color: 'oklch(0.88 0.14 90)' }}>
            — Six minutes of gold, then nothing.
          </div>
        </div>
        <div style={{ position: 'absolute', top: 38, left: 14, fontFamily: 'var(--f-mono)', fontSize: 9, color: 'oklch(0.88 0.14 90)', letterSpacing: '0.2em' }}>
          SE1 · SCENE 05 · 17:19
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: '100%', background: 'oklch(0.98 0.008 75)', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '2fr 3fr' }}>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="mono-sm" style={{ letterSpacing: '0.3em' }}>LONDON · SE1</div>
        <div>
          <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 34, fontStyle: 'italic', lineHeight: 1, color: 'oklch(0.2 0.02 40)' }}>
            Waterloo<br/><em style={{ fontWeight: 300 }}>Bridge</em>
          </div>
          <div className="mono-sm" style={{ marginTop: 10, opacity: 0.6 }}>ED. 01 / 05 OF 12</div>
        </div>
      </div>
      <Img label="BRIDGE · EAST · 17:19" tone="warm" style={{ height: '100%', aspectRatio: 'auto' }} />
    </div>
  );
}

// ---- Drawers (Assets pool · Media queue) ----------------------------------
function WSDrawers({ tab, onTab, selectedStop, mode }) {
  return (
    <aside className="drawers">
      <div className="drawer-tabs">
        <button className="drawer-tab" data-active={tab === 'assets'} onClick={() => onTab('assets')}>
          <TabGlyph char="A" />Assets pool
        </button>
        <button className="drawer-tab" data-active={tab === 'queue'} onClick={() => onTab('queue')}>
          <TabGlyph char="Q" />Media queue
        </button>
      </div>
      <div className="drawer-body">
        {tab === 'assets' ? <AssetsPoolDrawer selectedStop={selectedStop} /> : <MediaQueueDrawer mode={mode} />}
      </div>
    </aside>
  );
}

function AssetsPoolDrawer({ selectedStop }) {
  const loose = POOL_ASSETS.filter(a => a.stop === null);
  const assigned = POOL_ASSETS.filter(a => a.stop !== null);
  return (
    <div className="col gap-16">
      <div>
        <div className="row between items-baseline">
          <div className="eyebrow">Uploads · 22 items</div>
          <button className="mono-sm" style={{ opacity: 0.6 }}>Upload more</button>
        </div>
        <div className="mono-sm" style={{ opacity: 0.55, marginTop: 4 }}>
          Drag any asset onto a stop in the spine to assign.
        </div>
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Loose · {loose.length}</div>
        <div className="pool-grid">
          {loose.map(a => (
            <div key={a.id} className="pool-cell">
              <Img label={a.id.toUpperCase()} tone={a.tone} ratio="1/1" style={{ aspectRatio: 'auto', height: '100%' }} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Assigned · {assigned.length}</div>
        <div className="pool-grid">
          {assigned.map(a => (
            <div key={a.id} className="pool-cell" data-assigned={true} data-assigned-stop={a.stop}>
              <Img label={a.id.toUpperCase()} tone={a.tone} ratio="1/1" style={{ aspectRatio: 'auto', height: '100%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MediaQueueDrawer({ mode }) {
  const [tasks, setTasks] = React.useState(SEED_TASKS);
  // Animate the two "running" bars so the queue feels live.
  React.useEffect(() => {
    const t = setInterval(() => {
      setTasks(prev => prev.map(x =>
        x.state === 'running'
          ? { ...x, progress: Math.min(0.98, x.progress + 0.01 + Math.random() * 0.02) }
          : x
      ));
    }, 420);
    return () => clearInterval(t);
  }, []);

  const counts = {
    running: tasks.filter(t => t.state === 'running').length,
    queued:  tasks.filter(t => t.state === 'queued').length,
    done:    tasks.filter(t => t.state === 'done').length,
    failed:  tasks.filter(t => t.state === 'failed').length,
  };

  return (
    <div className="col gap-16">
      <div>
        <div className="eyebrow">Tasks · {tasks.length}</div>
        <div className="mono-sm" style={{ opacity: 0.55, marginTop: 4 }}>
          {counts.running} running · {counts.queued} queued · {counts.done} done · {counts.failed} failed
        </div>
      </div>
      <div>
        {tasks.map(t => (
          <div key={t.id} className="task-card" data-state={t.state}>
            <div className="task-card-hdr">
              <span className="mono-sm">
                <span className="task-dot" data-s={t.state} />
                STOP {t.stopId} · {t.kind}
              </span>
              <span className="mono-sm" style={{ opacity: 0.55 }}>{t.mode}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8, lineHeight: 1.4 }}>{t.prompt}</div>
            <div className="task-bar">
              <div className="task-bar-fill" style={{ width: `${Math.round(t.progress * 100)}%` }} />
            </div>
            <div className="row between" style={{ marginTop: 6 }}>
              <span className="mono-sm" style={{ opacity: 0.55 }}>
                {t.state === 'running' ? `${Math.round(t.progress * 100)}%` :
                 t.state === 'done'    ? 'result ready · drag →' :
                 t.state === 'failed'  ? 'mock: lost frame' :
                 'waiting in queue'}
              </span>
              {t.state === 'failed' && <button className="mono-sm" style={{ color: 'var(--status-failed)' }}>Retry</button>}
              {t.state === 'done'   && <button className="mono-sm" style={{ opacity: 0.7 }}>Insert ↓</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Workspace });
