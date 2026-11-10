// Offline v16 QA: file URLs and dedicated loopback Chrome/CDP only. No installs.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const crypto = require('node:crypto'), { spawn } = require('node:child_process'), { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..'), shots = path.join(root, 'out/shots');
const url = pathToFileURL(path.join(__dirname, 'dist/index.html')).href;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', endpoint = 'http://127.0.0.1:9255';
const research = JSON.parse(fs.readFileSync(path.join(root, 'work/src/events-and-markets.json'), 'utf8'));
const red = process.argv.includes('--red');
const report = { url, browser: chromePath, browserPlugin: 'Browser plugin not available; TASK.md explicitly authorizes offline Chrome/CDP', checks: [], layouts: [], screenshots: [], errors: [], warnings: [], externalRequests: [] };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let chrome, client;
async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(), listeners = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } } else for (const fn of listeners.get(m.method) || []) fn(m.params); };
  ws.onclose = () => { for (const p of pending.values()) p.reject(new Error('CDP closed')); pending.clear(); };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })); });
  return { ws, send, on(method, fn) { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn); }, async evaluate(expression) { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; } };
}
async function until(expr) { const end = Date.now() + 10000; while (Date.now() < end) { if (await client.evaluate(expr)) return; await pause(80); } throw new Error('Timed out: ' + expr); }
async function check(name, expression) { assert.ok(await client.evaluate(expression), name); report.checks.push(name); console.log('PASS', name); }
async function viewport(width, height) { await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width === 390 }); await client.send('Emulation.setTouchEmulationEnabled', { enabled: width === 390 }); }
async function open(suffix) {
  await client.send('Page.navigate', { url: url + suffix });
  await until(`document.querySelector('main')?.innerText.length>100`);
  await client.evaluate(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}))`);
  await pause(800);
}
async function click(selector) {
  const point = await client.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point }); await pause(250);
}
async function layout(label) {
  const state = await client.evaluate(`({url:location.href,title:document.title,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,meaningful:document.querySelector('main').innerText.length>100,overlay:!!document.querySelector('vite-error-overlay,nextjs-portal'),broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),clipped:[...document.querySelectorAll('.wa-row,.wa-main,.wa h4,.wa-heading,.ia-tabs')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className)})`);
  assert.ok(state.url.startsWith(url)); assert.ok(state.title.endsWith(' · Hamilton Local')); assert.equal(state.width, state.scrollWidth, label + ': overflow'); assert.ok(state.meaningful && !state.overlay); assert.deepEqual(state.broken, []); assert.deepEqual(state.clipped, []); report.layouts.push({ label, ...state }); console.log('PASS layout', label);
}
async function screenshot(file) {
  if (await client.evaluate(`!!document.querySelector('#overview')`)) { await client.evaluate(`document.querySelector('#overview').scrollIntoView({behavior:'instant'})`); await pause(750); }
  await client.evaluate(`(async()=>{window.scrollTo({top:0,behavior:'instant'});await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));window.__captureMotion=document.getAnimations().filter(a=>a.effect.getTiming().iterations===Infinity&&a.playState==='running');window.__captureMotion.forEach(a=>a.pause());})()`);
  assert.ok(await client.evaluate(`[...document.querySelectorAll('h1 .sb-blur-char')].every(e=>getComputedStyle(e).opacity==='1'&&['none','blur(0px)'].includes(getComputedStyle(e).filter))`), file + ': title animation settled');
  const { contentSize } = await client.send('Page.getLayoutMetrics');
  const clip = { x: 0, y: 0, width: contentSize.width, height: contentSize.height, scale: 1 };
  const { data } = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
  fs.writeFileSync(path.join(shots, file), Buffer.from(data, 'base64')); report.screenshots.push({ file, width: clip.width, height: clip.height }); console.log('Saved', file);
  await client.evaluate(`window.__captureMotion.forEach(a=>a.play());delete window.__captureMotion`);
}
function sourceAudit() {
  const baseline=JSON.parse(fs.readFileSync(path.join(root,'out/v16-before.json'),'utf8'));
  const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  for(const [file,expected] of Object.entries(baseline.files)) {
    if(['work/src/App.tsx','work/src/styles.css','work/src/events-and-markets.json'].includes(file))continue;
    assert.equal(hash(path.join(root,file)),expected,'Preserved '+file);
    if(file.startsWith('work/public/photos/'))assert.equal(hash(path.join(__dirname,'dist/photos',path.basename(file))),expected);
  }
  const normalize=s=>s.replace(/import (?:WEEKEND from '.\/events-and-markets.json'|\{ WeekendAgenda \} from '.\/WeekendAgenda');/, 'WEEKEND_IMPORT').replace(/const CHECKED = .*?;/,'CHECKED').replace(/function Weekend\([\s\S]*?(?=  const cards = )/,'WEEKEND_BODY\n');
  assert.equal(normalize(fs.readFileSync(path.join(__dirname,'src/App.tsx'),'utf8')),normalize(baseline.app),'App beyond authorized weekend/date changes');
  assert.ok(fs.readFileSync(path.join(__dirname,'src/styles.css'),'utf8').startsWith(baseline.css),'Existing CSS preserved verbatim');
  report.checks.push('Source hashes: Motion.tsx, original fonts/CSS, all public photographs, merchant/phone data, locked teasers and research originals preserved; App changes limited to weekend body/import and Chinese check date');
}
async function eventAudit(lang='zh') {
  const records=await client.evaluate(`[...document.querySelectorAll('[data-event-id]')].map(e=>({id:e.dataset.eventId,title:e.querySelector('h4').textContent,text:e.innerText,links:[...e.querySelectorAll('a')].map(a=>a.href)}))`);
  assert.equal(records.length,research.events_this_week.length);
  assert.equal(new Set(records.map(e=>e.id)).size,records.length);
  for(const item of research.events_this_week) {
    const row=records.find(e=>e.id===item.id);assert.ok(row,item.id);assert.equal(row.title,item['title_'+lang]);assert.ok(row.text.includes(item['price_'+lang]));assert.ok(row.text.includes(item.venue));
    for(const link of [item.source_url,...(item.also||[])])assert.ok(row.links.includes(link),item.id+' source '+link);
  }
  await check('Chinese UI dates, no ISO dates or duplicate English title lines', `!/(?:2026-\\d{2}-\\d{2})/.test(document.body.innerText)&&!document.querySelector('.wa .ia-secondary-name')&&[...document.querySelectorAll('.wa time')].every(e=>/\\d+月\\d+日 周[一二三四五六日]/.test(e.textContent))`);
  report.checks.push('All 37 events match merged data ('+lang+'): unique IDs, titles, venues, prices and every source');
}
async function marketsAudit() {
  const records=await client.evaluate(`[...document.querySelectorAll('[data-weekend-market-id]')].map(e=>({id:e.dataset.weekendMarketId,title:e.querySelector('h4').textContent,text:e.innerText,links:[...e.querySelectorAll('a')].map(a=>a.href)}))`);
  const items=[...research.markets.already_on_site,...research.markets.hamilton_new,...research.markets.waikato_other];
  assert.equal(records.length,items.length);
  for(const item of items){const row=records.find(e=>e.id===item.id);assert.ok(row);assert.equal(row.title,item.title_zh);assert.ok(row.links.includes(item.source_url));}
  assert.equal(records.filter(e=>e.id==='hamilton-farmers-market').length,1);
  for(const id of ['cambridge-trash-n-treasure','morrinsville-country-market'])assert.ok(records.find(e=>e.id===id).text.includes('本周无场次'));
  assert.ok(records.find(e=>e.id==='rosetown-produce-fair').text.includes('来源待确认'));
  report.checks.push('11 compact markets match supplied/merged data; Hamilton Farmers’ Market once; past recurring sessions labelled; 406 source marked unconfirmed');
}
async function detailShot(file,selector,width,height) {
  await viewport(width,height);
  await client.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`);await pause(650);
  const {data}=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(shots,file),Buffer.from(data,'base64'));report.screenshots.push({file,width,height,kind:'viewport detail'});console.log('Saved',file);
}
module.exports = { connect };
if(require.main===module)(async()=>{
  fs.mkdirSync(shots,{recursive:true});
  chrome=spawn(chromePath,['--headless=new','--no-sandbox','--hide-scrollbars','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--disable-extensions','--disable-domain-reliability','--no-proxy-server','--host-resolver-rules=MAP * ~NOTFOUND','--remote-debugging-port=9255','--remote-debugging-address=127.0.0.1',`--user-data-dir=${path.join(root,'out/.chrome-v16-qa')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
  try {
    let ready=false;for(let i=0;i<80;i++){try{await fetch(endpoint+'/json/version');ready=true;break;}catch{await pause(150);}}assert.ok(ready,'Chrome loopback ready');
    const target=await(await fetch(endpoint+'/json/new?about:blank',{method:'PUT'})).json();client=await connect(target.webSocketDebuggerUrl);
    client.on('Runtime.exceptionThrown',e=>report.errors.push(e.exceptionDetails));client.on('Runtime.consoleAPICalled',e=>{if(['error','warning'].includes(e.type))report[e.type==='error'?'errors':'warnings'].push(e.args.map(a=>a.value||a.description).join(' '));});
    client.on('Network.requestWillBeSent',e=>{if(/^https?:/.test(e.request.url))report.externalRequests.push(e.request.url);});
    await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Network.enable');await client.send('Network.setBlockedURLs',{urls:['http://*','https://*']});
    await client.send('Page.addScriptToEvaluateOnNewDocument',{source:`try{localStorage.setItem('hl-lang','zh')}catch{}`});
    sourceAudit();
    await viewport(1440,1000);await open('#/weekend');
    await check('Locked weekend order and Hamilton default',`JSON.stringify([...document.querySelectorAll('[role=tab]')].map(e=>e.textContent))===JSON.stringify(['本周精选','周末集市','节日活动'])&&document.querySelector('[aria-selected=true]').id==='tab-picks'&&document.querySelector('[aria-pressed=true]').dataset.region==='Hamilton'`);
    await layout('picks desktop default 1440');await screenshot('02-weekend-picks-desktop.png');await detailShot('02a-picks-desktop-detail.png','.wa',1440,1100);
    await click('[data-region=all]');await eventAudit();await layout('all regions desktop');await screenshot('07-picks-all-regions-desktop.png');
    await check('All groups and counts derive from records',`[...document.querySelectorAll('.wa-chip')].every(e=>Number(e.querySelector('span').textContent)===(e.dataset.region==='all'?37:[...document.querySelectorAll('[data-region-group]')].find(g=>g.dataset.regionGroup===e.dataset.region).querySelectorAll('[data-event-id]').length))`);
    await check('PB and Round the Bridges deduped, timing conflict and jet-ski venue preserved',`document.querySelectorAll('[data-event-id^=pb-festival]').length===1&&document.querySelectorAll('[data-event-id^=round-the-bridges]').length===1&&document.querySelector('[data-event-id^=round-the-bridges]').innerText.includes('待确认')&&document.querySelector('[data-event-id=jet-ski-lake-waahi]').innerText.includes('Lake Waahi Reserve')`);
    await click('[data-testid=lang]');await eventAudit('en');await check('English language switch works',`document.title==="What's On · Hamilton Local"&&document.querySelector('#tab-picks').textContent==='This week'`);await layout('picks English desktop');await click('[data-testid=lang]');
    await click('#tab-markets');await check('Market hash route and default region',`location.hash==='#/weekend?tab=markets'&&document.querySelector('[aria-pressed=true]').dataset.region==='Hamilton'`);await layout('markets desktop');await screenshot('03-weekend-markets-desktop.png');await click('[data-region=all]');await marketsAudit();await layout('all markets desktop');await screenshot('08-markets-all-regions-desktop.png');
    await click('#tab-festivals');await check('Festival and placeholder unchanged',`document.querySelector('#section-panel').innerText.includes('怀卡托热气球节')&&document.querySelector('.ia-inline-empty').textContent==='更多节日 · 内容整理中'&&document.querySelector('#section-panel a').href==='https://balloonsoverwaikato.co.nz/'`);await layout('festivals desktop');await screenshot('04-weekend-festivals-desktop.png');
    await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Home',code:'Home',windowsVirtualKeyCode:36});await client.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Home',code:'Home',windowsVirtualKeyCode:36});await pause(200);await check('Tab keyboard Home navigation',`document.activeElement.id==='tab-picks'&&document.querySelector('[aria-selected=true]').id==='tab-picks'`);
    const history=await client.send('Page.getNavigationHistory');await client.send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex-1].id});await pause(250);await check('Hash back restores festivals',`document.querySelector('[aria-selected=true]').id==='tab-festivals'`);
    await viewport(390,844);await open('#/weekend');await layout('picks mobile default 390');await screenshot('05-weekend-picks-mobile.png');await detailShot('05a-picks-mobile-detail.png','.ia-tabs',390,1100);
    await check('390px chips stay on one compact scrollable row',`document.querySelector('.wa-regions').scrollWidth>document.querySelector('.wa-regions').clientWidth&&new Set([...document.querySelectorAll('.wa-chip')].map(e=>Math.round(e.getBoundingClientRect().y))).size===1&&[...document.querySelectorAll('.wa-chip')].every(e=>e.getBoundingClientRect().height<=44)`);
    await click('[data-region=other]');await check('Mobile region chip updates visible events',`document.querySelector('[aria-pressed=true]').dataset.region==='other'&&[...document.querySelectorAll('[data-region-group]')].length===1&&document.querySelector('[data-event-id=jet-ski-lake-waahi]')!==null`);await layout('picks other Waikato mobile');await screenshot('09-picks-other-waikato-mobile.png');
    await client.evaluate(`document.querySelector('[data-region=Cambridge]').focus()`);await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await client.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(250);await check('Region chips support keyboard activation and visible focus',`document.querySelector('[aria-pressed=true]').dataset.region==='Cambridge'&&getComputedStyle(document.activeElement).outlineStyle!=='none'`);await layout('Cambridge mobile');await screenshot('10-picks-cambridge-mobile.png');
    await click('#tab-markets');await layout('markets mobile');await screenshot('06-weekend-markets-mobile.png');await click('[data-region=all]');await marketsAudit();await layout('all markets mobile');await screenshot('11-markets-all-regions-mobile.png');
    await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('[data-region=Raglan]');await check('Reduced motion respected',`getComputedStyle(document.querySelector('.wa-results')).animationName==='none'`);await client.send('Emulation.setEmulatedMedia',{features:[]});
    await viewport(1440,1000);await open('#/');await check('Default window hero',`document.querySelector('.sb-hero-media').dataset.hero==='window'`);
    await check('Locked teaser photographs',`Object.entries({living:'teaser-living-a',weekend:'band-hamilton-lake',kids:'teaser-kids-c',services:'teaser-services-a',tools:'teaser-tools-b'}).every(([id,f])=>document.querySelector('[data-teaser="'+id+'"] img').getAttribute('src')==='./photos/'+f+'.webp')`);
    await check('Homepage weekend pill order',`JSON.stringify([...document.querySelectorAll('[data-teaser=weekend] .ia-tool-pills a')].map(a=>[a.textContent,a.getAttribute('href')]))===JSON.stringify([['本周精选','#/weekend?tab=picks'],['周末集市','#/weekend?tab=markets'],['节日活动','#/weekend?tab=festivals']])`);await layout('home desktop');await screenshot('01-home-desktop.png');
    for(const mode of ['window','a','b']){await open('?hero='+mode+'#/');await until(`document.querySelector('.sb-hero-media')?.dataset.hero===${JSON.stringify(mode)}`);await check('Hero query '+mode,`document.querySelector('.sb-hero-media').dataset.hero===${JSON.stringify(mode)}`);}
    await open('#/');await click('[data-testid=credits-btn]');await check('Credits retain 12 photograph records',`document.querySelector('dialog').open&&document.querySelectorAll('[data-photo-credit]').length===12&&document.querySelector('dialog').innerText.includes('Emily Walker')`);
    await open('#/living');await check('Supermarket order retained',`JSON.stringify([...document.querySelectorAll('[data-market-id]')].map(e=>e.dataset.marketId))===JSON.stringify(['newsave-tristram','newsave-thebase','wellmart','green-patch-grey','green-patch-borman','garden-fresh'])`);
    await open('#/living?tab=dining');await check('Other placeholders retained',`document.querySelector('[data-testid=empty-state]').innerText.includes('内容整理中')`);
    await open('#/tools?tab=urgent');await check('急诊 spelling retained',`document.querySelector('#tab-urgent').textContent==='急诊信息'&&!document.body.innerText.includes('急症')`);
    await open('#/weekend?tab=invalid');await check('Invalid tab falls back to picks',`document.querySelector('[aria-selected=true]').id==='tab-picks'`);
    assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);assert.deepEqual(report.externalRequests,[]);report.checks.push('No runtime errors, console warnings, broken images, overlays or external page requests during offline QA');report.passed=true;
  }catch(error){report.failure=error.message;console.error(error);process.exitCode=1;}
  finally {fs.writeFileSync(path.join(root,'out/qa-results.json'),JSON.stringify(report,null,2));if(client){await client.send('Browser.close').catch(()=>{});client.ws.close();}if(chrome&&chrome.exitCode===null)chrome.kill();}
})();
