const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
function load(){const r=esbuild.buildSync({entryPoints:['src/experience-model.ts'],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent'});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);return m.exports;}
test('NZ seasons include November spring and cycle spring summer autumn winter',()=>{
 const {seasonForMonth,nextSeason}=load();
 assert.deepEqual(Array.from({length:12},(_,i)=>seasonForMonth(i+1)),['summer','summer','autumn','autumn','autumn','winter','winter','winter','spring','spring','spring','summer']);
 let s='spring';const seen=[];for(let i=0;i<5;i++){seen.push(s);s=nextSeason(s);}assert.deepEqual(seen,['spring','summer','autumn','winter','spring']);
});
test('train journeys keep the four scenes and include seven new views before looping',()=>{
 const {SCENES,nextScene}=load();assert.equal(SCENES.length,11);let i=0;const seen=[];for(let n=0;n<12;n++){seen.push(i);i=nextScene(i);}assert.deepEqual(seen,[0,1,2,3,4,5,6,7,8,9,10,0]);assert.equal(new Set(SCENES.map(s=>s.src)).size,11);
});
