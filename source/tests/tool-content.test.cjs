const {test}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const esbuild=require('esbuild');
function load(entry){const r=esbuild.buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,external:['react']});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);return m.exports;}
const zh=(zh,en)=>zh;
test('all new content records use official fetched source IDs, and five checklists include steps/materials/time/cost',()=>{
 const sources=require('../src/tool-sources.json'),ids=new Set(sources.map(s=>s.id));
 assert.equal(ids.size,sources.length);
 for(const source of sources)assert.match(new URL(source.url).hostname,/(?:\.govt\.nz|\.health\.nz|\.anz\.co\.nz)$/);
 const {ARRIVAL_STEPS}=load('src/tool-content.ts');
 assert.equal(ARRIVAL_STEPS.length,5);
 for(const card of ARRIVAL_STEPS){assert.equal(card.stepsZh.length,4);assert.equal(card.stepsEn.length,4);for(const field of ['bringZh','timeZh','costZh','bringEn','timeEn','costEn'])assert.ok(card[field]);for(const id of card.sources)assert.ok(ids.has(id));}
});
test('SSR checklist has five accessible summaries, numbered instructions and dated sources',()=>{
 const {ArrivalChecklist}=load('src/PracticalTools.tsx');
 const html=renderToStaticMarkup(React.createElement(ArrivalChecklist,{t:zh}));
 assert.equal((html.match(/<summary>/g)||[]).length,5);
 assert.equal((html.match(/<ol>/g)||[]).length,5);
 assert.equal((html.match(/资料更新于 2026-11/g)||[]).length,5);
 assert.match(html,/New Arrival Checklist/);assert.match(html,/待确认/);
});
test('seasonal rules preserve key species, closure override and November restrictions',()=>{
 const {SeasonalReminders}=load('src/PracticalTools.tsx');
 const html=renderToStaticMarkup(React.createElement(SeasonalReminders,{t:zh}));
 assert.match(html,/2026-11-01/);assert.match(html,/SCA CS 全面关闭/);assert.match(html,/2 米/);
 assert.match(html,/2026-09-01/);assert.match(html,/0800 611 116/);
 assert.equal((html.match(/data-shellfish=/g)||[]).length,10);
 assert.equal((html.match(/资料更新于 2026-11/g)||[]).length,6);
});
