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

test('homepage default layout is E (news front page)',()=>{ const m=load('src/Briefing.tsx'); assert.equal(m.DEFAULT_VARIANT,'e'); assert.equal(m.parseVariant('?bv=e'),'e'); assert.equal(m.parseVariant('?bv=d'),'d'); const out=renderToStaticMarkup(React.createElement(m.Briefing,{t})); assert.match(out,/hl-brief--e/); });

const many=(extra=[])=>({generated_at:'2026-11-17T05:30:00Z',items:[
 item('u1',{title:'Urgent one',category:'police',urgent:true,summary_zh:'紧急一'}),
 item('dull',{title:'City council baulks at $50 million venues deficit',category:'council',summary_zh:'市政赤字',published:'2026-11-17T04:00:00Z'}),
 item('fly',{title:'Airport lands new Queenstown to Hamilton route',category:'news'}),
 item('w',{title:'Free festival this weekend',category:'news',published:'2026-11-17T02:00:00Z'}),
 ...Array.from({length:7},(_,i)=>item('n'+i,{title:'Plain news '+i,published:'2026-11-16T0'+i+':00:00Z'})),
 item('rw1',{title:'Road Work: SH 3',category:'roads'}),item('rw2',{title:'Road Work: SH 1',category:'roads'}),
 ...extra]});
test('newsLayout: lead is first non-urgent arranged card, secondaries are the next two, urgent only in alerts',()=>{
 const d=many();
 const {cards}=model.arrangeItems(d.items);
 const nu=cards.filter(i=>!i.urgent);
 const nonUrgent=[...nu.filter(model.isLocalLife),...nu.filter(i=>!model.isLocalLife(i))];
 const L=model.newsLayout(d.items);
 assert.equal(L.lead.id,nonUrgent[0].id);
 assert.deepEqual(L.secondary.map(i=>i.id),nonUrgent.slice(1,1+model.NEWS_SECONDARY).map(i=>i.id));
 assert.deepEqual(L.alerts.map(i=>i.id),['u1']);
 assert.notEqual(L.lead.id,'u1');
 assert.equal(L.lead.id,'fly');
});
test('newsLayout: no duplicates; shown + roadworks equals arranged items',()=>{
 const d=many();
 const L=model.newsLayout(d.items);
 const ids=[...L.alerts,L.lead,...L.secondary,...L.latest,...L.roadworks].map(i=>i.id);
 assert.equal(new Set(ids).size,ids.length);
 const arr=model.arrangeItems(d.items);
 assert.equal(ids.length,arr.cards.length+arr.roadworks.length);
 const only=model.newsLayout([item('x',{urgent:true})]);
 assert.equal(only.lead,undefined);assert.equal(only.alerts.length,1);
});
test('variant e renders alerts strip, lead h3 with English original, 更多新闻 list, roadworks row and derived count',()=>{
 const d=many();
 const out=vhtml(d,'e');
 const L=model.newsLayout(d.items);
 assert.match(out,/hl-brief--e/);
 assert.ok(out.indexOf('hl-brief-e-alerts')<out.indexOf('hl-brief-e-lead'));
 const lead=out.match(/<article class="hl-brief-e-lead">[\s\S]*?<\/article>/)[0];
 assert.match(lead,/<h3[^>]*>Airport lands new Queenstown to Hamilton route<\/h3>/);
 assert.match(out,/市政赤字/);
 assert.doesNotMatch(lead,/紧急一/);
 assert.equal((out.match(/<article class="hl-brief-e-story">/g)||[]).length,Math.min(model.NEWS_SECONDARY,L.secondary.length));
 assert.match(out,new RegExp('共 '+d.items.length+' 条'));
 assert.match(out,/今天 2 处施工或管制/);
 assert.match(out,/更新于 11月17日 18:30/);
 if(L.latest.length>model.NEWS_LATEST_LIMIT) assert.match(out,new RegExp('查看更多 '+(L.latest.length-model.NEWS_LATEST_LIMIT)+' 条')); else assert.doesNotMatch(out,/查看更多/);
 assert.equal((out.match(/<span class="hl-brief-e-time"/g)||[]).length,Math.min(model.NEWS_LATEST_LIMIT,L.latest.length));
 assert.doesNotMatch(out,/ENGLISH BODY/);
 assert.match(out.match(/<ul class="hl-brief-e-alerts">[\s\S]*?<\/ul>/)[0],/紧急一/);
 for(const a of out.match(/<a [^>]*>/g)||[]){assert.match(a,/target="_blank"/);assert.match(a,/rel="noopener noreferrer"/);}
});

test('homepage order: tools before briefing before subscribe; #overview is not on the Briefing',()=>{
 const app=require('fs').readFileSync('src/App.tsx','utf8');
 const i=n=>app.indexOf('<'+n+' ');
 assert.ok(i('BlackFridayBanner')>0&&i('BlackFridayBanner')<i('CommonTools'));
 assert.ok(i('CommonTools')<i('Briefing'));
 assert.ok(i('Briefing')<i('Subscribe'));
 assert.ok(i('Subscribe')<i('GuideStats'));
 assert.ok(i('GuideStats')<i('GuideMarquee'));
 assert.doesNotMatch(require('fs').readFileSync('src/Briefing.tsx','utf8'),/id="overview"/);
 assert.match(app,/<div id="overview"><BlackFridayBanner/);
 assert.ok(app.indexOf('id="overview"')<i('CommonTools'));
});

