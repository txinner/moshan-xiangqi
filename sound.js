import {storage} from './storage.js';
let ctx; let enabled=storage.getItem('moshan-sound')!=='off';
export const soundOn=()=>enabled;
export function toggleSound(){enabled=!enabled;storage.setItem('moshan-sound',enabled?'on':'off');return enabled;}
export function sound(kind='move'){if(!enabled)return;try{ctx??=new AudioContext();ctx.resume();const now=ctx.currentTime;const tones={move:[320],select:[600],capture:[180,120],check:[440,660,440],win:[392,494,587,784],lose:[392,330,262],start:[262,392,523]}[kind]||[320];tones.forEach((hz,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=kind==='move'||kind==='capture'?'triangle':'sine';o.frequency.setValueAtTime(hz,now+i*.13);o.frequency.exponentialRampToValueAtTime(hz*.65,now+i*.13+.18);g.gain.setValueAtTime(.0001,now+i*.13);g.gain.exponentialRampToValueAtTime(.16,now+i*.13+.008);g.gain.exponentialRampToValueAtTime(.0001,now+i*.13+.3);o.connect(g).connect(ctx.destination);o.start(now+i*.13);o.stop(now+i*.13+.32);});}catch{}}
