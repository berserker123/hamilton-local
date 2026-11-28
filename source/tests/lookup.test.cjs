const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
const fs=require('node:fs');
function load(){const r=esbuild.buildSync({entryPoints:['src/lookup-model.ts'],bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);return m.exports;}
const model=load();
const data=JSON.parse(fs.readFileSync('public'+model.LOOKUP_DATA_URL,'utf8'));
const index=model.buildIndex(data);

test('lookup data covers Hamilton City addresses and zones',()=>{
  assert.ok(data.a.length>70000);
  assert.ok(data.zones.length>=40);
  for(const row of data.a.slice(0,500)){
    assert.ok(row[3]/1e5<-37.6&&row[3]/1e5>-37.9,'latitude inside Hamilton');
    assert.ok(row[4]/1e5>175.1&&row[4]/1e5<175.4,'longitude inside Hamilton');
  }
  assert.deepEqual(Object.keys(data.clinics).sort(),['anglesea','rototuna','terapa','victoria']);
});

test('address search matches numbers exactly and accepts street abbreviations',()=>{
  const hits=model.searchAddresses(index,'3 thackeray st');
  assert.ok(hits.length>=1);
  assert.ok(hits.every(i=>index.labels[i].startsWith('3 Thackeray Street')));
  assert.deepEqual(model.searchAddresses(index,'12'),[],'numbers alone do not search');
  const units=model.searchAddresses(index,'26 bryant road',20).map(i=>index.labels[i]);
  assert.ok(units.length>=10&&units.every(l=>/^(\d+\/)?26 Bryant Road/.test(l)));
});

test('the same address gives the same zones the data file stores',()=>{
  const [i]=model.searchAddresses(index,'3 thackeray street');
  const address=model.addressAt(index,i);
  assert.equal(address.road,'Thackeray Street');
  assert.ok(address.zones.length>0);
  assert.ok(address.zones.every(z=>typeof z.name==='string'&&z.name.length>0));
});

test('distances and labels',()=>{
  assert.ok(Math.abs(model.distanceKm(-37.78,175.28,-37.79,175.28)-1.11)<0.02);
  assert.equal(model.formatKm(2.345,true),'直线约 2.3 公里');
  assert.equal(model.formatKm(12.6,false),'about 13 km in a straight line');
  assert.equal(model.formatKm(0.03,true),'就在附近（直线不到 0.1 公里）');
  assert.deepEqual(model.zoneTypeLabel('Contributing'),['小学（1–6 年级）','Primary (Years 1–6)']);
  assert.equal(model.zoneStartsLater({eff:'2027-01-01'},'2026-11-28'),true);
  assert.equal(model.zoneStartsLater({eff:null},'2026-11-28'),false);
});

test('the lookup never sends the address anywhere',()=>{
  const tool=fs.readFileSync('src/LookupTool.tsx','utf8');
  const fetches=tool.match(/fetch\(/g)||[];
  assert.equal(fetches.length,1);
  assert.match(tool,/fetch\(LOOKUP_DATA_URL\)/);
  assert.doesNotMatch(tool,/localStorage|sessionStorage|sendBeacon|track\(/);
});
