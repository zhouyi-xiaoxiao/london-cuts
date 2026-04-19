// screens.jsx — high-level screens for the kit

const SEED = {
  project: { title: 'A Year in SE1', subtitle: 'Twelve walks between Bermondsey and Waterloo, 2025–2026', author: 'Ada Mensah' },
  stops: [
    { n: '01', title: 'First light at Tower Bridge', time: '06:42', meta: 'SE1 2UP · AMBER', img: 'seed-tower-bridge.jpg', done: true },
    { n: '02', title: 'Borough Market at opening', time: '07:58', meta: 'SE1 9AL · STEEL', img: 'seed-borough-market.jpg', done: true },
    { n: '03', title: 'A pub off Southwark Street', time: '09:15', meta: 'SE1 1TE · EMBER', img: 'seed-market-detail.jpg', done: true },
    { n: '04', title: 'The Shard, looking up', time: '11:04', meta: 'SE1 9SG · STEEL', img: 'seed-shard.jpg', done: true },
    { n: '05', title: 'Waterloo bridge, facing east', time: '17:19', meta: 'SE1 8XX · DUSK', img: 'seed-waterloo-bridge.jpg', done: true, active: true },
    { n: '06', title: 'The National Theatre façade', time: '19:02', meta: 'SE1 9PX · CONCRETE', img: 'seed-national-theatre.jpg', done: true, running: true },
    { n: '07', title: 'A pub off Southwark Street', time: '20:15', meta: 'SE1 1TE · NEON', img: 'seed-night-neon.jpg', done: false },
    { n: '08', title: 'The walk home', time: '22:48', meta: 'SE1 · SILVER', img: 'seed-thames.jpg', done: false },
    { n: '09', title: 'Bermondsey Street, Sunday', time: '—', meta: '—', img: 'seed-bermondsey.jpg', done: false },
    { n: '10', title: '', time: '—', meta: '—', img: null, done: false },
    { n: '11', title: '', time: '—', meta: '—', img: null, done: false },
    { n: '12', title: '', time: '—', meta: '—', img: null, done: false },
  ],
};

const ASSETS = '../../assets/';

