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
test('home and top navigation put tools first; pet records remain unchanged',()=>{
  const {SECTION_ORDER}=load();
  assert.deepEqual(SECTION_ORDER,['home','tools','living','weekend','kids','services']);
  const app=fs.readFileSync('src/App.tsx','utf8'),home=fs.readFileSync('src/HomeGuide.tsx','utf8');
  assert.match(home,/pageHref\('services', 'pets'\)/);
  assert.doesNotMatch(home,/#\/living\?tab=pets/);
  assert.doesNotMatch(home,/#\/services\?tab=/);
  assert.match(app,/if \(tab === 'pets'\) return <Pets/);
  assert.ok(require('../src/pets-v25.json').length || Object.keys(require('../src/pets-v25.json')).length);
});

test('toolbox has the requested eight short tabs with Other last',()=>{
  const {TOOL_TABS}=load();
  assert.deepEqual(TOOL_TABS,[
    ['bins','垃圾清运','Bins'],['urgent','急诊信息','Urgent care'],
    ['pay','税后收入','Pay calculator'],['checklist','新移民清单','Arrival checklist'],
    ['gst','GST计算','GST calculator'],['units','单位换算','Unit converter'],
    ['seasonal','季节提醒','Seasonal'],['other','其他','Other'],
  ]);
});

test('older toolbox links select Other and preserve their destinations and queries',()=>{
  const {canonicalHash,AT_IDS}=load();
  for(const anchor of ['tool-school-terms','tool-find-school','tool-transport','tool-weather','tool-outages','tool-government','tool-fuel']){
    assert.ok(AT_IDS.has(anchor));
    assert.equal(canonicalHash('#'+anchor),'#/tools?tab=other&at='+anchor);
    assert.equal(canonicalHash('#/tools?tab=bins&at='+anchor+'&q=test'),'#/tools?tab=other&at='+anchor+'&q=test');
  }
  assert.equal(canonicalHash('#/tools?tab=transport&q=test'),'#/tools?tab=other&q=test&at=tool-transport');
  assert.equal(canonicalHash('#/tools?tab=bins'),'#/tools?tab=bins');
  assert.equal(canonicalHash('#tool-bins'),'#/tools?tab=bins&at=tool-bins');
  assert.equal(canonicalHash('#urgent-clinics'),'#/tools?tab=urgent&at=urgent-clinics');
});

test('legacy hashes become real paths and every page has its own copy',()=>{
  const {legacyHashPath,pageHref,matchPath,PAGES}=load();
  assert.equal(legacyHashPath('#/tools?tab=bins'),'/tools/bins/');
  assert.equal(legacyHashPath('#/tools?tab=transport'),'/tools/transport/');
  assert.equal(legacyHashPath('#/tools?tab=urgent'),'/tools/urgent/');
  assert.equal(legacyHashPath('#/living'),'/supermarkets/');
  assert.equal(legacyHashPath('#/living?tab=grocers&q=Frankton'),'/supermarkets/?q=Frankton');
  assert.equal(legacyHashPath('#/weekend'),'/weekend/');
  assert.equal(legacyHashPath('#/whatson?tab=festivals'),'/weekend/festivals/');
  assert.equal(legacyHashPath('#/kids?tab=map'),'/kids/');
  assert.equal(legacyHashPath('#/services?tab=pets&at=pet-vets'),'/services/pets/#pet-vets');
  assert.equal(legacyHashPath('#/living?tab=pets&q=test'),'/services/pets/?q=test');
  assert.equal(legacyHashPath('#tool-transport'),'/tools/transport/#tool-transport');
  assert.equal(legacyHashPath('#tool-weather'),'/tools/other/#tool-weather');
  assert.equal(legacyHashPath('#main'),null);
  assert.equal(pageHref('home'),'/');
  assert.equal(pageHref('tools','bins'),'/tools/bins/');
  assert.equal(pageHref('tools','other','','tool-school-terms'),'/tools/other/#tool-school-terms');
  assert.equal(matchPath('/tools/bins').tab,'bins');
  assert.equal(matchPath('/tools/bins/').tab,'bins');
  assert.equal(matchPath('/no-such-page'),null);
  const titles=PAGES.map(page=>page.zh.title);
  const descriptions=PAGES.map(page=>page.zh.description);
  assert.equal(new Set(titles).size,PAGES.length);
  assert.equal(new Set(descriptions).size,PAGES.length);
  assert.equal(new Set(PAGES.map(page=>page.en.title)).size,PAGES.length);
  assert.equal(new Set(PAGES.map(page=>page.en.description)).size,PAGES.length);
  for(const page of PAGES){
    assert.ok(page.zh.title.includes('Hamilton Local'));
    assert.ok(page.zh.description.length>40);
    assert.ok(page.en.description.length>40);
    assert.ok(page.zh.points.length);
  }
});
