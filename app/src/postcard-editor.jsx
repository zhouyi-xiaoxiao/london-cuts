// postcard-editor.jsx — Per-stop postcard. Reads/writes via the store.
// 3D flip card · front view (mode-specific) ↔ editable back (message + recipient).

// Postcard style presets — all designed to be TRANSFORMATIVE (not just filters).
// The art should feel like an illustration INSPIRED by the photo, not a touched-
// up version of it. Each prompt pushes toward a distinct visual language so the
// user can pick a postcard that reads as illustration / poster / print rather
// than "same photo with a filter". Curated to 6 so pre-generation per project
// is ~13 stops × 6 styles × $0.02 = ~$1.56 (palatable).
const POSTCARD_STYLES = [
  { id: 'illustration', label: 'Watercolour illustration', emoji: '🎨', prompt: 'Reimagine this scene as a hand-painted watercolour illustration for a travel postcard. Use loose brush strokes, wet-on-wet washes, visible paper grain, muted sky tones, soft pigment bleeds. Simplify detail — this should feel like an illustration INSPIRED by the photo, not a filter on it. Keep the overall composition and landmarks but rework textures and forms as painted marks.' },
  { id: 'poster',       label: 'Vintage travel poster',    emoji: '🗺️', prompt: 'Reinterpret this scene as a mid-century vintage travel poster (think 1950s Shell / airline posters). Flat gouache-style colour blocks, bold geometric shapes, 3-5 colour limited palette, visible screenprint grain, stylised skies. Simplify faces and crowds into silhouettes. Keep the landmark shape recognisable but heavily stylise everything else.' },
  { id: 'riso',         label: 'Risograph 2-colour',       emoji: '🟥', prompt: 'Reimagine as a risograph print using only two colours (eg fluorescent pink and navy). Visible mis-registration, halftone dots, grainy texture, simplified shapes, slight colour offset. Flat forms, no photographic detail. Punk-zine energy.' },
  { id: 'inkwash',      label: 'Ink + watercolour',        emoji: '🖋️', prompt: 'Reimagine as a loose ink-line sketch over light watercolour washes. Quick confident brushwork, some pencil guidelines left visible, small splash accents. Urban-sketcher travel-journal feel. Simplify all non-essential detail.' },
  { id: 'anime',        label: 'Anime background',          emoji: '🌸', prompt: 'Reimagine as an anime film background painting (Ghibli / Makoto Shinkai feel). Soft atmospheric perspective, warm clouds, saturated yet painterly colours, simplified architecture, magical-realist lighting. No characters. Painterly, not photographic.' },
  { id: 'artnouveau',   label: 'Art nouveau print',        emoji: '🪻', prompt: 'Reinterpret as an Art Nouveau print (Mucha / fin-de-siècle poster). Thick flowing organic outlines, decorative borders, flat muted palette with golds, stylised plant forms framing the scene. Almost graphic. Heavy artistic licence — this should not look like the source photo.' },
];

