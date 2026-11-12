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
  assert.match(home,/#\/services\?tab=pets/);
  assert.doesNotMatch(home,/#\/living\?tab=pets/);
  assert.match(app,/if \(tab === 'pets'\) return <Pets/);
  assert.ok(require('../src/pets-v25.json').length || Object.keys(require('../src/pets-v25.json')).length);
});
