const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
function load(){const result=esbuild.buildSync({entryPoints:['src/home-guide-data.ts'],bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(m,m.exports,require);return m.exports;}
test('homepage counts reflect actual party, playground and non-festival pick records',()=>{
 const {guideStats}=load();
 const stats=guideStats(9);
 assert.deepEqual(stats.map(s=>s.count),[118,12,37,9]);
 assert.deepEqual(stats.map(s=>s.href),['#/kids?tab=parties','#/kids?tab=map','#/weekend?tab=picks','#/services?tab=home']);
 assert.match(stats[3].note.en,/No listings/);
 assert.equal(guideStats(0)[3].count,0);
});
test('count helper counts unique records and preview picks exclude festivals',()=>{
 const {uniqueCount,PREVIEW_PICKS}=load();
 assert.equal(uniqueCount([{id:'a'},{id:'a'},{id:'b'}]),2);
 assert.equal(uniqueCount([]),0);
 assert.equal(PREVIEW_PICKS.length,3);
 const data=require('../src/events-and-markets.json');
 for(const item of PREVIEW_PICKS){assert.ok(data.events_this_week.some(e=>e.id===item.id));assert.doesNotMatch(item.title_en,/festival|fiesta|carnival/i);assert.ok(item.dates.length);}
});
