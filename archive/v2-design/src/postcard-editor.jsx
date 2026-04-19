// postcard-editor.jsx — Postcard with editable message + recipient.
// All three modes share state; per-mode treatments for view ↔ edit.

function PostcardEditor({ mode, onMode, onClose }) {
  const [flipped, setFlipped] = React.useState(true);  // show back (message/recipient) by default
  const [editing, setEditing] = React.useState(null);  // 'message' | 'recipient' | null
  const [message, setMessage] = React.useState(POSTCARD_05.message);
  const [recipient, setRecipient] = React.useState(POSTCARD_05.recipient);

  return (
    <div className="page" data-mode={mode}>
      <div className="ws-topbar">
        <div className="row items-center gap-16">
          <button className="mono-sm" onClick={onClose} style={{ opacity: 0.6 }}>← Back to workspace</button>
          <Roundel />
          <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15 }}>Postcard · Stop 05 · Waterloo Bridge</div>
        </div>
        <div className="row items-center gap-16">
          <ModePill mode={mode} onMode={onMode} />
          <button className="btn" onClick={() => setFlipped(f => !f)}>Flip ↻</button>
          <button className="btn btn-solid">Render new version →</button>
        </div>
      </div>

      <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 32, maxWidth: 1680, margin: '0 auto' }}>
        <div style={{ padding: 48, background: 'oklch(from currentColor l c h / 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 620 }}>
          <div style={{ perspective: 2000, width: '100%', maxWidth: 720 }}>
            <div style={{
              position: 'relative', width: '100%', aspectRatio: '7/5',
              transformStyle: 'preserve-3d',
              transition: 'transform 700ms cubic-bezier(0.2,0.8,0.3,1)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}>
                <PostcardFrontView mode={mode} />
              </div>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}>
                <PostcardBackEditor
                  mode={mode}
                  editing={editing} setEditing={setEditing}
                  message={message} setMessage={setMessage}
                  recipient={recipient} setRecipient={setRecipient}
                />
              </div>
            </div>
            <div className="row center gap-8" style={{ marginTop: 16 }}>
              <span className="mono-sm" style={{ opacity: 0.6 }}>{flipped ? 'BACK — click to edit' : 'FRONT'}</span>
              <span className="mono-sm" style={{ opacity: 0.3 }}>·</span>
              <span className="mono-sm" style={{ opacity: 0.6 }}>148 × 105 mm · Ed.01 / 05 of 12</span>
            </div>
          </div>
        </div>

        <div className="col gap-24">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Message</div>
            <div className="mono-sm" style={{ opacity: 0.65, lineHeight: 1.6 }}>
              Handwriting field (Caveat). Max ~280 chars — wraps naturally; we keep a slight
              baseline jitter so it still reads as handwritten, not typeset.
            </div>
            <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => { setFlipped(true); setEditing('message'); }}>
              Edit message
            </button>
          </div>
          <div className="rule" />
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Recipient</div>
            <div className="mono-sm" style={{ opacity: 0.65, lineHeight: 1.6 }}>
              Name · two address lines · country. Each field is its own ruled row — looks like an
              address, not a form.
            </div>
            <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => { setFlipped(true); setEditing('recipient'); }}>
              Edit recipient
            </button>
          </div>
          <div className="rule" />
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Edit-state grammar</div>
            <div className="mono-sm" style={{ opacity: 0.7, lineHeight: 1.6 }}>
              {mode === 'punk'    && 'Taped label above each field. Dashed red-orange outline. Tilt preserved.'}
              {mode === 'fashion' && 'Inline — field blends with the card. Oxblood underline marks active.'}
              {mode === 'cinema'  && 'Slate frame darkens around the field. Subtitle-yellow outline.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// View-side (front) — uses the full PostcardFront look.
function PostcardFrontView({ mode }) {
  if (mode === 'punk') {
    return (
      <div style={{ width: '100%', height: '100%', background: 'black', position: 'relative', overflow: 'hidden' }}>
        <Img label="WATERLOO · DUSK" tone="punk" style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', height: '100%' }} />
        <div style={{ position: 'absolute', top: 20, left: 20, background: 'oklch(0.62 0.24 25)', color: 'white', padding: '6px 10px', fontFamily: 'var(--f-display)', fontSize: 20, transform: 'rotate(-3deg)' }}>SE1!!</div>
        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, fontFamily: 'var(--f-display)', fontSize: 56, color: 'white', textTransform: 'uppercase', lineHeight: 0.9, textShadow: '3px 3px 0 oklch(0.62 0.24 25)' }}>
          Greetings<br/>from<br/>Waterloo
        </div>
      </div>
    );
  }
  if (mode === 'cinema') {
    return (
      <div style={{ width: '100%', height: '100%', background: 'oklch(0.1 0.015 250)', position: 'relative', overflow: 'hidden' }}>
        <Img label="WATERLOO · 17:19 · DUSK" tone="dark" style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', height: '100%' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: 'black' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'black' }} />
        <div style={{ position: 'absolute', bottom: 56, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.5)', padding: '6px 14px', fontFamily: 'var(--f-mono)', fontSize: 13, color: 'oklch(0.88 0.14 90)' }}>
            — Six minutes of gold, then nothing.
          </div>
        </div>
        <div style={{ position: 'absolute', top: 50, left: 20, fontFamily: 'var(--f-mono)', fontSize: 10, color: 'oklch(0.88 0.14 90)', letterSpacing: '0.2em' }}>
          SE1 · SCENE 05 · 17:19
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: '100%', background: 'oklch(0.98 0.008 75)', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '2fr 3fr' }}>
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="mono-sm" style={{ letterSpacing: '0.3em' }}>LONDON · SE1</div>
        <div>
          <div style={{ fontFamily: 'var(--f-fashion)', fontSize: 48, fontStyle: 'italic', lineHeight: 1, color: 'oklch(0.2 0.02 40)' }}>
            Waterloo<br/><em style={{ fontWeight: 300 }}>Bridge</em>
          </div>
          <div className="mono-sm" style={{ marginTop: 16, opacity: 0.6 }}>ED. 01 / 05 OF 12</div>
        </div>
      </div>
      <Img label="BRIDGE · EAST · 17:19" tone="warm" style={{ height: '100%', aspectRatio: 'auto' }} />
    </div>
  );
}

