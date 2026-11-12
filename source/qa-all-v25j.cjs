// All maintained behavioral QA suites; archived version-specific expectations
// remain covered by qa-existing-v23's v18, v22 and feedback adaptations.
const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../out/qa-v25j-logs');
const suites=['qa-v25j','qa-v25i','qa-v25g','qa-v25f','qa-v25e','qa-v25d','qa-v25','qa-home-v23','qa-cord-status','qa-v23b','qa-v24b','qa-v24c','qa-existing-v23'];
fs.mkdirSync(out,{recursive:true});
function run(name){return new Promise(resolve=>{
 const log=fs.openSync(path.join(out,name+'.log'),'w');
 const child=spawn(process.execPath,[name+'.cjs'],{cwd:__dirname,windowsHide:true,stdio:['ignore',log,log]});
 child.on('error',e=>console.error(e));
 child.on('close',code=>{fs.closeSync(log);console.log((code===0?'PASS ':'FAIL ')+name);resolve({suite:name,exitCode:code});});
});}
(async()=>{const results=[];for(const suite of suites)results.push(await run(suite));const passed=results.every(r=>r.exitCode===0);fs.writeFileSync(path.resolve(out,'../qa-all-v25j.json'),JSON.stringify({passed,suites:results,behavioralSuites:15,logs:out},null,2));if(!passed)process.exitCode=1;})();
