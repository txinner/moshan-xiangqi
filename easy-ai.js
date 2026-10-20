import {makeUci} from 'xiangqiops/util.js';

const worth={king:100000,rook:1000,cannon:450,knight:400,advisor:200,bishop:200,pawn:100};
const profiles={novice:{randomChance:.45,risk:.05,choices:6},starter:{randomChance:.12,risk:.9,choices:2}};
function moves(position){return [...position.allDests()].flatMap(([from,dests])=>[...dests].map(to=>({from,to})));}
export function rankEasyMoves(position,difficulty){
  const profile=profiles[difficulty];
  if(!profile)throw new Error('Unknown easy difficulty');
  return moves(position).map(move=>{
    const piece=position.board.get(move.from);
    const captured=position.board.get(move.to);
    const next=position.clone();next.play(move);
    const replies=moves(next);
    if(!replies.length)return {uci:makeUci(move),score:1000000,winning:true};
    let threat=0;
    for(const reply of replies){
      const target=next.board.get(reply.to);
      if(!target)continue;
      const attacker=next.board.get(reply.from);
      const exchanged=next.clone();exchanged.play(reply);
      const canRecapture=[...exchanged.allDests().values()].some(dests=>dests.has(reply.to));
      // A defended piece is not a free loss: include the immediate recapture.
      const loss=worth[target.role]-(canRecapture?worth[attacker.role]:0);
      threat=Math.max(threat,loss);
    }
    const forward=(Math.floor(move.to/9)-Math.floor(move.from/9))*(piece.color==='white'?1:-1);
    const development=['knight','cannon','pawn'].includes(piece.role)?Math.max(-2,Math.min(2,forward))*5:0;
    const center=piece.role==='king'?0:(4-Math.abs(move.to%9-4))*2;
    return {uci:makeUci(move),score:(captured?worth[captured.role]:0)-profile.risk*threat+development+center+(next.isCheck()?8:0),winning:false};
  }).sort((a,b)=>b.score-a.score);
}
export function chooseEasyMove(position,difficulty,random=Math.random){
  const ranked=rankEasyMoves(position,difficulty);
  if(!ranked.length)return null;
  const winning=ranked.filter(move=>move.winning);
  if(winning.length)return winning[Math.min(winning.length-1,Math.floor(random()*winning.length))].uci;
  const profile=profiles[difficulty];
  // Unplanned moves create realistic, beatable mistakes; the next level makes fewer.
  const pool=random()<profile.randomChance?ranked:ranked.slice(0,profile.choices);
  return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))].uci;
}
