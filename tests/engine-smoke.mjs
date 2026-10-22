import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/V/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const page = await browser.newPage();
page.on('pageerror', error => console.error('PAGE ERROR', error.message));
try {
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173');
  const result = await page.evaluate(async () => {
    const { Engine } = await import('/engine.js');
    const { fresh, legalMove } = await import('/rules.js');
    const status = [];
    const engine = new Engine(s => { if (s.state !== 'loading') status.push(s); });
    await engine.init();
    const fen = fresh().fen();
    const a = await engine.search(fen, 2);
    if (!a || !legalMove(fresh(), a)) throw new Error('Illegal depth2 move: ' + a);
    const b = await engine.search(fen, 14);
    if (!b || !legalMove(fresh(), b)) throw new Error('Illegal depth14 move: ' + b);
    const pending = engine.search(fen, 14);
    await new Promise(r => setTimeout(r, 10));
    engine.cancel();
    const cancelled = await pending;
    if (cancelled !== null) throw new Error('Cancel must resolve null');
    const c = await engine.search(fen, 2);
    if (!c || !legalMove(fresh(), c)) throw new Error('Illegal move after cancel: ' + c);
    engine.destroy();
    return { isolated: crossOriginIsolated, depth2: a, depth14: b, cancelled, afterCancel: c, maxDepth: Math.max(...status.map(s => s.depth || 0)) };
  });
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
