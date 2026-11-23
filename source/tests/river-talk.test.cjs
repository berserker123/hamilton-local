const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const data=require('../src/data/river-talk.json');
const model=()=>import('../src/river-talk.mjs');
const at=(date,time='12:00:00')=>Date.parse(`${date}T${time}+13:00`);

test('boards keep the approved names in order',()=>{
  assert.deepEqual(data.boards.map(b=>b.zh),['市政大白话','生活小妙招','人生通关攻略','抠门研究所']);
});

test('every article follows the template and cites an https source',()=>{
  const boards=new Set(data.boards.map(b=>b.id));
  const required=['titleZh','titleEn','answerZh','answerEn','whoZh','whoEn','checked','published','validUntil'];
  for(const a of data.articles){
    assert.ok(boards.has(a.board),a.id);
    for(const key of required)assert.ok(a[key],a.id+' '+key);
    assert.equal(a.factsZh.length,a.factsEn.length,a.id);
    assert.equal(a.actionsZh.length,a.actionsEn.length,a.id);
    assert.ok(a.sources.length>0&&a.sources.every(s=>s.url.startsWith('https://')),a.id);
    assert.ok(a.validUntil>=a.checked,a.id);
  }
});

test('content expires after its last day in New Zealand time',async()=>{
  const {activeAlerts,activeArticles}=await model();
  const parking=data.alerts.find(a=>a.id==='parking-nov-28');
  assert.ok(activeAlerts({alerts:[parking]},at('2026-11-28','23:59:00')).length===1);
  assert.equal(activeAlerts({alerts:[parking]},at('2026-11-29','00:01:00')).length,0);
  const article=data.articles.find(a=>a.id==='fairfield-wastewater-tanks');
  assert.equal(activeArticles({articles:[article]},at(article.validUntil,'23:59:00')).length,1);
  assert.equal(activeArticles({articles:[article]},at('2026-12-12','00:01:00')).length,0);
});

test('at most three alerts show, soonest first',async()=>{
  const {activeAlerts,ALERT_LIMIT}=await model();
  const many=['2026-12-04','2026-12-01','2026-12-03','2026-12-02'].map((until,i)=>({id:String(i),until}));
  assert.deepEqual(activeAlerts({alerts:many},at('2026-11-23')).map(a=>a.until),['2026-12-01','2026-12-02','2026-12-03']);
  assert.equal(ALERT_LIMIT,3);
});

test('talk pages are real routes and old news links still work',async()=>{
  const {PAGES,readRoute}=await import('../src/site-routes.mjs');
  const {talkHref}=await model();
  assert.deepEqual(readRoute('/talk/'),{route:'talk',tab:'',q:'',at:''});
  for(const a of data.articles){
    assert.ok(PAGES.some(p=>p.path===talkHref(a.id)),a.id);
    assert.equal(readRoute(talkHref(a.id)).route,'talk');
  }
  assert.equal(readRoute('/news/').route,'talk');
  assert.equal(readRoute('/news/old-story/').route,'talk');
});

test('internal links in the column point at real pages',async()=>{
  const {PAGES}=await import('../src/site-routes.mjs');
  const links=[...data.alerts.map(a=>a.href),...data.articles.map(a=>a.cta&&a.cta.href)].filter(h=>h&&h.startsWith('/'));
  for(const link of links)assert.ok(PAGES.some(p=>p.path===link),link);
});

test('licence total quoted in Level 1 matches the arrival checklist',()=>{
  const content=fs.readFileSync('src/tool-content.ts','utf8');
  const total=content.match(/合计 \$(\d+\.\d{2})/)[1];
  const article=data.articles.find(a=>a.id==='level-1-just-landed');
  assert.ok(article.factsZh.some(f=>f.includes(total+' 纽币')));
  assert.ok(article.factsEn.some(f=>f.includes('NZ$'+total)));
});

