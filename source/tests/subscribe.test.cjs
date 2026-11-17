const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const esbuild=require('esbuild');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(entry){const r=esbuild.buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,external:['react','react-dom','lucide-react'],loader:{'.json':'json'}});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);return m.exports;}
const {Subscribe}=load('src/Subscribe.tsx');
const model=load('src/subscribe-model.ts');
const briefingModel=load('src/briefing-model.ts');
const t=zh=>zh;
const render=variant=>renderToStaticMarkup(React.createElement(Subscribe,{t,variant}));

for(const variant of ['full','compact'])test('subscribe form renders ('+variant+') with label, required email and 3 checked topics',()=>{
  const html=render(variant);
  const id='subscribe-'+variant+'-email';
  assert.match(html,new RegExp('<label[^>]*for="'+id+'"'));
  const input=html.match(new RegExp('<input[^>]*id="'+id+'"[^>]*>'))[0];
  assert.match(input,/type="email"/);
  assert.match(input,/required=""/);
  assert.match(input,/autoComplete="email"|autocomplete="email"/i);
  const boxes=html.match(/<input[^>]*type="checkbox"[^>]*>/g)||[];
  assert.equal(boxes.length,3);
  for(const b of boxes)assert.match(b,/checked=""/);
  for(const zh of ['每周活动日历','每日快讯摘要','黑五优惠'])assert.ok(html.includes(zh));
  assert.ok(html.includes('我们只用你的邮箱发送 Hamilton Local 内容，随时可退订。'));
  assert.match(html,/href="\/privacy\/"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/href="\/feed.xml"/);
  assert.ok(html.includes('RSS 订阅'));
});
test('subscribe form follows the language toggle',()=>{
  const html=renderToStaticMarkup(React.createElement(Subscribe,{t:(zh,en)=>en,variant:'full'}));
  assert.ok(html.includes('Weekly events'));
  assert.ok(html.includes('Unsubscribe any time'));
});
test('subscribe config points at the MailerLite form with 3 group ids',()=>{
  const c=JSON.parse(fs.readFileSync('src/data/subscribe.json','utf8'));
  assert.equal(c.provider,'mailerlite');
  assert.match(c.formAction,/^https:\/\/assets\.mailerlite\.com\/jsonp\/\d+\/forms\/\d+\/subscribe$/);
  assert.deepEqual(Object.keys(c.groups),['events','briefing','blackfriday']);
  for(const v of Object.values(c.groups)) assert.match(v,/^\d+$/);
});
test('empty formAction shows opening-soon and makes no network call',async()=>{
  let calls=0;
  const fake=async()=>{calls++;return {ok:true};};
  const cfg={provider:'mailerlite',formAction:'',groups:{events:'1',briefing:'2',blackfriday:'3'}};
  assert.equal(await model.submitSubscription(cfg,'a@b.co',['events'],fake),'soon');
  assert.equal(await model.submitSubscription(cfg,'bad',['events'],fake),'invalid');
  const origFetch=global.fetch;
  global.fetch=()=>{calls++;throw new Error('network');};
  try{assert.equal(await model.submitSubscription(cfg,'a@b.co',['events']),'soon');}finally{global.fetch=origFetch;}
  assert.equal(calls,0);
});
test('configured formAction POSTs fields[email] and selected groups[] and reports result',async()=>{
  let seen;
  const ok=async(url,init)=>{seen={url,init};return {ok:true};};
  const cfg={provider:'mailerlite',formAction:'https://example.test/subscribe',groups:{events:'11',briefing:'22',blackfriday:'33'}};
  assert.equal(await model.submitSubscription(cfg,' a@b.co ',['events','blackfriday'],ok),'ok');
  assert.equal(seen.url,cfg.formAction);
  assert.equal(seen.init.method,'POST');
  assert.equal(seen.init.body.get('fields[email]'),'a@b.co');
  assert.deepEqual(seen.init.body.getAll('groups[]'),['11','33']);
  assert.equal(await model.submitSubscription(cfg,'a@b.co',['events'],async()=>({ok:false})),'error');
  assert.equal(await model.submitSubscription(cfg,'a@b.co',['events'],async()=>{throw new Error('x');}),'error');
});
test('home places the full form after the briefing; footer has the compact form on every page',()=>{
  const app=fs.readFileSync('src/App.tsx','utf8');
  assert.ok(app.includes('<Briefing t={t} /><Subscribe t={t} variant="full" />'));
  const start=app.indexOf('<footer className="sb-footer ia-footer">');
  assert.ok(start>0);
  const footer=app.slice(start,app.indexOf('</footer>',start));
  assert.ok(footer.includes('<Subscribe t={t} variant="compact" />'));
  assert.equal(app.split('<footer ').length-1,1,'one shared footer for all routes');
});
test('privacy page has a bilingual newsletter section',()=>{
  const p=fs.readFileSync('src/Privacy.tsx','utf8');
  for(const s of ['MailerLite','双重确认','double opt-in','退订链接','unsubscribe link','/feed.xml'])assert.ok(p.includes(s),s);
});

