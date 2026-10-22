import {fresh,restore,legalMove,outcome,notation} from '../rules.js';
const alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ttl=48*60*60*1000;
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
async function digest(token){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');}
export function newGame(round=1,hostColor='white'){return {round,hostColor,fen:fresh().fen(),history:[],ended:null,ready:[],startedAt:Date.now()};}
function error(message,status=400){const err=new Error(message);err.status=status;throw err;}
function sideFor(state,player){return player==='host'?state.game.hostColor:state.game.hostColor==='white'?'black':'white';}
function snapshot(row,player){const state=JSON.parse(row.state);return {code:row.code,version:row.version,player,side:sideFor(state,player),joined:!!row.guest_hash,closed:!!state.closed,game:state.game,expiresAt:row.expires_at};}
export class RoomService{
  constructor(db){this.db=db;}
  async getRow(code){if(!/^[2-9A-HJ-NP-Z]{8}$/.test(code))error('请输入正确的八位邀请码');const row=await this.db.prepare('SELECT * FROM rooms WHERE code = ?').bind(code).first();if(!row||row.expires_at<Date.now())error('房间不存在或已过期',404);return row;}
  async player(row,token){if(!token||token.length!==64)error('请重新加入房间',401);const hash=await digest(token);if(hash===row.host_hash)return 'host';if(hash===row.guest_hash)return 'guest';error('没有该房间的入席凭证',403);}
  async create(color='white'){
    const token=randomToken(),hostHash=await digest(token),now=Date.now();
    for(let attempt=0;attempt<5;attempt++){
      const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>alphabet[x%alphabet.length]).join('');
      const state=JSON.stringify({game:newGame(1,color==='black'?'black':'white'),closed:false});
      const result=await this.db.prepare('INSERT OR IGNORE INTO rooms (code,host_hash,state,version,updated_at,expires_at) VALUES (?,?,?,0,?,?)').bind(code,hostHash,state,now,now+ttl).run();
      if(result.meta.changes){return {...snapshot(await this.getRow(code),'host'),token};}
    }
    error('暂时无法创建房间，请重试',503);
  }
  async join(code){const row=await this.getRow(code);if(JSON.parse(row.state).closed)error('这个房间已关闭',410);if(row.guest_hash)error('房间已经坐满了',409);const token=randomToken(),hash=await digest(token);const state=JSON.parse(row.state);state.game.startedAt=Date.now();const result=await this.db.prepare('UPDATE rooms SET guest_hash=?,state=?,version=version+1,updated_at=? WHERE code=? AND version=? AND guest_hash IS NULL').bind(hash,JSON.stringify(state),Date.now(),code,row.version).run();if(!result.meta.changes)error('房间已经坐满了',409);return {...snapshot(await this.getRow(code),'guest'),token};}
  async read(code,token){const row=await this.getRow(code);return snapshot(row,await this.player(row,token));}
  async action(code,token,body){
    const row=await this.getRow(code),player=await this.player(row,token),state=JSON.parse(row.state),game=state.game;
    if(state.closed)error('房间已关闭',410);
    if(body.round!==game.round)error('棋局已更新，请刷新后再试',409);
    const side=sideFor(state,player);
    if(body.action==='move'){
      if(!row.guest_hash)error('请等待棋友入席',409);
      if(game.ended)error('本局已经结束',409);
      if(body.version!==row.version)error('对方已更新棋局，请重新落子',409);
      const pos=restore(game.fen);if(pos.turn!==side)error('还没轮到你落子',409);
      if(typeof body.uci!=='string')error('走法无效');const move=legalMove(pos,body.uci);if(!move)error('这步棋不符合规则');
      const record={fen:pos.fen(),uci:body.uci,label:notation(pos,move),turn:pos.turn,capture:!!pos.board.get(move.to)};
      pos.play(move);record.check=pos.isCheck();game.history.push(record);game.fen=pos.fen();game.ended=outcome(pos);
      const key=pos.fen().split(' ').slice(0,2).join(' ');
      if(game.history.filter(h=>h.fen.split(' ').slice(0,2).join(' ')===key).length>=2)game.ended={winner:null,reason:'三次重复局面'};
    }else if(body.action==='resign'){
      if(!row.guest_hash||game.ended)error('当前不能认输',409);
      game.ended={winner:side==='white'?'black':'white',reason:'认输'};
    }else if(body.action==='rematch'){
      if(!row.guest_hash||!game.ended)error('本局结束后才能再来一局',409);
      if(!game.ready.includes(player))game.ready.push(player);
      if(game.ready.length===2)state.game=newGame(game.round+1,game.hostColor==='white'?'black':'white');
    }else if(body.action==='leave'){
      state.closed=true;
      if(!game.ended)game.ended={winner:row.guest_hash?(side==='white'?'black':'white'):null,reason:'对方离开房间'};
    }else error('未知操作');
    const result=await this.db.prepare('UPDATE rooms SET state=?,version=version+1,updated_at=?,expires_at=? WHERE code=? AND version=?').bind(JSON.stringify(state),Date.now(),Date.now()+ttl,code,row.version).run();
    if(!result.meta.changes)error('棋局已更新，请重试',409);
    return snapshot(await this.getRow(code),player);
  }
}
export async function handleRoomRequest(request,db){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  const localOrigin=origin&&/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowedOrigin=origin&&(origin===url.origin||localOrigin)?origin:null;
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Cross-Origin-Resource-Policy':'cross-origin','Vary':'Origin'};
  if(allowedOrigin){headers['Access-Control-Allow-Origin']=allowedOrigin;headers['Access-Control-Allow-Headers']='Authorization, Content-Type';headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';}
  if(request.method==='OPTIONS')return new Response(null,{status:allowedOrigin?204:403,headers});
  if(origin&&!allowedOrigin)return new Response(JSON.stringify({error:'请求来源不受支持'}),{status:403,headers});
  try{
    if(!db)error('联机服务正在准备，请稍后重试',503);
    if(request.method==='POST'&&Number(request.headers.get('Content-Length')||0)>4096)error('请求过长',413);
    let body={};if(request.method==='POST'){const raw=await request.text();if(raw.length>4096)error('请求过长',413);try{body=JSON.parse(raw||'{}');}catch{error('请求格式错误');}if(!body||typeof body!=='object'||Array.isArray(body))error('请求格式错误');}
    const service=new RoomService(db),token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
    let result;
    if(url.pathname==='/api/rooms'&&request.method==='POST')result=await service.create(body.side);
    else{
      const match=url.pathname.match(/^\/api\/rooms\/([2-9A-HJ-NP-Z]{8})(?:\/(join|action))?$/);
      if(!match)error('房间地址无效',404);
      if(!match[2]&&request.method==='GET')result=await service.read(match[1],token);
      else if(match[2]==='join'&&request.method==='POST')result=await service.join(match[1]);
      else if(match[2]==='action'&&request.method==='POST')result=await service.action(match[1],token,body);
      else error('操作方式不支持',405);
    }
    return new Response(JSON.stringify(result),{headers});
  }catch(err){return new Response(JSON.stringify({error:err.status?err.message:'暂时无法同步棋局，请重试'}),{status:err.status||500,headers});}
}
