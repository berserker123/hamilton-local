// Offline Chrome/CDP validation. Uses only local files and loopback browser control.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const vm = require('node:vm');
const esbuild = require('esbuild');
const imageManifest = require('./src/teaser-images.json');
const marketOrder = ['newsave-tristram','newsave-thebase','wellmart','green-patch-grey','green-patch-borman','garden-fresh'];
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9247;
const endpoint = `http://127.0.0.1:${port}`;
const shots = path.resolve(__dirname, '../out/shots');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { browser: chromePath, browserPlugin: 'Browser plugin not available; using TASK.md offline Chrome/CDP capture script, without installing dependencies', url: pathToFileURL(path.join(__dirname, 'dist/index.html')).href, checks: [], layouts: [], exceptions: [], consoleErrors: [], blockedRequests: [], screenshots: [] };
let chrome, client;
// Keep Node alive while the built-in WebSocket has pending CDP requests.
const keepAlive = setInterval(() => {}, 1000);
console.log('Offline capture starting');

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map(), listeners = new Map();
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const p = pending.get(message.id);
      if (!p) return;
      pending.delete(message.id);
      message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result);
    } else for (const callback of listeners.get(message.method) || []) callback(message.params);
  };
  ws.onclose = () => { for (const p of pending.values()) p.reject(new Error('Chrome CDP connection closed')); pending.clear(); };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  return { ws, send, evaluate, on(name, callback) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(callback); } };
}

