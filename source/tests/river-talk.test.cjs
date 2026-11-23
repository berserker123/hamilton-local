const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const data=require('../src/data/river-talk.json');
const model=()=>import('../src/river-talk.mjs');
const at=(date,time='12:00:00')=>Date.parse(`${date}T${time}+13:00`);

test('boards keep the approved names in order',()=>{
  assert.deepEqual(data.boards.map(b=>b.zh),['市政大白话','人生通关攻略','抠门研究所','一键查']);
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
