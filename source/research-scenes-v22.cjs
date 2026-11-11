const fs=require('fs'),path=require('path');
const out=path.resolve(__dirname,'../out/research');fs.mkdirSync(out,{recursive:true});
const candidates=[
 ['gardens','Hamilton Gardens, New Zealand (2).JPG','汉密尔顿花园 · 意大利花园','Hamilton Gardens · Italian Renaissance Garden'],
 ['waikato-river','River - Hamilton Gardens - Hamilton, NZ - DSC06553.jpg','怀卡托河 · 花园眺望','Waikato River · view from Hamilton Gardens'],
 ['fairfield','Fairfield Bridge.jpg','Fairfield 大桥','Fairfield Bridge'],
 ['claudelands','Claudelands Bridge, Hamilton 02.JPG','Claudelands 大桥','Claudelands Bridge'],
 ['museum','WaikatoMuseum.jpg','怀卡托博物馆','Waikato Museum'],
 ['balloons','BoW nightglow1.jpg','怀卡托热气球节 · 夜光','Balloons over Waikato · Night Glow'],
 ['lake','Hamilton lake.jpg','汉密尔顿湖 · Lake Rotoroa','Hamilton Lake · Lake Rotoroa'],
];
(async()=>{
const records=[];for(const [id,file,zh,en] of candidates){
 const u=new URL('https://commons.wikimedia.org/w/api.php');u.search=new URLSearchParams({action:'query',format:'json',titles:'File:'+file,prop:'imageinfo',iiprop:'url|size|extmetadata'});
 const cache=path.join(out,id+'-metadata.json');
 const info=fs.existsSync(cache)?JSON.parse(fs.readFileSync(cache,'utf8')):Object.values((await(await fetch(u)).json()).query.pages)[0].imageinfo[0];
 fs.writeFileSync(path.join(out,id+'-metadata.json'),JSON.stringify(info,null,2));
 const m=info.extmetadata,plain=s=>(s||'').replace(/<[^>]*>/g,'').replace(/&#?[a-z0-9]+;/gi,' ').trim();
 if(info.width<1600||!/CC BY|CC0|Public domain/.test(m.LicenseShortName.value))throw Error('Unacceptable '+id);
 const original=path.join(out,id+path.extname(file).toLowerCase());
 if(!fs.existsSync(original)){const r=await fetch(info.url);if(!r.ok)throw Error(r.status+' '+id);fs.writeFileSync(original,Buffer.from(await r.arrayBuffer()));}
 records.push({id,zh,en,file,original,width:info.width,height:info.height,author:plain(m.Artist?.value),license:m.LicenseShortName.value,licenseUrl:m.LicenseUrl?.value||'https://creativecommons.org/publicdomain/zero/1.0/',source:info.descriptionurl,url:info.url,caption:plain(m.ImageDescription?.value),src:'./photos/window-'+id+'-v22.webp'});
}fs.writeFileSync(path.join(out,'scenes-v22.json'),JSON.stringify(records,null,2));console.log(records.map(r=>({id:r.id,dimensions:[r.width,r.height],author:r.author,license:r.license,caption:r.caption})));
})().catch(e=>{console.error(e);process.exitCode=1});