function PostcardEditor({ stopId = '05' }) {
  const stop   = useLCStore(s => s.stops.find(st => st.n === stopId));
  const mode   = useLCStore(s => s.ui.mode || s.project.defaultMode || 'fashion');
  const assets = useLCStore(s => s.assetsPool);
  const totalStops = useLCStore(s => s.stops.length);
  const palette = (typeof usePalette === 'function') ? usePalette(stop, assets) : [];
  const [flipped, setFlipped] = React.useState(true);
  const [editing, setEditing] = React.useState(null);
  const [artGenerating, setArtGenerating] = React.useState(null); // style id being generated
  const [artError, setArtError] = React.useState(null);
  const [showKeyModal, setShowKeyModal] = React.useState(false);

  if (!stop) {
    return (
      <div className="page" data-mode={mode} style={{ padding: 48 }}>
        <div className="mono-sm">Unknown stop: {stopId}</div>
        <button className="btn btn-sm" style={{ marginTop: 16 }} onClick={() => { location.hash = '#workspace'; }}>Back to workspace</button>
      </div>
    );
  }

  const postcard = stop.postcard || { message: '', recipient: { name: '', line1: '', line2: '', country: '' } };
  const recipient = postcard.recipient || { name: '', line1: '', line2: '', country: '' };
  const message = postcard.message || '';
  const heroUrl = heroUrlFor(stop, assets);
  const artAssetId = postcard.artAssetId;
  const artUrl = artAssetId ? (assets.find(a => a.id === artAssetId)?.imageUrl || null) : null;
  const frontUrl = artUrl || heroUrl;
  // Auto-detect from the image, but let the user force an orientation via the
  // toolbar. Override lives on stop.postcard.orientationOverride (null = auto).
  const autoOrientation = useImageOrientation(frontUrl);
  const orientationOverride = postcard.orientationOverride || null;
  const orientation = orientationOverride || autoOrientation;
  const isPortrait = orientation === 'portrait';
  const cardAspect = isPortrait ? '5/7' : '7/5';
  const cardMaxWidth = isPortrait ? 480 : 720;
  const cardDimsLabel = isPortrait ? '105 × 148 mm' : '148 × 105 mm';

  const setMessage = (text) => storeActions.setPostcardMessage(stopId, text);
  const setRecipient = (r) => storeActions.setRecipient(stopId, r);

  const onMode   = (m) => storeActions.setMode(m);
  const onClose  = () => { location.hash = '#workspace'; };

  const generateArt = async (style) => {
    if (!heroUrl || artGenerating) return;
    setArtError(null);
    setArtGenerating(style.id);
    try {
      // Derive stable source identity for cache lookup/save.
      const heroAsset = stop.heroAssetId ? assets.find(a => a.id === stop.heroAssetId) : null;
      const sourceIdentity = (() => {
        if (heroAsset?.sourceName) return heroAsset.sourceName;
        if (heroUrl && !heroUrl.startsWith('data:')) {
          const m = heroUrl.match(/\/([^\/?#]+)(?:\?|#|$)/);
          return m ? m[1] : null;
        }
        return null;
      })();

      // Cache hit? Restore for $0.
      let finalId = null;
      if (sourceIdentity && window.lcVariantCacheGet) {
        try {
          const key = window.lcVariantCacheKey(sourceIdentity, style.id);
          const cached = await window.lcVariantCacheGet(key);
          if (cached && cached.url) {
            finalId = storeActions.addGeneratedVariant(stopId, {
              url: cached.url,
              prompt: cached.prompt || style.prompt,
              revisedPrompt: cached.revisedPrompt,
              quality: cached.quality || 'low',
              styleLabel: cached.styleLabel || style.label,
              styleId: style.id,
              sourceIdentity,
            });
          }
        } catch (_) {}
      }

      if (!finalId) {
        const result = await window.LCGenerateImage({
          prompt: style.prompt,
          sourceUrl: heroUrl,
          quality: 'low',
        });
        finalId = storeActions.addGeneratedVariant(stopId, {
          url: result.url,
          prompt: style.prompt,
          revisedPrompt: result.revisedPrompt,
          quality: 'low',
          styleLabel: style.label,
          styleId: style.id,
          sourceIdentity,
        });
      }

      // Fallback if older store action didn't return an id
      const resolved = finalId || (() => {
        const s = window.LCStore.getState();
        return s.assetsPool[s.assetsPool.length - 1]?.id;
      })();
      if (resolved) storeActions.setPostcardArt(stopId, resolved);
    } catch (err) {
      const msg = err?.message || 'Generation failed';
      // NO_KEY in the deployed showcase → drop the demo-mode modal instead of a
      // cryptic error banner. In local dev with an embedded key this path is
      // unreachable; the modal copy still adapts (see KeyPasteModal).
      if (msg === 'NO_KEY' || msg.includes('NO_KEY')) {
        setShowKeyModal(true);
        setArtError(null);
      } else {
        setArtError(msg);
      }
    } finally {
      setArtGenerating(null);
    }
  };
  const resetArt = () => storeActions.setPostcardArt(stopId, null);

  return (
    <div className="page" data-mode={mode} style={{ overflow: 'auto', height: '100vh' }}>
      <div className="ws-topbar">
        <div className="row items-center gap-16">
          <button className="mono-sm" onClick={onClose} style={{ opacity: 0.6 }}>← Back to workspace</button>
          <Roundel />
          <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15 }}>Postcard · Stop {stop.n} · {stop.title}</div>
        </div>
        <div className="row items-center gap-16">
          <ModePill mode={mode} onMode={onMode} />
          <button
            className="btn"
            title={orientationOverride
              ? `Postcard set to ${orientation}. Click to switch.`
              : `Auto-detected ${orientation}. Click to force the opposite.`}
            onClick={() => {
              const target = isPortrait ? 'landscape' : 'portrait';
              // Clear the override when it would just mirror auto-detect.
              storeActions.setPostcardOrientation(stopId, target === autoOrientation ? null : target);
            }}
          >
            {isPortrait ? '▯ → ▭ Landscape' : '▭ → ▯ Portrait'}
          </button>
          <button className="btn" onClick={() => setFlipped(f => !f)}>Flip ↻</button>
          <button className="btn btn-solid" onClick={onClose}>Done →</button>
        </div>
      </div>

      <div className="lc-postcard-page" style={{ padding: 'clamp(16px, 3vw, 40px)', display: 'grid', gap: 'clamp(16px, 2.4vw, 32px)', maxWidth: 1680, margin: '0 auto' }}>
        <div style={{ padding: 'clamp(16px, 3vw, 48px)', background: 'oklch(from currentColor l c h / 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'clamp(280px, 60vh, 620px)' }}>
          <div style={{ perspective: 2000, width: '100%', maxWidth: cardMaxWidth }}>
            <div style={{
              position: 'relative', width: '100%', aspectRatio: cardAspect,
              transformStyle: 'preserve-3d',
              transition: 'transform 700ms cubic-bezier(0.2,0.8,0.3,1)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}>
                <PostcardFrontView mode={mode} stop={stop} heroUrl={frontUrl} palette={palette} totalStops={totalStops} orientation={orientation} />
              </div>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}>
                <PostcardBackEditor
                  mode={mode}
                  stop={stop}
                  palette={palette}
                  totalStops={totalStops}
                  orientation={orientation}
                  editing={editing} setEditing={setEditing}
                  message={message} setMessage={setMessage}
                  recipient={recipient} setRecipient={setRecipient}
                />
              </div>
            </div>
            <div className="row center gap-8" style={{ marginTop: 16 }}>
              <span className="mono-sm" style={{ opacity: 0.6 }}>{flipped ? 'BACK — click any field to edit ✎' : 'FRONT'}</span>
              <span className="mono-sm" style={{ opacity: 0.3 }}>·</span>
              <span className="mono-sm" style={{ opacity: 0.6 }}>{cardDimsLabel} · Ed.01 / {stop.n} of {totalStops}</span>
            </div>
          </div>
        </div>

        <div className="col gap-24">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Message</div>
            <div className="mono-sm" style={{ opacity: 0.65, lineHeight: 1.6 }}>
              Handwriting field (Caveat). Wraps naturally. Click the card, type. Saves as you go.
            </div>
            <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => { setFlipped(true); setEditing('message'); }}>
              Edit message
            </button>
          </div>
          <div className="rule" />
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Recipient</div>
            <div className="mono-sm" style={{ opacity: 0.65, lineHeight: 1.6 }}>
              Name · two address lines · country. Each field is a ruled row — looks like an address, not a form.
            </div>
            <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => { setFlipped(true); setEditing('recipient'); }}>
              Edit recipient
            </button>
          </div>
          <div className="rule" />
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Postcard art</div>
            <div className="mono-sm" style={{ opacity: 0.65, lineHeight: 1.6 }}>
              Use an AI-generated artistic version as the postcard front.
            </div>
            {!heroUrl && (
              <div className="mono-sm" style={{ marginTop: 10, opacity: 0.6, fontStyle: 'italic' }}>
                Set a hero image first.
              </div>
            )}
            <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {POSTCARD_STYLES.map(style => {
                const isActive = artGenerating === style.id;
                const disabled = !heroUrl || !!artGenerating;
                return (
                  <button
                    key={style.id}
                    className="btn btn-sm"
                    disabled={disabled}
                    onClick={() => generateArt(style)}
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 11,
                      opacity: disabled && !isActive ? 0.45 : 1,
                    }}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
            {artGenerating && (
              <div className="mono-sm" style={{ marginTop: 10, opacity: 0.7 }}>
                Generating {POSTCARD_STYLES.find(s => s.id === artGenerating)?.label}…
              </div>
            )}
            {artError && (
              <div className="mono-sm" style={{ marginTop: 10, color: 'oklch(0.55 0.2 25)' }}>
                {artError}
              </div>
            )}
            {artUrl && !artGenerating && (
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-sm" onClick={resetArt} style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>
                  Use photo instead
                </button>
              </div>
            )}
          </div>
          <div className="rule" />
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Mode grammar</div>
            <div className="mono-sm" style={{ opacity: 0.7, lineHeight: 1.6 }}>
              {mode === 'punk'    && 'Taped label above each field. Dashed red-orange outline. Tilt preserved.'}
              {mode === 'fashion' && 'Inline — field blends with the card. Oxblood underline marks active.'}
              {mode === 'cinema'  && 'Slate frame darkens around the field. Subtitle-yellow outline.'}
            </div>
          </div>
        </div>
      </div>
      {showKeyModal && window.KeyPasteModal && (
        <KeyPasteModal onClose={() => setShowKeyModal(false)} onUseDefault={() => setShowKeyModal(false)} />
      )}
    </div>
  );
}

// Front view — uses the hero image if available, else the mode placeholder.
// All sized text uses CSS container queries (cqw units) so nothing overflows
// at smaller card widths (portrait tiles, mobile, etc.). Wrapper always has
// `containerType: 'inline-size'`.
function PostcardFrontView({ mode, stop, heroUrl, palette = [], totalStops = 12, orientation = 'landscape' }) {
  const focus = stop?.heroFocus || { x: 50, y: 50 };
  const img = heroUrl
    ? <img src={heroUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${focus.x}% ${focus.y}%` }} />
    : <Img label={stop.label} tone={mode === 'cinema' ? 'dark' : mode === 'punk' ? 'punk' : 'warm'} style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', height: '100%' }} />;
  const titleWord = (stop.title.split(',')[0] || stop.title).toUpperCase();
  const titleShort = stop.title.split(' ').slice(0, 2).join(' ');
  const isPortrait = orientation === 'portrait';

  // Palette slots (sorted dark → light): [0]=darkest, [3]=brightest.
  const punkAccent    = palette[2] || 'oklch(0.62 0.24 25)';
  const fashionInk    = palette[0] || 'oklch(0.2 0.02 40)';
  const cinemaSubtitle = palette[3] || 'oklch(0.88 0.14 90)';

  const wrap = { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', containerType: 'inline-size' };
  const clampFs = (min, cqw, max) => `clamp(${min}px, ${cqw}cqw, ${max}px)`;
  const textSafe = { overflowWrap: 'break-word', wordBreak: 'break-word', hyphens: 'auto' };

  if (mode === 'punk') {
    const firstWord = titleWord.split(' ')[0];
    if (isPortrait) {
      return (
        <div style={{ ...wrap, background: 'black' }}>
          {img}
          <div style={{ position: 'absolute', top: '4cqw', right: '4cqw', background: punkAccent, color: 'white', padding: '1.5cqw 3cqw', fontFamily: 'var(--f-display)', fontSize: clampFs(12, 4.5, 22), transform: 'rotate(-3deg)', lineHeight: 1 }}>{stop.code.split(' ')[0]}!!</div>
          <div style={{ position: 'absolute', top: '6cqw', left: '6cqw', right: '6cqw', fontFamily: 'var(--f-display)', fontSize: clampFs(18, 10.5, 48), color: 'white', textTransform: 'uppercase', lineHeight: 0.92, textShadow: `0.6cqw 0.6cqw 0 ${punkAccent}`, ...textSafe }}>
            Greetings<br/>from<br/>{firstWord}
          </div>
        </div>
      );
    }
    return (
      <div style={{ ...wrap, background: 'black' }}>
        {img}
        <div style={{ position: 'absolute', top: '3cqw', left: '3cqw', background: punkAccent, color: 'white', padding: '1cqw 2cqw', fontFamily: 'var(--f-display)', fontSize: clampFs(12, 3, 22), transform: 'rotate(-3deg)', lineHeight: 1 }}>{stop.code.split(' ')[0]}!!</div>
        <div style={{ position: 'absolute', bottom: '4cqw', left: '4cqw', right: '4cqw', fontFamily: 'var(--f-display)', fontSize: clampFs(18, 8, 56), color: 'white', textTransform: 'uppercase', lineHeight: 0.9, textShadow: `0.6cqw 0.6cqw 0 ${punkAccent}`, ...textSafe }}>
          Greetings<br/>from<br/>{firstWord}
        </div>
      </div>
    );
  }
  if (mode === 'cinema') {
    if (isPortrait) {
      return (
        <div style={{ ...wrap, background: 'oklch(0.1 0.015 250)' }}>
          {img}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '5.5cqw', background: 'black' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '5.5cqw', background: 'black' }} />
          <div style={{ position: 'absolute', bottom: '4cqw', left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.5)', padding: '1cqw 3cqw', fontFamily: 'var(--f-mono)', fontSize: clampFs(10, 2.8, 15), color: cinemaSubtitle, maxWidth: '85%', ...textSafe }}>
              — {stop.mood} · {stop.time}
            </div>
          </div>
          <div style={{ position: 'absolute', top: '4cqw', left: '8cqw', right: '8cqw', fontFamily: 'var(--f-mono)', fontSize: clampFs(8, 2.2, 12), color: cinemaSubtitle, letterSpacing: '0.2em', ...textSafe }}>
            SCENE {stop.n} · {stop.time}
          </div>
        </div>
      );
    }
    return (
      <div style={{ ...wrap, background: 'oklch(0.1 0.015 250)' }}>
        {img}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5.5cqw', background: 'black' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '5.5cqw', background: 'black' }} />
        <div style={{ position: 'absolute', bottom: '8cqw', left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.5)', padding: '0.8cqw 2.5cqw', fontFamily: 'var(--f-mono)', fontSize: clampFs(10, 2, 15), color: cinemaSubtitle, maxWidth: '88%', ...textSafe }}>
            — {stop.mood} · {stop.time}
          </div>
        </div>
        <div style={{ position: 'absolute', top: '8cqw', left: '3cqw', right: '3cqw', fontFamily: 'var(--f-mono)', fontSize: clampFs(8, 1.6, 12), color: cinemaSubtitle, letterSpacing: '0.2em', ...textSafe }}>
          SCENE {stop.n} · {stop.time}
        </div>
      </div>
    );
  }
  if (isPortrait) {
    return (
      <div style={{ ...wrap, background: 'oklch(0.98 0.008 75)', display: 'grid', gridTemplateRows: '3fr 2fr' }}>
        <div style={{ position: 'relative' }}>{img}</div>
        <div style={{ padding: '5cqw', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: clampFs(8, 2.2, 12), letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.7, ...textSafe }}>LONDON · {stop.code}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--f-fashion)', fontSize: clampFs(16, 9, 42), fontStyle: 'italic', lineHeight: 1, color: fashionInk, ...textSafe }}>
              {titleShort}
            </div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: clampFs(8, 2.2, 12), letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2.5cqw', opacity: 0.6 }}>ED. 01 / {stop.n} OF {totalStops}</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...wrap, background: 'oklch(0.98 0.008 75)', display: 'grid', gridTemplateColumns: '2fr 3fr' }}>
      <div style={{ padding: '4.5cqw', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: clampFs(8, 1.9, 12), letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.7, ...textSafe }}>LONDON · {stop.code}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--f-fashion)', fontSize: clampFs(16, 7, 48), fontStyle: 'italic', lineHeight: 1, color: fashionInk, ...textSafe }}>
            {titleShort}
          </div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: clampFs(8, 1.9, 12), letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2.5cqw', opacity: 0.6 }}>ED. 01 / {stop.n} OF {totalStops}</div>
        </div>
      </div>
      <div style={{ position: 'relative' }}>{img}</div>
    </div>
  );
}

// Back-side editor — message + recipient become editable in place, saves to store.
function PostcardBackEditor({ mode, stop, palette = [], totalStops = 12, orientation = 'landscape', editing, setEditing, message, setMessage, recipient, setRecipient }) {
  const handColor   = palette[0] || 'oklch(0.25 0.02 240)';
  const stampBorder = palette[0] || 'oklch(0.4 0.008 60)';
  // palette[1] at low opacity for divider lines. CSS color-mix for broad support across hex/oklch.
  const dividerCss  = palette[1]
    ? `color-mix(in srgb, ${palette[1]} 35%, transparent)`
    : 'oklch(0.8 0.008 60)';
  const isPortrait = orientation === 'portrait';
  const msgStyle = {
    fontFamily: 'var(--f-hand)', fontSize: 22, lineHeight: 1.5,
    color: handColor,
    width: '100%',
    minHeight: isPortrait ? 100 : 140,
    resize: 'none',
    background: 'transparent',
    cursor: 'text',
  };
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'oklch(0.96 0.008 60)',
      color: 'oklch(0.15 0.008 60)',
      padding: 32,
      display: 'grid',
      ...(isPortrait
        ? { gridTemplateRows: '3fr 2fr', gap: 20 }
        : { gridTemplateColumns: '3fr 2fr', gap: 24 }),
      fontFamily: 'var(--f-mono)',
    }}>
      <div
        className="editable"
        data-editing={editing === 'message'}
        data-edit-label="MESSAGE — handwritten"
        style={{
          ...(isPortrait
            ? { borderBottom: `1px solid ${dividerCss}`, paddingBottom: 20 }
            : { borderRight: `1px solid ${dividerCss}`, paddingRight: 24 }),
          position: 'relative',
          cursor: editing === 'message' ? 'text' : 'pointer',
        }}
        onClick={() => { if (editing !== 'message') setEditing('message'); }}
      >
        {editing === 'message' ? (
          <>
            <textarea
              autoFocus
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setEditing(null); } }}
              style={msgStyle}
              placeholder="Write your note…"
            />
            <div className="row" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-sm"
                onClick={(e) => { e.stopPropagation(); setEditing(null); }}
                style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}
              >Done</button>
            </div>
          </>
        ) : (
          <div style={{ fontFamily: 'var(--f-hand)', fontSize: 22, lineHeight: 1.5, color: handColor, whiteSpace: 'pre-wrap', minHeight: isPortrait ? 100 : 140 }}>
            {message || <span style={{ opacity: 0.45, fontStyle: 'italic' }}>Click here to write your message… ✎</span>}
          </div>
        )}
      </div>

      <div
        className="editable"
        data-editing={editing === 'recipient'}
        data-edit-label="RECIPIENT"
        onClick={() => { if (editing !== 'recipient') setEditing('recipient'); }}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setEditing(null); } }}
        style={{ cursor: editing === 'recipient' ? 'text' : 'pointer', position: 'relative' }}
      >
        <div className="mono-sm" style={{ letterSpacing: '0.25em', marginBottom: 12 }}>LONDON CUTS · ED.01 / {stop.n}</div>
        {[
          ['name', 'name'],
          ['line1', 'address line 1'],
          ['line2', 'address line 2'],
          ['country', 'country'],
        ].map(([k, placeholder]) => (
          <div key={k} style={{ borderBottom: `1px solid ${dividerCss}`, padding: '4px 0', fontSize: 12 }}>
            {editing === 'recipient' ? (
              <input
                value={recipient[k] || ''}
                onChange={e => setRecipient({ [k]: e.target.value })}
                autoFocus={k === 'name'}
                placeholder={placeholder}
                style={{ fontFamily: 'var(--f-mono)', fontSize: 12, width: '100%', cursor: 'text' }}
              />
            ) : (recipient[k] || <span style={{ opacity: 0.4 }}>{placeholder} ✎</span>)}
          </div>
        ))}
        <div style={{
          width: 60, height: 76, border: `1px dashed ${stampBorder}`,
          padding: 6, textAlign: 'center', fontSize: 8, lineHeight: 1.2,
          ...(isPortrait
            ? { position: 'absolute', top: 0, right: 0 }
            : { marginTop: 16, marginLeft: 'auto' }),
        }}>
          1ST<br/>CLASS<br/>—<br/>{stop.code.split(' ')[0]}
        </div>
        {editing === 'recipient' && (
          <div className="row" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-sm"
              onClick={(e) => { e.stopPropagation(); setEditing(null); }}
              style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}
            >Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PostcardEditor });
window.POSTCARD_STYLES = POSTCARD_STYLES;