// Back-side editor — message + recipient become editable in place.
function PostcardBackEditor({ mode, editing, setEditing, message, setMessage, recipient, setRecipient }) {
  const msgStyle = {
    fontFamily: 'var(--f-hand)', fontSize: 22, lineHeight: 1.5,
    color: 'oklch(0.25 0.02 240)',
    width: '100%',
    minHeight: 140,
    resize: 'none',
    background: 'transparent',
  };
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'oklch(0.96 0.008 60)',
      color: 'oklch(0.15 0.008 60)',
      padding: 32,
      display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24,
      fontFamily: 'var(--f-mono)',
    }}>
      <div
        className="editable"
        data-editing={editing === 'message'}
        data-edit-label="MESSAGE — handwritten"
        style={{ borderRight: '1px solid oklch(0.8 0.008 60)', paddingRight: 24 }}
        onClick={() => setEditing('message')}
      >
        {editing === 'message' ? (
          <textarea
            autoFocus
            value={message}
            onChange={e => setMessage(e.target.value)}
            onBlur={() => setEditing(null)}
            style={msgStyle}
          />
        ) : (
          <div style={{ fontFamily: 'var(--f-hand)', fontSize: 22, lineHeight: 1.5, color: 'oklch(0.25 0.02 240)', whiteSpace: 'pre-wrap' }}>
            {message}
          </div>
        )}
      </div>

      <div
        className="editable"
        data-editing={editing === 'recipient'}
        data-edit-label="RECIPIENT"
        onClick={() => setEditing('recipient')}
      >
        <div className="mono-sm" style={{ letterSpacing: '0.25em', marginBottom: 12 }}>LONDON CUTS · ED.01 / 05</div>
        {['name', 'line1', 'line2', 'country'].map(k => (
          <div key={k} style={{ borderBottom: '1px solid oklch(0.4 0.008 60)', padding: '4px 0', fontSize: 12 }}>
            {editing === 'recipient' ? (
              <input
                value={recipient[k]}
                onChange={e => setRecipient({ ...recipient, [k]: e.target.value })}
                onBlur={() => setEditing(null)}
                autoFocus={k === 'name'}
                style={{ fontFamily: 'var(--f-mono)', fontSize: 12, width: '100%' }}
              />
            ) : recipient[k]}
          </div>
        ))}
        <div style={{ width: 60, height: 76, border: '1px dashed oklch(0.4 0.008 60)', marginTop: 16, marginLeft: 'auto', padding: 6, textAlign: 'center', fontSize: 8, lineHeight: 1.2 }}>
          1ST<br/>CLASS<br/>—<br/>SE1
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PostcardEditor });
