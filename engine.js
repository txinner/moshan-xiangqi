const BASE = new URL('./engine/', new URL(import.meta.env.BASE_URL, location.href)).href;
const aborted = () => null;

/** Browser-only Pikafish UCI adapter. Cancellation resolves a search with null. */
export class Engine {
  constructor(onStatus = () => {}) {
    this.onStatus = onStatus;
    this.worker = null;
    this.initializing = null;
    this.active = null;
    this.queued = null;
    this.epoch = 0;
  }
  status(state, message, extra = {}) { this.onStatus({ state, message, ...extra }); }
  async init() {
    if (this.initializing) return this.initializing;
    this.initializing = this.initialize().catch(error => {
      this.initializing = null;
      this.status('error', error.message);
      throw error;
    });
    return this.initializing;
  }
  async initialize() {
    this.status('loading', '棋友正在入席…', { progress: 0 });
    if (!globalThis.crossOriginIsolated) {
      if (!('serviceWorker' in navigator) || !isSecureContext) throw new Error('引擎需要 HTTPS 或 localhost，以及跨源隔离支持。');
      const key = 'moshan-isolation-reload';
      if (sessionStorage.getItem(key)) throw new Error('浏览器未启用跨源隔离，请使用支持 SharedArrayBuffer 的现代浏览器。');
      const swUrl = new URL('./isolation-sw.js', new URL(import.meta.env.BASE_URL, location.href));
      await navigator.serviceWorker.register(swUrl.href, { scope: new URL('./', swUrl).pathname });
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      sessionStorage.setItem(key, '1');
      location.reload();
      return new Promise(() => {});
    }
    sessionStorage.removeItem('moshan-isolation-reload');
    await new Promise((resolve, reject) => {
      this.worker = new Worker(BASE + 'worker.js');
      const timeout = setTimeout(() => fail(new Error('引擎加载超时，请检查网络后重试。')), 180000);
      const fail = error => {
        clearTimeout(timeout);
        this.worker?.terminate(); this.worker = null;
        this.active?.resolve(null); this.active = null;
        this.queued?.resolve(null); this.queued = null;
        this.status('error', error.message);
        reject(error);
      };
      this.worker.onerror = event => fail(new Error(event.message || '引擎运行错误'));
      this.worker.onmessage = ({ data }) => {
        if (data.type === 'error') return fail(new Error(data.error));
        if (data.type === 'net-progress') this.status('loading', '正在准备棋局…', { progress: data.loaded / 50706378 });
        if (data.type === 'ready') {
          this.send('uci');
          this.send('setoption name Threads value 1');
          this.send('setoption name Hash value 32');
          this.send('isready');
        }
        if (data.type === 'line') {
          if (data.line === 'readyok') { clearTimeout(timeout); this.status('ready', '棋友已就绪'); resolve(); }
          this.line(data.line);
        }
      };
      this.worker.postMessage({ type: 'init', jsUrl: BASE + 'pikafish.js', wasmUrl: BASE + 'pikafish.wasm', netUrls: Array.from({ length: 7 }, (_, i) => BASE + `pikafish.nnue.part${i}`) });
    });
  }
  send(command) { this.worker?.postMessage({ type: 'command', command }); }
  async search(fen, depth) {
    const epoch = ++this.epoch;
    this.stopPending();
    await this.init();
    if (epoch !== this.epoch) return aborted();
    const fields = fen.trim().split(/\s+/);
    if (fields.length === 4) fen = `${fields[0]} ${fields[1]} - - ${fields[2]} ${fields[3]}`;
    return new Promise(resolve => {
      this.queued = { fen, depth: Math.max(1, Math.min(14, Number(depth) || 2)), resolve, cancelled: false };
      this.drain();
    });
  }
  drain() {
    if (this.active || !this.queued) return;
    this.active = this.queued; this.queued = null;
    this.status('thinking', '对手正在思考…', { depth: 0 });
    this.send(`position fen ${this.active.fen}`);
    this.send(`go depth ${this.active.depth}`);
  }
  line(line) {
    if (line.startsWith('info depth') && this.active && !this.active.cancelled) {
      const depth = Number(line.match(/\bdepth (\d+)/)?.[1] || 0);
      const score = line.match(/\bscore (cp|mate) (-?\d+)/);
      this.status('thinking', '对手正在思考…', { depth, score: score ? { type: score[1], value: Number(score[2]) } : undefined });
    }
    if (!line.startsWith('bestmove') || !this.active) return;
    const active = this.active;
    this.active = null;
    const move = line.split(/\s+/)[1];
    active.resolve(!active.cancelled && /^[a-i][0-9][a-i][0-9]$/.test(move) ? move : null);
    if (this.queued) this.drain();
    else this.status('ready', '棋友已就绪');
  }
  stopPending() {
    if (this.queued) { this.queued.resolve(null); this.queued = null; }
    if (this.active && !this.active.cancelled) {
      this.active.cancelled = true;
      this.active.resolve(null);
      this.send('stop');
    }
  }
  cancel() { ++this.epoch; this.stopPending(); }
  destroy() { this.cancel(); this.worker?.terminate(); this.worker = null; this.active = null; this.initializing = null; }
}
export default Engine;