function ProjectsScreen({ onOpen }) {
  return (
    <div style={{ minHeight: '100vh' }} data-mode="fashion">
      <TopBar
        title="London Cuts Studio"
        left={<span className="mono-sm" style={{ opacity: 0.5 }}>{SEED.project.author}</span>}
        right={<>
          <Button sm>📁 New from photos</Button>
          <Button sm>? Demo</Button>
          <Button sm solid onClick={onOpen}>+ New project</Button>
        </>}
      />
      <div style={{ padding: '48px 40px', maxWidth: 1680, margin: '0 auto' }}>
        <div className="row between items-end" style={{ marginBottom: 32 }}>
          <div>
            <Eyebrow>Studio</Eyebrow>
            <h1 style={{ fontFamily: 'var(--f-fashion)', fontSize: 72, fontStyle: 'italic', lineHeight: 1, marginTop: 8, letterSpacing: '-0.02em' }}>Your work.</h1>
            <div className="mono-sm" style={{ marginTop: 10, opacity: 0.55, maxWidth: 560 }}>
              3 projects · click any card to switch. Loading a demo archives the current one so nothing is lost.
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          <ProjectCard isCurrent onClick={onOpen} title="A Year in SE1" subtitle="Twelve walks between Bermondsey and Waterloo, 2025–2026" cover={ASSETS + 'seed-waterloo-bridge.jpg'} stops={12} done={8} mode="fashion" />
          <ProjectCard title="Last trains out of Waterloo" subtitle="A zine in twelve stops" cover={ASSETS + 'seed-night-neon.jpg'} stops={9} done={9} mode="punk" published="14 APR 2026" />
          <ProjectCard title="Six Minutes of Gold" subtitle="Evenings walked east, October–December" cover={ASSETS + 'seed-golden-hour.jpg'} stops={6} done={4} mode="cinema" archived="02 MAR 2026" />
          <ProjectCard title="Bermondsey, untitled" cover={ASSETS + 'seed-bermondsey.jpg'} stops={3} done={1} mode="fashion" archived="18 JAN 2026" />
        </div>
        <div style={{ marginTop: 56 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Activity</Eyebrow>
          <div className="col" style={{ fontSize: 13 }}>
            {[['NOW', '8/12 stops ready · 2 need a hero'], ['TODAY', '47 assets in pool · 3 archived projects'], ['YESTERDAY', 'Default mode: fashion'], ['2 DAYS AGO', 'Published "Brick Lane after rain"']].map(([t, m], i) => (
              <div key={i} className="row gap-24" style={{ padding: '10px 0', borderBottom: '1px dashed var(--rule)' }}>
                <span className="mono-sm" style={{ opacity: 0.55, width: 100 }}>{t}</span><span>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ isCurrent, title, subtitle, cover, stops, done, mode, published, archived, onClick }) {
  const pct = Math.round(100 * done / stops);
  return (
    <div className="proj-card" onClick={onClick}>
      <Img src={cover} />
      <div className="row between items-baseline" style={{ marginTop: 16, gap: 8 }}>
        <div style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 24, lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <Chip solid style={published ? { opacity: 0.75 } : undefined}>{isCurrent ? 'CURRENT' : (published ? 'LIVE' : 'DRAFT')}</Chip>
      </div>
      {subtitle && <div style={{ marginTop: 6, fontSize: 13, opacity: 0.7, fontFamily: 'var(--f-fashion)', fontStyle: 'italic' }}>{subtitle}</div>}
      <div className="mono-sm" style={{ marginTop: 10, opacity: 0.65 }}>
        {stops} STOPS · {done}/{stops} READY · {mode.toUpperCase()}{published && ` · PUBLISHED ${published}`}
      </div>
      {archived && <div className="mono-sm" style={{ marginTop: 2, opacity: 0.45 }}>ARCHIVED {archived}</div>}
      <div className="proj-progress"><div style={{ width: pct + '%' }} /></div>
    </div>
  );
}

function WorkspaceScreen({ onBack, onPostcard, onPublic }) {
  const [activeN, setActiveN] = React.useState('05');
  const [drawerTab, setDrawerTab] = React.useState('assets');
  const active = SEED.stops.find(s => s.n === activeN) || SEED.stops[4];
  const [body, setBody] = React.useState("The river is the only thing in London that tells the time. Everything else lies — the sky, the lamps on the embankment, the hour on your phone — but the Thames knows exactly where the sun is.\n\nI walked onto Waterloo Bridge at seventeen past five. Six minutes of gold, then nothing.");
  return (
    <div data-mode="fashion" style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: '60px 1fr' }}>
      <TopBar title="A Year in SE1" left={<span className="mono-sm" style={{ opacity: 0.5 }}>· 8/12 ready</span>} right={<>
        <Button sm onClick={onBack}>← Projects</Button>
        <Button sm onClick={onPublic}>Public view ↗</Button>
        <Button sm solid>Publish →</Button>
      </>} />
      <div style={{ display: 'grid', gridTemplateColumns: '288px 1fr 340px', minHeight: 0 }}>
        <div className="spine">
          <div style={{ padding: '0 18px 12px' }}><Eyebrow>Stops · {SEED.stops.filter(s => s.done).length}/{SEED.stops.length}</Eyebrow></div>
          {SEED.stops.map(s => <SpineRow key={s.n} {...s} active={s.n === activeN} onClick={() => setActiveN(s.n)} />)}
        </div>
        <div style={{ overflowY: 'auto', padding: '28px 40px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div className="row between items-end" style={{ marginBottom: 18 }}>
              <div>
                <Eyebrow>Stop {active.n} · {active.meta}</Eyebrow>
                <h2 style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 44, lineHeight: 1.05, marginTop: 6, letterSpacing: '-0.015em' }}>{active.title}</h2>
              </div>
              <div className="row gap-8">
                <Button sm>↻ Re-analyze</Button>
                <Button sm onClick={onPostcard}>Postcard →</Button>
              </div>
            </div>
            <Img src={active.img ? ASSETS + active.img : null} label={active.meta} tone="warm" />
            <MetaRow items={[active.time, '28 OCT 2025', '8°C · SW', 'DUSK']} style={{ margin: '14px 0 24px' }} />
            <Eyebrow style={{ marginBottom: 10 }}>Body</Eyebrow>
            <textarea className="textarea" rows={6} value={body} onChange={e => setBody(e.target.value)} />
            <div style={{ marginTop: 28 }}>
              <Eyebrow style={{ marginBottom: 10 }}>Pull quote</Eyebrow>
              <blockquote style={{ margin: 0, padding: '4px 0 4px 16px', borderLeft: '3px solid var(--mode-accent)', fontFamily: 'var(--f-display)', fontSize: 24, lineHeight: 1.2 }}>Six minutes of gold, then nothing.</blockquote>
            </div>
            <div style={{ marginTop: 28 }}>
              <Eyebrow style={{ marginBottom: 10 }}>Asset strip</Eyebrow>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                {['seed-waterloo-bridge.jpg', 'seed-thames.jpg', 'seed-southbank.jpg', 'seed-tate.jpg', 'seed-night-neon.jpg', 'seed-golden-hour.jpg'].map((s, i) => (
                  <img key={i} src={ASSETS + s} style={{ width: 72, height: 72, objectFit: 'cover', border: '1px solid var(--rule)', flexShrink: 0 }} />
                ))}
                <div className="img-ph" style={{ width: 72, height: 72, flexShrink: 0 }}><span className="ph-cap" style={{ margin: 4, fontSize: 7 }}>DROP</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="drawer">
          <DrawerTabs tab={drawerTab} onTab={setDrawerTab} counts={{ assets: 47, tasks: 3 }} />
          <div style={{ padding: 20 }}>
            {drawerTab === 'assets' && <DrawerAssets />}
            {drawerTab === 'tasks' && <DrawerTasks />}
            {drawerTab === 'info' && <DrawerInfo />}
          </div>
        </div>
      </div>
    </div>
  );
}

function DrawerAssets() {
  const imgs = ['seed-waterloo-bridge.jpg','seed-thames.jpg','seed-shard.jpg','seed-tower-bridge.jpg','seed-tate.jpg','seed-borough-market.jpg','seed-night-neon.jpg','seed-southbank.jpg'];
  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>47 assets · 6 styled</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
        {imgs.map((s, i) => <img key={i} src={ASSETS + s} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', border: '1px solid var(--rule)' }} />)}
      </div>
    </div>
  );
}

function DrawerTasks() {
  const tasks = [{ t: 'Analyze photos', s: 'done', n: '17 / 17' }, { t: 'Pre-generate postcards', s: 'running', n: '42 / 72' }, { t: 'Body draft · stop 07', s: 'queued', n: '—' }];
  return (
    <div className="col gap-12">
      {tasks.map((t, i) => (
        <div key={i} className="col gap-4" style={{ paddingBottom: 10, borderBottom: '1px solid var(--rule)' }}>
          <div className="row between items-baseline"><span style={{ fontSize: 13 }}>{t.t}</span><span className="mono-sm" style={{ opacity: 0.6 }}>{t.n}</span></div>
          <div className="row gap-8 items-center"><span className="pip" data-done={t.s === 'done' ? 'true' : undefined} data-running={t.s === 'running' ? 'true' : undefined} /><span className="mono-sm" style={{ opacity: 0.6 }}>{t.s}</span></div>
        </div>
      ))}
    </div>
  );
}

function DrawerInfo() {
  return (
    <div className="col gap-12">
      <div><Eyebrow>Project</Eyebrow><div style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 22, marginTop: 4 }}>A Year in SE1</div></div>
      <div><Eyebrow>Area</Eyebrow><div className="mono">SE1 · SOUTHWARK</div></div>
      <div><Eyebrow>Default mode</Eyebrow><div className="mono">FASHION</div></div>
      <div><Eyebrow>Visibility</Eyebrow><div className="mono">DRAFT · UNLISTED</div></div>
    </div>
  );
}

function PostcardScreen({ onBack }) {
  const [flipped, setFlipped] = React.useState(false);
  const [style, setStyle] = React.useState('photo');
  const styles = [['photo','🖼️','PHOTO'],['riso','🟥','RISO'],['poster','🗺️','POSTER'],['paint','🎨','PAINT'],['ink','🖋️','INK'],['bloom','🌸','BLOOM']];
  const filter = style === 'riso' ? 'contrast(1.3) saturate(2) hue-rotate(-10deg)' : style === 'poster' ? 'contrast(1.4) saturate(1.6)' : style === 'ink' ? 'grayscale(1) contrast(1.5)' : style === 'paint' ? 'contrast(0.85) saturate(1.3) blur(0.3px)' : style === 'bloom' ? 'saturate(1.5) brightness(1.1)' : 'none';
  return (
    <div data-mode="fashion" style={{ minHeight: '100vh' }}>
      <TopBar title="Postcard · Stop 05" right={<>
        <Button sm onClick={onBack}>← Workspace</Button>
        <Button sm onClick={() => setFlipped(f => !f)}>Flip ↻</Button>
        <Button sm solid>Done →</Button>
      </>} />
      <div style={{ padding: '48px 40px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, maxWidth: 1280, margin: '0 auto' }}>
        <div className="col" style={{ alignItems: 'center' }}>
          <div className="pc-wrap">
            <div className="pc" data-flip={flipped ? 'true' : undefined}>
              <div className="pc-face">
                <img src={ASSETS + 'seed-waterloo-bridge.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter }} />
                <div className="cap" style={{ left: 12, top: 12 }}>WATERLOO BR · DUSK</div>
                <div className="cap" style={{ right: 12, bottom: 12 }}>ED.01 · 05/12</div>
              </div>
              <div className="pc-face pc-back">
                <div style={{ padding: '18px 20px', fontFamily: 'var(--f-hand)', fontSize: 22, lineHeight: 1.35, borderRight: '1px dashed var(--rule)' }}>M — walked home across Waterloo last night. The river caught. Thought of you in Lisbon. Six minutes of gold, then nothing.<br />— A.</div>
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
                  {['Matteo Ricci', 'Rua das Flores 28', '1200-195 Lisboa', 'Portugal'].map((l, i) => (
                    <div key={i} style={{ fontFamily: 'var(--f-body)', fontSize: 13, borderBottom: '1px solid var(--rule)', paddingBottom: 2 }}>{l}</div>
                  ))}
                  <div className="mono-sm" style={{ marginTop: 8, opacity: 0.55 }}>ED.01 · 05/12</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mono-sm" style={{ marginTop: 14, opacity: 0.6 }}>{flipped ? 'BACK' : 'FRONT'} · click flip to turn</div>
        </div>
        <div className="col gap-24">
          <div>
            <Eyebrow>Style</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
              {styles.map(([id, icon, label]) => (
                <button key={id} onClick={() => setStyle(id)} style={{ border: '1px solid ' + (style === id ? 'var(--ink)' : 'var(--rule)'), padding: '10px 8px', background: style === id ? 'var(--ink)' : 'transparent', color: style === id ? 'var(--paper)' : 'var(--ink)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>{icon}</span><span className="mono-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Eyebrow>Message</Eyebrow>
            <textarea className="textarea" rows={6} defaultValue="M — walked home across Waterloo last night. The river caught. Six minutes of gold, then nothing. — A." style={{ fontFamily: 'var(--f-hand)', fontSize: 18, lineHeight: 1.4 }} />
          </div>
          <div><Eyebrow>Send to</Eyebrow><input className="input" defaultValue="Matteo Ricci · Rua das Flores 28 · Lisboa" /></div>
          <Button solid>⚡ Regenerate style</Button>
        </div>
      </div>
    </div>
  );
}

function PublicScreen({ onBack }) {
  const [mode, setMode] = React.useState('fashion');
  return (
    <div data-mode={mode} style={{ minHeight: '100vh' }}>
      <div className="topbar">
        <div className="row items-center gap-16">
          <Roundel />
          <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15 }}>London Cuts</div>
          <span className="mono-sm" style={{ opacity: 0.5 }}>· Ada Mensah</span>
        </div>
        <div className="row items-center gap-12">
          <ModePill mode={mode} onMode={setMode} />
          <Button sm onClick={onBack}>← Studio</Button>
        </div>
      </div>
      {mode === 'punk' ? <PublicPunk /> : mode === 'cinema' ? <PublicCinema /> : <PublicFashion />}
    </div>
  );
}

function PublicFashion() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 40px' }}>
      <Eyebrow>SE1 · 2025–2026</Eyebrow>
      <h1 style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 96, lineHeight: 0.95, marginTop: 12, letterSpacing: '-0.02em' }}>A Year in<br />SE1.</h1>
      <div style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 20, opacity: 0.7, marginTop: 16, maxWidth: 560 }}>Twelve walks between Bermondsey and Waterloo, hour by hour, across one winter and the spring that followed.</div>
      <MetaRow items={['ADA MENSAH', '12 STOPS', 'PUBLISHED 14 APR 2026', '2,400 WORDS']} style={{ margin: '32px 0 48px' }} />
      <Atlas />
      <StopSample />
    </div>
  );
}

function PublicPunk() {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ transform: 'rotate(-1.5deg)' }}>
        <h1 style={{ fontFamily: 'var(--f-punk)', fontSize: 140, lineHeight: 0.82, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>A Year<br />In SE1.</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32, alignItems: 'start' }}>
        <div style={{ border: '2px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)' }}>
          <img src={ASSETS + 'seed-night-neon.jpg'} style={{ width: '100%', display: 'block', filter: 'contrast(1.4) grayscale(0.3)' }} />
        </div>
        <div>
          <MetaRow items={['ADA MENSAH', '12 STOPS', 'LIVE']} />
          <div style={{ fontFamily: 'var(--f-body)', fontSize: 17, lineHeight: 1.55, marginTop: 16 }}>Twelve walks between Bermondsey and Waterloo. Hour by hour. No dead time.</div>
          <div style={{ marginTop: 16, transform: 'rotate(1deg)', display: 'inline-block', background: 'var(--mode-accent)', color: '#fff', padding: '8px 14px', fontFamily: 'var(--f-punk)', fontSize: 20 }}>LAST TRAINS OUT</div>
        </div>
      </div>
      <Atlas />
    </div>
  );
}

