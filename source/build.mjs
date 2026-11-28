import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {renderFeed} from './src/feed.mjs';
import {PAGES,renderDocument,renderNotFound,renderSitemap} from './src/site-routes.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
process.chdir(root);
const dist=path.resolve(root,'dist');
if(path.dirname(dist)!==root || path.basename(dist)!=='dist')throw new Error('Unsafe build target');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(path.join(dist,'photos'),{recursive:true});
fs.cpSync('public/photos',path.join(dist,'photos'),{recursive:true});
fs.copyFileSync('public/favicon.svg',path.join(dist,'favicon.svg'));
for (const name of ['favicon-32.png','apple-touch-icon.png','icon-512.png','icon-192.png','icon-512-maskable.png']) fs.copyFileSync(path.join('public',name),path.join(dist,name));
fs.cpSync('public/brand',path.join(dist,'brand'),{recursive:true});
for(const name of ['robots.txt','og-image.jpg','manifest.webmanifest','sw.js'])fs.copyFileSync(path.join('public',name),path.join(dist,name));
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
// 一键查 address data, fetched only when the lookup tool opens.
const lookupFiles=fs.readdirSync('public/lookup').filter(name=>name.endsWith('.json')).map(name=>'lookup/'+name);
fs.mkdirSync(path.join(dist,'lookup'),{recursive:true});
for(const name of lookupFiles)fs.copyFileSync(path.join('public',name),path.join(dist,name));
await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'iife',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'},outfile:path.join(dist,'app.js')});
execFileSync(process.execPath,['node_modules/tailwindcss/lib/cli.js','-c','tailwind.config.js','-i','src/styles.css','-o',path.join(dist,'app.css'),'--minify'],{stdio:'inherit'});
fs.writeFileSync(path.join(dist,'app.css'),fs.readFileSync('node_modules/leaflet/dist/leaflet.css','utf8')+'\n'+fs.readFileSync(path.join(dist,'app.css'),'utf8')+'\n'+fs.readFileSync('src/page-experience.css','utf8'));
fs.cpSync('node_modules/leaflet/dist/images',path.join(dist,'images'),{recursive:true});
fs.mkdirSync(path.join(dist,'licenses'),{recursive:true});
fs.cpSync('public/licenses',path.join(dist,'licenses'),{recursive:true});
fs.copyFileSync('node_modules/leaflet/LICENSE',path.join(dist,'licenses/Leaflet.txt'));
const template=fs.readFileSync('index.html','utf8');
const repoRoot=path.resolve(root,'..');
const generated=['app.js','manifest.webmanifest','sw.js','icon-192.png','icon-512-maskable.png','app.css','404.html','sitemap.xml','feed.xml',...lookupFiles,...PAGES.map(page=>page.path.slice(1)+'index.html')];
for(const page of PAGES){
  const file=path.join(dist,page.path.slice(1),'index.html');
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,renderDocument(template,page));
}
fs.writeFileSync(path.join(dist,'404.html'),renderNotFound(template));
const sitemap=renderSitemap();
fs.writeFileSync(path.join(dist,'sitemap.xml'),sitemap);
fs.writeFileSync(path.join(root,'public','sitemap.xml'),sitemap);
fs.writeFileSync(path.join(dist,'feed.xml'),renderFeed(root));
// The deployed repository serves its root. Copy only generated code/HTML/XML;
// keep the existing assets, CNAME and README exactly as they are.
// The daily briefing was retired: remove its old article folders from the deployed root.
fs.rmSync(path.join(repoRoot,'news'),{recursive:true,force:true});
for(const name of generated){
  const target=path.join(repoRoot,name);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(path.join(dist,name),target);
}
console.log('BUILD_OK: dist + root deployment files ('+PAGES.length+' canonical pages)');
