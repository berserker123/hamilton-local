const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const out=path.resolve(__dirname,'../out'),dir=path.join(out,'video-checks');fs.mkdirSync(dir,{recursive:true});
const report=[];
for(const name of ['home-train','whatson-balloons','living-seasons']){
 const file=path.join(out,'shots',name+'.webm');
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',file],{encoding:'utf8'}));
 const duration=Number(meta.format.duration),stream=meta.streams[0];assert.ok(duration>=6&&duration<=10,`${name} duration ${duration}`);assert.equal(stream.width,1440);assert.equal(stream.height,1000);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',file,'-f','null','-'],{stdio:'pipe'});
 const frames=[];
 for(const time of [.6,3.5,7]){const png=path.join(dir,`${name}-${time}.png`);execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(time),'-i',file,'-frames:v','1','-update','1',png],{stdio:'pipe'});frames.push(png);}
 const contact=path.join(dir,name+'-contact.png');
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...frames.flatMap(f=>['-i',f]),'-filter_complex','[0:v]scale=480:-1[a];[1:v]scale=480:-1[b];[2:v]scale=480:-1[c];[a][b][c]hstack=inputs=3[out]','-map','[out]','-frames:v','1','-update','1',contact],{stdio:'pipe'});
 report.push({name,duration,codec:stream.codec_name,width:stream.width,height:stream.height,fileBytes:fs.statSync(file).size,decodedAllFrames:true,sampledTimes:[.6,3.5,7],contact:path.relative(out,contact)});
}
fs.writeFileSync(path.join(out,'video-verification-v21.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
