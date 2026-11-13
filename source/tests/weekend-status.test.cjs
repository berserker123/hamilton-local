const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
function load(){
  const result=esbuild.buildSync({entryPoints:['src/weekend-status.ts'],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent'});
  const m={exports:{}};
  new Function('module','exports','require',result.outputFiles[0].text)(m,m.exports,require);
  return m.exports;
}
const TONES=new Set(['is-faded','is-tbc','is-free','is-priced']);
test('every weekend status gets exactly one colour class',()=>{
  const {priceTone,displayPrice}=load();
  const data=require('../src/events-and-markets.json');
  const rows=[
    ...data.events_this_week.map(item=>({zh:item.price_zh,en:item.price_en,past:false})),
    ...[...data.markets.already_on_site,...data.markets.hamilton_new,...data.markets.waikato_other].map(item=>{
      const priced=data.events_this_week.find(event=>event.town===item.town && event.title_zh===item.title_zh);
      const zh=item.price_zh || (priced?priced.price_zh:'费用待确认');
      const en=item.price_en || (priced?priced.price_en:'Price unconfirmed');
      return {zh,en,past:['cambridge-trash-n-treasure','morrinsville-country-market'].includes(item.id)};
    }),
  ];
  const counts={};
  for (const row of rows){
    const tone=priceTone(row.zh,row.en,row.past);
    assert.ok(TONES.has(tone), row.zh);
    counts[tone]=(counts[tone]||0)+1;
    const shown=displayPrice(row.zh,row.en);
    if(/^免费(入场)?$/.test(row.zh.trim())){assert.equal(shown.zh,'免费');assert.equal(shown.en,'Free');}
  }
  assert.equal(counts['is-free']+counts['is-tbc']+counts['is-priced']+counts['is-faded'], rows.length);
  assert.equal(priceTone('免费','Free entry'),'is-free');
  assert.equal(priceTone('免费入场','Free admission'),'is-free');
  assert.equal(priceTone('免费，需报名','Free admission; registration listed'),'is-free');
  assert.equal(priceTone('票价待确认（需购票）','Ticketed; price 待确认'),'is-tbc');
  assert.equal(priceTone('费用待确认','Price unconfirmed'),'is-tbc');
  assert.equal(priceTone('$20–$35','$20–$35'),'is-priced');
  assert.equal(priceTone('免费（本期报名已关闭）','Free; registrations closed'),'is-faded');
  assert.equal(priceTone('免费','Free',true),'is-faded');
  const {isWeekendEvent,weekendHeading}=load();
  assert.deepEqual(weekendHeading('2026-11-10','2026-11-16'), {zh:'11月13日–15日', en:'13–15 November 2026', first:'2026-11-13', last:'2026-11-15'});
  const events=data.events_this_week.filter(item=>isWeekendEvent(item.dates,'2026-11-10','2026-11-16'));
  const byTown={};
  for (const item of events){
    const town=['Hamilton','Cambridge','Raglan'].includes(item.town)?item.town:'other';
    byTown[town]=(byTown[town]||0)+1;
  }
  assert.ok(events.length < data.events_this_week.length);
  assert.ok(events.every(item=>item.dates.some(date=>['2026-11-13','2026-11-14','2026-11-15'].includes(date))));
  console.log('status classes', counts);
  console.log('fri-sun picks', events.length, byTown);
});
