// Additional offline checks for recording playback and unavailable scenic assets.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {connect}=require('./capture-preview.cjs');
const pause=ms=>new Promise(r=>setTimeout(r,ms)),out=path.resolve(__dirname,'../out'),report={checks:[],videos:[]};
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--disable-extensions','--host-resolver-rules=MAP * ~NOTFOUND','--remote-debugging-port=9249','--remote-debugging-address=127.0.0.1',`--user-data-dir=${path.join(__dirname,'.chrome-hero-review-profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let client;const keepAlive=setInterval(()=>{},1000);
(async()=>{
 let ready=false;for(let i=0;i<80;i++){try{await fetch('http://127.0.0.1:9249/json/version');ready=true;break;}catch{await pause(100);}}assert.ok(ready);
 const target=await(await fetch('http://127.0.0.1:9249/json/new?about:blank',{method:'PUT'})).json();client=await connect(target.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Network.enable');await client.send('Network.setBlockedURLs',{urls:['http://*','https://*']});
 for(const name of ['a','b']){
  const bytes=fs.readFileSync(path.join(out,'shots',`hero-${name}.webm`));assert.equal(bytes.subarray(0,4).toString('hex'),'1a45dfa3');
  const result=await client.evaluate(`(async()=>{
   const v=document.createElement('video');v.muted=true;v.preload='auto';document.body.append(v);
   const loaded=new Promise((r,j)=>{v.onloadeddata=r;v.onerror=()=>j(new Error('Video decode error'));});
   v.src='data:video/webm;base64,${bytes.toString('base64')}';await loaded;
   const canvas=document.createElement('canvas');canvas.width=v.videoWidth;canvas.height=v.videoHeight;const ctx=canvas.getContext('2d');
   // MediaRecorder WebM has no duration header: seek to EOF to finish demuxing before measuring.
   await new Promise(r=>{v.onseeked=r;v.currentTime=1e9;});
   const frames=[];
   for(const t of [2,8]){await new Promise((r,j)=>{v.onseeked=r;v.onerror=()=>j(new Error('Video seek error'));v.currentTime=t;});ctx.drawImage(v,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let min=255,max=0;for(let i=0;i<pixels.length;i+=400){min=Math.min(min,pixels[i]);max=Math.max(max,pixels[i]);}frames.push({time:v.currentTime,range:max-min,png:canvas.toDataURL('image/png').split(',')[1]});}
   const result={width:v.videoWidth,height:v.videoHeight,duration:Number.isFinite(v.duration)?v.duration:'stream duration',frames};v.remove();return result;
  })()`);
  console.log('Video metadata',name,result.width,result.height,result.duration,result.frames.map(f=>f.time));assert.equal(result.width,1440);assert.equal(result.height,1000);assert.ok(result.duration>=8&&result.duration<=12,'Recording duration must preserve 8-12 seconds of real time');assert.ok(Math.abs(result.frames[1].time-8)<0.1,'Can seek to 8 seconds without clamping');
  for(const f of result.frames){assert.ok(f.range>100,'Decoded frame is nonblank');const data=Buffer.from(f.png,'base64');fs.writeFileSync(path.join(out,`video-${name}-${f.time}s.png`),data);f.sha256=crypto.createHash('sha256').update(data).digest('hex');delete f.png;}
  assert.notEqual(result.frames[0].sha256,result.frames[1].sha256,'Real motion in recording');report.videos.push({file:`hero-${name}.webm`,...result});console.log('PASS WebM playback, seeking and changing frames',name);
 }
 // Simulate a missing lake file without modifying any asset. Only the train may remain.
 await client.send('Network.setCacheDisabled',{cacheDisabled:true});await client.send('Network.setBlockedURLs',{urls:['http://*','https://*','*hamilton-lake.webp']});
 await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await client.send('Page.navigate',{url:pathToFileURL(path.join(__dirname,'dist/index.html')).href+'?hero=b#/'});
 let fallback=false;for(let i=0;i<100;i++){fallback=await client.evaluate(`document.querySelector('.sb-hero-media')?.dataset.ready==='true'&&document.querySelectorAll('.sb-hero-media img').length===1&&document.querySelector('.sb-hero-media img')?.naturalWidth>0`);if(fallback)break;await pause(100);}assert.ok(fallback,'Failed lake decode is excluded, train remains visible');
 report.checks.push('Blocked scenic file decodes to a single fully loaded train; no blank slideshow layer');console.log('PASS unavailable scenic image fallback');report.status='PASS';
})().catch(e=>{report.status='FAIL';report.failure=e.stack;console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'motion-review.json'),JSON.stringify(report,null,2));if(client){try{await client.send('Browser.close');}catch{}client.ws.close();}chrome.kill();clearInterval(keepAlive);});




