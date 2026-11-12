const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../out'),shots=path.join(out,'shots/v25h');
const baseline=process.argv.includes('--baseline');
const targets=[
 ['places','living?tab=places','.ia-place'],['grocers','living?tab=grocers','.ia-market-card'],
 ['upick','living?tab=upick','.ia-directory-card'],['stays','living?tab=stays','.ia-directory-card'],
 ['pets','services?tab=pets','.ia-directory-card'],['playground','kids?tab=map','.pg-place'],
 ['family','kids?tab=places','.ia-place'],['parties','kids?tab=parties','.pv-row'],
 ['weekend','weekend?tab=picks','.wa-row'],['markets','weekend?tab=markets','.wa-row'],
 ['festivals','weekend?tab=festivals','.wa-row'],['directory','services?tab=home','.ia-category'],
 ['pay','tools?tab=pay','.v25g-calculator'],['gst','tools?tab=gst','.v25g-calculator'],
 ['units','tools?tab=units','.v25g-calculator'],['checklist','tools?tab=checklist','.v25g-check-card'],
 ['seasonal','tools?tab=seasonal','.v25g-season-card'],['bins','tools?tab=bins','.sb-panel'],
 ['transport','tools?tab=transport','.sb-panel'],['urgent','tools?tab=urgent','.sb-clinic'],
 ['home-tools','','.v25g-shortcut'],['home-teaser','','.v23-preview-shell']
];
const report={url:'http://127.0.0.1:4186',browser:'Chromium 1254',browserPlugin:'Browser plugin not available; requested Playwright used',viewports:[1440,390],checks:[],errors:[],screenshots:[]};
const layouts={};
(async()=>{
 fs.mkdirSync(shots,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe'});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  p.on('pageerror',e=>report.errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/tile.openstreetmap/.test(m.text()))report.errors.push(m.text());});
  async function open(route){await p.goto(report.url+'/#/'+route);await p.locator('h1').waitFor();await p.evaluate(()=>document.fonts.ready);assert.match(await p.title(),/Hamilton Local/);assert.ok((await p.locator('main').innerText()).length>100);assert.equal(await p.locator('vite-error-overlay,nextjs-portal').count(),0);}
  const saved=baseline?{}:JSON.parse(fs.readFileSync(path.join(out,'v25h-layout-before.json'),'utf8'));
  for(const [name,route,selector] of targets){
   await open(route);const cards=p.locator(selector),card=cards.first();await card.waitFor();
   layouts[name]=await cards.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
   if(baseline)continue;
   const relative=rows=>rows.map(r=>({...r,y:r.y-rows[0].y}));
   assert.deepEqual(relative(layouts[name]),relative(saved[name]),name+' unchanged card size and spacing');
   assert.ok(await cards.evaluateAll(es=>es.every(e=>e.classList.contains('hl-glow'))),name+' shared utility coverage');
   await p.mouse.move(1,1);await card.scrollIntoViewIfNeeded();
   assert.equal(await card.evaluate(e=>getComputedStyle(e,'::after').opacity),'0',name+' idle');
   await card.hover();
   const style=await card.evaluate(e=>{const s=getComputedStyle(e,'::after');return {opacity:s.opacity,filter:s.filter,pointer:s.pointerEvents,z:s.zIndex,background:s.backgroundImage,transition:s.transitionDuration,overflow:getComputedStyle(e).overflow};});
   assert.equal(style.opacity,'0.3',name+' hover');assert.equal(style.filter,'blur(60px)');assert.equal(style.pointer,'none');assert.equal(style.z,'-1');assert.match(style.background,/201, 165, 90/);assert.equal(style.transition,'0s');assert.equal(style.overflow,'visible');
   const clipping=await card.evaluate(e=>{const r=e.getBoundingClientRect(),bad=[];for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(s.overflowX+' '+s.overflowY)&&(r.left-b.left<60||b.right-r.right<60||r.top-b.top<60||b.bottom-r.bottom<60))bad.push(a.className);}return bad;});
   assert.deepEqual(clipping,[],name+' halo clearance');
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' desktop overflow');
   if(['places','home-tools','playground','directory'].includes(name)){
    await p.screenshot({path:path.join(shots,name+'-hover.png')});report.screenshots.push(name+'-hover.png');
   }
   await p.mouse.move(1,1);await p.keyboard.press('Tab');
   const focus=card.locator('a,button,input,select,summary,[tabindex="0"]').first();
   if(await focus.count())await focus.focus();else if(await card.evaluate(e=>e.matches('a,button')))await card.focus();
   if(await card.evaluate(e=>e.matches(':focus-visible')||!!e.querySelector(':focus-visible')))assert.equal(await card.evaluate(e=>getComputedStyle(e,'::after').opacity),'0.3',name+' keyboard');
   report.checks.push(name+': coverage, unchanged layout, idle/hover, 60px gold halo, reduced motion, pointer safety, clearance');
  }
  if(baseline){fs.writeFileSync(path.join(out,'v25h-layout-before.json'),JSON.stringify(layouts,null,2));console.log('Baseline captured for '+targets.length+' card families');return;}
  await open('living?tab=places');const place=p.locator('.ia-place').first();
  await place.locator('.ia-flip-front').click();assert.ok(await place.locator('.ia-flip.is-flipped').count());
  await place.locator('.ia-flip-back-hit').click();assert.equal(await place.locator('.ia-flip.is-flipped').count(),0);
  await place.locator('a[aria-haspopup="dialog"]').click();assert.ok(await p.locator('.ia-place-detail').isVisible());await p.keyboard.press('Escape');assert.equal(await p.locator('.ia-place-detail').count(),0);
  await p.getByTestId('feedback-launcher').click();assert.ok(await p.locator('.fb-dialog').isVisible());await p.keyboard.press('Escape');
  await open('');await p.locator('.v25g-shortcut').first().click();assert.match(p.url(),/tools\?tab=pay/);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.locator('.v25g-calculator').hover();await p.waitForTimeout(400);assert.equal(await p.locator('.v25g-calculator').evaluate(e=>getComputedStyle(e,'::after').transitionDuration),'0.35s');
  await p.mouse.move(1,1);await p.waitForTimeout(400);assert.equal(await p.locator('.v25g-calculator').evaluate(e=>getComputedStyle(e,'::after').opacity),'0');
  report.checks.push('Photo flips both ways; detail dialog opens/closes; feedback dialog opens/closes; home card navigates; normal transition fades in/out');
  await open('kids?tab=map');await p.locator('.pg-map-panel').scrollIntoViewIfNeeded();
  assert.ok(await p.locator('.pg-map-panel').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.right-40,r.top+100));}),'scrollport bleed leaves the map clickable');
  const list=p.locator('.pg-list');const before=await list.evaluate(e=>e.scrollTop);
  await p.locator('.pg-place').first().hover();await p.mouse.wheel(0,300);await p.waitForTimeout(150);assert.ok(await list.evaluate(e=>e.scrollTop)>before,'playground list still scrolls');
  await p.emulateMedia({reducedMotion:'reduce'});
  for(const variant of ['a','b','c']){
   await p.goto(report.url+'/?cards='+variant+'#/living?tab=places');const card=p.locator('.ia-place').first();await card.hover();await p.waitForTimeout(400);
   assert.equal(await card.evaluate(e=>getComputedStyle(e,'::after').opacity),'0.3',variant+' optional card style halo');
   if(variant==='b')assert.equal(await card.evaluate(e=>getComputedStyle(e,'::before').width),'6px','optional accent preserved');
  }
  report.checks.push('Playground map remains clickable beside scrollport; list wheel scroll works; optional a/b/c styles retain halo and b accent');
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),mobile=await touch.newPage();
  for(const route of ['', 'living?tab=places','kids?tab=map','services?tab=home','tools?tab=checklist','weekend?tab=picks']){
   await mobile.goto(report.url+'/#/'+route);await mobile.locator('h1').waitFor();
   assert.equal(await mobile.evaluate(()=>matchMedia('(hover:hover)').matches),false);
   assert.ok(await mobile.locator('.hl-glow').evaluateAll(es=>es.every(e=>getComputedStyle(e,'::after').content==='none')));
   assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' mobile overflow');
  }
  await touch.close();report.checks.push('390px touch: no generated halo, no horizontal overflow on six representative routes');
  assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS v25h: '+targets.length+' card families, layouts, interactions, motion, touch, screenshots');
 }finally{await browser.close();if(!baseline)fs.writeFileSync(path.join(out,'qa-v25h.json'),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
