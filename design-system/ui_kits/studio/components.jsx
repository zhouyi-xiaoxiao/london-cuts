// components.jsx — atoms for the London Cuts studio kit

function Roundel({ xl }) {
  return <span className={xl ? 'roundel roundel-xl' : 'roundel'} />;
}

function Eyebrow({ children, style }) {
  return <div className="eyebrow" style={style}>{children}</div>;
}

function Chip({ children, solid, style, onClick }) {
  return <span className={solid ? 'chip chip-solid' : 'chip'} style={style} onClick={onClick}>{children}</span>;
}

function Button({ children, solid, sm, onClick, title, style }) {
  const cls = ['btn', solid ? 'btn-solid' : '', sm ? 'btn-sm' : ''].filter(Boolean).join(' ');
  return <button className={cls} onClick={onClick} title={title} style={style}>{children}</button>;
}

function MetaRow({ items, style }) {
  return (
    <div className="row gap-16" style={{ padding: '10px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', flexWrap: 'wrap', ...(style||{}) }}>
      {items.map((v, i) => <span key={i} className="mono" style={{ opacity: 0.75 }}>{v}</span>)}
    </div>
  );
}

function Img({ src, label, ratio = '16/9', tone, style }) {
  if (src) {
    return <img src={src} alt="" style={{ width: '100%', aspectRatio: ratio, objectFit: 'cover', display: 'block', border: '1px solid var(--rule)', ...(style||{}) }} />;
  }
  return (
    <div className="img-ph" data-tone={tone} style={{ width: '100%', aspectRatio: ratio, ...(style||{}) }}>
      {label && <span className="ph-cap">{label}</span>}
    </div>
  );
}

function ProgressPips({ states }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {states.map((s, i) => <span key={i} className="pip" data-done={s === 'done' ? 'true' : undefined} data-running={s === 'running' ? 'true' : undefined} />)}
    </span>
  );
}

function ModePill({ mode, onMode }) {
  const modes = ['punk', 'fashion', 'cinema'];
  return (
    <div className="mode-pill">
      {modes.map(m => (
        <button key={m} data-active={m === mode ? 'true' : undefined} onClick={() => onMode(m)}>{m}</button>
      ))}
    </div>
  );
}

function TopBar({ title, left, right }) {
  return (
    <div className="topbar">
      <div className="row items-center gap-16">
        <Roundel />
        <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15 }}>{title}</div>
        {left}
      </div>
      <div className="row items-center gap-12">{right}</div>
    </div>
  );
}

function SpineRow({ n, title, time, active, done, running, onClick }) {
  return (
    <div className="spine-row" data-active={active ? 'true' : undefined} onClick={onClick}>
      <span className="num">{n}</span>
      <div className="col gap-4">
        <div className="title">{title || <span style={{ opacity: 0.45 }}>Untitled stop</span>}</div>
        <ProgressPips states={[done ? 'done' : 'empty', done ? 'done' : 'empty', running ? 'running' : (done ? 'done' : 'empty'), done ? 'done' : 'empty']} />
      </div>
      {time && <span className="time">{time}</span>}
    </div>
  );
}

function DrawerTabs({ tab, onTab, counts }) {
  const tabs = [['assets', 'Assets', counts.assets], ['tasks', 'Tasks', counts.tasks], ['info', 'Info']];
  return (
    <div className="drawer-tabs">
      {tabs.map(([id, label, count]) => (
        <button key={id} className="drawer-tab" data-active={tab === id ? 'true' : undefined} onClick={() => onTab(id)}>
          {label}{count != null ? ` · ${count}` : ''}
        </button>
      ))}
    </div>
  );
}

function AtlasMarker({ n, onClick }) {
  return <span className="atlas-marker" onClick={onClick}>{n}</span>;
}

Object.assign(window, { Roundel, Eyebrow, Chip, Button, MetaRow, Img, ProgressPips, ModePill, TopBar, SpineRow, DrawerTabs, AtlasMarker });