function PublicCinema() {
  return (
    <div>
      <div style={{ padding: '48px 40px 0', maxWidth: 1280, margin: '0 auto' }}>
        <Eyebrow style={{ color: 'var(--mode-accent)', opacity: 1 }}>SE1 · 2025–2026</Eyebrow>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 84, lineHeight: 1, marginTop: 12, letterSpacing: '-0.01em' }}>A Year in SE1.</h1>
      </div>
      <div style={{ position: 'relative', maxWidth: 1680, margin: '32px auto 0', padding: '0 40px' }}>
        <div style={{ position: 'relative', aspectRatio: '21/9', overflow: 'hidden' }}>
          <img src={ASSETS + 'seed-waterloo-bridge.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75) saturate(0.85)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0.35) 0, transparent 25%, transparent 75%, rgba(0,0,0,0.55) 100%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 24, textAlign: 'center', fontFamily: 'var(--f-mono)', fontSize: 15, letterSpacing: '0.08em', color: 'var(--mode-accent)' }}>THE RIVER IS THE ONLY THING IN LONDON THAT TELLS THE TIME.</div>
        </div>
      </div>
      <div style={{ maxWidth: 880, margin: '48px auto', padding: '0 40px' }}>
        <MetaRow items={['ADA MENSAH', '12 STOPS', '2,400 WORDS', 'PUBLISHED 14 APR 2026']} />
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: 13, lineHeight: 1.8, marginTop: 28, letterSpacing: '0.01em' }}>I walked onto Waterloo Bridge at seventeen past five. The sky had already started. Six minutes of gold, then nothing.</p>
        <Atlas />
      </div>
    </div>
  );
}

