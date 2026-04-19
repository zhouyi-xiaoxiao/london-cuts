// media-provider.jsx — adapter layer for image-to-image / image-to-video.
//
// The real provider is owned by a teammate. This file defines the contract
// and ships a MockMediaProvider for local demo + a tiny React hook layer.
//
// Contract (keep stable):
//
//   interface MediaProvider {
//     id: string;                 // 'mock' | 'teammate-real' | ...
//     createImageToImageJob(spec) => Promise<{ taskId: string }>
//     createImageToVideoJob(spec) => Promise<{ taskId: string }>
//     getJobStatus(taskId)        => Promise<MediaTask>
//     cancelJob(taskId)           => Promise<void>
//     retryJob(taskId)            => Promise<{ taskId: string }>  // new task id
//     subscribe(taskId, handler)  => () => void                   // unsubscribe
//   }
//
//   type MediaTaskState = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';
//
//   type MediaTask = {
//     id: string;
//     kind: 'img2img' | 'img2vid';
//     providerId: string;
//     stopId: string;
//     sourceAssetId: string | null;
//     mode: 'punk' | 'fashion' | 'cinema';
//     prompt?: string;
//     strength?: number;
//     seed?: number;
//     state: MediaTaskState;
//     progress: number;          // 0..1
//     etaMs?: number;
//     durationMs?: number;
//     resultAssetId?: string;
//     error?: string;
//     createdAt: number;
//     updatedAt: number;
//   };
//
// Screens only depend on this interface. To swap in the teammate's real
// provider, implement the four methods + `subscribe`, then call:
//     setMediaProvider(new TeammateRealProvider({ baseUrl, token }))
//
// Nothing else changes.

function __lcUid(prefix = 'tk') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

class MockMediaProvider {
  constructor() {
    this.id = 'mock';
    this._subs = new Map(); // taskId -> Set<handler>
    this._timers = new Map(); // taskId -> timeout/interval ids
  }

  _emit(task) {
    storeActions.upsertTask(task);
    const subs = this._subs.get(task.id);
    if (subs) subs.forEach(h => { try { h(task); } catch (e) { console.error(e); } });
  }

  _simulate(task) {
    const totalMs = 3000 + Math.round(Math.random() * 5000);
    const start = Date.now();
    const failRoll = Math.random();
    // 8% failure rate for mock realism; always succeed on retry to keep demo smooth.
    const willFail = task._isRetry ? false : failRoll < 0.08;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(1, elapsed / totalMs);
      const curr = { ...task, state: 'running', progress: pct, etaMs: Math.max(0, totalMs - elapsed), updatedAt: Date.now() };
      if (pct >= 1) {
        if (willFail) {
          this._emit({ ...curr, state: 'failed', progress: 1, error: 'Mock generator lost the frame', durationMs: elapsed, etaMs: 0 });
        } else {
          this._emit({
            ...curr,
            state: 'done',
            progress: 1,
            durationMs: elapsed,
            etaMs: 0,
            resultAssetId: __lcUid('asset'),
          });
        }
        const tid = this._timers.get(task.id);
        if (tid) clearInterval(tid);
        this._timers.delete(task.id);
        return;
      }
      this._emit(curr);
    };

