const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../src/data/food-guide.json');
const model=()=>import('../src/food-guide.mjs');

test('the section keeps its approved name and ten occasions',async()=>{
  const {FOOD_OCCASIONS}=await model();
  assert.deepEqual(FOOD_OCCASIONS.map(o=>o.zh),['带爸妈吃饭','过生日','带娃吃饭','约会和纪念日','十人以上聚餐','请客户吃饭','一个人吃','素食','日常好吃','网红打卡']);
  const tabs=(await import('../src/site-routes.mjs')).TABS.living;
  assert.deepEqual(tabs.find(t=>t[0]==='dining'),['dining','屯里食堂','Tron Eats']);
});

test('every occasion has at least five places',async()=>{
  const {FOOD_OCCASIONS,placesFor}=await model();
  for(const o of FOOD_OCCASIONS)assert.ok(placesFor(data.places,o.id).length>=5,o.id);
});

test('every fact, hour, price and perk cites an https source',()=>{
  for(const p of data.places){
    assert.ok(p.facts.length>0,p.id);
    for(const item of [...p.facts,...p.hours,...(p.price?[p.price]:[])])assert.ok(item.url.startsWith('https://'),p.id);
    for(const f of p.facts)assert.ok(f.zh&&f.en,p.id);
  }
  for(const perk of data.perks)assert.ok(perk.url.startsWith('https://')&&perk.perkZh&&perk.conditionsZh,perk.name);
});

test('places are unique and every tag has a reason in both languages',async()=>{
  const {FOOD_OCCASIONS}=await model();
  const ids=new Set(FOOD_OCCASIONS.map(o=>o.id));
  assert.equal(new Set(data.places.map(p=>p.id)).size,data.places.length);
  assert.equal(new Set(data.places.map(p=>p.name.toLowerCase())).size,data.places.length);
  for(const p of data.places)for(const o of p.occasions){assert.ok(ids.has(o.id),p.id+' '+o.id);assert.ok(o.whyZh&&o.whyEn,p.id+' '+o.id);}
});

test('no scores or ratings, and no Sunday-evening occasion',()=>{
  const text=JSON.stringify(data);
  assert.doesNotMatch(text,/[★☆]|\b\d(\.\d)?\s*\/\s*5\b|评分|星级|\brating\b/i);
  assert.ok(!data.places.some(p=>p.id==='regal-chinese'));
  assert.ok(!data.places.some(p=>p.occasions.some(o=>o.id==='sunday-late')));
});

test('places sort by name and birthday locations drop source URLs',async()=>{
  const {placesFor,cleanWhere}=await model();
  const names=placesFor(data.places,'parents').map(p=>p.name);
  assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)));
  assert.equal(cleanWhere('Starbucks Chartwell, Hamilton (branch: https://example.com/x)'),'Starbucks Chartwell, Hamilton');
});

test('dice pick never repeats the last place and covers every place',async()=>{
  const {pickRandom}=await model();
  const seen=new Set();
  for(let i=0;i<data.places.length;i++){const p=pickRandom(data.places,null,()=>(i+0.5)/data.places.length);seen.add(p.id);}
  assert.equal(seen.size,data.places.length);
  for(let i=0;i<50;i++)assert.notEqual(pickRandom(data.places,data.places[0].id).id,data.places[0].id);
  assert.equal(pickRandom([],null),null);
});
