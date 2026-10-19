import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat,realpath} from 'node:fs/promises';
import {resolve,relative,extname,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=await realpath(fileURLToPath(new URL('./dist/',import.meta.url)));
const noOpen=process.argv.includes('--no-open')||process.env.MOSHAN_NO_OPEN==='1';
const portFlag=process.argv.indexOf('--port');
const firstPort=portFlag<0?18765:Number(process.argv[portFlag+1]);
if(!Number.isInteger(firstPort)||firstPort<1024||firstPort>65515)throw new Error('Invalid port.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.zip':'application/zip'};
const identity={app:'moshan-xiangqi-local',root};
function openBrowser(url){
  if(noOpen)return;
  const command=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Start-Process -FilePath '${url}'`],{windowsHide:true,stdio:'ignore'});
  command.on('error',()=>console.log('Open this address in your browser: '+url));
  command.unref();
}
async function serve(req,res){
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-cache');
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(pathname==='/__moshan__/health'){
      res.setHeader('Content-Type','application/json');res.end(req.method==='HEAD'?undefined:JSON.stringify(identity));return;
    }
    const candidate=resolve(root,'.'+pathname.replaceAll('\\','/'),pathname.endsWith('/')?'index.html':'');
    const rel=relative(root,candidate);
    if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel)){res.writeHead(403);res.end();return;}
    // Resolve links too, so this service can only expose files inside dist.
    const actual=await realpath(candidate);
    const actualRel=relative(root,actual);
    if(actualRel==='..'||actualRel.startsWith('..'+sep)||isAbsolute(actualRel)){res.writeHead(403);res.end();return;}
    const info=await stat(actual);
    if(!info.isFile()){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',types[extname(actual)]||'application/octet-stream');
    res.setHeader('Content-Length',info.size);
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(actual);
    stream.on('error',()=>res.destroy());
    res.on('close',()=>stream.destroy());
    stream.pipe(res);
  }catch(error){res.writeHead(error instanceof URIError?400:error.code==='ENOENT'?404:500);res.end('Unable to load this file.');}
}
let running;
for(let port=firstPort;port<firstPort+20;port++){
  const server=http.createServer(serve);
  const error=await new Promise(resolve=>{server.once('error',resolve);server.listen(port,'127.0.0.1',()=>resolve(null));});
  const url=`http://127.0.0.1:${port}/`;
  if(!error){
    running=server;
    console.log('\nMO SHAN XIANGQI\n'+url+'\n\nKeep this window open while playing.\nClose it or press Ctrl+C to stop the game server.\n');
    openBrowser(url);break;
  }
  if(error.code!=='EADDRINUSE')throw error;
  try{
    const reply=await fetch(url+'__moshan__/health',{signal:AbortSignal.timeout(1500)});
    const data=await reply.json();
    if(data.app===identity.app&&data.root===root){console.log('Game is already running: '+url);openBrowser(url);process.exit(0);}
  }catch{}
}
if(!running)throw new Error('No available port. Close other local servers and try again.');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{running.close();running.closeAllConnections();});
