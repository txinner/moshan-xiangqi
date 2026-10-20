import assert from 'node:assert/strict';
import {fresh,restore,legalMove} from '../rules.js';
import {levels,resolveLevel} from '../difficulty.js';
import {chooseEasyMove,rankEasyMoves} from '../easy-ai.js';
assert.deepEqual(levels.map(level=>level.tag),['新手','入门','初级','进阶','高手','大师','宗师']);
assert.deepEqual(levels.slice(2).map(level=>level.depth),[2,5,8,11,14]);
for(let old=0;old<5;old++)assert.equal(resolveLevel(null,old),old+2);
assert.equal(resolveLevel('novice',4),0);assert.equal(resolveLevel('starter',null),1);
assert.equal(resolveLevel('master',0),5);assert.equal(resolveLevel(null,null),0);
assert.equal(resolveLevel('invalid','bad'),0);
assert.ok(rankEasyMoves(fresh(),'starter').slice(0,2).every(row=>!['b2b9','h2h9'].includes(row.uci)),'entry level should not open with a losing cannon exchange');
let seed=12345;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(const difficulty of ['novice','starter']){
  const position=fresh();const original=position.fen();
  for(let i=0;i<8;i++)assert.ok(legalMove(position,chooseEasyMove(position,difficulty,random)));
  assert.equal(position.fen(),original,'selection must not mutate the game');
  for(let ply=0;ply<24&&position.hasDests();ply++){
    const move=legalMove(position,chooseEasyMove(position,difficulty,random));
    assert.ok(move,'every generated move must be legal');position.play(move);
  }
}
const trap=restore('r3k4/9/9/p8/9/4P4/9/9/9/R3K4 w 0 1');
const novice=rankEasyMoves(trap,'novice'),starter=rankEasyMoves(trap,'starter');
const risky=rows=>rows.find(row=>row.uci==='a0a6');
assert.ok(risky(novice).score>risky(starter).score+500,'entry level accounts for losing a rook');
assert.ok(starter.slice(0,2).every(row=>row.uci!=='a0a6'));
assert.ok(novice.some(row=>row.uci==='a0a6'));
const checked=restore('4k4/9/9/9/4p4/9/9/4r4/9/4K4 w 0 1');
for(const difficulty of ['novice','starter'])assert.ok(legalMove(checked,chooseEasyMove(checked,difficulty,random)),'check must be answered legally');
const lost=restore('4k4/9/9/9/9/9/9/4r4/3r1r3/4K4 w 0 1');
assert.equal(chooseEasyMove(lost,'novice'),null);
console.log('PASS: seven levels, original strength, save migration, legal play, check evasion, terminal position, risk separation.');
