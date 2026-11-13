const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
function moduleUnderTest(){const result=esbuild.buildSync({entryPoints:['src/agenda-data.ts'],bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(m,m.exports,require);return m.exports;}
test('festival wording in titles and descriptions has one exclusive category',()=>{
 const {isFestival,splitAgenda}=moduleUnderTest();
 for(const field of ['title_zh','title_en','description','description_zh','notes_zh'])for(const word of ['Festival','festival','节日','节','Fiesta','Carnival'])assert.equal(isFestival({[field]:word}),true,field+word);
 assert.equal(isFestival({title_en:'Weekend market',description:'Local produce'}),false);
 const festival={id:'f',title_en:'Town Fiesta',dates:['2026-11-14'],town:'Hamilton'};
 const result=splitAgenda([festival,{id:'e',title_en:'Walk'}],[festival,{id:'m',title_en:'Market'}]);
 assert.deepEqual(result.picks.map(x=>x.id),['f','e']);assert.deepEqual(result.markets.map(x=>x.id),['m']);assert.deepEqual(result.festivals.map(x=>x.id),['f']);
});
test('actual data merges festivals into weekly picks by date',()=>{
 const {AGENDA}=moduleUnderTest();assert.equal(AGENDA.picks.length,37);assert.equal(AGENDA.markets.length,11);
 for (const id of ['asian-cultural-food','pacific-rose-bowl-festival-2026','pb-festival-2026-11-14-15']) assert.ok(AGENDA.picks.some(item=>item.id===id), id);
 const dates=AGENDA.picks.map(item=>Array.isArray(item.dates)&&item.dates.length?[...item.dates].sort()[0]:'9999-99-99');
 assert.deepEqual(dates, [...dates].sort());
});
