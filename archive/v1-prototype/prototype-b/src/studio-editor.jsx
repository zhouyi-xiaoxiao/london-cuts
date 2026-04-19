// studio-editor.jsx — Story editor (main writing surface) + Media panel + Publish

function StoryEditor({ onNav, mode, onMode }) {
  const [stopIdx, setStopIdx] = React.useState(4);
  const stop = STOPS[stopIdx];
  return (
    <StudioShell
      screen="editor" onNav={onNav} mode={mode} onMode={onMode}
      title="Story editor"
      breadcrumb={`A Year in SE1 › Editor › Stop ${stop.n}`}
      actions={<>
        <button className="btn">Preview in public</button>
        <button className="btn btn-solid" onClick={() => onNav('publish')}>Publish →</button>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 340px', gap: 0, border: '1px solid var(--rule)', minHeight: 720 }}>
        {/* Chapter list */}
        <div style={{ borderRight: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--rule)' }}>
            <div className="eyebrow">Chapters</div>
          </div>
          {STOPS.map((s, i) => (
            <button key={s.n} onClick={() => setStopIdx(i)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 14px', borderBottom: '1px solid var(--rule)',
              background: stopIdx === i ? 'var(--paper)' : 'transparent',
              borderLeft: stopIdx === i ? '3px solid var(--ink)' : '3px solid transparent',
            }}>
              <div className="mono-sm" style={{ opacity: 0.5 }}>{s.n}</div>
              <div style={{ fontSize: 13, lineHeight: 1.25 }}>{s.title}</div>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ background: 'var(--paper)', padding: 40, overflow: 'auto' }}>
          <div className="mono-sm" style={{ opacity: 0.5, marginBottom: 6 }}>STOP {stop.n} · {stop.code} · {stop.time}</div>
          <input defaultValue={stop.title} style={{ fontFamily: 'var(--f-serif)', fontSize: 44, width: '100%', borderBottom: '1px dashed var(--rule)', padding: '6px 0' }} />
          <div style={{ marginTop: 24 }}>
            <Img label="HERO · DUSK · FACING EAST" tone="warm" ratio="16/9" />
            <div className="row gap-8" style={{ marginTop: 8 }}>
              <button className="btn btn-sm">Replace</button>
              <button className="btn btn-sm">Crop</button>
              <button className="btn btn-sm">Regenerate variant</button>
            </div>
          </div>
          <div style={{ marginTop: 32 }}>
            <div className="mono-sm" style={{ opacity: 0.5, marginBottom: 4 }}>OPENING · AI-DRAFTED · 72% YOURS</div>
            <div contentEditable suppressContentEditableWarning style={{ fontFamily: 'var(--f-serif)', fontSize: 20, lineHeight: 1.5, padding: 12, border: '1px solid transparent', outline: 'none' }}>
              The bridge catches the sun for about six minutes before it tips into the river. I've walked it three dozen times and every time it looks like someone cut a different film from the same reel.
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div contentEditable suppressContentEditableWarning style={{ fontSize: 15, lineHeight: 1.7, padding: 12, border: '1px dashed var(--rule)' }}>
              People walk it briskly, with intent, which is why the slow ones stand out — tourists mostly, and one or two lovers who've stopped mattering to the city.
            </div>
            <Img label="ST PAUL'S" tone="cool" ratio="3/4" />
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-sm">+ Image</button>
            <button className="btn btn-sm" style={{ marginLeft: 8 }}>+ Pull quote</button>
            <button className="btn btn-sm" style={{ marginLeft: 8 }}>+ Paragraph</button>
            <button className="btn btn-sm" style={{ marginLeft: 8 }}>+ Generated media</button>
          </div>
          <div style={{ marginTop: 24, padding: 14, background: 'var(--paper-2)', border: '1px solid var(--rule)' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>AI suggestion</div>
            <div style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 8 }}>"A busker played a harmonica badly. Good, actually. Good badly."</div>
            <div className="row gap-8">
              <button className="btn btn-sm">Insert</button>
              <button className="btn btn-sm">Regenerate</button>
              <button className="btn btn-sm btn-ghost">Dismiss</button>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div style={{ borderLeft: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
          <div className="row" style={{ borderBottom: '1px solid var(--rule)' }}>
            {['Meta', 'Media', 'History'].map((t, i) => (
              <button key={t} className="mono-sm" style={{ flex: 1, padding: '12px 8px', borderBottom: i === 0 ? '2px solid var(--ink)' : 'none', fontWeight: i === 0 ? 600 : 400 }}>{t}</button>
            ))}
          </div>
          <div style={{ padding: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Applied mode</div>
            <ModeSwitcher mode={mode} onMode={onMode} compact />
            <div className="mono-sm" style={{ marginTop: 10, opacity: 0.55 }}>Changes the rendering of this chapter in the public project view.</div>

            <div className="rule" style={{ margin: '20px 0' }} />

            <div className="eyebrow" style={{ marginBottom: 10 }}>Chapter meta</div>
            <div className="col gap-10">
              {[
                ['Location', 'Waterloo Bridge'],
                ['Postcode', 'SE1 7PB'],
                ['Time', '17:19'],
                ['Mood', 'Gold'],
                ['Weather', 'Clear · 8°C'],
              ].map(([k, v]) => (
                <div key={k} className="row between">
                  <span className="mono-sm" style={{ opacity: 0.55 }}>{k}</span>
                  <span style={{ fontSize: 12 }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="rule" style={{ margin: '20px 0' }} />

            <div className="eyebrow" style={{ marginBottom: 10 }}>Postcard</div>
            <div style={{ padding: 10, border: '1px solid var(--rule)', background: 'var(--paper)' }}>
              <Img label="POSTCARD v3" tone="warm" ratio="7/5" />
              <div className="row between mono-sm" style={{ marginTop: 8, opacity: 0.6 }}>
                <span>v3 · 2m ago</span>
                <span>2.4s</span>
              </div>
            </div>
            <div className="row gap-8" style={{ marginTop: 10 }}>
              <button className="btn btn-sm" onClick={() => onNav('postcard')}>Open</button>
              <button className="btn btn-sm">Regenerate</button>
            </div>

            <div className="rule" style={{ margin: '20px 0' }} />

            <div className="eyebrow" style={{ marginBottom: 10 }}>Generated media</div>
            <div className="col gap-8">
              <div className="row between items-center" style={{ padding: 8, background: 'var(--paper)' }}>
                <div className="row gap-8 items-center"><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.62 0.18 140)' }} /><span style={{ fontSize: 12 }}>dusk → night · img2vid</span></div>
                <span className="mono-sm" style={{ opacity: 0.6 }}>3s</span>
              </div>
              <div className="row between items-center" style={{ padding: 8, background: 'var(--paper)' }}>
                <div className="row gap-8 items-center"><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.75 0.14 80)' }} /><span style={{ fontSize: 12 }}>style: gritty film</span></div>
                <span className="mono-sm" style={{ opacity: 0.6 }}>queued</span>
              </div>
              <button className="btn btn-sm" style={{ marginTop: 4 }} onClick={() => onNav('media')}>Open media panel →</button>
            </div>
          </div>
        </div>
      </div>
    </StudioShell>
  );
}

function MediaPanel({ onNav, mode, onMode }) {
  const provider = getMediaProvider();
  const tasks = useStore(s => s.mediaTasks);
  const stops = useStore(s => s.stops);
  const [selectedId, setSelectedId] = React.useState(null);
  const [filter, setFilter] = React.useState('all'); // all|running|done|failed|queued

  // Pick a sensible default selection: freshest done, else freshest anything
  React.useEffect(() => {
    if (selectedId && tasks.some(t => t.id === selectedId)) return;
    const done = tasks.find(t => t.state === 'done');
    setSelectedId((done || tasks[0])?.id || null);
  }, [tasks, selectedId]);

  const filtered = React.useMemo(() => {
    return tasks.filter(t => filter === 'all' ? true : t.state === filter);
  }, [tasks, filter]);

  const selected = tasks.find(t => t.id === selectedId) || null;
  const savedResults = tasks.filter(t => t.state === 'done');
  const running = tasks.filter(t => t.state === 'running' || t.state === 'queued').length;

  const startTask = async (kind) => {
    const stop = stops[Math.floor(Math.random() * stops.length)];
    const createFn = kind === 'img2vid'
      ? provider.createImageToVideoJob.bind(provider)
      : provider.createImageToImageJob.bind(provider);
    const { taskId } = await createFn({
      stopId: stop.n,
      sourceAssetId: stop.heroAssetId || null,
      mode,
      prompt: kind === 'img2vid' ? 'animate 2–4s, hold composition' : 'restyle in ' + mode + ' grammar',
    });
    setSelectedId(taskId);
  };

  const cancelQueued = async () => {
    const queued = tasks.filter(t => t.state === 'queued' || t.state === 'running');
    for (const t of queued) await provider.cancelJob(t.id);
  };

  return (
    <StudioShell
      screen="media" onNav={onNav} mode={mode} onMode={onMode}
      title="Media integration panel"
      breadcrumb="A Year in SE1 › Media"
      actions={<>
        <button className="btn" onClick={cancelQueued} disabled={running === 0}>Cancel queued</button>
        <button className="btn btn-solid" onClick={() => startTask('img2img')}>+ New task</button>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div>
          {/* Entry points — the only place generators are invoked */}
          <div style={{ border: '1px solid var(--rule)', padding: 20, marginBottom: 24 }}>
            <div className="row between items-baseline" style={{ marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--f-serif)', fontSize: 24 }}>Start a media task</div>
                <div className="mono-sm" style={{ opacity: 0.6, marginTop: 4 }}>Hands off to the media provider. We track the job and save results back to the stop.</div>
              </div>
              <div className="chip" title="Swap via setMediaProvider(...). See src/media-provider.jsx.">
                Provider: {provider.id} · {provider.id === 'mock' ? 'mock (local)' : 'live'}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { t: 'Image → Image', s: 'Restyle a source frame in mode grammar', b: 'Start image-to-image →', kind: 'img2img' },
                { t: 'Image → Video', s: 'Animate a stop into a 2–4s clip', b: 'Start image-to-video →', kind: 'img2vid' },
              ].map(k => (
                <div key={k.t} style={{ padding: 16, border: '1.5px solid var(--rule)', background: 'var(--paper-2)' }}>
                  <div className="mono-sm" style={{ opacity: 0.6 }}>HANDOFF</div>
                  <div style={{ fontFamily: 'var(--f-serif)', fontSize: 22, marginTop: 4 }}>{k.t}</div>
                  <div style={{ fontSize: 13, opacity: 0.8, margin: '4px 0 14px' }}>{k.s}</div>
                  <button className="btn btn-sm btn-solid" onClick={() => startTask(k.kind)}>{k.b}</button>
                </div>
              ))}
            </div>
          </div>

          {/* Task queue */}
          <div className="row between items-baseline" style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 22 }}>Tasks · {tasks.length}</div>
            <div className="row gap-8">
              {['all', 'running', 'queued', 'done', 'failed'].map(f => (
                <button key={f}
                  onClick={() => setFilter(f)}
                  className="mono-sm"
                  style={{
                    padding: '4px 10px',
                    border: `1px solid ${filter === f ? 'var(--ink)' : 'var(--rule)'}`,
                    background: filter === f ? 'var(--ink)' : 'transparent',
                    color: filter === f ? 'var(--paper)' : 'var(--ink)',
                  }}
                >{f}</button>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid var(--rule)' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '24px 14px', textAlign: 'center', opacity: 0.55 }} className="mono-sm">No tasks matching this filter. Try "all".</div>
            )}
            {filtered.map((t) => {
              const color = t.state === 'done' ? 'oklch(0.55 0.14 140)'
                : t.state === 'running' ? 'oklch(0.6 0.18 240)'
                : t.state === 'failed' ? 'oklch(0.55 0.2 25)'
                : t.state === 'cancelled' ? 'oklch(0.55 0.01 60)'
                : 'oklch(0.6 0 0)';
              const pct = Math.round((t.progress || 0) * 100);
              const stopMeta = stops.find(s => s.n === t.stopId);
              const label = `${t.stopId} · ${stopMeta?.title || 'stop'} · ${t.mode}`;
              const eta = t.state === 'done' ? ((t.durationMs || 0) / 1000).toFixed(1) + 's'
                : t.state === 'running' ? Math.max(0, Math.round((t.etaMs || 0) / 1000)) + 's'
                : t.state === 'queued' ? 'queued'
                : t.state === 'failed' ? 'retry'
                : t.state;
              const active = t.id === selectedId;
              return (
                <div key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className="row items-center gap-16"
                  style={{
                    padding: '12px 14px', borderBottom: '1px solid var(--rule)',
                    background: active ? 'var(--paper-2)' : 'transparent',
                    borderLeft: active ? '3px solid var(--ink)' : '3px solid transparent',
                    cursor: 'pointer',
                  }}>
                  <div style={{ width: 56, height: 40 }}>
                    <Img label="" tone={t.kind === 'img2vid' ? 'dark' : t.mode === 'punk' ? 'punk' : t.mode === 'cinema' ? 'cool' : 'warm'} ratio="16/10" />
                  </div>
                  <div className="mono-sm" style={{ width: 80, opacity: 0.6 }}>{t.kind.toUpperCase()}</div>
                  <div style={{ flex: 1, fontSize: 13 }}>{label}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 4, background: 'var(--paper-3)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 300ms' }} />
                    </div>
                  </div>
                  <div className="mono-sm" style={{ width: 80, textAlign: 'right', color }}>{t.state.toUpperCase()}</div>
                  <div className="mono-sm" style={{ width: 60, textAlign: 'right', opacity: 0.5 }}>{eta}</div>
                  <div className="row gap-4">
                    <button className="btn btn-sm" title="Retry"
                      onClick={(e) => { e.stopPropagation(); provider.retryJob(t.id); }}
                      disabled={t.state === 'running' || t.state === 'queued'}>↺</button>
                    <button className="btn btn-sm" title="Cancel"
                      onClick={(e) => { e.stopPropagation(); provider.cancelJob(t.id); }}
                      disabled={t.state !== 'running' && t.state !== 'queued'}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results gallery */}
          <div style={{ marginTop: 32 }}>
            <div className="row between items-baseline" style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--f-serif)', fontSize: 22 }}>Saved results · {savedResults.length}</div>
              <div className="mono-sm" style={{ opacity: 0.6 }}>Click to inspect · drag-to-editor TODO</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {savedResults.length === 0 && (
                <div className="mono-sm" style={{ gridColumn: '1 / -1', padding: '20px 0', opacity: 0.5 }}>No saved results yet. Start a task above.</div>
              )}
              {savedResults.map((t) => (
                <div key={t.id} onClick={() => setSelectedId(t.id)} style={{ position: 'relative', cursor: 'pointer', outline: t.id === selectedId ? '2px solid var(--ink)' : 'none' }}>
                  <Img label={t.kind === 'img2vid' ? 'IMG2VID' : 'IMG2IMG'} tone={t.kind === 'img2vid' ? 'dark' : t.mode === 'punk' ? 'punk' : t.mode === 'cinema' ? 'cool' : 'warm'} ratio="1/1" />
                  {t.kind === 'img2vid' && <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', fontFamily: 'var(--f-mono)', fontSize: 9 }}>▶ {((t.durationMs || 3200) / 1000).toFixed(1)}s</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — selected task inspector */}
        <div className="col gap-20">
          <div style={{ padding: 20, border: '1px solid var(--rule)' }}>
            <div className="row between items-center">
              <div className="eyebrow">Selected task</div>
              <div className="chip" style={{
                color: selected?.state === 'done' ? 'oklch(0.55 0.14 140)' : selected?.state === 'failed' ? 'oklch(0.55 0.2 25)' : 'inherit',
                borderColor: selected?.state === 'done' ? 'oklch(0.55 0.14 140)' : selected?.state === 'failed' ? 'oklch(0.55 0.2 25)' : 'currentColor',
              }}>{selected ? selected.state : '—'}</div>
            </div>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 20, marginTop: 10 }}>
              {selected ? (selected.kind === 'img2vid' ? 'Image → Video' : 'Image → Image') : 'No task selected'}
            </div>
            <div className="mono-sm" style={{ opacity: 0.6 }}>
              {selected ? `Stop ${selected.stopId} · ${stops.find(s => s.n === selected.stopId)?.title || ''}` : 'Pick a task from the list.'}
            </div>

            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div className="mono-sm" style={{ opacity: 0.5, marginBottom: 4 }}>SOURCE</div>
                <Img label="" tone={selected?.mode === 'cinema' ? 'cool' : 'warm'} ratio="1/1" />
              </div>
              <div>
                <div className="mono-sm" style={{ opacity: 0.5, marginBottom: 4 }}>RESULT</div>
                <Img label={selected?.state === 'running' ? '…' : ''} tone={selected?.state === 'done' ? (selected.mode === 'punk' ? 'punk' : 'warm') : 'dark'} ratio="1/1" />
              </div>
            </div>

            {selected?.state === 'running' && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 4, background: 'var(--paper-3)' }}>
                  <div style={{ height: '100%', width: `${Math.round((selected.progress || 0) * 100)}%`, background: 'oklch(0.6 0.18 240)', transition: 'width 300ms' }} />
                </div>
                <div className="mono-sm" style={{ marginTop: 6, opacity: 0.7 }}>
                  {Math.round((selected.progress || 0) * 100)}% · eta {Math.max(0, Math.round((selected.etaMs || 0) / 1000))}s
                </div>
              </div>
            )}

            <div className="rule" style={{ margin: '16px 0' }} />
            <div className="col gap-8" style={{ fontSize: 12 }}>
              {selected ? [
                ['Provider', selected.providerId],
                ['Mode', selected.mode],
                ['Prompt', `"${selected.prompt || '—'}"`],
                ['Strength', String(selected.strength ?? '—')],
                ['Seed', String(selected.seed ?? '—')],
                ['Progress', `${Math.round((selected.progress || 0) * 100)}%`],
                ['Duration', selected.durationMs ? (selected.durationMs / 1000).toFixed(2) + 's' : '—'],
              ].map(([k, v]) => (
                <div key={k} className="row between gap-12">
                  <span className="mono-sm" style={{ opacity: 0.55, minWidth: 70 }}>{k}</span>
                  <span style={{ textAlign: 'right' }}>{v}</span>
                </div>
              )) : <div className="mono-sm" style={{ opacity: 0.55 }}>—</div>}
            </div>
            <div className="row gap-8" style={{ marginTop: 16 }}>
              <button className="btn btn-sm btn-solid"
                disabled={!selected || selected.state !== 'done'}
                onClick={() => onNav('editor')}>Use in editor</button>
              <button className="btn btn-sm"
                disabled={!selected}
                onClick={() => selected && provider.retryJob(selected.id)}>Regenerate</button>
              <button className="btn btn-sm"
                disabled={!selected || selected.state !== 'done'}
                onClick={() => selected && exportPostcardPNG({ mode: selected.mode, side: 'front', filename: `london-cuts-result-${selected.id}.png` })}
              >Download</button>
            </div>
          </div>

          <div style={{ padding: 16, border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Quota · mock</div>
            <div className="mono-sm" style={{ opacity: 0.7 }}>{tasks.length * 4} / 500 credits used</div>
            <div style={{ height: 4, background: 'var(--paper-3)', marginTop: 8 }}>
              <div style={{ height: '100%', width: `${Math.min(100, tasks.length * 4 / 5)}%`, background: 'var(--ink)' }} />
            </div>
          </div>
        </div>
      </div>
    </StudioShell>
  );
}

function Publish({ onNav, mode, onMode }) {
  const [visibility, setVisibility] = React.useState('public');
  const [pubMode, setPubMode] = React.useState('fashion');
  return (
    <StudioShell
      screen="publish" onNav={onNav} mode={mode} onMode={onMode}
      title="Publish"
      breadcrumb="A Year in SE1 › Publish"
      actions={<>
        <button className="btn">Save draft</button>
        <button className="btn btn-solid">Publish now</button>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Left: checklist + form */}
        <div>
          <div style={{ padding: 20, border: '1px solid var(--rule)', background: 'var(--paper-2)', marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Pre-flight checks</div>
            {[
              ['All 10 stops have a hero image', true],
              ['All stops have at least one paragraph', true],
              ['Postcards generated for 9 / 10 stops', false, 'Stop 07 missing postcard'],
              ['All media tasks finished', true],
              ['Cover image selected', true],
              ['Author bio complete', true],
            ].map(([label, ok, note]) => (
              <div key={label} className="row between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)', fontSize: 13 }}>
                <span style={{ color: ok ? 'oklch(0.45 0.14 140)' : 'oklch(0.55 0.2 50)', width: 18 }}>{ok ? '✓' : '!'}</span>
                <span className="flex-1">{label}</span>
                {!ok && <span className="mono-sm" style={{ opacity: 0.6 }}>{note}</span>}
              </div>
            ))}
            <button className="btn btn-sm" style={{ marginTop: 12 }}>Generate missing postcard</button>
          </div>

          <div className="col gap-20">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Title</div>
              <input defaultValue="A Year in SE1" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--rule)', fontFamily: 'var(--f-serif)', fontSize: 22 }} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Public URL slug</div>
              <div className="row items-center" style={{ border: '1px solid var(--rule)' }}>
                <span className="mono-sm" style={{ padding: '10px 12px', opacity: 0.6, borderRight: '1px solid var(--rule)' }}>londoncuts.io / ana-ishii /</span>
                <input defaultValue="a-year-in-se1" style={{ flex: 1, padding: '10px 12px', fontFamily: 'var(--f-mono)' }} />
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Visibility</div>
              <div className="row gap-8">
                {[
                  ['public', 'Public · in Atlas'],
                  ['unlisted', 'Unlisted · link only'],
                  ['private', 'Private · just me'],
                ].map(([id, label]) => (
                  <button key={id} onClick={() => setVisibility(id)} className="mono-sm" style={{ padding: '8px 12px', border: `1px solid ${visibility === id ? 'var(--ink)' : 'var(--rule)'}`, background: visibility === id ? 'var(--ink)' : 'transparent', color: visibility === id ? 'var(--paper)' : 'var(--ink)' }}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Default public mode</div>
              <div className="row gap-8">
                {['punk', 'fashion', 'cinema'].map(m => (
                  <button key={m} onClick={() => setPubMode(m)} className="mono-sm" style={{ padding: '8px 12px', border: `1px solid ${pubMode === m ? 'var(--ink)' : 'var(--rule)'}`, background: pubMode === m ? 'var(--ink)' : 'transparent', color: pubMode === m ? 'var(--paper)' : 'var(--ink)' }}>{m[0].toUpperCase() + m.slice(1)}</button>
                ))}
                <span className="mono-sm" style={{ alignSelf: 'center', opacity: 0.55, marginLeft: 8 }}>Readers can still switch modes.</span>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Tags · 3</div>
              <div className="row gap-8 wrap">
                <span className="chip">SE1</span>
                <span className="chip">walking</span>
                <span className="chip">thames</span>
                <button className="chip" style={{ borderStyle: 'dashed' }}>+ add</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: preview */}
        <div>
          <div className="row between items-baseline" style={{ marginBottom: 12 }}>
            <div className="eyebrow">Preview</div>
            <div className="row gap-6">
              <button className="mono-sm chip chip-solid">Desktop</button>
              <button className="mono-sm chip">Mobile</button>
            </div>
          </div>
          <div style={{ border: '1px solid var(--rule)', overflow: 'hidden', background: 'var(--paper-2)' }}>
            <div className="mono-sm" style={{ padding: '8px 12px', background: 'var(--paper-3)', borderBottom: '1px solid var(--rule)' }}>
              londoncuts.io/ana-ishii/a-year-in-se1
            </div>
            <div style={{ padding: 24, background: pubMode === 'cinema' ? 'oklch(0.12 0.015 250)' : pubMode === 'punk' ? 'oklch(0.97 0 0)' : 'oklch(0.98 0.008 75)', color: pubMode === 'cinema' ? 'oklch(0.92 0.01 80)' : 'oklch(0.15 0 0)' }}>
              <div className="mono-sm" style={{ opacity: 0.6 }}>ED. 01 · SE1 · 10 STOPS</div>
              <div style={{ fontFamily: pubMode === 'punk' ? 'var(--f-display)' : pubMode === 'cinema' ? 'var(--f-serif)' : 'var(--f-fashion)', fontSize: 48, lineHeight: 1, marginTop: 12, fontStyle: pubMode === 'fashion' ? 'italic' : 'normal', textTransform: pubMode === 'punk' ? 'uppercase' : 'none' }}>A Year in SE1</div>
              <div style={{ marginTop: 16 }}>
                <Img label="COVER" tone={pubMode === 'cinema' ? 'dark' : pubMode === 'punk' ? 'punk' : 'warm'} ratio="3/2" />
              </div>
              <div style={{ marginTop: 16, fontSize: 14 }}>Ten walks between Bermondsey and Waterloo, 2025–2026.</div>
            </div>
          </div>
          <div className="mono-sm" style={{ opacity: 0.55, marginTop: 10 }}>Preview updates as you change settings.</div>
        </div>
      </div>
    </StudioShell>
  );
}

Object.assign(window, { StoryEditor, MediaPanel, Publish });