test('site search finds column articles and the column itself',()=>{
  const esbuild=require('esbuild');
  const built=esbuild.buildSync({entryPoints:['src/search.ts'],bundle:true,platform:'node',format:'cjs',write:false});
  const mod={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(mod,mod.exports,require);
  const search=mod.exports;
  const ids=q=>search.searchMatches(q).map(m=>m.id);
  const active=id=>{const a=data.articles.find(x=>x.id===id);return Date.now()<=Date.parse(a.validUntil+'T23:59:59+13:00');};
  if(active('fairfield-wastewater-tanks'))assert.ok(ids('污水').includes('talk-fairfield-wastewater-tanks'));
  if(active('festive-free-parking')){assert.ok(ids('免费停车').includes('talk-festive-free-parking'));assert.equal(search.resolveSearch('免费停车'),'/search/?q='+encodeURIComponent('免费停车'));}
  for(const q of ['屯里二三事','Tron Talk','市政大白话','抠门研究所','快讯'])assert.equal(search.resolveSearch(q),'/talk/');
  assert.deepEqual(ids('水'),[]);
});

test('the daily briefing is gone from the site',()=>{
  for(const file of ['src/Briefing.tsx','src/News.tsx','src/briefing-model.ts','src/data/briefing.json','scripts/sync-briefing.mjs'])assert.ok(!fs.existsSync(file),file);
  const app=fs.readFileSync('src/App.tsx','utf8');
  assert.ok(!app.includes('每日快讯'));
  assert.ok(!fs.readFileSync('src/subscribe-model.ts','utf8').includes('briefing'));
});

test('every article and news item carries a known topic and a dated https source',async()=>{
  const {TALK_TOPICS}=await model();
  const topics=new Set(TALK_TOPICS.map(x=>x.id));
  assert.deepEqual(TALK_TOPICS.map(x=>x.zh),['钱袋子','出门在外','带娃日常','身子骨']);
  for(const item of [...data.articles,...data.news]){
    assert.ok(item.topics.length&&item.topics.every(x=>topics.has(x)),item.id);
  }
  for(const n of data.news){
    for(const key of ['titleZh','titleEn','bodyZh','bodyEn','takeZh','takeEn','source','date','until'])assert.ok(n[key],n.id+' '+key);
    assert.match(n.url,/^https:/);
    assert.ok(n.until>=n.date,n.id);
    assert.doesNotMatch(n.bodyZh+n.takeZh,/条评论|网友热议/);
  }
});

test('the storytelling article keeps the parent in charge',()=>{
  const a=data.articles.find(x=>x.id==='ai-storytelling-10-minutes');
  assert.match(a.noteZh,/13 岁/);
  assert.match(a.noteZh,/不保证/);
  assert.ok(a.topics.includes('kids'));
  assert.match(a.prompts[0].text,/I am the parent and the only person using this account/);
  assert.match(a.prompts[0].text,/Never ask for real names/);
  assert.doesNotMatch(JSON.stringify(a),/Gakku|皮卡丘|奥特曼/);
});

test('bed guide finds close sizes and flags fitted sheets that will be tight',async()=>{
  const {NZ_BEDS,CN_BEDS,closestBed,beddingFit}=await import('../src/bed-sizes.mjs');
  const queen=NZ_BEDS.find(b=>b.id==='nz-queen');
  const cn=closestBed(queen,CN_BEDS);
  assert.equal(cn.id,'cn-150-200');
  assert.equal(beddingFit(queen,cn).level,'tight');
  assert.equal(beddingFit(cn,queen).level,'loose');
  assert.equal(beddingFit(queen,queen).level,'same');
  assert.equal(beddingFit(NZ_BEDS.find(b=>b.id==='nz-king'),CN_BEDS.find(b=>b.id==='cn-180-200')).level,'different');
});

test('home shortcuts include school finder and bed sizes',async()=>{
  const tools=fs.readFileSync('src/PracticalTools.tsx','utf8');
  assert.match(tools,/at:'tool-find-school'/);
  assert.match(tools,/at:'tool-beds'/);
  const {AT_IDS}=await import('../src/site-routes.mjs');
  assert.ok(AT_IDS.has('tool-beds'));
});

test('homepage shows six cards, led by the Christmas tree, and refills when items expire',async()=>{
  const {homeFeed,HOME_CARD_LIMIT}=await model();
  assert.equal(HOME_CARD_LIMIT,6);
  const cards=homeFeed(data,at('2026-11-24'));
  assert.equal(cards.length,6);
  assert.equal(cards[0].item.id,'christmas-tree');
  assert.ok(cards.some(c=>c.kind==='article')&&cards.some(c=>c.kind==='news'));
  const later=homeFeed(data,at('2026-12-27'));
  assert.ok(!later.some(c=>c.item.id==='christmas-tree'));
});

test('Tron Talk sits next to Home in both navigations and unit converter leaves the shortcuts',()=>{
  const app=fs.readFileSync('src/App.tsx','utf8');
  assert.match(app,/NAV_ITEMS = \[SECTIONS\[0\], \{ id: 'talk', zh: '屯里二三事'/);
  assert.equal(app.split("{NAV_ITEMS.map(s =>").length-1,2);
  assert.doesNotMatch(fs.readFileSync('src/PracticalTools.tsx','utf8'),/at:'tool-units'/);
});
