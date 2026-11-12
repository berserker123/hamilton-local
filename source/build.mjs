import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
process.chdir(root);
const dist=path.resolve(root,'dist');
if(path.dirname(dist)!==root || path.basename(dist)!=='dist')throw new Error('Unsafe build target');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(path.join(dist,'photos'),{recursive:true});
fs.cpSync('public/photos',path.join(dist,'photos'),{recursive:true});
fs.copyFileSync('public/favicon.svg',path.join(dist,'favicon.svg'));
fs.copyFileSync(path.join('public','og-image.jpg'),path.join(dist,'og-image.jpg'));
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'iife',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'},outfile:path.join(dist,'app.js')});
execFileSync(process.execPath,['node_modules/tailwindcss/lib/cli.js','-c','tailwind.config.js','-i','src/styles.css','-o',path.join(dist,'app.css'),'--minify'],{stdio:'inherit'});
fs.writeFileSync(path.join(dist,'app.css'),fs.readFileSync('node_modules/leaflet/dist/leaflet.css','utf8')+'\n'+fs.readFileSync(path.join(dist,'app.css'),'utf8')+'\n'+fs.readFileSync('src/page-experience.css','utf8'));
fs.cpSync('node_modules/leaflet/dist/images',path.join(dist,'images'),{recursive:true});
fs.mkdirSync(path.join(dist,'licenses'),{recursive:true});
fs.cpSync('public/licenses',path.join(dist,'licenses'),{recursive:true});
fs.copyFileSync('node_modules/leaflet/LICENSE',path.join(dist,'licenses/Leaflet.txt'));
const {PAGES,ALIASES,renderDocument,renderNotFound,renderAlias,renderSitemap,renderRobots}=await import('./src/site-routes.mjs');
for(const page of PAGES){
  const dir=page.path==='/'?dist:path.join(dist,page.path.slice(1));
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),renderDocument(page));
}
for(const [alias,target] of ALIASES){
  const dir=path.join(dist,alias);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),renderAlias(target));
}
const sitemap=renderSitemap();
const robots=renderRobots();
fs.writeFileSync(path.join(dist,'404.html'),renderNotFound());
fs.writeFileSync(path.join(dist,'sitemap.xml'),sitemap);
fs.writeFileSync(path.join(dist,'robots.txt'),robots);
fs.writeFileSync(path.join('public','sitemap.xml'),sitemap);
fs.writeFileSync(path.join('public','robots.txt'),robots);
const repoRoot=path.resolve(root,'..');
const cname=path.join(repoRoot,'CNAME');
if(fs.existsSync(cname))fs.copyFileSync(cname,path.join(dist,'CNAME'));
fs.cpSync(dist,repoRoot,{recursive:true,force:true});
console.log('BUILD_OK: dist (esbuild + Tailwind + local Leaflet) + '+PAGES.length+' pages');
