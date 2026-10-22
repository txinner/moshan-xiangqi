// Usage: node scripts/import-endgames.mjs path/to/shiqingyaqu551.fen
// Upstream: https://github.com/kuiba1949/xiangqi-tools/blob/a422f57cec467d2cc3e95a057ae0740a490f16f8/fen/shiqingyaqu551.fen
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Chess } from 'xiangqiops/chess.js';
import { parseFen } from 'xiangqiops/fen.js';

const bytes = readFileSync(process.argv[2]);
const source = bytes.toString('utf8');
const matches = [...source.matchAll(/\[FEN_INDEX "([^"]+)"\]\s*\[EVENT "([^"]+)"\]\s*\[FEN "([^"]+)"\]/g)];
const stats = { parsed: 0, noMoves: 0, oppositeCheck: 0, duplicate: 0 };
const seen = new Set();
const candidates = [];
for (const [, id, event, rawFen] of matches) {
  const fen = rawFen.replace(' - -', '');
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  stats.parsed++;
  if (!position.hasDests()) { stats.noMoves++; continue; }
  const other = position.clone();
  other.turn = position.turn === 'white' ? 'black' : 'white';
  if (other.isCheck()) { stats.oppositeCheck++; continue; }
  const board = fen.split(' ')[0];
  if (seen.has(board)) { stats.duplicate++; continue; }
  seen.add(board);
  const number = Number(id.split('-').at(-1));
  const title = event.replace(/^.*第\d+局\s*/, '').replaceAll('*', '').trim();
  candidates.push({ id, title, fen: position.fen(), source: `适情雅趣 · 第${number}局`, sourceUrl: `https://github.com/kuiba1949/xiangqi-tools/blob/a422f57cec467d2cc3e95a057ae0740a490f16f8/fen/shiqingyaqu551.fen#L${source.slice(0, source.indexOf(`[FEN_INDEX "${id}"]`)).split('\n').length}` });
}
if (candidates.length < 150) throw new Error('Not enough verified unique positions');
// Spread the selection throughout the book, preserving the source order.
const selected = Array.from({ length: 150 }, (_, i) => candidates[Math.floor(i * (candidates.length - 1) / 149)]);
if (new Set(selected.map(p => p.fen)).size !== 150) throw new Error('Duplicate selected positions');
writeFileSync(new URL('../public/endgames.json', import.meta.url), JSON.stringify(selected, null, 2) + '\n');
console.log(JSON.stringify({ sha256: createHash('sha256').update(bytes).digest('hex'), ...stats, candidates: candidates.length, selected: selected.length }, null, 2));
