// app.jsx — SPA root. Hash router + OpenAI image generation + key modal.

// ---- Global concurrency limiter for image generation ----
// OpenAI's /v1/images/edits endpoint caps at ~5 concurrent requests per key;
// above that, extra calls hit 429 rate-limit errors. We cap at 4 in flight so
// there's headroom for one-off user-triggered generations during batch pre-gen.
const LC_IMG_MAX_INFLIGHT = 4;
let __lcImgInFlight = 0;
const __lcImgWaiters = [];
function __lcImgAcquire() {
  if (__lcImgInFlight < LC_IMG_MAX_INFLIGHT) {
    __lcImgInFlight++;
    return Promise.resolve();
  }
  return new Promise(resolve => { __lcImgWaiters.push(resolve); });
}
function __lcImgRelease() {
  __lcImgInFlight--;
  const next = __lcImgWaiters.shift();
  if (next) { __lcImgInFlight++; next(); }
}

async function __generateImageRaw({ prompt, size, quality, model, sourceFile, sourceUrl }) {
  const key = sessionStorage.getItem('lc_openai_key') || window.__LC_OPENAI_KEY_DEFAULT;
  if (!key) throw new Error('NO_KEY');

  const hasSource = !!(sourceFile || sourceUrl);
  if (hasSource) {
    let file = sourceFile;
    if (!file && sourceUrl) {
      const r = await fetch(sourceUrl);
      if (!r.ok) throw new Error('Could not fetch source image: ' + r.status);
      const blob = await r.blob();
      file = new File([blob], 'source.png', { type: blob.type || 'image/png' });
    }
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('n', '1');
    if (model.startsWith('gpt-image')) form.append('quality', quality);
    form.append('image', file);
    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key },
      body: form,
    });
    if (!res.ok) {
      const err = await res.text();
      const e = new Error('HTTP ' + res.status + ': ' + err.slice(0, 300));
      e.status = res.status;
      throw e;
    }
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('NO_IMAGE_IN_RESPONSE');
    return { url: 'data:image/png;base64,' + b64, revisedPrompt: data.data?.[0]?.revised_prompt };
  }

  const body = { model, prompt, size, n: 1, quality };
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    const e = new Error('HTTP ' + res.status + ': ' + err.slice(0, 300));
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('NO_IMAGE_IN_RESPONSE');
  return { url: 'data:image/png;base64,' + b64, revisedPrompt: data.data?.[0]?.revised_prompt };
}

// Public wrapper — retries on 429/5xx with exponential backoff, goes through
// the global concurrency gate so we never have more than LC_IMG_MAX_INFLIGHT
// requests hitting OpenAI at once.
async function generateImage(opts) {
  const args = {
    size: '1024x1024',
    quality: 'low',
    model: 'gpt-image-1.5',
    ...opts,
  };
  // 4 attempts: immediate, 1.5s, 4s, 10s. Plenty for transient 429s.
  const delays = [0, 1500, 4000, 10000];
  let lastErr = null;
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));
    await __lcImgAcquire();
    try {
      const result = await __generateImageRaw(args);
      __lcImgRelease();
      return result;
    } catch (err) {
      __lcImgRelease();
      lastErr = err;
      const status = err && err.status;
      const msg = (err && err.message) || '';
      // Don't retry missing-key / 400 bad request / final attempt
      if (msg === 'NO_KEY') throw err;
      if (status && status >= 400 && status < 500 && status !== 429) throw err;
      if (attempt === delays.length - 1) throw err;
      // else: loop, will backoff
    }
  }
  throw lastErr || new Error('generate failed');
}
window.LCGenerateImage = generateImage;
window.__lcImgStats = () => ({ inFlight: __lcImgInFlight, waiting: __lcImgWaiters.length });