function Atlas() {
  const markers = [{ n: '01', x: 18, y: 62 }, { n: '02', x: 32, y: 48 }, { n: '05', x: 50, y: 38 }, { n: '06', x: 58, y: 46 }, { n: '08', x: 72, y: 30 }, { n: '10', x: 82, y: 60 }];
  return (
    <div style={{ position: 'relative', height: 340, border: '1px solid var(--rule)', marginTop: 40, background: 'var(--paper-2)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 79px, var(--rule) 79px, var(--rule) 80px), repeating-linear-gradient(0deg, transparent 0, transparent 79px, var(--rule) 79px, var(--rule) 80px)', opacity: 0.6 }} />
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M 0 32 Q 20 30, 35 28 T 68 24 T 100 18" stroke="var(--mode-accent)" strokeWidth="0.4" fill="none" opacity="0.6" />
      </svg>
      {markers.map(m => (
        <div key={m.n} style={{ position: 'absolute', left: m.x + '%', top: m.y + '%', transform: 'translate(-50%, -50%)' }}>
          <AtlasMarker n={m.n} />
        </div>
      ))}
      <div className="cap" style={{ left: 12, top: 12 }}>SE1 · 12 STOPS</div>
    </div>
  );
}

function StopSample() {
  return (
    <article style={{ maxWidth: 780, margin: '64px auto 0' }}>
      <Eyebrow>Stop 05 · SE1 8XX · DUSK</Eyebrow>
      <h2 style={{ fontFamily: 'var(--f-fashion)', fontStyle: 'italic', fontSize: 56, lineHeight: 1.05, marginTop: 6, letterSpacing: '-0.015em' }}>Waterloo bridge, facing east</h2>
      <MetaRow items={['17:19', '28 OCT 2025', '8°C · SW']} style={{ margin: '18px 0 24px' }} />
      <Img src={ASSETS + 'seed-waterloo-bridge.jpg'} ratio="3/2" />
      <p style={{ fontSize: 17, lineHeight: 1.7, marginTop: 24 }}>The river is the only thing in London that tells the time. Everything else lies — the sky, the lamps on the embankment, the hour on your phone — but the Thames knows exactly where the sun is.</p>
      <blockquote style={{ margin: '24px 0', padding: '4px 0 4px 16px', borderLeft: '3px solid var(--mode-accent)', fontFamily: 'var(--f-display)', fontSize: 28, lineHeight: 1.2 }}>Six minutes of gold, then nothing.</blockquote>
      <p style={{ fontSize: 17, lineHeight: 1.7 }}>I walked onto Waterloo Bridge at seventeen past five. The sky had already started, quietly — behind me, somewhere over Lambeth — and the Thames was catching it in pieces.</p>
    </article>
  );
}

Object.assign(window, { ProjectsScreen, WorkspaceScreen, PostcardScreen, PublicScreen });
