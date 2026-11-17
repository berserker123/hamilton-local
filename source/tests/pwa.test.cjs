const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dist=path.join(__dirname,'..','dist');
const pngSize=file=>{const b=fs.readFileSync(file);assert.equal(b.toString('ascii',1,4),'PNG');return b.readUInt32BE(16)+'x'+b.readUInt32BE(20);};
const htmlFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const p=path.join(dir,e.name);
  if(e.isDirectory())return e.name==='node_modules'?[]:htmlFiles(p);
  return e.name.endsWith('.html')?[p]:[];
});

test('manifest parses and every listed icon exists in dist at the stated size',()=>{
  const m=JSON.parse(fs.readFileSync(path.join(dist,'manifest.webmanifest'),'utf8'));
  assert.equal(m.display,'standalone');
  assert.equal(m.start_url,'/');
  assert.equal(m.scope,'/');
  assert.equal(m.short_name,'Hamilton Local');
  assert.ok(m.icons.some(i=>i.sizes==='192x192'&&i.purpose==='any'));
  assert.ok(m.icons.some(i=>i.sizes==='512x512'&&i.purpose==='any'));
  assert.ok(m.icons.some(i=>i.sizes==='512x512'&&i.purpose==='maskable'));
  for(const icon of m.icons){
    const file=path.join(dist,icon.src.replace(/^\//,''));
    assert.ok(fs.existsSync(file),icon.src+' missing');
    assert.equal(pngSize(file),icon.sizes,icon.src);
  }
});

test('every built html page links the manifest and theme-color tags',()=>{
  const pages=htmlFiles(dist);
  assert.ok(pages.length>=33,'expected 32 pages + 404, got '+pages.length);
  for(const file of pages){
    const html=fs.readFileSync(file,'utf8');
    for(const needle of ['<link rel="manifest" href="/manifest.webmanifest">','<meta name="theme-color" content="#E6DFD5" media="(prefers-color-scheme: light)">','<meta name="theme-color" content="#1e1d1a" media="(prefers-color-scheme: dark)">','<meta name="apple-mobile-web-app-capable" content="yes">','<meta name="mobile-web-app-capable" content="yes">','<meta name="apple-mobile-web-app-title" content="Hamilton Local">'])
      assert.ok(html.includes(needle),path.relative(dist,file)+' lacks '+needle);
  }
});

test('sw.js is pass-through and caches nothing',()=>{
  const sw=fs.readFileSync(path.join(dist,'sw.js'),'utf8');
  assert.ok(!/cache\.put|caches\.open|cache\.add/.test(sw));
  assert.ok(sw.includes('fetch(event.request)'));
});