async function check(name, expression) {
  const result = await client.evaluate(expression);
  if (!result) {
    report.failureState = await client.evaluate(`({scrollY,weather:document.querySelector('[data-testid="wx-pill"]')?.outerHTML,dialog:document.querySelector('[role="dialog"]')?.outerHTML,lastClick:window.__lastClick,atClick:window.__lastClick ? document.elementFromPoint(window.__lastClick.x,window.__lastClick.y)?.outerHTML.slice(0,500) : null})`);
    const {data}=await client.send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(__dirname,'qa-failure.png'),Buffer.from(data,'base64'));
  }
  assert.ok(result, name);
  report.checks.push({ name, result: 'PASS' });
}
async function click(selector) {
  await client.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
  await pause(160);
  const point = await client.evaluate(`(() => {const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return window.__lastClick={x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await client.send('Input.dispatchMouseEvent', {type:'mouseMoved',...point});
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  await pause(140);
}
async function search(value) {
  await click('input[type=search]');
  await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await client.send('Input.insertText', { text: value });
  await pause(160);
}
async function setViewport(width, height, mobile) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await pause(250);
}
async function settlePage() {
  await client.evaluate(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});} ))`);
  await client.evaluate(`(async()=>{for(const section of document.querySelectorAll('main > section')){section.scrollIntoView({block:'start',behavior:'instant'});await new Promise(r=>setTimeout(r,200));} scrollTo({top:0,behavior:'instant'});})()`);
  await pause(1300);
}
async function screenshot(filename, selector) {
  // Let transient copy/search notifications expire before review screenshots.
  await client.evaluate(`(async()=>{for(let i=0;i<45 && document.querySelector('[role=status]');i++)await new Promise(r=>setTimeout(r,100));})()`);
  await client.evaluate(`document.activeElement instanceof HTMLElement && document.activeElement.blur()`);
  await client.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
  if (selector) {
    await client.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`);
    await pause(950);
  } else {
    await client.evaluate(`scrollTo({top:0,behavior:'instant'})`);
    await pause(350);
  }
  const clip = await client.evaluate(selector
    ? `(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}; })()`
    : `({x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1})`);
  const { data } = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
  fs.writeFileSync(path.join(shots, filename), Buffer.from(data, 'base64'));
  report.screenshots.push({ file: filename, width: clip.width, height: clip.height });
  console.log('Saved', filename, `${clip.width}x${Math.round(clip.height)}`);
}
﻿const verified = require('./src/verified-urls.json');
const allowed = verified.verified.map(v => v.url);
const requests = [];
async function go(route, tab) {
  const hash = '#/' + (route === 'home' ? '' : route) + (tab ? '?tab=' + tab : '');
  await client.evaluate(`location.hash=${JSON.stringify(hash)}`);
  await pause(450);
}
async function layout(label) {
  const data = await client.evaluate(`(() => {
    const visible = e => {const r=e.getBoundingClientRect();return r.width>0 && r.height>0 && getComputedStyle(e).visibility!=='hidden';};
    const targets=[...document.querySelectorAll('a,button,input')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return {text:e.innerText.trim().slice(0,50)||e.getAttribute('aria-label'),width:r.width,height:r.height};});
    return {viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,route:location.hash,title:document.title,smallTargets:targets.filter(t=>t.height<43.9 || t.width<43.9),clipped:[...document.querySelectorAll('article')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.innerText.slice(0,60))};
  })()`);
  report.layouts.push({label,...data});
  assert.equal(data.pageWidth,data.viewport,`${label}: no horizontal overflow`);
  assert.equal(data.smallTargets.length,0,`${label}: 44px touch targets ${JSON.stringify(data.smallTargets)}`);
  assert.equal(data.clipped.length,0,`${label}: no clipped cards`);
}
async function links(label) {
  const urls = await client.evaluate(`[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>!h.startsWith('#'))`);
  const storeMaps = await client.evaluate(`[...document.querySelectorAll('a[href="https://maps.app.goo.gl/q6puR6FKnBUKsNDVA"]')].every(a=>a.closest('[data-market-id]')?.dataset.marketId==='newsave-thebase')`);
  assert.ok(storeMaps,label+': dedicated map link confined to The Base store');
  const invalid = urls.filter(url=>!allowed.includes(url) && url!=='https://maps.app.goo.gl/q6puR6FKnBUKsNDVA');
  assert.deepEqual(invalid,[],label+': only allowlisted link-outs');
  report.checks.push({name:label+': only allowlisted link-outs',result:'PASS'});
}
async function routeCheck(route, tab, language) {
  const en = language==='en';
  await check(`${language}: ${route}/${tab||'default'} identity and content`, `document.title.endsWith(' · Hamilton Local') && document.documentElement.lang===${JSON.stringify(en?'en-NZ':'zh-CN')} && document.querySelector('h1').innerText.trim().length>0 && document.querySelector('main').innerText.length>100 && !document.querySelector('vite-error-overlay,nextjs-portal') && [...document.querySelectorAll('nav a[aria-current="page"]')].every(a=>a.getAttribute('href')===${JSON.stringify('#/'+(route==='home'?'':route))})`);
  if(tab) await check(`${language}: ${route}/${tab} selected tab and panel`, `document.querySelector('[role="tab"][aria-selected="true"]').id===${JSON.stringify('tab-'+tab)} && document.querySelectorAll('[role="tabpanel"]').length===1`);
  await links(`${language} ${route}/${tab||'home'}`);
}
async function escape() {
  await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await client.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await pause(150);
}
async function verifyTeasers(label) {
  await settlePage();
  const expected = {living:'./photos/teaser-living-a.webp',kids:'./photos/teaser-kids-c.webp',services:'./photos/teaser-services-a.webp'};
  expected.weekend='./photos/band-hamilton-lake.webp';
  expected.tools='./photos/teaser-tools-b.webp';
  await check(label, `Object.entries(${JSON.stringify(expected)}).every(([id,src])=>{const img=document.querySelector('[data-teaser="'+id+'"] img');return img?.getAttribute('src')===src && img.complete && img.naturalWidth>0;})`);
}
(async()=>{
  fs.mkdirSync(shots,{recursive:true});
  const baseline = require('../out/v12-baseline.json');
  const context={module:{exports:{}}};context.exports=context.module.exports;
  vm.runInNewContext(esbuild.transformSync(fs.readFileSync(path.join(__dirname,'src/local-data.ts'),'utf8'),{loader:'ts',format:'cjs'}).code,context);
  const stores=JSON.parse(JSON.stringify(context.module.exports.SUPERMARKETS));
  assert.deepEqual(stores.map(s=>s.id),marketOrder,'Requested supermarket order');
  assert.deepEqual(imageManifest.credits,baseline.credits,'All inherited Commons credits preserved');
  const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  for(const [file,original] of Object.entries(baseline.sourceHashes))if(!['App.tsx','teaser-images.json'].includes(file))assert.equal(hash(path.join(__dirname,'src',file)),original,'Unrelated source preserved: '+file);
  for(const [file,original] of Object.entries(baseline.photoHashes))for(const dir of ['public/photos','dist/photos'])assert.equal(hash(path.join(__dirname,dir,file)),original,'Existing photo preserved: '+dir+'/'+file);

  for(const file of fs.readdirSync(path.join(__dirname,'src')).filter(file=>/\.(tsx?|json)$/.test(file)))assert.ok(!fs.readFileSync(path.join(__dirname,'src',file),'utf8').includes('\u6025\u75c7'),'No old Chinese urgent-care wording in '+file);
  report.checks.push({name:'Source audit: store details and original photos unchanged; three new tools images copied intact to public and dist; urgent-care terminology preserved',result:'PASS'});
  chrome=spawn(chromePath,[
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--no-first-run','--no-default-browser-check',
    '--disable-background-networking','--disable-component-update','--disable-sync','--disable-extensions','--disable-domain-reliability',
    '--no-proxy-server','--host-resolver-rules=MAP * ~NOTFOUND',`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${path.join(__dirname,'.chrome-ia-profile')}`,'about:blank'
  ],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  chrome.stderr.on('data',()=>{});
  let ready=false;
  for(let i=0;i<80;i++){try{await fetch(endpoint+'/json/version');ready=true;break;}catch{await pause(150);}}
  assert.ok(ready,'Local Chrome debugging endpoint');
  const target=await(await fetch(endpoint+'/json/new?about:blank',{method:'PUT'})).json();
  client=await connect(target.webSocketDebuggerUrl);
  client.on('Runtime.exceptionThrown',e=>report.exceptions.push(e.exceptionDetails));
  client.on('Runtime.consoleAPICalled',e=>{if(e.type==='error')report.consoleErrors.push(e.args.map(a=>a.value||a.description).join(' '));});
  client.on('Network.requestWillBeSent',e=>{if(/^https?:/.test(e.request.url))requests.push(e.request.url);});
  await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Network.enable');
  await client.send('Network.setBlockedURLs',{urls:['http://*','https://*']});
  await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await setViewport(1440,1000,false);
  await client.send('Page.navigate',{url:report.url+'#/'});await pause(800);
  if(await client.evaluate(`document.documentElement.lang!=='zh-CN'`))await click('[data-testid="lang"]');
  await check('v9: Chinese home navigation uses 首页',`[...document.querySelectorAll('nav a[href="#/"]')].every(a=>a.innerText==='首页') && !document.body.innerText.includes('总览')`);
  await settlePage();
  await check('v12: default locked mix and Orbiter load without query parameters',`Object.entries({living:'teaser-living-a.webp',weekend:'band-hamilton-lake.webp',kids:'teaser-kids-c.webp',services:'teaser-services-a.webp',tools:'teaser-tools-b.webp'}).every(([id,photo])=>{const card=document.querySelector('[data-teaser="'+id+'"]'),img=card.querySelector('.ia-teaser-photo');return img?.getAttribute('src')==='./photos/'+photo && img.naturalWidth>0 && getComputedStyle(card).backgroundImage.includes('linear-gradient');})`);
  await check('v9: homepage supermarket mentions are bilingual',`['新宜超市 New Save','物美超市 Wellmart','华盛超市 Garden Fresh'].every(name=>document.querySelector('[data-teaser="living"]').innerText.includes(name))`);
  await check('Home contains five teasers, train hero and weather link, no full listing grids',`document.querySelectorAll('[data-teaser]').length===5 && !document.querySelector('.ia-market-grid,.ia-place-grid,.ia-tool-grid') && !!document.querySelector('img[src$="hero-train.webp"]') && !!document.querySelector('.ia-weather')`);
  for(const key of ['tools','style'])for(const value of ['a','b','c','invalid','']) {
    for(const url of [report.url+'?'+key+'='+value+'#/',report.url+'#/?'+key+'='+value]) {
      await client.send('Page.navigate',{url});await pause(150);
      await verifyTeasers('Locked Orbiter ignores '+url.slice(report.url.length));
    }
  }
  await client.send('Page.navigate',{url:report.url+'?tools=a#/?tools=c&style=a'});await pause(250);
  await verifyTeasers('Conflicting page/hash parameters cannot override Orbiter');
  await click('.sb-desktop-nav a[href^="#/living"]');
  await check('Living navigation discards tools switching',`!location.hash.includes('tools=') && document.querySelectorAll('[data-market-id]').length===6`);
  await click('.sb-brand');await verifyTeasers('Returning Home keeps Orbiter');
  await client.send('Page.navigate',{url:report.url+'#/'});await pause(350);
  const routes={home:[''],living:['grocers','dining','places'],weekend:['markets','festivals','picks'],kids:['map','places','parties'],services:['home','trades','daily'],tools:['bins','transport','urgent']};
  for(const language of ['zh','en']) {
    if(language==='en')await click('[data-testid="lang"]');
    for(const width of [1440,390]) {
      await setViewport(width,width===390?844:1000,width===390);
      for(const [route,tabs] of Object.entries(routes))for(const tab of tabs){
        await go(route,tab);await routeCheck(route,tab,language);await layout(`${language}-${width}-${route}-${tab}`);
        if(route==='living'&&tab==='grocers') {
          await check(`${language} ${width}: exact supermarket order and grid positions`, `(()=>{const cards=[...document.querySelectorAll('[data-market-id]')],r=cards.map(c=>c.getBoundingClientRect());return JSON.stringify(cards.map(c=>c.dataset.marketId))===${JSON.stringify(JSON.stringify(marketOrder))} && (${width}===1440 ? r[0].top===r[1].top && r[1].top===r[2].top && r[3].top===r[4].top && r[4].top===r[5].top && r[3].top>r[0].top && r[0].left<r[1].left && r[1].left<r[2].left && r[3].left<r[4].left && r[4].left<r[5].left : r.every((v,i)=>i===0||v.top>r[i-1].top));})()`);
          await check(`${language} ${width}: six supermarkets, five checked and pending Borman`, `document.querySelectorAll('[data-market-id]').length===6 && document.querySelector('[data-market-id="green-patch-borman"]').innerText.includes('Borman Fresh') && document.querySelector('[data-market-id="green-patch-grey"]').innerText.includes('680 Grey Street') && document.querySelector('.ia-list-toolbar').innerText.includes(${JSON.stringify(language==='zh'?'6 家门店 · 5 家已核对 · 1 家品牌待核实':'6 stores · 5 checked · 1 brand unconfirmed')}) && !document.querySelector('.ia-market-card code')`);
          await check(`${language} ${width}: verified The Base details and exact dedicated map`, `(()=>{const card=document.querySelector('[data-market-id="newsave-thebase"]');return card.innerText.includes('07 949 7088') && card.innerText.includes('The Base, Corner of Te Rapa Road & Wairere Drive, Te Rapa, Hamilton 3200') && card.innerText.includes(${JSON.stringify(language==='zh'?'每天 9:00–19:00（The Base 商场目录）':'Daily 9:00am–7:00pm (The Base directory)')}) && card.querySelector('a').href==='https://maps.app.goo.gl/q6puR6FKnBUKsNDVA' && document.querySelectorAll('.ia-market-card a[href]').length===1;})()`);
          if(language==='zh')await check(`${width}: bilingual headings on every supermarket`, `Object.entries({'newsave-tristram':'新宜超市 New Save','newsave-thebase':'新宜超市 New Save',wellmart:'物美超市 Wellmart','garden-fresh':'华盛超市 Garden Fresh','green-patch-grey':'绿盈超市 Green Patch','green-patch-borman':'绿盈超市 Green Patch'}).every(([id,name])=>document.querySelector('[data-market-id="'+id+'"] h2').innerText===name)`);
          await check(`${language} ${width}: directory wording corrected`, `document.querySelector('[data-market-id="green-patch-grey"]').innerText.includes(${JSON.stringify(language==='zh'?'目录信息':'directory listing')})`);
        }
        if(route==='kids'&&tab==='map')await check(`${language} ${width}: map labels without facility pins`, `document.querySelector('.ia-map-grid').innerText.includes('Rototuna') && !document.querySelector('iframe,.map-pin')`);
        if(route==='tools'&&tab==='urgent')await check(`${language} ${width}: four clinics and Healthline`, `document.querySelectorAll('.sb-clinic').length===4 && document.querySelector('main').innerText.includes('0800 611 116') && document.querySelector('main').innerText.includes('Anglesea') && !document.querySelector('main').innerText.includes('Angelsea') && !!document.querySelector('a[href="https://www.healthnz.govt.nz/online-phone-healthcare/healthline"]')`);
      }
    }
  }
  // Exercise actual controls rather than only entering deep links.
  await setViewport(1440,1000,false);await go('home');
  await search('680');await click('.ia-hero-search button[type="submit"]');
  await check('Home search deep-links to filtered grocers', `location.hash.includes('/living?tab=grocers&q=680') && document.querySelectorAll('[data-market-id]').length===1 && !!document.querySelector('[data-market-id="green-patch-grey"]')`);
  await search('nonmatching-xyz');
  await check('Grocer search empty state',`document.querySelectorAll('[data-market-id]').length===0 && !!document.querySelector('[data-testid="empty-state"]')`);
  await click('.ia-inline-search button');
  await check('Clear search restores six listings',`document.querySelectorAll('[data-market-id]').length===6`);
  await search('The Base');
  await check('Search finds The Base branch independently',`document.querySelectorAll('[data-market-id]').length===1 && !!document.querySelector('[data-market-id="newsave-thebase"]')`);
  await click('.ia-inline-search button');
  await click('.ia-market-card .sb-action');
  await check('Copy address provides status feedback',`!!document.querySelector('[role="status"]')`);
  await click('[data-testid="sources-btn"]');
  await check('Page-level Sources: 17 text-only supermarket references including The Base',`document.querySelector('dialog').open && document.querySelectorAll('.ia-source-record').length===17 && [...document.querySelectorAll('.ia-source-record')].filter(e=>/jany.io|edan.io/.test(e.innerText)).every(e=>e.innerText.includes('Directory listing')) && ['https://maps.app.goo.gl/q6puR6FKnBUKsNDVA','https://www.the-base.co.nz/en/directory/detail/new-save-asian-fresh-supermarket/','https://www.the-base.co.nz/en/contact/'].every(url=>[...document.querySelectorAll('.ia-source-record code')].some(e=>e.innerText===url)) && !document.querySelector('.ia-source-record a')`);
  await links('Sources dialog');await layout('desktop-sources-dialog');
  await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:1});
  await check('Sources keyboard focus stays inside dialog',`document.querySelector('dialog').contains(document.activeElement)`);
  await escape();
  await check('Escape closes Sources and restores opener focus',`!document.querySelector('dialog') && document.activeElement.dataset.testid==='sources-btn'`);
  await click('[data-testid="tab-dining"]');
  await check('Clicking Living tab shows genuine empty state',`location.hash.includes('tab=dining') && !!document.querySelector('[data-testid="empty-state"]')`);
  await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await pause(250);
  await check('Arrow keys select next tab with real places',`location.hash.includes('tab=places') && document.querySelectorAll('[data-place-id]').length>0`);
  await go('services','home');await click('[data-testid="join"]');
  await check('Business placeholder CTA announces coming soon',`document.querySelector('[role="status"]').innerText.includes('Coming soon') && !document.querySelector('form')`);
  await go('tools','bins');await click('[data-testid="tab-transport"]');
  await check('Bus panel retains all 19 existing routes',`document.querySelectorAll('.sb-route').length===19`);
  await client.evaluate('history.back()');await pause(300);
  await check('Browser Back restores prior tool tab',`location.hash.includes('tab=bins') && document.querySelector('[aria-selected="true"]').id==='tab-bins'`);
  await click('[data-testid="credits-btn"]');
  await check('Credits preserve authors, licences and raw references',`document.querySelector('dialog').open && document.querySelector('dialog').innerText.includes('David Thomsen') && document.querySelector('dialog').innerText.includes('CC BY-SA 4.0') && document.querySelector('dialog').innerText.includes('commons.wikimedia.org')`);
  await check('Teaser photos retain inherited credits coverage',`['band-tools','band-market','band-urgent','Hamilton Gardens','Michal Klajban'].every(text=>document.querySelector('dialog').innerText.includes(text))`);
  await check('Three new Commons image credits include title, author, source, licence URL and modifications',`document.querySelectorAll('[data-photo-credit]').length===12 && ${JSON.stringify(imageManifest.credits)}.every(image=>{const card=document.querySelector('[data-photo-credit="'+image.id+'"]');return [image.sourceFile,image.author,image.license,image.url,image.licenseUrl,image.note,'WebP'].every(text=>card.innerText.includes(text));})`);
  await links('Credits dialog');await escape();
  await client.send('Page.reload');await pause(600);
  await check('Deep route and English preference survive reload',`location.hash.includes('/tools?tab=bins') && document.documentElement.lang==='en-NZ' && document.querySelector('[aria-selected="true"]').id==='tab-bins'`);
  // Extra responsive widths on all six default routes.
  for(const width of [768,1024,1200]){await setViewport(width,1000,false);for(const [route,tabs] of Object.entries(routes)){await go(route,tabs[0]);await layout(`responsive-${width}-${route}`);}}
  await setViewport(390,844,true);await go('living','grocers');await click('[data-testid="sources-btn"]');await layout('mobile-sources-dialog');await escape();
  await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await go('home');await settlePage();
  await check('Normal motion reveals homepage content',`getComputedStyle(document.querySelector('.ia-overview')).opacity==='1' && getComputedStyle(document.querySelector('.sb-blur-char')).opacity==='1'`);
  await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await click('[data-testid="lang"]');
  await go('home');await click('[data-testid="credits-btn"]');
  await check('Chinese credits expose all twelve images and modification notice',`document.querySelectorAll('[data-photo-credit]').length===12 && [...document.querySelectorAll('[data-photo-credit]')].every(e=>e.innerText.includes('图片经裁剪、缩放并转换为 WebP'))`);await escape();
  await client.send('Page.navigate',{url:report.url+'#/'});await pause(350);
  await setViewport(1440,1000,false);await settlePage();
  await check('Screenshots use the default #/ with no query',`location.search==='' && location.hash==='#/'`);
  await verifyTeasers('Desktop screenshot has all five locked photos including Orbiter');
  await screenshot('01-home-desktop.png');
  await screenshot('01b-home-teasers.png','.ia-teaser-grid');
  await setViewport(390,844,true);await go('home');await settlePage();
  await verifyTeasers('Mobile screenshot has all five locked photos including Orbiter');
  await check('Mobile screenshot uses the default #/ with no query',`location.search==='' && location.hash==='#/'`);
  await screenshot('02-home-mobile.png');
  await check('No broken local images on default mobile home',`[...document.images].every(i=>i.complete && i.naturalWidth>0)`);
  assert.deepEqual(requests,[],'No external network requests attempted by app');
  assert.equal(report.exceptions.length,0,'No runtime exceptions');assert.equal(report.consoleErrors.length,0,'No app console errors');
  report.externalRequests=requests;
  report.checks.push({name:'No external requests, runtime exceptions or application console errors',result:'PASS'});
  report.status='PASS';console.log(`QA passed: ${report.checks.length} checks; ${report.layouts.length} layouts; ${report.screenshots.length} screenshots`);
})().catch(error=>{report.status='FAIL';report.failure=error.stack;console.error(error);process.exitCode=1;}).finally(async()=>{
  fs.writeFileSync(path.join(__dirname,'qa-results.json'),JSON.stringify(report,null,2));
  if(client){try{await client.send('Browser.close');}catch{}client.ws.close();}
  if(chrome)chrome.kill();clearInterval(keepAlive);
});

