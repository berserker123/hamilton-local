const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../out'),shots=path.join(out,'shots/v25j');
const report={url:'http://127.0.0.1:4186',browserPlugin:'Browser plugin not available; local Playwright Chromium used',checks:[],errors:[],screenshots:[]};
const targets=[
 ['places','living?tab=places','.ia-place'],['grocers','living?tab=grocers','.ia-market-card'],
 ['upick','living?tab=upick','.ia-directory-card'],['stays','living?tab=stays','.ia-directory-card'],
 ['pets','services?tab=pets','[data-pet-category]'],['playground','kids?tab=map','.pg-place'],
 ['family','kids?tab=places','.ia-place'],['parties','kids?tab=parties','.pv-row'],
 ['weekend','weekend?tab=picks','.wa-row'],['markets','weekend?tab=markets','.wa-row'],
 ['festivals','weekend?tab=festivals','.wa-row'],['directory','services?tab=home','.ia-category'],
 ['pay','tools?tab=pay','.v25g-calculator'],['gst','tools?tab=gst','.v25g-calculator'],
 ['units','tools?tab=units','.v25g-calculator'],['checklist','tools?tab=checklist','.v25g-check-card'],
 ['seasonal','tools?tab=seasonal','.v25g-season-card'],['bins','tools?tab=bins','.sb-panel'],
 ['transport','tools?tab=other','#tool-transport'],['urgent','tools?tab=urgent','.sb-clinic'],
 ['home-tools','','.v25g-shortcut'],['home-teaser','','.v23-preview-shell']
];
const tabs=['bins','urgent','pay','checklist','gst','units','seasonal','other'];
const zh=['垃圾清运','急诊信息','税后收入','新移民清单','GST计算','单位换算','季节提醒','其他'];
const otherIds=['tool-weather','tool-school-terms','tool-find-school','tool-outages','tool-government','tool-fuel','tool-transport'];
(async()=>{
 fs.mkdirSync(shots,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe'});
 report.browser=browser.version();
 try{
  for(const file of fs.readdirSync(path.join(__dirname,'src')).filter(f=>/\.(css|tsx)$/.test(f)))
   assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'src',file),'utf8'),/hl-glow/,file+' removed glow utility');
  const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  p.on('pageerror',e=>report.errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/tile.openstreetmap/.test(m.text()))report.errors.push(m.text());});
  async function open(route=''){
   await p.goto(report.url+'/#/'+route);await p.locator('h1').waitFor();await p.evaluate(()=>document.fonts.ready);
   assert.match(await p.title(),/Hamilton Local/);assert.ok((await p.locator('main').innerText()).length>100);
   assert.equal(await p.locator('vite-error-overlay,nextjs-portal').count(),0);
   assert.equal(await p.locator('[class*="hl-glow"]').count(),0);
  }
  async function snap(name,fullPage=false){await p.screenshot({path:path.join(shots,name),fullPage});report.screenshots.push(name);}
  for(const [name,route,selector] of targets){
   await open(route);const card=p.locator(selector).first();await card.scrollIntoViewIfNeeded();await card.hover();
   assert.ok(await card.evaluate(e=>getComputedStyle(e,'::after').filter!=='blur(60px)'),name+' no hover halo');
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' no horizontal overflow');
   if(name==='places')await snap('places-hover-noglow.png');
   if(name==='playground'){
    const list=p.locator('.pg-list');
    assert.deepEqual(await list.evaluate(e=>{const s=getComputedStyle(e);return [s.boxSizing,s.marginTop,s.paddingTop,s.zIndex];}),['border-box','0px','0px','auto']);
    await list.evaluate(e=>e.scrollTop=300);assert.ok(await list.evaluate(e=>e.scrollTop)>0);
    await p.locator('.leaflet-control-zoom-in').click();
   }
   const focus=card.locator('a,button,input,select,summary').first();
   if(await focus.count()){await focus.focus();assert.ok(await card.evaluate(e=>getComputedStyle(e,'::after').filter!=='blur(60px)'),name+' no focus halo');}
   report.checks.push(name+': no glow on hover/focus; no overflow');
  }
  for(const variant of ['a','b','c']){
   await p.goto(report.url+'/?cards='+variant+'#/living?tab=places');
   const card=p.locator('.ia-place').first();await card.hover();
   assert.equal(await p.locator('html').getAttribute('data-cards'),variant);
   assert.notEqual(await card.evaluate(e=>getComputedStyle(e,'::after').filter),'blur(60px)');
   if(variant==='b')assert.equal(await card.evaluate(e=>getComputedStyle(e,'::before').width),'6px');
  }
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobile=await touch.newPage();
  for(const route of ['', 'living?tab=places','kids?tab=map','services?tab=home','tools?tab=other','weekend?tab=picks']){
   await mobile.goto(report.url+'/#/'+route);await mobile.locator('h1').waitFor();
   assert.equal(await mobile.evaluate(()=>matchMedia('(hover:hover)').matches),false);
   assert.equal(await mobile.locator('[class*="hl-glow"]').count(),0);
   assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await touch.close();report.checks.push('No glow utility remains in source; optional a/b/c styles and b accent preserved; six touch routes have no glow/overflow');
  await open('tools');
  assert.equal(await p.locator('[role=tab][aria-selected=true]').getAttribute('id'),'tab-bins');
  assert.deepEqual(await p.locator('[role=tab]').allTextContents(),zh);
  await p.locator('[role=tablist]').scrollIntoViewIfNeeded();await p.mouse.move(1,1);await snap('toolbox-tabs.png');
  await p.getByTestId('tab-bins').focus();await p.keyboard.press('End');
  await p.waitForFunction(()=>document.activeElement?.id==='tab-other');
  assert.equal(await p.getByTestId('tab-other').getAttribute('aria-selected'),'true');
  for(const id of otherIds)assert.equal(await p.locator('#'+id).count(),1);
  assert.equal(await p.locator('.ia-tool-card').count(),6);
  assert.equal(await p.locator('.ia-tool-card a').count(),15);
  const data=require('esbuild').buildSync({entryPoints:[path.join(__dirname,'src/local-data.ts')],bundle:true,platform:'node',format:'cjs',write:false});
  const m={exports:{}};new Function('module','exports',data.outputFiles[0].text)(m,m.exports);
  assert.deepEqual(await p.locator('#tool-transport .sb-route-number').allTextContents(),m.exports.ROUTES.map(r=>r.n));
  await p.locator('[role=tablist]').scrollIntoViewIfNeeded();await p.mouse.move(1,1);await snap('other.png',true);
  await p.getByTestId('tab-other').focus();await p.keyboard.press('Home');await p.waitForFunction(()=>document.activeElement?.id==='tab-bins');
  assert.equal(await p.locator('.ia-tool-card,#tool-transport').count(),0);
  for(const id of otherIds){
   await open('tools?tab=bins&at='+id);await p.locator('#'+id).waitFor();
   assert.equal(new URLSearchParams(p.url().split('?')[1]).get('tab'),'other');
   await p.waitForTimeout(800);
   const anchor=await p.locator('#'+id).evaluate(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,max:document.documentElement.scrollHeight-innerHeight,y:scrollY}));
   assert.ok(anchor.top>=-1&&anchor.top<900&&(anchor.top<=120||Math.abs(anchor.y-anchor.max)<2),id+' scrolled to anchor: '+JSON.stringify(anchor));
   await p.goto(report.url+'/#'+id);await p.locator('#'+id).waitFor();assert.match(p.url(),/tab=other/);
  }
  await open('tools?tab=transport');assert.match(p.url(),/tab=other&at=tool-transport/);
  for(const [label,id] of [['学期与假期','tool-school-terms'],['学区查询','tool-find-school']]){
   await open();await p.locator('.ia-quick-links').getByRole('link',{name:label,exact:true}).click();
   await p.locator('#'+id).waitFor();assert.match(p.url(),/tab=other/);assert.match(p.url(),new RegExp('at='+id));
  }
  for(const width of [1440,390,320]){
   await p.setViewportSize({width,height:900});
   for(const lang of ['zh','en'])for(const tab of tabs){
    await open('tools?tab='+tab);
    if((await p.locator('html').getAttribute('lang')==='zh-CN')!==(lang==='zh'))await p.getByTestId('lang').click();
    assert.deepEqual(await p.locator('[role=tab]').evaluateAll(es=>es.map(e=>e.id)),tabs.map(t=>'tab-'+t));
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+'/'+lang+'/'+tab+' no overflow');
    if(lang==='zh')assert.deepEqual(await p.locator('[role=tab]').allTextContents(),zh);
    if(tab!=='other')assert.equal(await p.locator('.ia-tool-card,#tool-transport').count(),0);
   }
  }
  await p.setViewportSize({width:1440,height:900});await open();
  if(await p.locator('html').getAttribute('lang')!=='zh-CN')await p.getByTestId('lang').click();
  const sceneTexts=[];
  for(let i=1;i<=3;i++){
   await p.locator('.sb-window-view img').first().waitFor({state:'attached'});
   await p.evaluate(()=>Promise.all([...document.querySelectorAll('.sb-window-view img')].map(img=>img.decode().catch(()=>{}))));
   await p.mouse.move(1,1);await p.waitForTimeout(100);
   sceneTexts.push(await p.locator('.v22-scene-label').innerText());await snap('hero-scene-'+i+'.png');
   if(i<3){const scene=await p.locator('.sb-window-view').getAttribute('data-scene');await p.getByTestId('page-cord').click();await p.waitForFunction(old=>document.querySelector('.sb-window-view').dataset.scene!==old,scene);}
  }
  assert.equal(new Set(sceneTexts).size,3);
  report.checks.push('Eight tabs in exact order in both languages at 1440/390/320; keyboard Home/End; six older card groups and transport retained; legacy/bare anchors and homepage quick links; three distinct hero scenes');
  assert.deepEqual(report.errors,[]);report.passed=true;
 }finally{await browser.close();fs.writeFileSync(path.join(out,'qa-v25j.json'),JSON.stringify(report,null,2));}
 console.log('PASS v25j: '+report.checks.length+' checks, six requested screenshots');
})().catch(e=>{console.error(e);process.exitCode=1;});
