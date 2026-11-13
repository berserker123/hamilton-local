const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
const fs=require('node:fs');
function load(){const r=esbuild.buildSync({entryPoints:['src/tool-navigation.ts'],bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);return m.exports;}
test('legacy pets tab, category and bare hashes redirect into directory and preserve query',()=>{
  const {canonicalHash}=load();
  for(const [old,next] of [
    ['#/living?tab=pets','#/services?tab=pets'],
    ['#/living?tab=pets&at=pet-vets&q=test','#/services?tab=pets&at=pet-vets&q=test'],
    ['#/living?at=pet-boarding','#/services?at=pet-boarding&tab=pets'],
    ['#pets','#/services?tab=pets&at=pets'],
    ['#pet-dog-parks','#/services?tab=pets&at=pet-dog-parks'],
    ['#/living?tab=stays','#/living?tab=stays'],
    ['#/tools?tab=units&at=tool-units','#/tools?tab=units&at=tool-units'],
  ])assert.equal(canonicalHash(old),next);
});
test('home and top navigation put tools first; pet guide remains reachable',()=>{
  const {SECTION_ORDER}=load();
  assert.deepEqual(SECTION_ORDER,['home','tools','living','weekend','kids','services']);
  const app=fs.readFileSync('src/App.tsx','utf8'),home=fs.readFileSync('src/HomeGuide.tsx','utf8');
  assert.match(home,/#\/services\?tab=pets/);
  assert.doesNotMatch(home,/#\/living\?tab=pets/);
  assert.match(app,/if \(tab === 'pets'\) return <Pets/);
  assert.ok(require('../src/pets-v25.json').length || Object.keys(require('../src/pets-v25.json')).length);
});

test('toolbox splits buses and other tools into their own tabs',()=>{
  const {TOOL_TABS}=load();
  assert.deepEqual(TOOL_TABS,[
    ['bins','垃圾清运','Bins'],['urgent','急诊信息','Urgent care'],['bus','市区公交','City buses'],
    ['pay','税后收入','Pay calculator'],['checklist','新移民清单','Arrival checklist'],
    ['gst','GST计算','GST calculator'],['units','单位换算','Unit converter'],
    ['seasonal','季节提醒','Seasonal'],['other','其他工具','Other tools'],
  ]);
});

test('older toolbox links select Other and preserve their destinations and queries',()=>{
  const {canonicalHash,AT_IDS}=load();
  for(const anchor of ['tool-school-terms','tool-find-school','tool-weather','tool-outages','tool-government','tool-fuel']){
    assert.ok(AT_IDS.has(anchor));
    assert.equal(canonicalHash('#'+anchor),'#/tools?tab=other&at='+anchor);
    assert.equal(canonicalHash('#/tools?tab=bins&at='+anchor+'&q=test'),'#/tools?tab=other&at='+anchor+'&q=test');
  }
  assert.equal(canonicalHash('#tool-transport'),'#/tools?tab=bus&at=tool-transport');
  assert.equal(canonicalHash('#/tools?tab=transport&q=test'),'#/tools?tab=bus&q=test&at=tool-transport');
  assert.equal(canonicalHash('#/weekend?tab=festivals'),'#/weekend?tab=picks');
  assert.equal(canonicalHash('#/tools?tab=bins'),'#/tools?tab=bins');
  assert.equal(canonicalHash('#tool-bins'),'#/tools?tab=bins&at=tool-bins');
  assert.equal(canonicalHash('#urgent-clinics'),'#/tools?tab=urgent&at=urgent-clinics');
});
