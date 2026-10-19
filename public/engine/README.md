# Pikafish WebAssembly assets

Source: https://github.com/brianhliou/pikafish-wasm , release **v0.1.0**.
Upstream engine: https://github.com/official-pikafish/Pikafish at
`6a59ee2f7b105bff64d9efc2692591107787e2b1`.
The exact source patch and build script are included; use Emscripten 3.1.74
and follow the upstream repository build instructions to reproduce.

Engine code: GPL-3.0-or-later, see LICENSE. Neural network: see NNUE-License.md;
the publisher prohibits commercial use without permission.

Original release hashes are in SHA256SUMS. The downloaded JavaScript, WASM,
and NNUE were verified against all three hashes. The 50,706,378-byte NNUE is
split into seven `pikafish.nnue.part0` through `.part6` assets, each at most
8 MiB, to work with static hosting file-size limits. Concatenation in numeric
order reproduces the original network exactly. `worker.js` is adapted from
the same repository to load these seven chunks sequentially with progress.

JavaScript: 80,121 bytes. WASM: 662,419 bytes. NNUE: 50,706,378 bytes.
Pthreads and SIMD are required even with Threads=1. Serve over HTTPS (or
localhost), ideally with COOP=same-origin and COEP=require-corp. The app's
isolation-sw.js supplies a service-worker fallback on static hosts and reloads
the page once. Browsers or embedded previews that block isolation/service
workers cannot run this engine; use a modern browser tab.

Adapter API in ../../engine.js: `new Engine(onStatus)`, `await init()`,
`await search(fen, depth)` -> UCI move string or null, `cancel()`, `destroy()`.
Cancellation resolves null immediately but drains the old UCI bestmove before
starting a queued search, preventing stale moves after undo or restart.
Status callback receives `{state, message, progress?, depth?, score?}`.
Search depth is capped at 14, without a time cutoff, so selected depth is real.
