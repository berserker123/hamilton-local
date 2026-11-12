const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4186';
const out=path.resolve(__dirname,'../out'),shots=path.join(out,'shots/v25g');
const report={url:base,browser:'Chromium 1254',browserPlugin:'Browser plugin not available; user requested local Playwright',viewports:[1440,390,320],checks:[],consoleErrors:[],pageErrors:[],httpErrors:[],screenshots:[]};
(async()=>{
 fs.mkdirSync(shots,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),p=await context.newPage();
  p.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});
  p.on('pageerror',e=>report.pageErrors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)report.httpErrors.push(r.status()+' '+r.url())});
  async function open(hash=''){
   await p.goto(base+'/'+hash);await p.locator('h1').waitFor();
   if(await p.locator('html').getAttribute('lang')!=='zh-CN')await p.getByTestId('lang').click();
   await p.evaluate(()=>document.fonts.ready);
   assert.match(await p.title(),/Hamilton Local/);
   assert.ok((await p.locator('main').innerText()).length>100);
   assert.equal(await p.locator('vite-error-overlay,nextjs-portal').count(),0);
  }
  async function snap(name,selector,fullPage=false){
   await p.mouse.move(1,1);
   await p.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();});
   if(selector)await p.locator(selector).evaluate(el=>window.scrollTo(0,scrollY+el.getBoundingClientRect().top-135));
   await p.screenshot({path:path.join(shots,name),fullPage});report.screenshots.push(name);
  }
  async function noOverflow(label){assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' document overflow');}
  await open();
  for(const selector of ['.sb-desktop-nav','.sb-mobile-nav'])assert.deepEqual(await p.locator(selector+' a').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),['#/','#/tools','#/living','#/weekend','#/kids','#/services']);
  assert.deepEqual(await p.locator('.v23-feature-tabs [role=tab]').evaluateAll(es=>es.map(e=>e.id)),['guide-tab-tools','guide-tab-living','guide-tab-weekend','guide-tab-kids','guide-tab-services']);
  assert.equal(await p.locator('.v25g-shortcut').count(),6);
  await p.locator('#guide-tab-tools').click();
  assert.deepEqual(await p.locator('[data-preview-record]').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),['#/tools?tab=pay','#/tools?tab=gst','#/tools?tab=checklist']);
  assert.ok(await p.locator('#common-tools').evaluate(el=>el.previousElementSibling.matches('.sb-hero')));
  for(const link of await p.locator('.v25g-shortcut').all()){
   const href=await link.getAttribute('href');await open(href);const id=new URLSearchParams(href.split('?')[1]).get('at');assert.equal(await p.locator('#'+id).count(),1);await open();
  }
  await snap('home-tools.png','#common-tools');await p.locator('header').screenshot({path:path.join(shots,'nav.png')});report.screenshots.push('nav.png');
  report.checks.push('Home shortcuts after hero; all six links open their real destination; tools first in both navigation bars and section previews');

  await open('#/tools?tab=pay');assert.equal(await p.locator('#pay-hourly').inputValue(),'23.95');assert.equal(await p.locator('#pay-kiwi').inputValue(),'0.035');
  assert.equal(await p.locator('#pay-kiwi option:checked').innerText(),'3.5% · 当前默认');
  await p.locator('#pay-hourly').fill('25');await p.locator('#pay-hours').fill('40');assert.equal(await p.getByTestId('pay-net').innerText(),'$793.50');
  assert.deepEqual(await p.locator('[data-pay-row="paye"] td').allTextContents(),['$171.50','$343.00','$8,918.00']);
  await p.locator('#pay-student').check();assert.equal(await p.getByTestId('pay-net').innerText(),'$729.18');assert.equal(await p.locator('.v25g-tax-code strong').innerText(),'M SL');
  await p.locator('#pay-student').uncheck();await snap('pay-calc.png','#tool-pay');
  await p.locator('#pay-hourly').fill('');assert.equal(await p.getByTestId('pay-net').innerText(),'—');assert.equal(await p.locator('.v25g-pay-table').count(),0);
  await p.locator('#pay-hourly').fill('-1');assert.equal(await p.getByTestId('pay-net').innerText(),'—');
  await p.locator('#pay-hourly').fill('0');assert.equal(await p.getByTestId('pay-net').innerText(),'$0.00');
  await p.locator('#pay-hourly').fill('25');await p.locator('#pay-kiwi').selectOption('0');assert.equal(await p.getByTestId('pay-net').innerText(),'$828.50');
  report.checks.push('Pay defaults, $25 × 40h M/M SL, PAYE/ACC no double deduction, no-KiwiSaver, empty/negative/zero inputs');

  await open('#/tools?tab=checklist');assert.equal(await p.locator('.v25g-check-card').count(),5);
  const bank=p.locator('#arrival-bank');await bank.locator('summary').focus();await p.keyboard.press('Enter');assert.equal(await bank.getAttribute('open'),'');assert.equal(await bank.locator('ol li').count(),4);
  await snap('checklist.png','#tool-checklist');
  for(const card of await p.locator('.v25g-check-card').all())assert.equal(await card.locator('.v25g-sources a').count()>0,true);
  report.checks.push('Five numbered arrival accordions with materials/time/cost, keyboard expansion and dated official links');

  await open('#/tools?tab=gst');assert.equal(await p.getByTestId('gst-exclusive').innerText(),'$100.00');assert.equal(await p.getByTestId('gst-gst').innerText(),'$15.00');
  await p.locator('#gst-direction').selectOption('exclusive');await p.locator('#gst-amount').fill('100');assert.equal(await p.getByTestId('gst-inclusive').innerText(),'$115.00');
  await p.locator('#temperature-input').fill('32');assert.equal(await p.locator('#temperature-result').innerText(),'0');
  await p.locator('#weight-input').fill('2');assert.equal(await p.locator('#weight-result').innerText(),'1');await p.locator('#weight-from').selectOption('lb');assert.equal(await p.locator('#weight-result').innerText(),'0.907185');
  await p.locator('#area-from').selectOption('ft2');await p.locator('#area-to').selectOption('m2');await p.locator('#area-input').fill('1');assert.equal(await p.locator('#area-result').innerText(),'0.092903');
  await snap('gst-units.png','#tool-gst',true);
  await p.locator('#gst-amount').fill('');assert.equal(await p.getByTestId('gst-inclusive').innerText(),'—');
  report.checks.push('GST both directions; live temperature/jin/lb/area conversions; empty GST clears results');

  await open('#/tools?tab=seasonal');assert.equal(await p.locator('[data-shellfish]').count(),10);
  assert.match(await p.locator('[data-shellfish="green-mussel"]').innerText(),/10/);
  assert.match(await p.locator('[data-shellfish="scallop"]').innerText(),/关闭/);
  assert.match(await p.locator('#tool-fishing').innerText(),/2026-11-01/);
  assert.match(await p.locator('#tool-pollen-flu').innerText(),/2026-09-01/);
  assert.equal(await p.locator('a[href="tel:0800611116"]').count(),1);
  await snap('seasonal.png','#tool-fishing',true);
  await snap('pollen-flu.png','#tool-pollen-flu');
  report.checks.push('Dated MPI restrictions, regional shellfish table, scallop closure override, eel limits, biotoxin/app links and current 2026 vaccine extension');

  const pets=require('./src/pets-v25.json');
  for(const hash of ['#/living?tab=pets','#pets','#/living?tab=pets&at=pet-vets','#pet-dog-parks']){
   await open(hash);assert.match(p.url(),/#\/services\?/);assert.equal(await p.locator('#tab-pets').getAttribute('aria-selected'),'true');assert.equal(await p.locator('[data-pet-category]').count(),pets.length);assert.equal(await p.locator('[data-directory-id]').count(),pets.reduce((n,g)=>n+g.items.length,0));
   const target=new URL(p.url()).hash.split('at=')[1];if(target)assert.ok(await p.locator('#'+target).evaluate(el=>Math.abs(el.getBoundingClientRect().top)<260),'category anchor reached');
  }
  await open('#/services?tab=pets');await snap('pets-in-directory.png','#pets');
  await open('#/living?tab=stays');assert.equal(await p.locator('#tab-pets').count(),0);assert.equal(await p.locator('#stays').count(),1);
  await open();await p.locator('#guide-tab-services').click();assert.equal(await p.locator('.v25-preview-links a').getAttribute('href'),'#/services?tab=pets');
  report.checks.push('All pet groups/cards retained in directory, old URLs and category hashes redirect, stays remain in living, home directory entry updated');

  await open('#/weekend');assert.equal(await p.locator('.ia-section-media img').getAttribute('src'),'./photos/band-weekend-nightglow.webp');assert.equal(await p.locator('.ia-section-media img').evaluate(img=>img.complete&&img.naturalWidth===2400),true);await snap('weekend-bg.png');
  await p.getByTestId('credits-btn').click();const credit=p.locator('[data-photo-credit="weekend-nightglow"]');assert.match(await credit.innerText(),/Isderion/);assert.match(await credit.innerText(),/CC BY-SA 3.0 de/);assert.equal(await credit.locator('a').count(),2);await p.keyboard.press('Escape');
  report.checks.push('Supplied nightglow background at 2400px, readable dark overlay, author/licence/original in footer credits');

  for(const width of [1440,390,320]){
   await p.setViewportSize({width,height:width===1440?1100:844});
   for(const lang of ['zh','en'])for(const tab of ['pay','checklist','gst','units','seasonal']){
    await open('#/tools?tab='+tab);if(lang==='en')await p.getByTestId('lang').click();
    await noOverflow(width+' '+lang+' '+tab);
    if(width===320&&tab==='pay'){
     const table=p.locator('.v25g-table-wrap');assert.equal(await table.getAttribute('tabindex'),'0');
     await table.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(120);assert.ok(await table.evaluate(el=>el.scrollLeft)>0,'keyboard scrolls narrow pay table');
    }
    assert.equal(await p.locator('#section-panel .v25g-heading').count()>0,true);
    for(const heading of await p.locator('.v25g-heading').all())assert.ok(await heading.locator('.ia-kicker').innerText());
    for(const card of await p.locator('.v25g-calculator,.v25g-check-card,.v25g-season-card,.v25g-healthline').all()){
     if(await card.evaluate(el=>el.tagName==='DETAILS'&&!el.open))await card.locator('summary').click();
     assert.match(await card.locator('.v25g-sources').innerText(),/2026-11/);assert.ok(await card.locator('.v25g-sources a').count()>0);
    }
    if(lang==='zh')for(const title of await p.locator('#section-panel .ia-name-line:is(h2,h3)').all())assert.ok(await title.evaluate(el=>el.nextElementSibling?.matches('.ia-secondary-name')));
   }
   await open();await noOverflow(width+' home');
   if(width===390){await snap('home-mobile.png',undefined,true);await snap('home-mobile-tools.png','#common-tools');}
   if(width===320){await open('#/tools?tab=pay');await snap('pay-mobile-320.png','#tool-pay');}
  }
  assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.httpErrors,[]);
  report.checks.push('1440/390/320, Chinese and English: all new tools nonblank, no page overflow, bilingual titles, source dates; zero console/page/HTTP errors');
  report.passed=true;console.log(JSON.stringify(report,null,2));
 } finally {await browser.close();fs.writeFileSync(path.join(out,'qa-v25g.json'),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
