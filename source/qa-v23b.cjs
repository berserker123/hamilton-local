const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base='http://127.0.0.1:4184',out=path.resolve(__dirname,'../out'),shots=path.join(out,'shots');
const report={url:base,browserPlugin:'Browser plugin not available; using existing local Playwright',checks:[],consoleErrors:[],pageErrors:[],httpErrors:[]};
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const routes=['','#/living','#/living?tab=dining','#/living?tab=places','#/weekend','#/weekend?tab=markets','#/weekend?tab=festivals','#/kids','#/kids?tab=places','#/kids?tab=parties','#/services','#/services?tab=trades','#/services?tab=daily','#/tools','#/tools?tab=transport','#/tools?tab=urgent'];
(async()=>{
 fs.mkdirSync(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe'});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  p.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});p.on('pageerror',e=>report.pageErrors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.httpErrors.push({url:r.url(),status:r.status()})});
  await p.goto(base);await p.locator('#guide-tab-living').click();
  const records=await p.locator('[data-preview-record]').evaluateAll(es=>es.map(e=>e.dataset.previewRecord));
  const source=require('esbuild').buildSync({entryPoints:['src/local-data.ts'],bundle:true,platform:'node',format:'cjs',write:false});const data={exports:{}};new Function('module','exports',source.outputFiles[0].text)(data,data.exports);
  const markets=records.map(id=>data.exports.SUPERMARKETS.find(s=>s.id===id));assert.equal(markets.length,3);assert.ok(markets.every(Boolean));assert.equal(new Set(markets.map(s=>s.brand)).size,3,'preview must show three different real brands');
  for(const lang of ['zh','en']){if(lang==='en')await p.getByTestId('lang').click();assert.deepEqual(await p.locator('[data-preview-record] strong').allTextContents(),markets.map(s=>lang==='zh'?s.zhName:s.name));}
  await p.getByTestId('lang').click();await p.locator('.v23-feature').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(shots,'v23b-home-tabs.png')});report.checks.push('Three existing brands; Chinese/English names and record IDs agree');
  for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740}]){
   await p.setViewportSize(viewport);
   for(const route of routes){
    await p.goto(base+'/'+route);await p.locator('h1').waitFor();const pill=p.getByTestId('feedback-launcher');assert.equal(await pill.evaluate(e=>getComputedStyle(e).position),'fixed');
    await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(150);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');const pb=await pill.boundingBox();assert.ok(pb.x>=0&&pb.y>=0&&pb.x+pb.width<=viewport.width&&pb.y+pb.height<=viewport.height);
    const footer=await p.locator('.ia-footer-bottom').boundingBox();assert.ok(footer.y+footer.height+12<=pb.y,'footer needs clear space above launcher');
    for(const selector of ['.ia-footer-actions button','.fb-footer-button','.ia-quick-links a','.ia-market-actions button','.v23-preview-open']){
     for(const el of await p.locator(selector).all()){await el.evaluate(e=>e.scrollIntoView({block:'center'}));await p.waitForTimeout(30);assert.ok(!overlaps(await pill.boundingBox(),await el.boundingBox()),'launcher obscures '+selector);}
    }
    if(!route&&viewport.width===390){await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(100);await p.screenshot({path:path.join(shots,'v23b-feedback-mobile-bottom.png')});}
   }
   report.checks.push(`${viewport.width}px: fixed visible launcher, footer clearance, reachable buttons/tags on 16 routes`);
  }
  await p.goto(base+'/#/services');await p.getByTestId('join').click();await p.locator('.ia-toast').waitFor();assert.ok(!overlaps(await p.getByTestId('feedback-launcher').boundingBox(),await p.locator('.ia-toast').boundingBox()),'toast overlaps feedback');
  await p.getByTestId('feedback-launcher').click();await p.locator('dialog[open]').waitFor();await p.keyboard.press('Escape');assert.equal(await p.locator('dialog[open]').count(),0);report.checks.push('Toast clearance; launcher opens unchanged modal; Escape closes it');
  const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{bottom:34}});await p.evaluate(()=>{dispatchEvent(new Event('resize'));scrollTo(0,document.body.scrollHeight)});await p.waitForTimeout(100);const safePill=await p.getByTestId('feedback-launcher').boundingBox(),safeFooter=await p.locator('.ia-footer-bottom').boundingBox();assert.ok(safePill.y+safePill.height<=740-34);assert.ok(safeFooter.y+safeFooter.height+12<=safePill.y);report.checks.push('34px bottom safe-area emulation: launcher and footer remain clear');
  assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.httpErrors,[]);report.passed=true;report.checks.forEach(c=>console.log('PASS',c));console.log('PASS zero console/page errors and HTTP/404 errors');
 }finally{fs.writeFileSync(path.join(out,'qa-v23b.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
