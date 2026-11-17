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

test('interest ranking puts council finance/infrastructure first, then lifestyle, collapses routine roadworks, keeps urgent on top',()=>{
 const items=[
  item('dull',{title:'City council baulks at $50 million venues deficit',category:'news',published:'2026-11-17T04:00:00Z'}),
  item('rw',{title:'Road Work: SH 3 Te Awamutu',category:'roads'}),
  item('sh1',{title:'In Brief: Overnight closures coming for SH1',category:'news'}),
  item('fly',{title:'Airport lands new Queenstown to Hamilton route',category:'news',published:'2026-11-17T01:00:00Z'}),
  item('urg',{title:'Road Closure: SH 39',category:'roads',urgent:true}),
 ];
 const {cards,roadworks}=model.arrangeItems(items);
 assert.deepEqual(cards.map(i=>i.id),['urg','dull','fly']);
 assert.deepEqual(roadworks.map(i=>i.id).sort(),['rw','sh1']);
 const out=html({generated_at:'2026-11-17T05:30:00Z',items});
 assert.match(out,/今天 2 处施工或管制/);
 assert.match(out,/aria-expanded="false"/);
 assert.ok(out.indexOf('baulks')<out.indexOf('Airport lands'));
});
const VARIANTS=['a','b','c','d'];
const vhtml=(data,variant)=>renderToStaticMarkup(React.createElement(BriefingView,{data,t,variant,now:Date.parse('2026-11-17T05:00:00Z')}));
const vitems=[
 item('dull',{title:'City council baulks at $50 million venues deficit',category:'news',published:'2026-11-17T04:00:00Z'}),
 item('rw',{title:'Road Work: SH 3 Te Awamutu',category:'roads'}),
 item('fly',{title:'Airport lands new Queenstown to Hamilton route',category:'news'}),
 item('urg',{title:'Road Closure: SH 39',category:'roads',urgent:true}),
 item('zh',{title:'Zh title',summary_zh:'中文摘要内容',category:'council'}),
];
const vdata={generated_at:'2026-11-17T05:30:00Z',items:vitems};
test('?bv= is parsed; unknown or missing keeps the current layout',()=>{
 const {parseVariant}=load('src/Briefing.tsx');
 assert.equal(parseVariant('?bv=c'),'c');assert.equal(parseVariant('?x=1&bv=a'),'a');
 assert.equal(parseVariant('?bv=z'),undefined);assert.equal(parseVariant(''),undefined);
 assert.doesNotMatch(vhtml(vdata,undefined),/hl-brief--/);
});
for(const v of VARIANTS){
 test('variant '+v+' renders, keeps ordering, hides English summary, links are safe',()=>{
  const out=vhtml(vdata,v);
  assert.match(out,new RegExp('hl-brief--'+v));
  assert.match(out,/汉密尔顿每日快讯/);assert.match(out,/更新于/);
  assert.doesNotMatch(out,/ENGLISH BODY/);
  assert.match(out,/中文摘要内容/);assert.doesNotMatch(out,/Zh title/);
  assert.match(out,/今天 1 处施工或管制/);
  assert.match(out,/摘要仅供参考，详情请以原文为准。/);
  assert.match(out,/is-urgent/);
  const links=out.match(/<a [^>]*>/g)||[];
  assert.ok(links.length>=4);
  for(const a of links){assert.match(a,/target="_blank"/);assert.match(a,/rel="noopener noreferrer"/);}
  assert.ok(out.indexOf('Road Closure: SH 39')<out.indexOf('baulks'));
  assert.ok(out.indexOf('baulks')<out.indexOf('Airport lands'));
 });
}
test('variant b splits civic and lifestyle columns; c shows 8 before expanding; d puts urgent in a banner; a has a lead',()=>{
 const b=vhtml(vdata,'b');
 assert.match(b,/紧急 · 市政/);assert.match(b,/生活 · 新闻/);
 const many={generated_at:'2026-11-17T05:30:00Z',items:Array.from({length:10},(_,i)=>item('i'+i))};
 const c=vhtml(many,'c');
 assert.equal((c.match(/class="hl-brief-item/g)||[]).length,8);assert.match(c,/查看全部 10 条/);
 const d=vhtml(vdata,'d');
 assert.ok(d.indexOf('hl-brief-banners')>-1&&d.indexOf('hl-brief-banners')<d.indexOf('hl-brief-tile'));
 assert.match(vhtml(vdata,'a'),/hl-brief-lead/);
});
