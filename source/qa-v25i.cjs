// Regression: scene labels stay inside the actual frame and retain scene-owned names.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const out=path.resolve(__dirname,'../out'),shots=path.join(out,'shots/v25i');
const model=esbuild.buildSync({entryPoints:[path.join(__dirname,'src/experience-model.ts')],bundle:true,platform:'node',format:'cjs',write:false});
const m={exports:{}};new Function('module','exports',model.outputFiles[0].text)(m,m.exports);
const scenes=m.exports.SCENES;
const report={url:'http://127.0.0.1:4186',browserPlugin:'Browser plugin not available; requested local Chromium used',checks:[],errors:[],failures:[]};
const check=(ok,message)=>{if(!ok)report.failures.push(message);};
async function next(p){
 const current=Number(await p.locator('.sb-window-view').getAttribute('data-scene'));
 await p.getByTestId('page-cord').click();
 await p.waitForFunction(expected=>Number(document.querySelector('.sb-window-view').dataset.scene)===expected,(current+1)%scenes.length);
 await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function geometry(p,tag){
 const result=await p.evaluate(()=>{
  const label=document.querySelector('.v22-scene-label'),rim=document.querySelector('.sb-window-rim');
  const l=label.getBoundingClientRect(),r=rim.getBoundingClientRect(),s=getComputedStyle(rim);
  // The opaque inner ring is 7px on desktop and 5px below 701px.
  const edge=parseFloat(s.borderRightWidth)+(innerWidth<=700?5:7);
  const f=document.querySelector('.fb-launcher').getBoundingClientRect();
  const radius=parseFloat(s.borderBottomRightRadius)-edge;
  const right=r.right-edge-l.right,bottom=r.bottom-edge-l.bottom;
  return {right,bottom,inside:l.left>=r.left+edge&&l.top>=r.top+edge,
   corner:Math.hypot(Math.max(0,radius-right),Math.max(0,radius-bottom))<=radius+.5,
   collision:l.left<f.right&&l.right>f.left&&l.top<f.bottom&&l.bottom>f.top,
   overflow:document.documentElement.scrollWidth>innerWidth,
   text:label.textContent};
 });
 check(result.right>=16&&result.right<=20&&result.bottom>=16&&result.bottom<=20,tag+' even inset: '+JSON.stringify(result));
 check(result.inside&&result.corner,tag+' inside curved opening');
 check(!result.collision,tag+' feedback collision');
 check(!result.overflow,tag+' horizontal overflow');
 report.checks.push({tag,...result});
}
(async()=>{
 fs.mkdirSync(shots,{recursive:true});
 const b=await chromium.launch({headless:true,executablePath:'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe'});
 report.browser=b.version();
 try{
  const p=await b.newPage();
  p.on('pageerror',e=>report.errors.push(e.message));
  p.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
  p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  for(const width of [1920,1440,1280,1024,768,390,320]){
   await p.setViewportSize({width,height:width<=390?844:900});
   await p.goto(report.url);await p.locator('.v22-scene-label').waitFor();
   await p.evaluate(()=>document.fonts.ready);
   assert.match(await p.title(),/Hamilton Local/);
   assert.ok((await p.locator('main').innerText()).length>100);
   assert.equal(await p.locator('vite-error-overlay,nextjs-portal').count(),0);
   if(await p.locator('html').getAttribute('lang')!=='zh-CN')await p.getByTestId('lang').click();
   for(const lang of ['zh','en']){
    if(lang==='en')await p.getByTestId('lang').click();
    for(let i=0;i<scenes.length;i++){
     const expected=lang==='zh'?scenes[i].zh+' · '+scenes[i].en:scenes[i].en;
     check(await p.locator('.v22-scene-label').textContent()===expected,`${width}/${lang}/${i} clean scene text`);
     await p.waitForTimeout(35);
     await geometry(p,`${width}/${lang}/${i}`);
     await next(p);
    }
   }
   // Long labels at short/tall heights, including scroll past the fixed feedback pill.
   for(const height of [600,1200]){
    await p.setViewportSize({width,height});
    while(await p.locator('.sb-window-view').getAttribute('data-scene')!=='4')await next(p);
    await p.waitForTimeout(50);await geometry(p,`${width}x${height}/long`);
    const y=await p.locator('.v22-scene-label').evaluate(e=>Math.max(0,e.getBoundingClientRect().bottom+scrollY-innerHeight+35));
    await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(50);
    await geometry(p,`${width}x${height}/scroll`);
    await p.evaluate(()=>scrollTo(0,0));
   }
  }
  for(const [width,height,name] of [[1440,900,'hero-1440'],[390,844,'hero-390']]){
   await p.setViewportSize({width,height});await p.goto(report.url);
   await p.locator('.v22-scene-label').waitFor();
   if(await p.locator('html').getAttribute('lang')!=='zh-CN')await p.getByTestId('lang').click();
   await next(p);await p.waitForTimeout(2500);
   await p.screenshot({path:path.join(shots,name+'.png')});
   if(width===1440)await p.screenshot({path:path.join(shots,'hero-1440-crop.png'),clip:{x:940,y:550,width:500,height:350}});
  }
  await p.getByTestId('feedback-launcher').click();await p.locator('.fb-dialog').waitFor();
  await p.keyboard.press('Escape');assert.equal(await p.locator('.fb-dialog').count(),0);
  for(const mode of ['a','b']){await p.goto(report.url+'/?hero='+mode);await p.locator('h1').waitFor();assert.equal(await p.locator('.v22-scene-label').count(),0);}
  report.passed=!report.failures.length&&!report.errors.length;
  console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,failures:report.failures,errors:report.errors},null,2));
  if(!report.passed)process.exitCode=1;
 }finally{fs.writeFileSync(path.join(out,'qa-v25i.json'),JSON.stringify(report,null,2));await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
