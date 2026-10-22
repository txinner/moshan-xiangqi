import {storage} from './storage.js';
export const effectEnabled=kind=>storage.getItem('moshan-effect-'+kind)!=='off';
export function setEffect(kind,on){storage.setItem('moshan-effect-'+kind,on?'on':'off');if(!on)document.querySelectorAll(kind==='capture'?'.capture-fx':'.check-fx').forEach(el=>el.remove());}
export function moveEffects({capture,check,destination,orientation='white'}){
  const frame=document.querySelector('.board-frame'),board=document.querySelector('cg-board');if(!frame||!board)return;
  if(capture&&effectEnabled('capture')){
    const box=board.getBoundingClientRect(),outer=frame.getBoundingClientRect(),file=destination.charCodeAt(0)-97,rank=Number(destination[1]);
    const x=orientation==='white'?file:8-file,y=orientation==='white'?9-rank:rank;
    const el=document.createElement('div');el.className='capture-fx';el.setAttribute('aria-hidden','true');el.style.left=box.left-outer.left+(x+.5)*box.width/9+'px';el.style.top=box.top-outer.top+(y+.5)*box.height/10+'px';
    el.innerHTML='<i class="capture-ring"></i>'+Array.from({length:8},(_,i)=>`<i class="capture-spark" style="--angle:${i*45}deg"></i>`).join('');frame.append(el);setTimeout(()=>el.remove(),850);
  }
  if(check&&effectEnabled('check')){
    const el=document.createElement('div');el.className='check-fx';el.setAttribute('aria-hidden','true');el.innerHTML='<span>将军</span>';frame.append(el);setTimeout(()=>el.remove(),1150);
  }
}
