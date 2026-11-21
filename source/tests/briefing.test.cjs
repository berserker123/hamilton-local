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
 if(L.latest.length>model.NEWS_LATEST_LIMIT) assert.match(out,/查看全部新闻/); else assert.doesNotMatch(out,/查看全部新闻/);
 assert.match(out,/href="\/news\/"/);
 assert.equal((out.match(/<span class="hl-brief-e-time"/g)||[]).length,Math.min(model.NEWS_LATEST_LIMIT,L.latest.length));
 assert.doesNotMatch(out,/ENGLISH BODY/);
 assert.match(out.match(/<ul class="hl-brief-e-alerts">[\s\S]*?<\/ul>/)[0],/紧急一/);
 for(const a of out.match(/<a [^>]*>/g)||[]){
  if(/href="https?:/.test(a)){assert.match(a,/target="_blank"/);assert.match(a,/rel="noopener noreferrer"/);}
  else assert.match(a,/href="\/news\//);
 }
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
 const localLifeItems=data.items.filter(model.isLocalLife);
 if(localLifeItems.length>0){
  assert.ok(model.isLocalLife(L.lead),L.lead.title);
  for(const i of [L.lead,...L.secondary.slice(0,Math.max(0,localLifeItems.length-1))])assert.ok(model.isLocalLife(i),i.title);
 }
 assert.ok(![L.lead,...L.secondary].filter(Boolean).some(i=>/dairy farmers/.test(i.title)));
 assert.equal(model.isLocalLife({title:'Massive wastewater tanks planned for Fairfield Park',category:'news'}),true);
 assert.equal(model.isLocalLife({title:'Hundreds of Waikato dairy farmers at higher risk',category:'news'}),false);
});
test('owner rule: every amount in Chinese text is 纽币',()=>{
 const {normalizeCurrency}=load('src/currency.mjs');
 assert.equal(normalizeCurrency('高达5000万新元的赤字'),'高达5000万纽币的赤字');
 assert.equal(normalizeCurrency('未缴税款已达1100万新西兰元'),'未缴税款已达1100万纽币');
 assert.equal(normalizeCurrency('花费$50万'),'花费50万纽币');
 assert.equal(normalizeCurrency('约 NZ$ 1,200'),'约 1,200纽币');
 const synthetic={generated_at:'2026-11-19T00:00:00Z',items:[item('fx',{summary_zh:'赤字高达5000万新元'})]};
 const synOut=renderToStaticMarkup(React.createElement(BriefingView,{data:synthetic,t,now:Date.parse('2026-11-19T00:00:00Z')}));
 assert.doesNotMatch(synOut,/新元/);assert.match(synOut,/5000万纽币/);
 const data=require('../src/data/briefing.json');
 for(const i of data.items){const z=model.itemText(i);assert.doesNotMatch(z,/新元|纽元|美元|新西兰元|\$\d/,z);}
 const out=renderToStaticMarkup(React.createElement(BriefingView,{data,t,now:Date.parse(data.generated_at)}));
 assert.doesNotMatch(out,/新元|纽元|美元|新西兰元/);
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

test('5: afternoon brief parser trims boilerplate, skips unlinked/weather sections, matches sources, and handles missing English',async()=>{
 const {parseAfternoonBrief}=await import('../scripts/sync-briefing.mjs');
 const generated='2026-11-20T03:15:02.539687+00:00';
 const linked=[
  {line:'- 今日 Stuff 报道，本地赛事消息，预算达500万新元。[来源链接](https://www.stuff.co.nz/sport/123/test-match)',src:'stuff_filtered',title:'Test match across Hamilton',summary:'Matches will take place in Hamilton.'},
  {line:'- 有网友在 r/thetron 发帖称在政府招标网站看到了 Hillcrest 图书馆招标信息，该帖共获得 34 条评论。[来源链接](https://www.reddit.com/r/thetron/comments/abc/hillcrest_library/)',src:'reddit_thetron',title:'Hillcrest library tender',summary:''},
  {line:'- 市政公布新公园计划。[官网](https://hamilton.govt.nz/your-council/news/new-park)',src:null,title:'',summary:''},
 ];
 const md=[
  '# 《汉密尔顿今日速报》（2026-11-20）',
  '## 市政/民生',
  linked[0].line,
  linked[2].line,
  '## 社区热议',
  linked[1].line,
  '## 全纽热搜与本地关联',
  '- 没有链接的热搜条目，应当被跳过。',
  '## 明日天气',
  '2026-11-21（明天）：多云，最高19°C。',
 ].join('\n');
 const dailyJson={
  date:'2026-11-20',
  generated,
  sources:{
   stuff_filtered:[{title:linked[0].title,summary:linked[0].summary,url:'https://www.stuff.co.nz/sport/123/test-match'}],
   reddit_thetron:[{title:linked[1].title,url:'https://www.reddit.com/r/thetron/comments/abc/hillcrest_library/'}],
  },
 };
 const parsed=parseAfternoonBrief(md,dailyJson);
 assert.equal(parsed.generated_at,generated);
 assert.equal(parsed.items.length,linked.length);
 const stuffItem=parsed.items.find(i=>i.source==='Stuff');
 assert.equal(stuffItem.title,linked[0].title);
 assert.equal(stuffItem.summary,linked[0].summary);
 assert.equal(stuffItem.summary_zh,'本地赛事消息，预算达500万新元');
 assert.equal(stuffItem.published,generated);
 assert.equal(stuffItem.category,'news');
 const redditItem=parsed.items.find(i=>i.source==='r/thetron');
 assert.equal(redditItem.summary_zh,'政府招标网站看到了 Hillcrest 图书馆招标信息');
 assert.doesNotMatch(JSON.stringify(parsed),/条评论|网友热议|\d+ comments/);
 assert.equal(redditItem.title,linked[1].title);
 const councilItem=parsed.items.find(i=>i.category==='council');
 assert.equal(councilItem.title,'');
 assert.equal(model.itemText(councilItem,'en'),'市政公布新公园计划');
 const zhOut=renderToStaticMarkup(React.createElement(BriefingView,{data:parsed,t,variant:'e',now:Date.parse(generated)}));
 const enOut=renderToStaticMarkup(React.createElement(BriefingView,{data:parsed,t:(_z,e)=>e,variant:'e',now:Date.parse(generated)}));
 assert.doesNotMatch(zhOut,/没有链接的热搜条目|明日天气|<p class="hl-brief-e-en"[^>]*><\/p>/);
 assert.match(enOut,/Hillcrest library tender/);
 assert.match(enOut,/市政公布新公园计划/);
});

test('6: syncBriefing selects whichever source (afternoon brief vs watch latest.json) was generated later',async()=>{
 const fs=require('node:fs');
 const os=require('node:os');
 const path=require('node:path');
 const {syncBriefing}=await import('../scripts/sync-briefing.mjs');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hl-sync-'));
 try{
  const srcRoot=path.join(tmp,'source');
  const deployRoot=path.join(tmp,'deploy');
  const dailyDir=path.join(tmp,'daily');
  fs.mkdirSync(path.join(srcRoot,'src','data'),{recursive:true});
  fs.mkdirSync(path.join(srcRoot,'dist'),{recursive:true});
  fs.mkdirSync(deployRoot,{recursive:true});
  fs.mkdirSync(path.join(dailyDir,'data'),{recursive:true});
  fs.mkdirSync(path.join(dailyDir,'out'),{recursive:true});
  fs.writeFileSync(path.join(srcRoot,'src','events-and-markets.json'),JSON.stringify({events_this_week:[]}));
  fs.writeFileSync(path.join(srcRoot,'src','data','blackfriday.json'),JSON.stringify([]));
  const watchPath=path.join(tmp,'latest.json');
  const morningTs='2026-11-20T09:00:03+13:00';
  const afternoonTs='2026-11-20T03:15:02.539687+00:00'; // 16:15:02+13:00
  const watchItems=[{id:'w1',source:'RNZ',title:'Morning item',url:'https://www.rnz.co.nz/news/1',published:morningTs,date_only:false,summary:'Morning',summary_zh:'早报内容，拨款100万新元。',category:'news',urgent:false}];
  fs.writeFileSync(watchPath,JSON.stringify({generated_at:morningTs,items:watchItems}));
  const dailyBullets=[
   '- 今日 Stuff 报道，下午快讯内容，投入200万新元。[来源链接](https://www.stuff.co.nz/nz-news/1)',
   '- 有网友发帖提及社区讨论。[来源链接](https://www.reddit.com/r/thetron/comments/xyz/post/)',
  ];
  fs.writeFileSync(path.join(dailyDir,'data','2026-11-20.json'),JSON.stringify({date:'2026-11-20',generated:afternoonTs,sources:{stuff_filtered:[{title:'Afternoon story',summary:'Afternoon summary',url:'https://www.stuff.co.nz/nz-news/1'}]}}));
  fs.writeFileSync(path.join(dailyDir,'out','2026-11-20-brief.md'),['## 市政/民生',dailyBullets[0],'## 社区热议',dailyBullets[1]].join('\n'));

  const resAfternoon=syncBriefing(watchPath,srcRoot,deployRoot,{dailyDir});
  assert.equal(resAfternoon.kind,'daily');
  assert.equal(resAfternoon.generated_at,afternoonTs);
  assert.equal(resAfternoon.count,dailyBullets.length);
  const syncedAfternoon=JSON.parse(fs.readFileSync(path.join(srcRoot,'src','data','briefing.json'),'utf8'));
  assert.match(syncedAfternoon.items[0].summary_zh,/200万纽币/);
  assert.doesNotMatch(syncedAfternoon.items[0].summary_zh,/新元/);
  const feedAfter=fs.readFileSync(path.join(deployRoot,'feed.xml'),'utf8');
  assert.match(feedAfter,/Afternoon story/);
  assert.equal(fs.readFileSync(path.join(srcRoot,'dist','feed.xml'),'utf8'),feedAfter);

  // Next morning: latest.json is newer than yesterday's afternoon brief
  const nextMorningTs='2026-11-21T09:00:01+13:00';
  fs.writeFileSync(watchPath,JSON.stringify({generated_at:nextMorningTs,items:watchItems}));
  const resMorning=syncBriefing(watchPath,srcRoot,deployRoot,{dailyDir});
  assert.equal(resMorning.kind,'watch');
  assert.equal(resMorning.generated_at,nextMorningTs);
  assert.equal(resMorning.count,watchItems.length);
  const syncedMorning=JSON.parse(fs.readFileSync(path.join(srcRoot,'src','data','briefing.json'),'utf8'));
  assert.match(syncedMorning.items[0].summary_zh,/100万纽币/);
 }finally{
  fs.rmSync(tmp,{recursive:true,force:true});
 }
});
test('7: sanitizer strips comment counts (zh/en) and forum lead-ins from every briefing field, without adding text',async()=>{
 const {sanitizeBriefingText,hasCommentCount}=await import('../src/briefing-sanitize.mjs');
 const {normalizeBriefingData}=await import('../scripts/sync-briefing.mjs');
 const cases=[
  ['网友热议：体育用品连锁店 Stirling Sports 处于清算程序中（16 条评论）','体育用品连锁店 Stirling Sports 处于清算程序中'],
  ['有网友在 r/thetron 发帖称在政府招标网站看到了 Hillcrest 图书馆设计服务的招标信息，该帖共获得 34 条评论。','政府招标网站看到了 Hillcrest 图书馆设计服务的招标信息。'],
  ['有网友发帖提及体育用品连锁店 Stirling Sports 处于清算程序中，该帖共有 16 条评论。','体育用品连锁店 Stirling Sports 处于清算程序中。'],
  ['有网友发帖询问住在繁忙主路旁的住户户外散养猫咪的情况，该帖共有 29 条评论','住在繁忙主路旁的住户户外散养猫咪的情况'],
  ['Stirling Sports in liquidation (16 comments)','Stirling Sports in liquidation'],
  ['Hillcrest library tender · 34 comments','Hillcrest library tender'],
  ['Council approves budget, with 12 replies','Council approves budget'],
  ['市议会通过2027年预算，投入500万纽币。','市议会通过2027年预算，投入500万纽币。'],
  ['Warriors to play in Hamilton in 2027','Warriors to play in Hamilton in 2027'],
  ['**勇士队2027年赛程公布**：三场比赛落地汉密尔顿','勇士队2027年赛程公布：三场比赛落地汉密尔顿'],
 ];
 for(const [input,expected] of cases){
  assert.equal(sanitizeBriefingText(input),expected,input);
  assert.equal(hasCommentCount(sanitizeBriefingText(input)),false,input);
 }
 assert.equal(sanitizeBriefingText(null),null);
 assert.equal(sanitizeBriefingText('Council received 300 comments on plan'),'Council received 300 comments on plan'); // mid-sentence news facts are kept
 const out=normalizeBriefingData({generated_at:'2026-11-20T03:15:02Z',items:[{id:'x',source:'r/thetron',title:'Stirling Sports in liquidation (16 comments)',summary:'Thread, 16 comments',url:'https://www.reddit.com/r/thetron/comments/x/',summary_zh:'网友热议：Stirling Sports 清算（16 条评论）'}]});
 assert.equal(out.items[0].summary_zh,'Stirling Sports 清算');
 assert.equal(out.items[0].title,'Stirling Sports in liquidation');
 assert.equal(out.items[0].summary,'Thread');
 const live=require('../src/data/briefing.json');
 for(const i of live.items) for(const k of ['summary_zh','title','summary']){
  assert.equal(hasCommentCount(i[k]),false,k+': '+i[k]);
  assert.doesNotMatch(String(i[k]||''),/网友热议|有网友发帖/);
 }
 const feed=require('fs').readFileSync('../feed.xml','utf8');
 assert.equal(hasCommentCount(feed.replace(/<link>[^<]*<\/link>|<guid[^>]*>[^<]*<\/guid>/g,'')),false);
});

test('8: long bold-headline afternoon briefs are cut to the headline (+ first sentence as detail), trim only',async()=>{
 const {parseAfternoonBrief,afternoonShortForm}=await import('../scripts/sync-briefing.mjs');
 const long='**NRL新西兰勇士队（Warriors）2027年赛程公布，三场比赛落地汉密尔顿**：男队将于2027年2月20日（周六）17:00在汉密尔顿FMG Stadium Waikato进行季前挑战赛，主场迎战Penrith Panthers；女队（NRLW）将在汉密尔顿进行两场常规赛。';
 const f=afternoonShortForm(long);
 assert.equal(f.summary_zh,'NRL新西兰勇士队（Warriors）2027年赛程公布，三场比赛落地汉密尔顿');
 assert.equal(f.detail_zh,'男队将于2027年2月20日（周六）17:00在汉密尔顿FMG Stadium Waikato进行季前挑战赛，主场迎战Penrith Panthers');
 assert.ok(long.includes(f.summary_zh)&&long.includes(f.detail_zh),'trim only');
 const md=['## 市政/民生','- '+long+'[Stuff](https://www.stuff.co.nz/sport/1/warriors)','## 社区热议','- 有网友发帖提及 Stirling Sports 处于清算程序中，该帖共有 16 条评论。[来源链接](https://www.reddit.com/r/thetron/comments/x/y/)'].join('\n');
 const parsed=parseAfternoonBrief(md,{generated:'2026-11-20T03:15:02Z',sources:{}});
 assert.equal(parsed.items[0].summary_zh,f.summary_zh);
 assert.ok(parsed.items[0].summary_zh.length<=60);
 assert.doesNotMatch(JSON.stringify(parsed),/\*\*|条评论|网友热议/);
 assert.equal(parsed.items[1].summary_zh,'Stirling Sports 处于清算程序中');
 assert.equal(parsed.items[1].detail_zh,'');
});

test('9: owner manual briefing overrides only its own date, keeps owner order/wording, shows headline + verbatim summary',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const {applyManualOverride,syncBriefing}=await import('../scripts/sync-briefing.mjs');
 const manual=JSON.parse(fs.readFileSync('src/data/briefing-manual.json','utf8'));
 const isSubseq=(h,s)=>{let k=0;for(const ch of s){if(ch===h[k])k++;}return k===h.length;};
 for(const it of manual.items){assert.ok(isSubseq(it.headline_zh,it.summary_zh),'headline trimmed from text: '+it.headline_zh);assert.doesNotMatch(it.title||'',/reddit|comments/i);}
 const mp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'hl-man-')),'m.json');
 fs.writeFileSync(mp,JSON.stringify(manual));
 const same={kind:'daily',ts:Date.parse('2026-11-20T03:15:02Z'),data:{generated_at:'x',items:[]}};
 assert.equal(applyManualOverride(same,mp).kind,'manual');
 const nextDay=new Date(Date.parse(manual.date+'T00:00:00Z')+86400000).toISOString().slice(0,10);
 const nextAt=nextDay+'T09:00:01+13:00';
 const next={kind:'watch',ts:Date.parse(nextAt),data:{generated_at:nextAt,items:[]}};
 assert.equal(applyManualOverride(next,mp),next,'manual must not block the next day');
 assert.equal(applyManualOverride(same,path.join(os.tmpdir(),'nope.json')),same);
 // full sync into a temp tree
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hl-man-sync-'));
 const srcRoot=path.join(tmp,'source'),deployRoot=path.join(tmp,'deploy');
 fs.mkdirSync(path.join(srcRoot,'src','data'),{recursive:true});fs.mkdirSync(deployRoot,{recursive:true});
 fs.writeFileSync(path.join(srcRoot,'src','events-and-markets.json'),JSON.stringify({events_this_week:[]}));
 fs.writeFileSync(path.join(srcRoot,'src','data','blackfriday.json'),'[]');
 const watch=path.join(tmp,'latest.json');
 fs.writeFileSync(watch,JSON.stringify({generated_at:'2026-11-20T09:00:03+13:00',items:[{id:'w',source:'RNZ',title:'Morning',url:'https://www.rnz.co.nz/n',published:'2026-11-20T09:00:03+13:00',summary_zh:'早报',category:'news'}]}));
 const res=syncBriefing(watch,srcRoot,deployRoot,{dailyDir:'',manualPath:mp});
 assert.equal(res.kind,'manual');
 assert.equal(res.count,manual.items.length);
 const synced=JSON.parse(fs.readFileSync(path.join(srcRoot,'src','data','briefing.json'),'utf8'));
 assert.deepEqual(synced.items.map(i=>i.summary_zh),manual.items.map(i=>i.summary_zh),'owner wording verbatim');
 const {newsLayout}=model;
 const lay=newsLayout(synced.items,Date.parse(synced.generated_at));
 assert.equal(lay.lead.headline_zh,manual.items[0].headline_zh,'item 1 is the lead');
 assert.deepEqual([lay.lead,...lay.secondary,...lay.latest].map(i=>i.headline_zh),manual.items.map(i=>i.headline_zh),'owner order kept, police story not dropped');
 const zh=renderToStaticMarkup(React.createElement(BriefingView,{data:synced,t,variant:'e',now:Date.parse(synced.generated_at)}));
 assert.match(zh,new RegExp('共 '+manual.items.length+' 条'));
 for(const it of manual.items){
  assert.ok(zh.includes(it.headline_zh));
  const view=model.itemDisplay(synced.items.find(i=>i.headline_zh===it.headline_zh),'zh');
  if(view.teaser) assert.ok(zh.includes(view.teaser.replace(/&/g,'&amp;')),view.teaser);
  const tail=it.summary_zh.slice(-8);
  if(view.teaser && !view.teaser.includes(tail)) assert.ok(!zh.includes(tail),'homepage keeps the short summary, not the ending: '+tail);
  assert.match(zh,new RegExp('href="/news/'+synced.items.find(i=>i.headline_zh===it.headline_zh).id+'/"'));
 }
 assert.doesNotMatch(zh,/Just saw government tender|Looks like we/);
 for(const it of manual.items) if(it.title) assert.ok(!zh.includes('>'+it.title.replace(/'/g,'&#x27;')+'<'),'no English subline in zh');
 const {NewsPage}=load('src/News.tsx');
 for(const it of synced.items){
  const article=renderToStaticMarkup(React.createElement(NewsPage,{t,data:synced,now:Date.parse(synced.generated_at),pathname:'/news/'+it.id+'/'}));
  assert.match(article,/data-testid="news-article"/);
  assert.ok(article.includes(it.headline_zh));
  assert.ok(article.includes(it.summary_zh.replace(/&/g,'&amp;')),'full text on the article');
 }
 const list=renderToStaticMarkup(React.createElement(NewsPage,{t,data:synced,now:Date.parse(synced.generated_at),pathname:'/news/'}));
 assert.match(list,/data-testid="news-list"/);
 assert.equal((list.match(/class="hl-brief-more"/g)||[]).length,synced.items.length);
});

test('homepage teasers stay inside one or two sentences and do not split a character',()=>{
 const long='男队2027年2月20日17:00在汉密尔顿FMG Stadium Waikato打季前赛，对阵Penrith Panthers；女队（NRLW）将在汉密尔顿打两场常规赛，8月14日19:15对Wests Tigers，8月29日15:45对Cronulla Sharks。票务尚待官方公布。';
 const teaser=model.itemTeaser(long);
 assert.match(teaser,/Penrith Panthers…$/);
 assert.doesNotMatch(teaser,/票务尚待/);
 assert.equal(model.itemTeaser('第一句很短。第二句也很短。第三句不要。'),'第一句很短。第二句也很短。');
 const word='Closure near Hamilton continues overnight for resurfacing';
 const cut=model.itemTeaser(word,24);
 assert.doesNotMatch(cut,/Hamilt…|Ham…/);
 assert.equal(cut.endsWith('…'),true);
 const emoji='甲乙丙😀后面还有很多字，需要被截断才看得出边界。';
 const safe=model.itemTeaser(emoji,8);
 assert.equal(safe.isWellFormed(),true);
 assert.doesNotMatch(safe,/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/);
});
