process.env.PLAYWRIGHT_BROWSERS_PATH=require('path').resolve(__dirname,'../out/playwright-tools');
const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const base='http://127.0.0.1:4184',out=path.resolve(__dirname,'../out'),shots=path.join(out,'shots');
// Reuse supplied FFmpeg; this Playwright version expects its older directory name.
const ffmpeg=path.join(process.env.PLAYWRIGHT_BROWSERS_PATH,'ffmpeg-1011','ffmpeg-win64.exe');
if(!fs.existsSync(ffmpeg)){fs.mkdirSync(path.dirname(ffmpeg),{recursive:true});fs.copyFileSync(path.resolve(__dirname,'../../hl-ia-v22/out/playwright-tools/ffmpeg-1011/ffmpeg-win64.exe'),ffmpeg);}
const report={url:base,browserPlugin:'Browser plugin not available; user explicitly requested local Playwright',checks:[],consoleErrors:[],pageErrors:[],httpErrors:[],failedRequests:[]};
const pass=text=>{report.checks.push(text);console.log('PASS',text)};
function watch(page){page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({url:r.url(),status:r.status()})});page.on('requestfailed',r=>{if(!r.failure()?.errorText.includes('ERR_ABORTED'))report.failedRequests.push(r.url()+': '+r.failure()?.errorText)});}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+JSON.stringify(page.viewportSize()));}
async function settledScreenshot(page,name){
 for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=600){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(100)}
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
 await page.waitForTimeout(800);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);
 await page.mouse.move(1,1);await page.screenshot({path:path.join(shots,name),fullPage:true});
}
(async()=>{
 fs.mkdirSync(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe'});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await ctx.newPage();watch(p);await p.goto(base);await p.locator('h1').waitFor();
  await noOverflow(p);assert.equal(await p.locator('.v23-marquee-track').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await p.locator('.v23-marquee-group a').count(),7);
  for(const el of await p.locator('.v23-marquee-group a').all()){const bounds=await el.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390,'static shortcut visible');}
  pass('Reduced-motion mobile: no overflow, seven static shortcuts remain visible');
  for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740},{width:844,height:300}]){
   await p.setViewportSize(viewport);await p.goto(base);await noOverflow(p);
   assert.match(await p.title(),/Hamilton Local/);assert.ok((await p.locator('main').innerText()).length>100);assert.equal(await p.locator('h1').count(),1);assert.equal(await p.locator('vite-error-overlay,nextjs-portal').count(),0);
   for(const id of ['living','weekend','kids','services','tools']){
    const tab=p.locator('#guide-tab-'+id);await tab.click();assert.equal(await tab.getAttribute('aria-selected'),'true');assert.equal(await p.locator('#guide-preview').getAttribute('aria-labelledby'),'guide-tab-'+id);assert.equal(await p.locator('[data-preview-record]').count(),3);await noOverflow(p);
    assert.equal(await p.locator('.v23-preview-content').evaluate(e=>getComputedStyle(e).animationName),'none');
   }
   await p.getByTestId('lang').click();assert.equal(await p.locator('html').getAttribute('lang'),'en-NZ');await noOverflow(p);await p.getByTestId('lang').click();
  }
  pass('Four viewports: five preview states, bilingual copy, one heading, nonblank screen, no overlays or overflow');
  await p.setViewportSize({width:1440,height:1000});await p.goto(base);await p.locator('#guide-tab-living').focus();
  for(const [key,id] of [['ArrowRight','weekend'],['ArrowDown','kids'],['End','tools'],['Home','living'],['ArrowLeft','tools']]){await p.keyboard.press(key);assert.equal(await p.evaluate(()=>document.activeElement.id),'guide-tab-'+id);assert.equal(await p.locator('#guide-tab-'+id).getAttribute('aria-selected'),'true');}
  await p.locator('#guide-tab-services').click();assert.match(await p.locator('#guide-preview').innerText(),/暂无商家/);await p.locator('#guide-tab-kids').click();await p.locator('.v23-preview-open').click();await p.locator('#tab-map').waitFor();assert.equal(await p.locator('.pg-pin').count(),12);
  await p.goto(base);await p.getByRole('button',{name:'开始搜索',exact:true}).click();assert.equal(await p.evaluate(()=>document.activeElement.matches('.ia-hero-search input')),true);await p.locator('.ia-hero-search input').fill('Rototuna');await p.locator('.ia-hero-search').getByRole('button',{name:'搜索',exact:true}).click();await p.locator('#tab-grocers').waitFor();assert.ok(p.url().includes('q=Rototuna'));
  pass('Keyboard arrow/Home/End tabs, honest directory empty state, preview-to-map destination, three-step search entry');
  await p.goto(base);await p.emulateMedia({reducedMotion:'no-preference'});await p.mouse.move(1,1);await p.locator('.v23-stat-section').scrollIntoViewIfNeeded();await p.waitForTimeout(1250);
  assert.deepEqual(await p.locator('[data-count]').allTextContents(),['118','12','34','9']);
  const track=p.locator('.v23-marquee-track');const transform=()=>track.evaluate(e=>getComputedStyle(e).transform);
  const first=await transform();await p.waitForTimeout(300);assert.notEqual(await transform(),first);
  await p.locator('.v23-pause').click();await p.mouse.move(1,1);await p.waitForTimeout(80);const stopped=await transform();await p.waitForTimeout(300);assert.equal(await transform(),stopped);assert.equal(await p.locator('.v23-pause').getAttribute('aria-pressed'),'true');
  await p.locator('.v23-pause').click();await p.mouse.move(1,1);await p.waitForTimeout(80);const resumed=await transform();await p.waitForTimeout(300);assert.notEqual(await transform(),resumed);
  await p.locator('.v23-marquee-group a').first().focus();assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'paused');
  await p.locator('#guide-tab-weekend').click();assert.equal(await p.locator('.v23-preview-content').evaluate(e=>getComputedStyle(e).animationName),'v23-panel');await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await transform(),'none');assert.equal(await p.locator('.v23-preview-content').evaluate(e=>getComputedStyle(e).animationName),'none');await noOverflow(p);
  pass('Final counts, moving marquee, persistent pause/resume, keyboard pause, animated panel and live reduced-motion changes');
  // Exercise the actual production feedback bundle; intercept every submission.
  let payload;await ctx.route('https://api.web3forms.com/submit',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'})});
  await p.locator('.fb-footer-button').click();assert.equal(await p.getByTestId('feedback-preview').count(),0);await p.locator('#fb-message').fill('QA only: local preview feedback interception.');await p.getByRole('button',{name:'发送反馈',exact:true}).click();await p.getByRole('heading',{name:'收到，谢谢你的反馈。'}).waitFor();assert.ok(payload.access_key&&payload.access_key!=='PENDING');await p.keyboard.press('Escape');
  const baseline=require('../out/baseline-v23.json');assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/feedback-config.ts')).digest('hex'),baseline['work/src/feedback-config.ts']);
  pass('Production feedback config unchanged; existing footer opens modal and mocked Web3Forms submission succeeds; no real message sent');
  await p.emulateMedia({reducedMotion:'no-preference'});await p.goto(base);await settledScreenshot(p,'home-desktop.png');await p.setViewportSize({width:390,height:844});await settledScreenshot(p,'home-mobile.png');
  await p.getByTestId('lang').click();await noOverflow(p);await settledScreenshot(p,'home-mobile-english.png');await p.getByTestId('lang').click();await ctx.close();
  const videoContext=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:path.join(out,'recordings'),size:{width:1440,height:1000}}}),vp=await videoContext.newPage();watch(vp);const video=vp.video();await vp.goto(base);await vp.waitForTimeout(500);
  await vp.evaluate(()=>scrollTo(0,document.querySelector('.v23-stat-section').getBoundingClientRect().top+scrollY-20));await vp.waitForTimeout(1500);
  for(const id of ['weekend','kids','services','tools','living']){await vp.locator('#guide-tab-'+id).click();await vp.mouse.move(1,1);await vp.waitForTimeout(1050)}
  await vp.locator('.v23-pause').click();await vp.mouse.move(1,1);await vp.waitForTimeout(650);await vp.locator('.v23-pause').click();await vp.mouse.move(1,1);await vp.waitForTimeout(650);
  await vp.locator('.v23-how').scrollIntoViewIfNeeded();await vp.waitForTimeout(1100);await videoContext.close();await video.saveAs(path.join(shots,'home-motion.webm'));
  pass('Full-page desktop/mobile screenshots, English mobile capture and short motion WebM saved');
  assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.httpErrors,[]);assert.deepEqual(report.failedRequests,[]);pass('Zero console errors, page errors, HTTP/404 errors or failed requests');report.passed=true;
 }finally{fs.writeFileSync(path.join(out,'qa-home-v23.json'),JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
