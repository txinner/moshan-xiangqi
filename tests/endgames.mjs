import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {restore,outcome} from '../rules.js';
const entries=JSON.parse(await readFile(new URL('../public/endgames.json',import.meta.url),'utf8'));
assert.ok(entries.length>=100&&entries.length<=200);assert.equal(new Set(entries.map(entry=>entry.id)).size,entries.length);assert.equal(new Set(entries.map(entry=>entry.fen.split(' ')[0])).size,entries.length);
for(const entry of entries){assert.ok(entry.title&&entry.source);assert.ok(entry.sourceUrl.startsWith('https://github.com/kuiba1949/xiangqi-tools/'));const position=restore(entry.fen);assert.ok(position.board.kingOf('white')!==undefined);assert.ok(position.board.kingOf('black')!==undefined);assert.ok(position.hasDests());assert.equal(outcome(position),null);}
console.log(`PASS: ${entries.length} named, sourced, unique, playable historical endgames.`);
