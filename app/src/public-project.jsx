// public-project.jsx — Reader-facing page. Reads everything from the store so
// that edits made in Workspace flow through instantly.

function PublicProject({ mode, onMode, onExit, onStopClick }) {
  const project = useLCStore(s => s.project);
  const stops   = useLCStore(s => s.stops);
  const assets  = useLCStore(s => s.assetsPool);
  const activeStopId = useLCStore(s => s.ui.activeStopId);
  const [hover, setHover] = React.useState(null);
  const [selectedStop, setSelectedStop] = React.useState(activeStopId || stops.find(s => s.status.hero)?.n || stops[0]?.n || '01');
  const stopRef = React.useRef(null);

  const handlePick = (n) => {
    setSelectedStop(n);
    setTimeout(() => stopRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 30);
  };

  const current = stops.find(s => s.n === selectedStop) || stops[0];
  const coverStop = stops.find(s => s.heroAssetId) || current;
  const coverUrl  = heroUrlFor(coverStop, assets);

  return (
    <div className="page" data-mode={mode} style={{ overflow: 'auto', height: '100vh' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--mode-bg)',
        borderBottom: '1px solid oklch(from currentColor l c h / 0.15)',
      }}>
        <div className="row items-center between" style={{ padding: '14px 40px', maxWidth: 1680, margin: '0 auto' }}>
          <div className="row items-center gap-16">
            <Roundel />
            <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15 }}>LONDON CUTS</div>
            <span className="mono-sm" style={{ opacity: 0.5 }}>@ana · {project.title}</span>
            {project.visibility === 'public' && project.published && (
              <span className="chip chip-solid">Published {project.published}</span>
            )}
          </div>
          <div className="row items-center gap-16">
            <ModePill mode={mode} onMode={onMode} />
            <button className="btn btn-sm" onClick={onExit}>← Back to studio</button>
          </div>
        </div>
      </div>

      {/* 1. HERO */}
      <section className="pp-hero">
        <div className="pp-hero-txt">
          <div>
            <div className="eyebrow">Ed. 01 · {project.published || 'DRAFT'} · by {project.author}</div>
            <h1 style={{
              fontFamily: 'var(--mode-display-font)',
              fontSize: mode === 'punk' ? 132 : 116,
              lineHeight: 0.88, marginTop: 28, letterSpacing: '-0.02em',
              textTransform: mode === 'punk' ? 'uppercase' : 'none',
              fontStyle: mode === 'fashion' ? 'italic' : 'normal',
            }}>
              {mode === 'punk'    && <>{project.title || 'London'}.</>}
              {mode === 'fashion' && <>{project.title || 'London'}.</>}
              {mode === 'cinema'  && <>{project.title || 'London'}.</>}
            </h1>
            <div className="n-para" style={{ marginTop: 24, maxWidth: '38ch', opacity: 0.85 }}>
              {project.subtitle || `${stops.length} stops, three ways to read them — chosen by you, switched at the top.`}
            </div>
          </div>
          <div className="row between items-end">
            <div className="mono-sm" style={{ opacity: 0.6 }}>
              {stops.length} STOPS · {project.duration || '48 min'} · ED.01
            </div>
            <div className="mono-sm" style={{ opacity: 0.6 }}>Scroll ↓ for the map</div>
          </div>
        </div>
        <div className="pp-hero-img" style={{ position: 'relative' }}>
          {coverUrl
            ? <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: coverStop?.heroFocus ? `${coverStop.heroFocus.x}% ${coverStop.heroFocus.y}%` : '50% 50%', display: 'block' }} />
            : <Img label={project.coverLabel} tone={mode === 'cinema' ? 'dark' : mode === 'punk' ? 'punk' : 'warm'} style={{ height: '100%', aspectRatio: 'auto' }} />
          }
          {mode === 'cinema' && (
            <>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, background: 'black' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'black' }} />
              <div style={{ position: 'absolute', bottom: 60, left: 24, right: 24, textAlign: 'center' }}>
                <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.5)', padding: '6px 14px',
                              fontFamily: 'var(--f-mono)', fontSize: 13, color: 'oklch(0.88 0.14 90)' }}>
                  EXT. {(coverStop?.label || 'LONDON · GOLDEN HOUR').toUpperCase()}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 2. ATLAS */}
      <section className="pp-atlas-band" id="atlas">
        <div className="row between items-end" style={{ marginBottom: 20 }}>
          <div>
            <div className="eyebrow">The Atlas</div>
            <h2 style={{
              fontFamily: 'var(--mode-display-font)', fontSize: 56, lineHeight: 0.95,
              marginTop: 10, letterSpacing: '-0.02em',
              textTransform: mode === 'punk' ? 'uppercase' : 'none',
              fontStyle: mode === 'fashion' ? 'italic' : 'normal',
            }}>
              Placed on London.
            </h2>
          </div>
          <div className="mono-sm" style={{ opacity: 0.65 }}>
            Pan, zoom, click a marker → jump to that stop below.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div className="atlas-map-wrap pp-atlas-map" data-mode={mode}>
            <StopAtlas mode={mode} onStopClick={(s) => handlePick(s.n || s)} />
            {mode === 'cinema' && (
              <>
                <div className="atlas-letterbox atlas-letterbox-top" />
                <div className="atlas-letterbox atlas-letterbox-bottom" />
              </>
            )}
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>All stops</div>
            <div className="col">
              {stops.map(s => (
                <div key={s.n} className="row between items-center"
                     style={{ padding: '10px 0', borderBottom: '1px solid oklch(from currentColor l c h / 0.12)', cursor: 'pointer',
                              background: selectedStop === s.n ? 'oklch(from currentColor l c h / 0.06)' : 'transparent' }}
                     onClick={() => handlePick(s.n)}
                     onMouseEnter={() => setHover(s.n)}
                     onMouseLeave={() => setHover(null)}>
                  <div className="row items-center gap-12" style={{ minWidth: 0, flex: 1 }}>
                    <span className="mono-sm" style={{ width: 24, opacity: 0.5 }}>{s.n}</span>
                    <span style={{ fontFamily: 'var(--mode-display-font)', fontSize: 14, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                  </div>
                  <div className="row items-center gap-8">
                    {typeof s.lat === 'number' && typeof s.lng === 'number' && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mono-sm"
                        title={`Open ${s.title} in Google Maps`}
                        style={{ opacity: 0.55, textDecoration: 'underline' }}
                        onClick={(e) => e.stopPropagation()}
                      >📍</a>
                    )}
                    <span className="mono-sm" style={{ opacity: 0.55 }}>{s.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. STOP DETAIL */}
      <section className="pp-stop-detail" ref={stopRef}>
        <StopDetail stop={current} mode={mode} assets={assets} onEdit={() => onStopClick && onStopClick(current)} />
      </section>
    </div>
  );
}

function StopDetail({ stop, mode, assets, onEdit }) {
  const heroUrl = heroUrlFor(stop, assets);
  const palette = (typeof usePalette === 'function') ? usePalette(stop, assets) : [];
  // Subtle tint: a thin accent bar under the eyebrow using palette[2] (mid-bright).
  const accent = palette[2] || null;
  const fallbackBody = [
    { type: 'metaRow',   content: [stop.time, stop.mood, stop.code, stop.label] },
    { type: 'paragraph', content: `Stop ${stop.n}: ${stop.title}. This chapter is still in draft.` },
  ];
  const body = (stop.body && stop.body.length > 0) ? stop.body : fallbackBody;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div className="row items-baseline between" style={{ marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={accent ? {
            display: 'inline-block',
            paddingBottom: 4,
            borderBottom: `2px solid ${accent}`,
          } : undefined}>Stop {stop.n} · {stop.code} · {stop.time}
            {typeof stop.lat === 'number' && typeof stop.lng === 'number' && (
              <>
                {' · '}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: 'underline', cursor: 'pointer' }}
                  title="Open in Google Maps"
                >📍 Maps</a>
              </>
            )}
          </div>
          <h2 style={{
            fontFamily: 'var(--mode-display-font)',
            fontSize: mode === 'punk' ? 80 : 72,
            lineHeight: 0.92, marginTop: 12, letterSpacing: '-0.02em',
            textTransform: mode === 'punk' ? 'uppercase' : 'none',
            fontStyle: mode === 'fashion' ? 'italic' : 'normal',
          }}>{stop.title}</h2>
        </div>
        {onEdit && (
          <button className="btn btn-sm" onClick={onEdit}>Open postcard →</button>
        )}
      </div>

      <div style={{ maxWidth: mode === 'cinema' ? 780 : 920 }}>
        {body.map((node, i) => (
          <PublicNode key={i} node={node} assets={assets} heroUrl={i === 0 ? heroUrl : null} stop={stop} mode={mode} />
        ))}
        {heroUrl && !body.some(n => n.type === 'heroImage') && (
          <div className="n-hero">
            <img src={heroUrl} alt="" style={{ width: '100%', height: mode === 'cinema' ? 320 : 380, objectFit: 'cover', objectPosition: stop.heroFocus ? `${stop.heroFocus.x}% ${stop.heroFocus.y}%` : '50% 50%', display: 'block' }} />
            <div className="n-hero-cap">{stop.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PublicNode({ node, assets, mode, stop }) {
  const tasks = useLCStore(s => s.mediaTasks);
  const assetUrl = (id) => assets.find(a => a.id === id)?.imageUrl;
  switch (node.type) {
    case 'paragraph':
      return <p className="n-para">{node.content}</p>;
    case 'pullQuote':
      return <blockquote className="n-pull">{node.content}</blockquote>;
    case 'metaRow':
      return (
        <div className="n-meta">
          {(node.content || []).map((c, i) => <span key={i}>{c}</span>)}
        </div>
      );
    case 'heroImage': {
      const url = assetUrl(node.assetId) || (stop && window.STOP_IMAGES?.[stop.n]);
      return (
        <div className="n-hero">
          {url
            ? <img src={url} alt={node.caption || ''} style={{ width: '100%', height: mode === 'cinema' ? 320 : 380, objectFit: 'cover', display: 'block' }} />
            : <Img label={node.caption || 'HERO'} tone="warm" ratio={mode === 'cinema' ? '21/9' : '16/9'} className="frame" style={{ aspectRatio: 'auto', height: mode === 'cinema' ? 320 : 380 }} />
          }
          {node.caption && <div className="n-hero-cap">{node.caption}</div>}
        </div>
      );
    }
    case 'inlineImage': {
      const url = assetUrl(node.assetId);
      return (
        <div className="n-inline">
          {url
            ? <img src={url} alt={node.caption || ''} style={{ width: '100%', height: 240, objectFit: 'cover' }} />
            : <Img label={(node.assetId || '').toUpperCase()} tone="warm" ratio="3/4" className="frame" style={{ aspectRatio: 'auto', height: 240 }} />
          }
          {node.caption && <div className="cap">{node.caption}</div>}
        </div>
      );
    }
    case 'mediaEmbed': {
      const task = tasks.find(t => t.id === node.taskId);
      return (
        <div className="n-embed">
          <Img label={task ? `${task.kind.toUpperCase()} · ${task.state}` : 'EMBED'} tone={mode === 'cinema' ? 'dark' : 'warm'} ratio="16/9" style={{ aspectRatio: 'auto', height: '100%' }} />
          {task && <div className="n-embed-tag">{task.kind} · {task.state}</div>}
          <div className="play">▶  play</div>
          {node.caption && <div className="cap" style={{ position: 'absolute', bottom: 8, left: 8 }}>{node.caption}</div>}
        </div>
      );
    }
    default: return null;
  }
}

Object.assign(window, { PublicProject });
