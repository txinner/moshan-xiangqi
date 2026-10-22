import {defineConfig} from 'vite';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const headers={'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'};
// The menu must not wait for module requests or third-party stylesheets.
function inlineStartup(){
  let outputDirectory;
  return {name:'moshan-inline-startup',apply:'build',enforce:'post',
    configResolved(config){outputDirectory=resolve(config.root,config.build.outDir);},
    writeBundle(){
      const entry=resolve(outputDirectory,'index.html');
      let html=readFileSync(entry,'utf8');
      html=html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,(_,src)=>{
        const code=readFileSync(resolve(outputDirectory,src.replace(/^\//,'')),'utf8').replace(/<\/script/gi,'<\\/script');
        return `<script>${code}</script>`;
      });
      html=html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,(_,href)=>{
        const css=readFileSync(resolve(outputDirectory,href.replace(/^\//,'')),'utf8');
        return `<style>${css}</style>`;
      });
      // Vite puts entry scripts in <head>; classic inline execution needs the app container first.
      const scripts=[...html.matchAll(/<script>[\s\S]*?<\/script>/g)].map(match=>match[0]);
      html=html.replace(/<script>[\s\S]*?<\/script>/g,'').replace('</body>',()=>scripts.join('')+'</body>');
      writeFileSync(entry,html);
    }};
}
export default defineConfig({plugins:[inlineStartup()],server:{headers},preview:{headers},build:{outDir:'dist/client',target:'es2022',modulePreload:false,cssCodeSplit:false,rollupOptions:{output:{format:'iife',inlineDynamicImports:true}}}});