test('owner rule: lead and secondaries prefer everyday Hamilton life stories (real snapshot)',()=>{
 const data=require('../src/data/briefing.json');
 const L=model.newsLayout(data.items);
 assert.match(L.lead.title,/Hillcrest/);
 for(const i of [L.lead,...L.secondary.filter((_,k)=>k<data.items.filter(model.isLocalLife).length-1)])assert.ok(model.isLocalLife(i),i.title);
 assert.ok(![L.lead,...L.secondary].some(i=>/dairy farmers/.test(i.title)));
 assert.equal(model.isLocalLife({title:'Massive wastewater tanks planned for Fairfield Park',category:'news'}),true);
 assert.equal(model.isLocalLife({title:'Hundreds of Waikato dairy farmers at higher risk',category:'news'}),false);
});
 test('owner rule: every amount in Chinese text is 纽币',()=>{
 const {normalizeCurrency}=load('src/currency.mjs');
 assert.equal(normalizeCurrency('高达5000万新元的赤字'),'高达5000万纽币的赤字');
 assert.equal(normalizeCurrency('未缴税款已达1100万新西兰元'),'未缴税款已达1100万纽币');
 assert.equal(normalizeCurrency('花费$50万'),'花费50万纽币');
 assert.equal(normalizeCurrency('约 NZ$ 1,200'),'约 1,200纽币');
 const data=require('../src/data/briefing.json');
 for(const i of data.items){const z=model.itemText(i);assert.doesNotMatch(z,/新元|纽元|美元|新西兰元|\$\d/,z);}
 const out=renderToStaticMarkup(React.createElement(BriefingView,{data,t,now:Date.parse('2026-11-19T00:00:00Z')}));
 assert.doesNotMatch(out,/新元/);assert.match(out,/5000万纽币/);
});

test('1b: relative times are computed from view time in ZH and EN; header uses generated_at',()=>{
 const pub='2026-11-19T00:00:00Z';
 const at2h=Date.parse('2026-11-19T02:00:00Z');
 const at30h=Date.parse('2026-11-20T06:00:00Z');
 assert.equal(model.relativeTime(pub,at2h,'zh'),'2小时前');
 assert.equal(model.relativeTime(pub,at2h,'en'),'2 hours ago');
 assert.equal(model.relativeTime(pub,at30h,'zh'),'1天前');
 assert.equal(model.relativeTime(pub,at30h,'en'),'1 day ago');
 const d={generated_at:'2026-11-19T09:00:02+13:00',items:[item('a',{published:pub,summary_zh:'测试'})]};
 const out2h=renderToStaticMarkup(React.createElement(BriefingView,{data:d,t,variant:'e',now:at2h}));
 const out30h=renderToStaticMarkup(React.createElement(BriefingView,{data:d,t,variant:'e',now:at30h}));
 assert.match(out2h,/更新于 11月19日 09:00/);
 assert.match(out2h,/2小时前/);
 assert.match(out30h,/更新于 11月19日 09:00/);
 assert.match(out30h,/1天前/);
});

test('1c: stale notice renders when briefing data is older than 36 hours (ZH & EN)',()=>{
 const gen='2026-11-17T06:00:00Z';
 const fresh=Date.parse('2026-11-18T18:00:00Z'); // exactly 36h -> not stale
 const stale=Date.parse('2026-11-18T18:01:00Z'); // 36h 1m -> stale
 assert.equal(model.isStaleBriefing(gen,fresh),false);
 assert.equal(model.isStaleBriefing(gen,stale),true);
 const d={generated_at:gen,items:[item('a',{summary_zh:'测试'})]};
 const freshHtml=renderToStaticMarkup(React.createElement(BriefingView,{data:d,t,variant:'e',now:fresh}));
 const staleZh=renderToStaticMarkup(React.createElement(BriefingView,{data:d,t,variant:'e',now:stale}));
 const staleEn=renderToStaticMarkup(React.createElement(BriefingView,{data:d,t:(_zh,en)=>en,variant:'e',now:stale}));
 assert.doesNotMatch(freshHtml,/data-testid="briefing-stale"/);
 assert.match(staleZh,/data-testid="briefing-stale"/);
 assert.match(staleZh,/快讯暂未更新，最近更新于/);
 assert.match(staleEn,/data-testid="briefing-stale"/);
 assert.match(staleEn,/Briefing not recently updated/);
});

test('1d: structured expires_at/reopen_at items hide once past; future items stay visible',()=>{
 const now=Date.parse('2026-11-19T00:00:00Z');
 const past=item('old',{reopen_at:'2026-11-18T12:00:00+13:00',title:'Past road closure'});
 const future=item('cur',{reopen_at:'2026-11-20T12:00:00+13:00',title:'Ongoing road closure'});
 const plain=item('plain',{title:'Regular story'});
 assert.equal(model.isExpiredItem(past,now),true);
 assert.equal(model.isExpiredItem(future,now),false);
 assert.equal(model.isExpiredItem(plain,now),false);
 const L=model.newsLayout([past,future,plain],now);
 const ids=[...L.alerts,L.lead,...L.secondary,...L.latest,...L.roadworks].filter(Boolean).map(x=>x.id);
 assert.ok(!ids.includes('old'));
 assert.ok(ids.includes('cur')&&ids.includes('plain'));
});

test('4: English mode translates all briefing labels and uses original English titles',()=>{
 const d=many();
 const out=renderToStaticMarkup(React.createElement(BriefingView,{data:d,t:(_zh,en)=>en,variant:'e',now:Date.parse('2026-11-17T08:00:00Z')}));
 assert.match(out,/Hamilton Daily Briefing/);
 assert.match(out,/Updated 17 Nov, 18:30/);
 assert.match(out,/Lead/);
 assert.match(out,/More news/);
 assert.match(out,/Read source ↗/);
 assert.match(out,/Alert · Police/);
 assert.match(out,/roadworks or traffic controls today/);
 assert.match(out,/Urgent one/);
 assert.doesNotMatch(out,/更新于|头条|更多新闻|原文|施工或管制|摘要仅供参考|紧急一/);
});