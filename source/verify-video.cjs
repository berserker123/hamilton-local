const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const out=path.resolve(__dirname,'../out'),video=path.join(out,'shots/cord-demo.webm'),ffmpeg=path.join(out,'playwright-tools/ffmpeg-1011/ffmpeg-win64.exe');
const info=spawnSync(ffmpeg,['-i',video],{encoding:'utf8'}).stderr;
const match=info.match(/Duration: (\d+):(\d+):([\d.]+)/);assert.ok(match,'Video metadata exists');
const duration=Number(match[1])*3600+Number(match[2])*60+Number(match[3]);assert.ok(duration>=5&&duration<=8,'Video must be between 5 and 8 seconds');assert.match(info,/1440x1000/);
for(const [name,time]of [['video-night-check',.3],['video-day-check',3],['video-return-check',6.5]]){
 const r=spawnSync(ffmpeg,['-y','-ss',String(time),'-i',video,'-frames:v','1','-update','1',path.join(out,name+'.png')],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
}
const result={duration,width:1440,height:1000,codec:'vp8',fileBytes:fs.statSync(video).size,decodedFrameTimes:[.3,3,6.5]};fs.writeFileSync(path.join(out,'video-verification.json'),JSON.stringify(result,null,2));console.log('VIDEO_VERIFIED',result);
