const production='https://moshan-xiangqi.ampleelm4.chatgpt.site';
const local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
export const roomApiBase=local&&!new URLSearchParams(location.search).has('localRooms')?production:'';
export function parseRoomCode(value){try{if(value.includes('://'))value=new URL(value).hash.replace(/^#room=/,'');}catch{}return value.toUpperCase().replace(/[\s-]/g,'');}
export class RoomClient{
  constructor(onChange,onError){this.onChange=onChange;this.onError=onError;this.session=null;this.stopped=true;this.timer=null;this.inflight=false;}
  static saved(){try{return JSON.parse(sessionStorage.getItem('moshan-room-session'));}catch{return null;}}
  save(session){this.session=session;try{sessionStorage.setItem('moshan-room-session',JSON.stringify(session));}catch{}}
  async request(path,body){
    const response=await fetch(roomApiBase+'/api/rooms'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(this.session?.token?{Authorization:'Bearer '+this.session.token}:{})},credentials:'omit',body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
    const data=await response.json().catch(()=>({error:'联机服务暂不可用'}));
    if(!response.ok){const error=new Error(data.error||'暂时无法同步棋局');error.status=response.status;throw error;}return data;
  }
  async create(side){const result=await this.request('',{side});this.save({code:result.code,token:result.token});return result;}
  async join(code){const result=await this.request('/'+parseRoomCode(code)+'/join',{});this.save({code:result.code,token:result.token});return result;}
  async resume(){const saved=RoomClient.saved();if(!saved)throw new Error('没有可继续的房间');this.session=saved;return this.refresh();}
  async refresh(){if(!this.session)return null;return this.request('/'+this.session.code);}
  async action(action,snapshot,extra={}){
    try{const data=await this.request('/'+this.session.code+'/action',{action,version:snapshot.version,round:snapshot.game.round,...extra});this.onChange(data);return data;}
    catch(error){if(error.status===409){try{this.onChange(await this.refresh());}catch{}}throw error;}
  }
  start(){this.stopped=false;this.poll();}
  async poll(){if(this.stopped)return;try{const data=await this.refresh();if(!this.stopped)this.onChange(data);}catch(error){if(!this.stopped)this.onError(error);}finally{if(!this.stopped)this.timer=setTimeout(()=>this.poll(),1200);}}
  stop(){this.stopped=true;clearTimeout(this.timer);}
  clear(){this.stop();this.session=null;try{sessionStorage.removeItem('moshan-room-session');}catch{}}
  inviteUrl(){const base=roomApiBase||location.origin;return base+'/'+(roomApiBase?'':location.search)+'#room='+this.session.code;}
}
