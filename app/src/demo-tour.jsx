// demo-tour.jsx — scripted, user-driven walkthrough. Mounted once by App.
// State lives in store (`ui.tour`); step script defined below.

const TOUR_STEPS = [
  {
    id: 'projects-card',
    route: '#projects',
    target: () => document.querySelector('[data-tour="active-project-card"]'),
    title: 'This is your studio',
    body: 'Click the project card to open the workspace.',
    waitFor: () => location.hash === '#workspace',
    placement: 'right',
  },
  {
    id: 'spine',
    route: '#workspace',
    target: () => document.querySelector('.spine-row[data-active="true"]'),
    title: 'Pick a stop',
    body: 'Each row is a stop. The four dots are your checklist: upload · hero · body · media. Click another stop to continue.',
    waitFor: (lastActiveId) => {
      const cur = window.LCStore?.getState()?.ui?.activeStopId;
      return cur && cur !== lastActiveId;
    },
    captureState: () => window.LCStore?.getState()?.ui?.activeStopId,
    placement: 'right',
  },
  {
    id: 'variants',
    route: '#workspace',
    target: () => document.querySelector('.lc-variants .lc-gen-cta') || document.querySelector('.lc-variants'),
    title: 'Generate a hero',
    body: 'Tune the prompt, pick a quality, then click ⚡ Generate. You can generate as many variants as you want.',
    waitFor: (startCount) => {
      const s = window.LCStore?.getState();
      const active = s?.ui?.activeStopId;
      const count = s?.assetsPool?.filter(a => a.stop === active && a.tone === 'generated').length || 0;
      return count > startCount;
    },
    captureState: () => {
      const s = window.LCStore?.getState();
      const active = s?.ui?.activeStopId;
      return s?.assetsPool?.filter(a => a.stop === active && a.tone === 'generated').length || 0;
    },
    placement: 'top',
  },
  {
    id: 'use-as-hero',
    route: '#workspace',
    target: () => document.querySelector('.lc-variant-cell:not([data-pending="true"])'),
    title: 'Pick your favourite',
    body: 'Click "Use as hero" on the one you like. It becomes the cover for this stop.',
    waitFor: () => {
      const s = window.LCStore?.getState();
      const active = s?.ui?.activeStopId;
      const stop = s?.stops?.find(st => st.n === active);
      return !!stop?.heroAssetId;
    },
    placement: 'top',
  },
  {
    id: 'body',
    route: '#workspace',
    target: () => document.querySelector('.node') || document.querySelector('.canvas-inner'),
    title: 'Write the story',
    body: 'Click a paragraph to edit, or press "+ add block" to insert a new one — paragraph, pull quote, image, media embed, or meta row.',
    waitFor: (startSnapshot) => {
      const s = window.LCStore?.getState();
      const active = s?.ui?.activeStopId;
      const stop = s?.stops?.find(st => st.n === active);
      const snap = JSON.stringify(stop?.body || []);
      return snap !== startSnapshot;
    },
    captureState: () => {
      const s = window.LCStore?.getState();
      const active = s?.ui?.activeStopId;
      const stop = s?.stops?.find(st => st.n === active);
      return JSON.stringify(stop?.body || []);
    },
    placement: 'right',
  },
  {
    id: 'postcard',
    route: '#workspace',
    target: () => document.querySelector('.lc-postcard-tile button'),
    title: 'Postcard preview',
    body: 'The postcard reflects your hero + message in real time. Click "Open editor →" to write the note.',
    waitFor: () => location.hash.startsWith('#postcard/'),
    placement: 'top',
  },
  {
    id: 'publish',
    route: '#workspace',
    target: () => [...document.querySelectorAll('button')].find(b => /publish.*→/i.test(b.innerText)),
    title: 'Publish',
    body: 'Pre-flight checks every stop for missing hero / body / upload. Hit Publish and your public page goes live.',
    waitFor: () => false, // last step, waits for Finish
    isFinal: true,
    placement: 'bottom',
  },
];

