const {test}=require('node:test'),assert=require('node:assert/strict'),esbuild=require('esbuild');
function load(){const r=esbuild.buildSync({entryPoints:['src/cord-picks.ts'],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent'});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);return m.exports;}
test('shuffle visits every pick once and avoids the previous pick at cycle boundaries',()=>{
 const {createDrawBag}=load();const draw=createDrawBag(()=>.37);let previous;for(let cycle=0;cycle<8;cycle++){const seen=[];for(let i=0;i<7;i++){const next=draw(['a','b','c','d','e','f','g']);assert.notEqual(next,previous);seen.push(next);previous=next;}assert.equal(new Set(seen).size,7);}assert.equal(draw([]),undefined);assert.equal(draw(['only']),'only');
});
test('family draws use real playgrounds and venues; events must be explicit family records and current',()=>{
 const {familyPicks}=load();const picks=familyPicks('2026-11-11');assert.equal(picks.filter(p=>p.type==='playground').length,12);assert.ok(picks.some(p=>p.type==='venue'));for(const p of picks){assert.ok(p.name.zh&&p.name.en&&p.info.zh&&p.href);if(p.type==='event')assert.ok(p.dates.some(d=>d>='2026-11-11'));}assert.equal(familyPicks('2099-01-01').filter(p=>p.type==='event').length,0);assert.equal(new Set(picks.map(p=>p.id)).size,picks.length);
});
