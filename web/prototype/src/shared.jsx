// shared.jsx — shared UI: nav, mode switcher, chrome, image placeholders

// Image placeholder with stripes + mono caption
function Img({ label, tone, ratio = '3/2', style = {}, className = '' }) {
  return (
    <div
      className={`img-ph ${className}`}
      data-label={label}
      data-tone={tone}
      style={{ aspectRatio: ratio, width: '100%', ...style }}
    />
  );
}

// Underground-roundel marker
function Roundel({ label, size = 'md', style = {} }) {
  const cls = size === 'xl' ? 'roundel roundel-xl' : 'roundel';
  return <span className={cls} style={style} aria-label={label} />;
}

// Top nav for public surfaces
function PublicNav({ mode, onMode, screen, onNav }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--mode-bg)',
      borderBottom: '1px solid currentColor',
      borderBottomColor: 'oklch(from currentColor l c h / 0.12)',
    }}>
      <div className="max-wide row items-center between" style={{ padding: '14px 40px', height: 60 }}>
        <div className="row items-center gap-16">
          <Roundel />
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, letterSpacing: '0.02em' }}>
            LONDON&nbsp;CUTS
          </div>
          <span className="mono-sm" style={{ opacity: 0.5, marginLeft: 8 }}>ED. 01 · APR 2026</span>
        </div>
        <div className="row items-center gap-24">
          <button className="mono-sm" onClick={() => onNav?.('landing')} style={{ opacity: screen === 'landing' ? 1 : 0.5 }}>Index</button>
          <button className="mono-sm" onClick={() => onNav?.('atlas')} style={{ opacity: screen === 'atlas' ? 1 : 0.5 }}>Atlas</button>
          <button className="mono-sm" onClick={() => onNav?.('public-project')} style={{ opacity: screen === 'public-project' ? 1 : 0.5 }}>Projects</button>
          <span className="mono-sm" style={{ opacity: 0.3 }}>·</span>
          <ModeSwitcher mode={mode} onMode={onMode} />
          <button className="btn btn-sm" onClick={() => onNav?.('studio')}>Studio</button>
        </div>
      </div>
    </div>
  );
}

// Mode switcher — Punk / Fashion / Cinema
function ModeSwitcher({ mode, onMode, compact = false }) {
  const modes = [
    { id: 'punk', label: 'Punk' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'cinema', label: 'Cinema' },
  ];
  return (
    <div className="row" style={{
      border: '1px solid currentColor',
      borderColor: 'oklch(from currentColor l c h / 0.3)',
    }}>
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => onMode(m.id)}
          className="mono-sm"
          style={{
            padding: compact ? '4px 8px' : '6px 12px',
            background: mode === m.id ? 'currentColor' : 'transparent',
            color: mode === m.id ? 'var(--mode-bg)' : 'currentColor',
            transition: 'all 200ms',
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// Studio sidebar
function StudioSidebar({ screen, onNav }) {
  const items = [
    { id: 'studio', label: 'Projects', section: 'Work' },
    { id: 'create', label: 'New Project', section: 'Work' },
    { id: 'upload', label: 'Upload Memories', section: 'Current Project' },
    { id: 'organize', label: 'Organize Stops', section: 'Current Project' },
    { id: 'editor', label: 'Story Editor', section: 'Current Project' },
    { id: 'media', label: 'Media Panel', section: 'Current Project' },
    { id: 'publish', label: 'Publish', section: 'Current Project' },
  ];
  const grouped = items.reduce((a, i) => { (a[i.section] ||= []).push(i); return a; }, {});
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      borderRight: '1px solid var(--rule)',
      padding: '24px 0',
      background: 'var(--paper-2)',
      minHeight: '100vh',
      position: 'sticky', top: 0, alignSelf: 'flex-start',
      height: '100vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '0 20px', marginBottom: 28 }}>
        <div className="row items-center gap-12">
          <Roundel />
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 13, letterSpacing: '0.04em' }}>STUDIO</div>
        </div>
        <div className="mono-sm" style={{ opacity: 0.5, marginTop: 6 }}>Ana Ishii · Ed. 01</div>
      </div>
      {Object.entries(grouped).map(([section, list]) => (
        <div key={section} style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ padding: '0 20px 8px' }}>{section}</div>
          {list.map(i => (
            <button
              key={i.id}
              onClick={() => onNav?.(i.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 20px', fontSize: 13,
                background: screen === i.id ? 'var(--paper-3)' : 'transparent',
                borderLeft: screen === i.id ? '2px solid var(--ink)' : '2px solid transparent',
                fontWeight: screen === i.id ? 600 : 400,
              }}
            >{i.label}</button>
          ))}
        </div>
      ))}
      <div style={{ padding: '0 20px', marginTop: 'auto', fontSize: 11 }} className="mono-sm">
        <div style={{ opacity: 0.5 }}>Current Project</div>
        <div style={{ opacity: 0.9, marginTop: 2 }}>A Year in SE1</div>
      </div>
    </aside>
  );
}

// Studio top bar
function StudioTopbar({ title, breadcrumb, children, mode, onMode }) {
  return (
    <div style={{
      borderBottom: '1px solid var(--rule)',
      padding: '14px 32px',
      background: 'var(--paper)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div className="row items-center between">
        <div className="col gap-4">
          {breadcrumb && <div className="mono-sm" style={{ opacity: 0.5 }}>{breadcrumb}</div>}
          <div style={{ fontSize: 16, fontFamily: 'var(--f-sans)', fontWeight: 600 }}>{title}</div>
        </div>
        <div className="row items-center gap-16">
          {mode && <ModeSwitcher mode={mode} onMode={onMode} compact />}
          {children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Img, Roundel, PublicNav, ModeSwitcher, StudioSidebar, StudioTopbar });
