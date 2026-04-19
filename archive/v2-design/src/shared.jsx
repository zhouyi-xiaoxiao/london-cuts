// shared.jsx — V2 shared UI primitives.
// Reuses V1 Img + Roundel + ModeSwitcher conventions.

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

function Roundel({ label, size = 'md', style = {} }) {
  const cls = size === 'xl' ? 'roundel roundel-xl' : 'roundel';
  return <span className={cls} style={style} aria-label={label} />;
}

// Top-bar mode pill (V2 styling: squared, on the workspace top bar).
function ModePill({ mode, onMode }) {
  const modes = [
    { id: 'punk', label: 'Punk' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'cinema', label: 'Cinema' },
  ];
  return (
    <div className="mode-pill">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => onMode(m.id)}
          data-active={mode === m.id}
        >{m.label}</button>
      ))}
    </div>
  );
}

// Progress pips — 4 dots per stop row: upload / hero / body / media.
// Running media is indicated by animation.
function Pips({ status }) {
  return (
    <span className="pip-group" aria-label="stop progress">
      <span className="pip" data-done={!!status.upload} title="upload" />
      <span className="pip" data-done={!!status.hero}   title="hero" />
      <span className="pip" data-done={!!status.body}   title="body" />
      <span className="pip"
            data-done={status.media === 'done'}
            data-running={status.media === 'running'}
            title="media" />
    </span>
  );
}

function Annot({ dir = 'left', style = {}, children }) {
  return (
    <div className="annot" data-dir={dir} style={style}>{children}</div>
  );
}

// A fake cursor caret for "editable" demos (static)
function Caret() {
  return (
    <span style={{
      display: 'inline-block', width: 1.5, height: '1em',
      background: 'var(--mode-accent)', verticalAlign: 'text-top',
      marginLeft: 1,
      animation: 'lc-caret 1s step-end infinite',
    }} />
  );
}

// Document frame caption — "FIG 3a — Fashion workspace, stop selected"
function FigCap({ n, text }) {
  return (
    <div className="frame-caption">
      <span style={{ opacity: 0.55 }}>FIG {n} — </span>{text}
    </div>
  );
}

// A small icon primitive for drawer tabs (2-char monogram). No svg icons.
function TabGlyph({ char }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 16, height: 16,
      border: '1px solid currentColor',
      marginRight: 8,
      fontFamily: 'var(--f-mono)', fontSize: 9,
      textAlign: 'center', lineHeight: '14px',
    }}>{char}</span>
  );
}

Object.assign(window, { Img, Roundel, ModePill, Pips, Annot, Caret, FigCap, TabGlyph });

// Inject caret keyframe once.
(function injectCaret() {
  if (document.getElementById('lc-caret-kf')) return;
  const s = document.createElement('style');
  s.id = 'lc-caret-kf';
  s.textContent = '@keyframes lc-caret { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }';
  document.head.appendChild(s);
})();
