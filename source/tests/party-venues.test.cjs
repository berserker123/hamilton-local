const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
function moduleUnderTest(){
 const result=esbuild.buildSync({entryPoints:['src/party-data.ts'],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent'});
 const m={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(m,m.exports,require);return m.exports;
}
test('party filters combine region and type without silently including unknown types',()=>{
 const {filterPartyVenues}=moduleUnderTest();
 const items=[{id:'a',region:'Hamilton',type:'sport'},{id:'b',region:'Hamilton',type:'hire'},{id:'c',region:'Raglan',type:'sport'},{id:'d',region:'Hamilton',type:'unknown'}];
 assert.deepEqual(filterPartyVenues(items,'Hamilton','sport').map(v=>v.id),['a']);
 assert.deepEqual(filterPartyVenues(items,'all','sport').map(v=>v.id),['a','c']);
 assert.equal(filterPartyVenues(items,'all','all').length,4);
 assert.equal(filterPartyVenues(items,'Raglan','hire').length,0);
 assert.equal(filterPartyVenues(items,'Hamilton','indoor').length,0);
 assert.deepEqual(filterPartyVenues(items,'Hamilton','all').map(v=>v.id),['a','b','d']);
});
test('party directory meets verified coverage and complete source requirements',()=>{
 const venues=require('../src/party-venues.json');
 assert.ok(venues.length>=25);assert.ok(venues.filter(v=>v.region==='Hamilton').length>=12);
 assert.equal(new Set(venues.map(v=>v.id)).size,venues.length);
 assert.equal(new Set(venues.map(v=>v.name_en)).size,venues.length);
 for(const region of ['Hamilton','Cambridge','Te Awamutu','Raglan','other'])assert.ok(venues.some(v=>v.region===region));
 for(const v of venues){
  for(const key of ['id','town','name_zh','name_en','address','ages_zh','ages_en','details_zh','details_en','price_zh','price_en','url','verified_on'])assert.ok(typeof v[key]==='string'&&v[key].trim(),v.id+': '+key);
  assert.ok(['indoor','sport','outdoor','creative','hire','mobile'].includes(v.type),v.id);
  assert.ok(v.sources.length>0,v.id);assert.ok(v.sources.some(s=>s.url===v.url),v.id+': booking source');
  for(const s of v.sources){assert.ok(new URL(s.url).protocol==='https:');assert.ok(s.title&&s.evidence);}
  assert.equal(v.verified_on,'2026-11-11');assert.ok(!/facebook\.com|tripadvisor|eventfinda/.test(v.url));
  assert.ok(!/\?{3,}|�/.test(v.name_zh+v.ages_zh+v.details_zh+v.price_zh),v.id+': garbled text');
  assert.ok(!v.address.includes('（'),v.id+': navigable address only');
 }
});
test('mobile services match only their documented areas and remain a separate group',()=>{
 const {filterPartyVenues}=moduleUnderTest();
 const items=[{id:'local',region:'mobile',type:'mobile',service_regions:['Hamilton']},{id:'regional',region:'mobile',type:'mobile',service_regions:['Waikato']},{id:'unknown',region:'mobile',type:'mobile'},{id:'hall',region:'Hamilton',type:'hire'}];
 assert.deepEqual(filterPartyVenues(items,'Hamilton','mobile').map(v=>v.id),['local','regional']);
 assert.deepEqual(filterPartyVenues(items,'Raglan','mobile').map(v=>v.id),['regional']);
 assert.deepEqual(filterPartyVenues(items,'mobile','all').map(v=>v.id),['local','regional','unknown']);
 assert.deepEqual(filterPartyVenues(items,'Hamilton','hire').map(v=>v.id),['hall']);
});
test('regional paging is bounded and expansion covers the reported omissions',()=>{
 const {partyPage,PARTY_PAGE_SIZE,PARTY_REGIONS,PARTY_TYPES}=moduleUnderTest();
 const items=Array.from({length:18},(_,id)=>({id}));
 assert.equal(PARTY_PAGE_SIZE,8);assert.equal(partyPage(items,false).length,8);assert.deepEqual(partyPage(items,true),items);
 const venues=require('../src/party-venues.json');
 for(const name of ['Timezone The Base Hamilton','The Peak'])assert.ok(venues.some(v=>v.name_en===name),name);
 for(const v of venues){assert.ok(PARTY_REGIONS.some(r=>r.id===v.region),v.id+': region');assert.ok(PARTY_TYPES.some(r=>r.id===v.type),v.id+': type');if(v.type==='mobile'){assert.equal(v.region,'mobile');assert.ok(v.service_regions?.length,v.id+': official service coverage');}}
 const baseline=require('../../out/research/party-venues-before-expansion.json');
 for(const v of baseline)assert.ok(venues.some(n=>n.id===v.id),'retained '+v.id);
});
test('directions preserve complete address in Google Maps destination',()=>{
 const {partyDirections}=moduleUnderTest();const address='9–11 Norton Road, Frankton, Hamilton';
 const url=new URL(partyDirections(address));assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('api'),'1');assert.equal(url.searchParams.get('destination'),address+', New Zealand');
});
