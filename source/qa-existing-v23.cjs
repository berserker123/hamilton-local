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
 source=source.replaceAll('http://127.0.0.1:4179/','http://127.0.0.1:4184/').replaceAll('http://127.0.0.1:4183','http://127.0.0.1:4184');
 source=source.replaceAll('qa-'+kind+'.json','qa-existing-'+kind+'-v23.json');
 source=source.replaceAll("path.join(out,'shots')","path.join(out,'regression-shots','"+kind+"')").replaceAll("path.join(root,'out/shots')","path.join(root,'out/regression-shots/v18')");
 if(kind==='v18'){
  const start=source.indexOf(' const baseline=JSON.parse('),end=source.indexOf(" report.checks.push('Home defaults",start);
  assert.ok(start>0&&end>start);
  const check=" const baseline=require('../out/baseline-v23.json');\n for(const [file,expected] of Object.entries(baseline)){if(['work/src/App.tsx','work/src/styles.css'].includes(file))continue;assert.equal(hash(path.resolve(__dirname,'..',file)),expected,file+' retained from supplied v22');}\n const preserved=Object.keys(baseline).filter(name=>name.startsWith('work/public/photos/')&&name.endsWith('.webp')).length;\n";
  source=source.slice(0,start)+check+source.slice(end);
 }else if(kind==='v22'){
  source=source.replace("require('../out/baseline-v21.json')","require('../out/baseline-v23.json')");
  source=source.replace("['work/public/licenses/window-scenes.md','work/src/App.tsx','work/src/PageExperience.tsx','work/src/experience-model.ts','work/src/page-experience.css'].sort()","['work/src/App.tsx','work/src/styles.css'].sort()");
 }else{
  source=source.replace("require('../out/baseline-v22b.json')","require('../out/baseline-v23.json')");
  // Exercise PENDING in memory; the production key and bundle remain unchanged.
  const pending="const pending=await esbuild.build({entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'iife',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'\"production\"'},write:false,plugins:[{name:'qa-only-pending',setup(build){build.onLoad({filter:/feedback-config\\.ts$/},()=>({contents:\"export const FEEDBACK_ACCESS_KEY='PENDING';\",loader:'ts'}))}}]});\n const originalNewContext=browser.newContext.bind(browser); browser.newContext=async options=>{const context=await originalNewContext(options);await context.route('**/app.js',route=>route.fulfill({contentType:'text/javascript',body:pending.outputFiles[0].text}));return context;};\n const ctx=await browser.newContext";
  source=source.replace('const ctx=await browser.newContext',pending);
  const old="assert.ok(fs.readFileSync('src/feedback-config.ts','utf8').includes(\"FEEDBACK_ACCESS_KEY = 'PENDING'\"));";
  assert.ok(source.includes(old));
  source=source.replace(old,"assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/feedback-config.ts')).digest('hex'),baseline['work/src/feedback-config.ts']);");
 }
 console.log('RUN existing '+kind+' behavioral suite: port 4184, supplied-v22 input hashes');
 const suite=new Module(path.join(__dirname,'qa-'+kind+'-v23-run.cjs'),module);suite.filename=path.join(__dirname,'qa-'+kind+'-v23-run.cjs');suite.paths=module.paths;suite._compile(source,suite.filename);
}