// Small well-formedness parser: balanced tags, quoted attributes, only the five XML entities.
function parseXml(xml){
  const stack=[];
  const items=[];
  let cur=null;
  const re=/<\?xml[^>]*\?>|<\/([\w:]+)>|<([\w:]+)((?:\s+[\w:]+="[^"<]*")*)\s*(\/?)>|([^<]+)/g;
  let m,last=0;
  while((m=re.exec(xml))){
    assert.equal(m.index,last,'unparsed text at '+last);
    last=re.lastIndex;
    if(m[1]){
      assert.equal(stack.pop(),m[1],'mismatched close '+m[1]);
      if(m[1]==='item'){items.push(cur);cur=null;}
    }else if(m[2]){
      if(m[2]==='item')cur={};
      else if(cur)cur[m[2]]='';
      if(!m[4])stack.push(m[2]);
    }else if(m[5]!==undefined){
      assert.ok(!/&(?!(?:amp|lt|gt|quot|apos);)/.test(m[5]),'bad entity near '+m[5].slice(0,60));
      const top=stack[stack.length-1];
      if(cur&&top!=='item')cur[top]+=m[5];
    }
  }
  assert.equal(last,xml.length);
  assert.equal(stack.length,0,'unclosed tags');
  return items;
}
test('feed.xml is well-formed RSS 2.0 whose item count matches the data',async()=>{
  const feed=await import('../src/feed.mjs');
  const xml=feed.renderFeed('.');
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<rss version="2.0"'));
  assert.ok(xml.includes('<title>Hamilton Local 汉密尔顿本地</title>'));
  assert.ok(xml.includes('<link>https://hamiltonlocal.nz/</link>'));
  const items=parseXml(xml);
  const events=JSON.parse(fs.readFileSync('src/events-and-markets.json','utf8')).events_this_week.length;
  const brief=briefingModel.visibleItems(JSON.parse(fs.readFileSync('src/data/briefing.json','utf8')).items).length;
  const deals=Math.min(20,JSON.parse(fs.readFileSync('src/data/blackfriday.json','utf8')).length);
  assert.equal(items.length,events+brief+deals);
  const by=s=>feed.feedItems('.').filter(i=>i.source===s).length;
  assert.equal(by('events'),events);
  assert.equal(by('briefing'),brief);
  assert.equal(by('blackfriday'),deals);
  const guids=new Set();
  for(const it of items){
    assert.ok(it.title&&it.title.trim(),'title');
    assert.match(it.link||'',/^https?:\/\//);
    assert.ok(it.guid&&it.guid.trim(),'guid');
    guids.add(it.guid);
  }
  assert.equal(guids.size,items.length,'guids unique');
});
test('feed escapes special characters',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'feed-'));
  fs.mkdirSync(path.join(root,'src/data'),{recursive:true});
  fs.writeFileSync(path.join(root,'src/events-and-markets.json'),JSON.stringify({events_this_week:[{id:'x1',title_zh:'A & B <i>"q"</i>',title_en:"it's",source_url:'https://x.test/?a=1&b=2',dates:['2026-11-16'],time:'<t>'}]}));
  fs.writeFileSync(path.join(root,'src/data/briefing.json'),JSON.stringify({items:[]}));
  fs.writeFileSync(path.join(root,'src/data/blackfriday.json'),JSON.stringify([]));
  const feed=await import('../src/feed.mjs');
  const xml=feed.renderFeed(root);
  assert.ok(xml.includes('A &amp; B &lt;i&gt;&quot;q&quot;&lt;/i&gt; / it&apos;s'));
  assert.ok(xml.includes('https://x.test/?a=1&amp;b=2'));
  assert.ok(xml.includes('&lt;t&gt;'));
  assert.equal(parseXml(xml).length,1);
});
test('every page head carries the rss alternate link',async()=>{
  const {PAGES,renderDocument}=await import('../src/site-routes.mjs');
  const template=fs.readFileSync('index.html','utf8');
  assert.ok(PAGES.length>10);
  const link='<link rel="alternate" type="application/rss+xml" title="Hamilton Local 汉密尔顿本地" href="/feed.xml">';
  for(const page of PAGES){
    const html=renderDocument(template,page);
    assert.ok(html.includes(link),page.path);
    assert.ok(html.indexOf(link)<html.indexOf('</head>'),page.path);
  }
});

test('MailerLite 200 with success:false counts as error; success:true is ok',async()=>{ const model=load('src/subscribe-model.ts'); const cfg={provider:'mailerlite',formAction:'https://x.test/f',groups:{events:'1',briefing:'2',blackfriday:'3'}}; assert.equal(await model.submitSubscription(cfg,'a@b.co',['events'],async()=>({ok:true,json:async()=>({success:false,message:'reCAPTCHA failed'})})),'error'); assert.equal(await model.submitSubscription(cfg,'a@b.co',['events'],async()=>({ok:true,json:async()=>({success:true})})),'ok'); });
