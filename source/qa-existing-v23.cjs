// Preserve historical behavioral assertions while updating environment and input baselines.
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const kind=process.argv[2];
if(!kind){
 for(const name of ['v18','v22','feedback']){
  const result=spawnSync(process.execPath,[__filename,name],{stdio:'inherit',cwd:__dirname});
  if(result.status!==0)process.exit(result.status||1);
 }
}else{
 assert.ok(['v18','v22','feedback'].includes(kind));
 let source=fs.readFileSync(path.join(__dirname,'qa-'+kind+'.cjs'),'utf8');
 // v25e replaces the 2011 library image and retains a separate English title line in kids cards.
 source=source.replaceAll('QFSE Media.*CC BY 3.0 NZ','lumoplank.*CC0 1.0');
 // v25 removes Magical Bridge from Family outings, keeping its playground record.
 source=source.replace("page.locator('[data-place-id]').count(),7", "page.locator('[data-place-id]').count(),6")
  .replace('assert.equal(missing,2)', 'assert.equal(missing,1)')
  .replace('7 family cards, 5 real photographs loaded, 2 labelled photo placeholders', '6 family cards, 5 real photographs loaded, 1 labelled photo placeholder; Magical Bridge retained in playgrounds')
  .replaceAll("locator('footer')", "locator('.ia-footer')");
 source=source.replaceAll('http://127.0.0.1:4179/','http://127.0.0.1:4186/').replaceAll('http://127.0.0.1:4183','http://127.0.0.1:4186');
 source=source.replaceAll('显示汉密尔顿全部场地','显示汉密尔顿 Hamilton 全部场地');
 source=source.replace("['work/src/App.tsx','work/src/styles.css']", "['work/src/App.tsx','work/src/CordResult.tsx','work/src/Feedback.tsx','work/src/HomeGuide.tsx','work/src/PageExperience.tsx','work/src/PartyVenues.tsx','work/src/PlaygroundMap.tsx','work/src/WeekendAgenda.tsx','work/src/cord-picks.ts','work/src/page-experience.css','work/src/party-venues.json','work/src/places.json','work/src/playgrounds.json','work/src/styles.css']");
 source=source.replaceAll('qa-'+kind+'.json','qa-existing-'+kind+'-v23.json');
 // Retired cards: verify the same locked images through retained preview tabs.
 source=source.replace("for(const [id,photo] of Object.entries(locks))assert.equal(await page.locator(`[data-teaser=\"${id}\"] img`).getAttribute('src'),'./'+photo);","for(const [id,photo] of Object.entries(locks)){await page.locator('#guide-tab-'+id).click();assert.equal(await page.locator('.v23-preview-photo img').getAttribute('src'),'./'+photo);}assert.equal(await page.locator('[data-teaser]').count(),0);");
 source=source.replace("for(const [id,file]of Object.entries(mix))assert.equal(await p.locator(`[data-teaser=\"${id}\"] img`).getAttribute('src'),'./'+file);","for(const [id,photo] of Object.entries(mix)){await p.locator('#guide-tab-'+id).click();assert.equal(await p.locator('.v23-preview-photo img').getAttribute('src'),'./'+photo);}assert.equal(await p.locator('[data-teaser]').count(),0);");

 source=source.replaceAll("path.join(out,'shots')","path.join(out,'regression-shots','"+kind+"')").replaceAll("path.join(root,'out/shots')","path.join(root,'out/regression-shots/v18')");
 if(kind==='v18'){
  const start=source.indexOf(' const baseline=JSON.parse('),end=source.indexOf(" report.checks.push('Home defaults",start);
  assert.ok(start>0&&end>start);
  const check=" const baseline=require('../out/baseline-v24b.json');\n for(const [file,expected] of Object.entries(baseline)){if(['work/src/App.tsx','work/src/CordResult.tsx','work/src/Feedback.tsx','work/src/HomeGuide.tsx','work/src/PageExperience.tsx','work/src/PartyVenues.tsx','work/src/PlaygroundMap.tsx','work/src/WeekendAgenda.tsx','work/src/cord-picks.ts','work/src/styles.css','work/src/page-experience.css','work/src/party-venues.json','work/src/places.json','work/src/playgrounds.json'].includes(file))continue;assert.equal(hash(path.resolve(__dirname,'..',file)),expected,file+' retained from supplied v22');}\n const preserved=Object.keys(baseline).filter(name=>name.startsWith('work/public/photos/')&&name.endsWith('.webp')).length;\n";
  source=source.slice(0,start)+check+source.slice(end);
 }else if(kind==='v22'){
  // The tool link restores focus after navigation on animation frames.
  // Wait for the behavior rather than sampling it after a fixed delay.
  const focusCheck="await wait(p,350);assert.equal(await p.evaluate(()=>document.activeElement.id),'tool-bins');";
  assert.ok(source.includes(focusCheck));
  source=source.replace(focusCheck,"await p.waitForFunction(()=>document.activeElement.id==='tool-bins');assert.equal(await p.evaluate(()=>document.activeElement.id),'tool-bins');");
  source=source.replace("require('../out/baseline-v21.json')","require('../out/baseline-v24b.json')");
  source=source.replace("['work/public/licenses/window-scenes.md','work/src/App.tsx','work/src/PageExperience.tsx','work/src/experience-model.ts','work/src/page-experience.css'].sort()","['work/src/App.tsx','work/src/CordResult.tsx','work/src/Feedback.tsx','work/src/HomeGuide.tsx','work/src/PageExperience.tsx','work/src/PartyVenues.tsx','work/src/PlaygroundMap.tsx','work/src/WeekendAgenda.tsx','work/src/cord-picks.ts','work/src/page-experience.css','work/src/party-venues.json','work/src/places.json','work/src/playgrounds.json','work/src/styles.css'].sort()");
 }else{
  source=source.replace("require('../out/baseline-v22b.json')","require('../out/baseline-v24b.json')");
  // Exercise PENDING in memory; the production key and bundle remain unchanged.
  const pending="const pending=await esbuild.build({entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'iife',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'\"production\"'},write:false,plugins:[{name:'qa-only-pending',setup(build){build.onLoad({filter:/feedback-config\\.ts$/},()=>({contents:\"export const FEEDBACK_ACCESS_KEY='PENDING';\",loader:'ts'}))}}]});\n const originalNewContext=browser.newContext.bind(browser); browser.newContext=async options=>{const context=await originalNewContext(options);await context.route('**/app.js',route=>route.fulfill({contentType:'text/javascript',body:pending.outputFiles[0].text}));return context;};\n const ctx=await browser.newContext";
  source=source.replace('const ctx=await browser.newContext',pending);
  const old="assert.ok(fs.readFileSync('src/feedback-config.ts','utf8').includes(\"FEEDBACK_ACCESS_KEY = 'PENDING'\"));";
  assert.ok(source.includes(old));
  source=source.replace(old,"assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/feedback-config.ts')).digest('hex'),baseline['work/src/feedback-config.ts']);");
 }
 console.log('RUN existing '+kind+' behavioral suite: port 4186, supplied-v24b input hashes');
 const suite=new Module(path.join(__dirname,'qa-'+kind+'-v23-run.cjs'),module);suite.filename=path.join(__dirname,'qa-'+kind+'-v23-run.cjs');suite.paths=module.paths;suite._compile(source,suite.filename);
}
