import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {writeSitemap} from './scripts/generate-sitemap.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
process.chdir(root);
const dist=path.resolve(root,'dist');
if(path.dirname(dist)!==root || path.basename(dist)!=='dist')throw new Error('Unsafe build target');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(path.join(dist,'photos'),{recursive:true});
fs.cpSync('public/photos',path.join(dist,'photos'),{recursive:true});
for(const name of ['index.html'])fs.copyFileSync(name,path.join(dist,name));
fs.copyFileSync('public/favicon.svg',path.join(dist,'favicon.svg'));
for (const name of ['favicon-32.png','apple-touch-icon.png','icon-512.png']) fs.copyFileSync(path.join('public',name),path.join(dist,name));
fs.cpSync('public/brand',path.join(dist,'brand'),{recursive:true});
for(const name of ['robots.txt','og-image.jpg'])fs.copyFileSync(path.join('public',name),path.join(dist,name));
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'iife',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'},outfile:path.join(dist,'app.js')});
execFileSync(process.execPath,['node_modules/tailwindcss/lib/cli.js','-c','tailwind.config.js','-i','src/styles.css','-o',path.join(dist,'app.css'),'--minify'],{stdio:'inherit'});
fs.writeFileSync(path.join(dist,'app.css'),(fs.readFileSync('node_modules/leaflet/dist/leaflet.css','utf8')+'\n'+fs.readFileSync(path.join(dist,'app.css'),'utf8')+'\n'+fs.readFileSync('src/page-experience.css','utf8')).replace(/\r\n/g,'\n'));
fs.cpSync('node_modules/leaflet/dist/images',path.join(dist,'images'),{recursive:true});
fs.mkdirSync(path.join(dist,'licenses'),{recursive:true});
fs.cpSync('public/licenses',path.join(dist,'licenses'),{recursive:true});
fs.copyFileSync('node_modules/leaflet/LICENSE',path.join(dist,'licenses/Leaflet.txt'));
// Use the same records as the app; HTML remains useful before JavaScript runs.
const renderer = await build({entryPoints:['src/section-html.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {sectionDocument} = await import('data:text/javascript;base64,' + Buffer.from(renderer.outputFiles[0].text).toString('base64'));
const template = fs.readFileSync('index.html','utf8');
for (const route of ['home','living','weekend','kids','services','tools']) {
  const directory = route === 'home' ? dist : path.join(dist,route);
  fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,'index.html'),sectionDocument(template,route));
}
fs.writeFileSync(path.join(dist,'404.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, follow"><title>Page not found · Hamilton Local</title><link rel="stylesheet" href="/app.css"></head><body><main class="sb-container"><h1>Page not found / 页面未找到</h1><p><a href="/">Hamilton Local home / 首页</a></p><nav><a href="/living/">本地生活</a> · <a href="/weekend/">周末活动</a> · <a href="/kids/">亲子遛娃</a> · <a href="/services/">便民黄页</a> · <a href="/tools/">实用工具</a></nav></main></body></html>');
writeSitemap(dist);
console.log('BUILD_OK: dist (esbuild + Tailwind + local Leaflet)');
