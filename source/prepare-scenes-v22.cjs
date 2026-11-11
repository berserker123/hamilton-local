const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const records=require('../out/research/scenes-v22.json');
for(const r of records){
 const target=path.resolve(__dirname,'public/photos/window-'+r.id+'-v22.webp');
 // Keep recognisable subjects in a 16:9 crop; mirror the trailing half for the existing looping track.
 const y=r.id==='fairfield'?.3:r.id==='museum'?.36:r.id==='balloons'?.38:.5;
 const filter=`scale=1200:675:force_original_aspect_ratio=increase,crop=1200:675:(iw-1200)/2:(ih-675)*${y},eq=saturation=0.94:brightness=0.012:contrast=1.015,colorbalance=rs=0.012:bs=-0.008,split[a][b];[b]hflip[c];[a][c]hstack`;
 execFileSync('ffmpeg',['-y','-v','error','-i',r.original,'-filter_complex',filter,'-frames:v','1','-c:v','libwebp','-quality','87',target]);
 r.outputWidth=2400;r.outputHeight=675;r.bytes=fs.statSync(target).size;
 r.modifications='16:9 subject crop; resize to 1200×675; saturation 94%; brightness +0.012; contrast 1.015; slight warm colour balance; mirrored trailing half for the existing moving track; 2400×675 WebP quality 87.';
 r.sourceSHA256=crypto.createHash('sha256').update(fs.readFileSync(r.original)).digest('hex');r.outputSHA256=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
}
fs.writeFileSync(path.resolve(__dirname,'src/window-scene-credits.json'),JSON.stringify(records.map(({id,zh,en,author,license,licenseUrl,source,modifications})=>({id,zh,en,author,license,licenseUrl,source,modifications})),null,2));
let md=fs.readFileSync(path.resolve(__dirname,'../licenses/window-scenes.md'),'utf8').split('\n\n## v22 — verified')[0];md+='\n\n## v22 — verified 11 November 2026\n\nSeven NEW photographs, in addition to all four retained scenes. File descriptions, location/coordinates, author, original dimensions and free licence checked against Wikimedia Commons imageinfo metadata; full responses and original downloads retained in out/research.\n\n';
for(const r of records)md+=`### ${r.en}\n\n- Author: ${r.author}\n- Source: [${r.file}](${r.source})\n- Original: ${r.width} × ${r.height}; [download](${r.url})\n- Licence: [${r.license}](${r.licenseUrl}). Derivative distributed under this same licence; CC0 remains CC0.\n- Output: window-${r.id}-v22.webp (${r.bytes} bytes).\n- Modifications: ${r.modifications}\n- Source SHA256: ${r.sourceSHA256}\n- Derivative SHA256: ${r.outputSHA256}\n\n`;
md+='Location notes: the Italian Renaissance Garden is identified by the Commons category as well as the garden layout. Hamilton lake.jpg has coordinates −37.798180, 175.278992 on Hamilton Lake / Lake Rotoroa in Waikato; an unrelated Hamilton, New York category on Commons is erroneous. Museum view is the exterior from Memorial Park. Night Glow is a historical festival photograph, not a current event listing. No suitable cruise-boat source with an unambiguous approved licence was selected.\n';
fs.writeFileSync(path.resolve(__dirname,'../licenses/window-scenes.md'),md);fs.writeFileSync(path.resolve(__dirname,'public/licenses/window-scenes.md'),md);
fs.writeFileSync(path.resolve(__dirname,'../out/research/scenes-v22.json'),JSON.stringify(records,null,2));
console.log(records.map(r=>`${r.id}: ${r.bytes} bytes`).join('\n'));
