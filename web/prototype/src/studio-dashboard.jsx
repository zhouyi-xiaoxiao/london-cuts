// studio-dashboard.jsx — Studio dashboard + Create project page

function StudioShell({ screen, onNav, mode, onMode, title, breadcrumb, actions, children }) {
  return (
    <div className="page" data-mode="base" style={{ background: 'var(--paper)' }}>
      <div className="row" style={{ minHeight: '100vh' }}>
        <StudioSidebar screen={screen} onNav={onNav} />
        <div className="col flex-1" style={{ minWidth: 0 }}>
          <StudioTopbar title={title} breadcrumb={breadcrumb} mode={mode} onMode={onMode}>
            {actions}
          </StudioTopbar>
          <div className="flex-1" style={{ padding: 32 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudioDashboard({ onNav, mode, onMode }) {
  return (
    <StudioShell
      screen="studio" onNav={onNav} mode={mode} onMode={onMode}
      title="Projects"
      breadcrumb="Studio"
      actions={<button className="btn btn-solid" onClick={() => onNav('create')}>+ New project</button>}
    >
      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--rule)', border: '1px solid var(--rule)', marginBottom: 32 }}>
        {[
          ['Active projects', '3'],
          ['Drafts', '2'],
          ['Published', '4'],
          ['Total reads', '11.2K'],
        ].map(([k, v]) => (
          <div key={k} style={{ background: 'var(--paper)', padding: '20px 24px' }}>
            <div className="eyebrow">{k}</div>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 40, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* In progress */}
      <div style={{ marginBottom: 40 }}>
        <div className="row between items-baseline" style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--f-serif)', fontSize: 28 }}>In progress</div>
          <div className="mono-sm" style={{ opacity: 0.6 }}>3 projects</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { title: 'A Year in SE1', step: 'Story editor', progress: 72, mode: 'Fashion', last: '2h ago', label: 'SE1 · SOUTHWARK' },
            { title: 'Last Trains', step: 'Upload', progress: 24, mode: 'Cinema', last: 'Yesterday', label: 'TUBE · NIGHT', tone: 'dark' },
            { title: 'Brick Lane after rain', step: 'Publish', progress: 96, mode: 'Punk', last: '3 days ago', label: 'E1 · WET', tone: 'punk' },
          ].map((p, i) => (
            <div key={i} onClick={() => i === 0 ? onNav('editor') : null} style={{ border: '1px solid var(--rule)', background: 'var(--paper)', cursor: 'pointer' }}>
              <Img label={p.label} tone={p.tone || 'warm'} ratio="16/9" />
              <div style={{ padding: 16 }}>
                <div className="row between items-baseline">
                  <div style={{ fontFamily: 'var(--f-serif)', fontSize: 22 }}>{p.title}</div>
                  <span className="chip">{p.mode}</span>
                </div>
                <div className="mono-sm" style={{ opacity: 0.6, marginTop: 4 }}>{p.step} · edited {p.last}</div>
                <div style={{ height: 3, background: 'var(--paper-3)', marginTop: 16, position: 'relative' }}>
                  <div style={{ height: '100%', background: 'var(--ink)', width: `${p.progress}%` }} />
                </div>
                <div className="row between mono-sm" style={{ marginTop: 4, opacity: 0.6 }}>
                  <span>{p.progress}%</span>
                  <span>7 steps</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity + published */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 32 }}>
        <div>
          <div className="row between items-baseline" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 24 }}>Recent activity</div>
          </div>
          <div style={{ border: '1px solid var(--rule)' }}>
            {[
              ['Generation', 'Postcard v3 · Stop 05 · Waterloo Bridge', 'A Year in SE1', '2m ago', '✓'],
              ['Media', 'Image-to-video task queued · Stop 08', 'A Year in SE1', '12m ago', '⟳'],
              ['Edit', 'Reordered stops 04 ↔ 05', 'A Year in SE1', '1h ago', '✎'],
              ['Publish', 'Draft saved · public visibility off', 'A Year in SE1', '2h ago', '✎'],
              ['Upload', '12 new images added to memory set', 'Last Trains', 'Yesterday', '↑'],
              ['Generation', 'Story route generated · 7 stops', 'Last Trains', 'Yesterday', '✓'],
            ].map(([kind, msg, proj, time, icon], i) => (
              <div key={i} className="row items-center gap-16" style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)' }}>
                <div style={{ width: 24, textAlign: 'center', opacity: 0.5 }}>{icon}</div>
                <div className="mono-sm" style={{ width: 90, opacity: 0.6 }}>{kind.toUpperCase()}</div>
                <div style={{ flex: 1, fontSize: 13 }}>{msg}</div>
                <div className="mono-sm" style={{ opacity: 0.5, width: 140, textAlign: 'right' }}>{proj}</div>
                <div className="mono-sm" style={{ opacity: 0.5, width: 80, textAlign: 'right' }}>{time}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="row between items-baseline" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 24 }}>Published</div>
          </div>
          <div className="col gap-12">
            {PROJECTS_FEED.slice(0, 4).map(p => (
              <div key={p.id} className="row gap-12 items-center" style={{ padding: 8, border: '1px solid var(--rule)' }}>
                <div style={{ width: 72, flexShrink: 0 }}>
                  <Img label="" tone={p.mode === 'punk' ? 'punk' : p.mode === 'cinema' ? 'dark' : 'warm'} ratio="1/1" />
                </div>
                <div className="flex-1">
                  <div style={{ fontFamily: 'var(--f-serif)', fontSize: 16 }}>{p.title}</div>
                  <div className="mono-sm" style={{ opacity: 0.6 }}>{p.stops} stops · {p.mode}</div>
                </div>
                <div className="mono-sm" style={{ opacity: 0.6 }}>{p.reads}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudioShell>
  );
}

function CreateProject({ onNav, mode, onMode }) {
  const [step] = React.useState(1);
  const [selectedMode, setSelectedMode] = React.useState('fashion');
  return (
    <StudioShell
      screen="create" onNav={onNav} mode={mode} onMode={onMode}
      title="New project"
      breadcrumb="Studio › New project"
      actions={<button className="btn btn-solid" onClick={() => onNav('upload')}>Continue to upload →</button>}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Stepper */}
        <div className="row items-center gap-12" style={{ marginBottom: 40 }}>
          {['Details', 'Mode', 'Cover', 'Review'].map((s, i) => (
            <React.Fragment key={s}>
              <div className="row items-center gap-8">
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= step ? 'var(--ink)' : 'transparent', color: i <= step ? 'var(--paper)' : 'var(--ink)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>{i + 1}</div>
                <div className="mono-sm" style={{ opacity: i <= step ? 1 : 0.5 }}>{s}</div>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ fontFamily: 'var(--f-serif)', fontSize: 40, marginBottom: 8 }}>Start a new cut of London.</div>
        <div style={{ opacity: 0.7, marginBottom: 40, fontSize: 16 }}>Give it a working title and pick the mode that suits the story you're telling. You can change everything later.</div>

        <div className="col gap-24">
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Working title</label>
            <input defaultValue="A Year in SE1" style={{ width: '100%', padding: '14px 16px', border: '1px solid var(--rule)', fontFamily: 'var(--f-serif)', fontSize: 24, background: 'var(--paper)' }} />
          </div>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>One-line description</label>
            <input defaultValue="Ten walks between Bermondsey and Waterloo, 2025–2026" style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--rule)', fontSize: 15, background: 'var(--paper)' }} />
          </div>

          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 12 }}>Narrative mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { id: 'punk', title: 'Punk', body: 'Zine energy, raw cut-outs, street type. High contrast. Good for: chaos, night, noise, youth.' },
                { id: 'fashion', title: 'Fashion', body: 'Whitespace, serif display, bold crops. Good for: light, architecture, slow walks, portraits.' },
                { id: 'cinema', title: 'Cinema', body: 'Shot sequences, dark palette, subtitles. Good for: narrative arcs, moody pacing, time-of-day.' },
              ].map(m => (
                <button key={m.id} onClick={() => setSelectedMode(m.id)} style={{ textAlign: 'left', padding: 16, border: `1.5px solid ${selectedMode === m.id ? 'var(--ink)' : 'var(--rule)'}`, background: selectedMode === m.id ? 'var(--paper-2)' : 'var(--paper)' }}>
                  <div className="row between items-center">
                    <div style={{ fontFamily: 'var(--f-serif)', fontSize: 24 }}>{m.title}</div>
                    {selectedMode === m.id && <div className="chip chip-solid">Selected</div>}
                  </div>
                  <div className="mono-sm" style={{ opacity: 0.6, marginTop: 8, textTransform: 'none', letterSpacing: 0, lineHeight: 1.5 }}>{m.body}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Primary area</label>
              <select style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--rule)', fontSize: 15, background: 'var(--paper)' }}>
                <option>SE1 — Southwark / Bermondsey</option>
                <option>E1 — Whitechapel</option>
                <option>E8 — Hackney</option>
                <option>N1 — Islington</option>
                <option>Custom area…</option>
              </select>
            </div>
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Expected length</label>
              <select style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--rule)', fontSize: 15, background: 'var(--paper)' }}>
                <option>Short · 4–6 stops</option>
                <option>Standard · 8–12 stops</option>
                <option>Long · 13+ stops</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </StudioShell>
  );
}

Object.assign(window, { StudioShell, StudioDashboard, CreateProject });