function KeyPasteModal({ onClose, onUseDefault }) {
  const [key, setKey] = React.useState('');
  const defaultBtnRef = React.useRef(null);
  // Pre-focus "Use embedded default" on mount — Enter dismisses without pasting.
  React.useEffect(() => { defaultBtnRef.current?.focus(); }, []);
  const handleSave = () => {
    if (key.trim()) sessionStorage.setItem('lc_openai_key', key.trim());
    onClose();
  };
  const handleDontAsk = () => {
    try { sessionStorage.setItem('lc_key_dont_ask', '1'); } catch {}
    onUseDefault();
  };
  return (
    <>
      <div className="lc-key-modal-backdrop" onClick={onClose} />
      <div className="lc-key-modal">
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 500 }}>OpenAI API Key</h2>
          <p style={{ margin: '0 0 12px 0', fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
            A default key is already embedded. Press Enter (or click below) to use it.
            Or paste your own — it stays in sessionStorage only.
          </p>
        </div>
        <input
          type="password"
          placeholder="sk-proj-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && key.trim()) handleSave(); }}
          style={{
            width: '100%', padding: '8px 12px',
            border: '1px solid #ccc', borderRadius: 4,
            fontFamily: 'monospace', fontSize: 12,
            marginBottom: 12, boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={handleSave} style={{ flex: 1 }}>Save &amp; use</button>
          <button ref={defaultBtnRef} className="btn" onClick={handleDontAsk} style={{ flex: 1 }}>Use embedded (don't ask again)</button>
          <button className="btn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
        </div>
      </div>
    </>
  );
}

window.KeyPasteModal = KeyPasteModal;

// Hash router
function App() {
  const [hash, setHash] = React.useState(location.hash);
  const [showPublish, setShowPublish] = React.useState(false);
  const mode = useLCStore(s => s.ui?.mode || s.project?.defaultMode || 'fashion');

  React.useEffect(() => {
    const handleHashChange = () => setHash(location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  React.useEffect(() => {
    document.body.setAttribute('data-mode', mode);
  }, [mode]);

  const route = hash.slice(1) || 'projects';
  const [screen, ...params] = route.split('/');

  const handleExitToProjects = () => { location.hash = '#projects'; setShowPublish(false); };
  const handleOpenPublish = () => setShowPublish(true);
  const handleClosePublish = () => setShowPublish(false);
  const handleChangeMode = (newMode) => storeActions.setMode(newMode);
  const handleExitToWorkspace = () => { location.hash = '#workspace'; };

  let content;
  if (screen === 'projects') {
    content = window.ProjectsList
      ? <ProjectsList onSelectProject={() => location.hash = '#workspace'} />
      : <div>Loading Projects...</div>;
  } else if (screen === 'workspace') {
    content = window.Workspace ? (
      <div>
        <Workspace
          mode={mode}
          onMode={handleChangeMode}
          onOpenPublish={handleOpenPublish}
          onExitToProjects={handleExitToProjects}
        />
        {showPublish && window.PublishSlideover && (
          <PublishSlideover mode={mode} onClose={handleClosePublish} />
        )}
      </div>
    ) : <div>Loading Workspace...</div>;
  } else if (screen === 'public') {
    const publicMode = params[0];
    if (publicMode === 'atlas' && window.Atlas) {
      content = <Atlas mode={mode} onMode={handleChangeMode} onNav={(n) => {
        if (n === 'stop' || n === 'public-project') location.hash = '#public';
        else if (n === 'projects') location.hash = '#projects';
      }} />;
    } else if (window.PublicProject) {
      content = (
        <PublicProject
          mode={mode}
          onMode={handleChangeMode}
          onExit={handleExitToProjects}
          onStopClick={(stop) => location.hash = '#postcard/' + (stop.n || stop)}
        />
      );
    } else {
      content = <div>Loading Public view...</div>;
    }
  } else if (screen === 'postcard') {
    const stopId = params[0] || '05';
    content = window.PostcardEditor
      ? <PostcardEditor stopId={stopId} />
      : <div>Loading PostcardEditor...</div>;
  } else {
    location.hash = '#projects';
    content = <div>Redirecting...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {content}
      {window.DemoTour && <DemoTour />}
    </div>
  );
}

Object.assign(window, { App });
