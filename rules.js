import { Chess } from 'xiangqiops/chess.js';
import { parseFen } from 'xiangqiops/fen.js';
import { parseUci, makeSquare } from 'xiangqiops/util.js';
export const fresh = () => Chess.default();
export const restore = fen => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
// xiangqiground 0.1 uses ranks 1–10; xiangqiops / UCI use 0–9.
export const toGround = k => k[0] + (Number(k.slice(1)) + 1);
export const fromGround = k => k[0] + (Number(k.slice(1)) - 1);
export function destinations(pos) { return new Map([...pos.allDests()].map(([s,d])=>[toGround(makeSquare(s)),[...d].map(x=>toGround(makeSquare(x)))])); }
export function legalMove(pos,uci) {const m=parseUci(uci);return m && pos.isLegal(m)?m:null;}
export function outcome(pos) { // Chinese chess: stalemate is a loss, unlike chess.
  if (!pos.hasDests()) return {winner:pos.turn==='white'?'black':'white',reason:pos.isCheck()?'将死':'困毙'};
  if(pos.halfmoves>=120)return {winner:null,reason:'六十回合无吃子'};
  return null;
}
const chars={white:{king:'帅',advisor:'仕',bishop:'相',knight:'马',rook:'车',cannon:'炮',pawn:'兵'},black:{king:'将',advisor:'士',bishop:'象',knight:'马',rook:'车',cannon:'炮',pawn:'卒'}};
export function notation(pos,m) {const p=pos.board.get(m.from);const file=s=>p.color==='white'?'九八七六五四三二一'[s%9]:String(s%9+1);const a=Math.floor(m.from/9),b=Math.floor(m.to/9);return chars[p.color][p.role]+file(m.from)+(a===b?'平':(b>a)===(p.color==='white')?'进':'退')+(['knight','bishop','advisor'].includes(p.role)||a===b?file(m.to):p.color==='white'?'〇一二三四五六七八九'[Math.abs(b-a)]:Math.abs(b-a));}