    // move from queued → running after a short stagger
    const startDelay = 250 + Math.random() * 600;
    const kickoff = setTimeout(() => {
      this._emit({ ...task, state: 'running', progress: 0.02, updatedAt: Date.now() });
      const ivl = setInterval(tick, 180);
      this._timers.set(task.id, ivl);
    }, startDelay);
    this._timers.set(task.id, kickoff);
  }

  async _create(kind, spec) {
    const now = Date.now();
    const task = {
      id: __lcUid('tk'),
      kind,
      providerId: this.id,
      stopId: spec.stopId,
      sourceAssetId: spec.sourceAssetId || null,
      mode: spec.mode || 'fashion',
      prompt: spec.prompt || (kind === 'img2img' ? 'restyle in mode grammar' : 'animate 2–4s'),
      strength: spec.strength ?? 0.6,
      seed: spec.seed ?? Math.floor(Math.random() * 999999),
      state: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };
    this._emit(task);
    this._simulate(task);
    return { taskId: task.id };
  }

  createImageToImageJob(spec) { return this._create('img2img', spec); }
  createImageToVideoJob(spec) { return this._create('img2vid', spec); }

  async getJobStatus(taskId) {
    const task = lcGetState().mediaTasks.find(t => t.id === taskId);
    if (!task) throw new Error('task not found');
    return task;
  }

  async cancelJob(taskId) {
    const tid = this._timers.get(taskId);
    if (tid) { clearInterval(tid); clearTimeout(tid); this._timers.delete(taskId); }
    const task = lcGetState().mediaTasks.find(t => t.id === taskId);
    if (task && task.state !== 'done') {
      this._emit({ ...task, state: 'cancelled', updatedAt: Date.now() });
    }
  }

  async retryJob(taskId) {
    const prev = lcGetState().mediaTasks.find(t => t.id === taskId);
    if (!prev) throw new Error('task not found');
    const kind = prev.kind;
    // remove the old failed/cancelled task so the queue stays readable
    storeActions.removeTask(taskId);
    const { taskId: newId } = await this._create(kind, {
      stopId: prev.stopId, sourceAssetId: prev.sourceAssetId, mode: prev.mode,
      prompt: prev.prompt, strength: prev.strength, seed: prev.seed,
    });
    // mark replay so the mock succeeds
    const next = lcGetState().mediaTasks.find(t => t.id === newId);
    if (next) this._emit({ ...next, _isRetry: true });
    return { taskId: newId };
  }

  subscribe(taskId, handler) {
    if (!this._subs.has(taskId)) this._subs.set(taskId, new Set());
    this._subs.get(taskId).add(handler);
    return () => {
      const s = this._subs.get(taskId);
      if (s) { s.delete(handler); if (s.size === 0) this._subs.delete(taskId); }
    };
  }
}

// Singleton, with a setter so the teammate's real provider can be dropped in.
let __mediaProvider = new MockMediaProvider();
function getMediaProvider() { return __mediaProvider; }
function setMediaProvider(p) { __mediaProvider = p; }

// Hooks

function useMediaTasks({ kind, stopId } = {}) {
  const state = useStore(s => s.mediaTasks);
  return React.useMemo(() => {
    return state.filter(t => {
      if (kind && t.kind !== kind) return false;
      if (stopId && t.stopId !== stopId) return false;
      return true;
    });
  }, [state, kind, stopId]);
}

function useMediaTask(taskId) {
  return useStore(s => s.mediaTasks.find(t => t.id === taskId) || null);
}

// Seed a few tasks on first load so the Media panel is never empty in demo.
function seedMediaTasksIfEmpty() {
  const state = lcGetState();
  if (state.mediaTasks.length > 0) return;
  const p = getMediaProvider();
  // one running, two done-ish, one failed → retry target
  p.createImageToImageJob({ stopId: '05', mode: 'fashion', prompt: 'golden hour, editorial, slight grain' });
  p.createImageToImageJob({ stopId: '03', mode: 'punk', prompt: 'ransom, high contrast, paper texture' });
  p.createImageToVideoJob({ stopId: '08', mode: 'cinema', prompt: 'dolly 2s, neon preserved' });
  p.createImageToVideoJob({ stopId: '10', mode: 'cinema', prompt: 'first light, still camera' });
}

// Kick the seed once the store is ready. Do it on next tick so data.jsx is loaded.
setTimeout(seedMediaTasksIfEmpty, 50);

Object.assign(window, {
  MockMediaProvider,
  getMediaProvider,
  setMediaProvider,
  useMediaTasks,
  useMediaTask,
});