function DemoTour() {
  const tour = useLCStore(s => s.ui.tour);
  const [rect, setRect] = React.useState(null);
  const waitStateRef = React.useRef(null);
  const scrolledForStep = React.useRef(null);

  const step = TOUR_STEPS[tour?.step || 0];
  const active = !!tour?.active;

  // Route the user to the right hash for each step
  React.useEffect(() => {
    if (!active || !step) return;
    if (step.route && !location.hash.startsWith(step.route)) {
      location.hash = step.route;
    }
  }, [active, step?.id]);

  // Capture "before" state when step activates, for relative waitFor comparisons.
  // Also reset the scroll tracker so the new step's target can trigger scrollIntoView.
  React.useEffect(() => {
    if (!active || !step) return;
    waitStateRef.current = step.captureState ? step.captureState() : null;
    scrolledForStep.current = null;
  }, [active, step?.id]);

  // Locate target and poll for waitFor completion. setInterval (not rAF — rAF
  // doesn't fire in background tabs).
  React.useEffect(() => {
    if (!active || !step) return;
    let timer = null;
    let done = false;
    const tick = () => {
      if (done) return;
      const el = step.target && step.target();
      if (el) {
        const r = el.getBoundingClientRect();
        // Auto-scroll into view once per step if target is off-screen.
        // Account for a 60px sticky top bar with an 80px safe margin top/bottom.
        const vhNow = window.innerHeight || 800;
        const offBottom = r.bottom > vhNow - 80;
        const offTop = r.top < 80;
        if ((offBottom || offTop) && scrolledForStep.current !== step.id) {
          scrolledForStep.current = step.id;
          try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {}
        }
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
      try {
        if (!step.isFinal && step.waitFor && step.waitFor(waitStateRef.current)) {
          done = true;
          clearInterval(timer);
          const currentStep = window.LCStore.getState().ui.tour.step;
          const next = currentStep + 1;
          if (next < TOUR_STEPS.length) storeActions.setTourStep(next);
          else storeActions.endTour();
        }
      } catch {}
    };
    tick();
    timer = setInterval(tick, 150);
    return () => { done = true; clearInterval(timer); };
  }, [active, step?.id, tour?.step]);

  if (!active || !step) return null;

  const handleNext = () => {
    const next = (tour.step || 0) + 1;
    if (next < TOUR_STEPS.length) storeActions.setTourStep(next);
    else storeActions.endTour();
  };
  const handleSkip = () => storeActions.endTour();

  // Compute tooltip position
  const pad = 14;
  const tipW = 320;
  const tipH = 200;
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  let tipStyle;
  if (rect) {
    const placement = step.placement || 'right';
    if (placement === 'right') {
      tipStyle = { top: Math.max(20, rect.top), left: rect.left + rect.width + pad };
    } else if (placement === 'top') {
      tipStyle = { top: Math.max(20, rect.top - 180), left: Math.max(20, rect.left) };
    } else if (placement === 'bottom') {
      tipStyle = { top: rect.top + rect.height + pad, left: Math.max(20, rect.left) };
    } else {
      tipStyle = { top: 40, left: 40 };
    }
  } else {
    tipStyle = { top: 40, left: 40 };
  }
  // Clamp inside viewport so Finish/Next are never clipped off-screen.
  if (tipStyle.left + tipW > vw - 20) tipStyle.left = Math.max(20, vw - tipW - 20);
  if (tipStyle.top  + tipH > vh - 20) tipStyle.top  = Math.max(20, vh - tipH - 20);
  if (tipStyle.left < 20) tipStyle.left = 20;
  if (tipStyle.top  < 20) tipStyle.top  = 20;
  tipStyle.width = tipW;
  tipStyle.maxWidth = `calc(100vw - 40px)`;

  return (
    <div className="lc-tour-root">
      {rect ? (
        <div
          className="lc-tour-spotlight"
          style={{
            top: rect.top - 6, left: rect.left - 6,
            width: rect.width + 12, height: rect.height + 12,
          }}
        />
      ) : (
        <div className="lc-tour-overlay" />
      )}
      <div className="lc-tour-tooltip" style={tipStyle}>
        <div className="eyebrow" style={{ opacity: 0.7 }}>
          Step {(tour.step || 0) + 1} of {TOUR_STEPS.length}
        </div>
        <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 20, lineHeight: 1.1, margin: '6px 0 8px' }}>
          {step.title}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>{step.body}</div>
        <div className="row gap-8 items-center" style={{ marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={handleSkip}>Skip</button>
          <div style={{ flex: 1, minWidth: 4 }} />
          {step.isFinal
            ? <button className="btn btn-sm btn-solid" onClick={handleSkip}>Finish ✓</button>
            : <button className="btn btn-sm" onClick={handleNext}>Next →</button>
          }
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DemoTour, TOUR_STEPS });
