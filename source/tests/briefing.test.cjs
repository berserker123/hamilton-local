const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(entry){const r=esbuild.buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,external:['react','react-dom','lucide-react'],loader:{'.json':'json'}});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);return m.exports;}
const model=load('src/briefing-model.ts');
const {BriefingView}=load('src/Briefing.tsx');
const CATS=['breaking','police','council','roads','weather','civil_defence','news'];
const item=(id,o={})=>({id,source:'S',title:'Title '+id,url:'https://x.test/'+id,published:'2026-11-17T01:00:00Z',summary:'ENGLISH BODY '+id,category:'news',urgent:false,...o});
const t=(zh)=>zh;
const html=(data)=>renderToStaticMarkup(React.createElement(BriefingView,{data,t,now:Date.parse('2026-11-17T05:00:00Z')}));
test('category label map covers every schema category with Chinese labels',()=>{
 for(const c of CATS)assert.match(model.CATEGORY_LABELS[c],/^\p{Script=Han}+$/u);
 assert.deepEqual(Object.keys(model.CATEGORY_LABELS).sort(),[...CATS].sort());
});
test('sort puts urgent first, then newest first',()=>{
 const s=model.sortItems([item('a',{published:'2026-11-17T03:00:00Z'}),item('b',{published:'2026-11-17T01:00:00Z',urgent:true}),item('c',{published:'2026-11-17T04:00:00Z'})]);
 assert.deepEqual(s.map(i=>i.id),['b','c','a']);
});
test('summary_zh is used, falling back to the English title',()=>{
 assert.equal(model.itemText(item('a',{summary_zh:'中文摘要'})),'中文摘要');
 assert.equal(model.itemText(item('b')),'Title b');
});
test('English summary body is never rendered',()=>{
 const out=html({generated_at:'2026-11-17T05:30:00Z',items:[item('a'),item('b',{summary_zh:'中文'})]});
 assert.doesNotMatch(out,/ENGLISH BODY/);
 assert.match(out,/Title a/);assert.match(out,/rel="noopener noreferrer"/);assert.match(out,/target="_blank"/);
});
test('unknown categories are hidden',()=>{
 const out=html({generated_at:'2026-11-17T05:30:00Z',items:[item('a'),item('z',{category:'sport',title:'HIDDEN'})]});
 assert.doesNotMatch(out,/HIDDEN/);assert.match(out,/Title a/);
});
test('示例数据 pill only when sample is true',()=>{
 const base={generated_at:'2026-11-17T05:30:00Z',items:[item('a')]};
 assert.match(html({...base,sample:true}),/示例数据/);
 assert.doesNotMatch(html(base),/示例数据/);
});
test('shows at most 6 with a count derived from data, and updated time in Auckland',()=>{
 const items=Array.from({length:9},(_,i)=>item('i'+i));
 const out=html({generated_at:'2026-11-17T05:30:00Z',items});
 assert.equal((out.match(/class="hl-brief-item/g)||[]).length,6);
 assert.match(out,/查看全部 9 条/);
 assert.match(out,/更新于 11月17日 18:30/);
});

test('date_only items show 今天 / 昨天 / M月D日 in NZ time; others stay relative',()=>{
 const now=Date.parse('2026-11-17T06:30:00Z'); // 19:30 NZ, 17 Nov
 assert.equal(model.itemTime({published:'2026-11-17T00:00:00+13:00',date_only:true},now),'今天');
 assert.equal(model.itemTime({published:'2026-11-16T00:00:00+13:00',date_only:true},now),'昨天');
 assert.equal(model.itemTime({published:'2026-11-14T00:00:00+13:00',date_only:true},now),'11月14日');
 assert.equal(model.itemTime({published:'2026-11-17T06:00:00Z'},now),'30分钟前');
 assert.equal(model.itemTime({published:'2026-11-17T00:00:00+13:00',date_only:false},now),'19小时前');
 const out=html({generated_at:'2026-11-17T05:30:00Z',items:[item('d',{published:'2026-11-17T00:00:00+13:00',date_only:true,category:'council'})]});
 assert.match(out,/今天/);assert.doesNotMatch(out,/分钟前|小时前/);
});
