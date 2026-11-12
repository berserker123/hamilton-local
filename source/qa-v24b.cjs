const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4186',out=path.resolve(__dirname,'../out');
const built=esbuild.buildSync({entryPoints:['src/place-names.ts'],bundle:true,platform:'node',format:'cjs',write:false});
const m={exports:{}};new Function('module','exports',built.outputFiles[0].text)(m,m.exports);
const {placeNames,PLACE_NAMES}=m.exports;
const report={url:base,browserPlugin:'Browser plugin not available; existing local Playwright',checks:[],consoleErrors:[],pageErrors:[],httpErrors:[]};
const routes=['','#/living','#/living?tab=places','#/weekend','#/weekend?tab=markets','#/weekend?tab=festivals','#/kids','#/kids?tab=places','#/kids?tab=parties','#/tools','#/tools?tab=transport','#/tools?tab=urgent','#/services'];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.on('console',msg=>{if(msg.type()==='error')report.consoleErrors.push(msg.text())});page.on('pageerror',err=>report.pageErrors.push(err.message));page.on('response',res=>{if(res.status()>=400)report.httpErrors.push({url:res.url(),status:res.status()})});
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:width===1440?1000:844});
   for(const lang of ['zh','en']){
    await page.goto(base);await page.locator('h1').waitFor();
    if(await page.locator('html').getAttribute('lang')!==(lang==='zh'?'zh-CN':'en-NZ'))await page.getByTestId('lang').click();
    for(const route of routes){
     await page.goto(base+'/'+route);await page.locator('h1').waitFor();
     assert.match(await page.title(),/Hamilton Local/);assert.ok((await page.locator('main').innerText()).length>100);assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(),0);
     if(route.includes('weekend'))await page.locator('[data-region="all"]').click();
     if(route.includes('parties')){await page.locator('[data-party-region="all"]').click();for(const button of await page.locator('[data-party-more]').all())await button.click();}
     const text=await page.locator('body').innerText();
     if(lang==='zh'){
      // v25e: kids titles with an English name on the next line retain raw Chinese.
      const separateTitles=route.startsWith('#/kids')?await page.locator('[data-place-id] h3,.pv-row h4,.pg-popup h3').allTextContents():[];
      const namesText=text.split('\n').filter(line=>!separateTitles.includes(line.trim())).join('\n');
      const formatted=placeNames(namesText),before=namesText.split('\n'),after=formatted.split('\n');
      assert.ok(formatted===namesText,'Unformatted place name on '+route+' at '+width+': '+JSON.stringify(before.flatMap((line,i)=>line===after[i]?[]:[{before:line,after:after[i]}]).slice(0,6)));
     }
     else for(const zh of Object.keys(PLACE_NAMES))assert.ok(!text.includes(zh),'Chinese place name in English mode: '+route+' '+zh);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+route+' '+width);
    }
    report.checks.push(`${width}px ${lang}: 13 routes, names, page identity and no overflow; all agenda/directory groups expanded`);
   }
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/#/weekend');await page.getByTestId('lang').click();
  await page.locator('[data-region="all"]').click();
  for(const [id,label]of [['Hamilton','汉密尔顿 Hamilton'],['Cambridge','剑桥 Cambridge'],['Raglan','拉格伦 Raglan'],['other','其他怀卡托 Waikato']])assert.equal((await page.locator(`[data-region-group="${id}"] .wa-region-heading h2`).innerText()).trim(),label);
  await page.screenshot({path:path.join(out,'shots/v24b-whatson.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.locator('.wa-heading').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(out,'shots/v24b-mobile.png')});
  await page.goto(base+'/#/kids');await page.getByTestId('pg-area').selectOption('Hamilton Lake');assert.equal(await page.locator('[data-playground-id]').count(),1);assert.match(await page.locator('.pg-list h3').innerText(),/汉密尔顿 Hamilton/);
  await page.getByRole('button',{name:'在地图查看',exact:true}).click();await page.locator('.pg-popup').waitFor();assert.equal(await page.locator('.pg-popup h3').innerText(),'汉密尔顿湖游乐场');assert.match(await page.locator('.pg-popup').innerText(),/Hamilton Lake Domain Destination Playground/);
  report.checks.push('Four region headings contain English once; playground filter values and map popup preserved');
  assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.httpErrors,[]);report.passed=true;
 }finally{await browser.close();fs.writeFileSync(path.join(out,'qa-v24b.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));
})().catch(err=>{console.error(err);process.exitCode=1});
