const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'out/research');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8').replace(/^\uFEFF/,''));
const baseline=read('party-venues-before-expansion.json');
const additions=['hamilton','west','east','mobile'].flatMap(area=>read('expansion-'+area+'.json'));
const labels={Hamilton:'汉密尔顿 Hamilton',Cambridge:'剑桥 Cambridge','Te Awamutu':'蒂阿瓦穆图 Te Awamutu',Raglan:'拉格伦 Raglan',Huntly:'亨特利 Huntly',Morrinsville:'莫林斯维尔 Morrinsville',Matamata:'玛塔玛塔 Matamata',Tokoroa:'托科罗阿 Tokoroa',Putaruru:'普塔鲁鲁 Putāruru',Ngaruawahia:'纳鲁阿瓦希亚 Ngāruawāhia',Thames:'泰晤士 Thames',Coromandel:'科罗曼德及周边 Coromandel & Hauraki','Te Aroha':'蒂阿罗哈 Te Aroha',other:'其他怀卡托',mobile:'上门派对服务'};
const normalise=r=>r==='Ngāruawāhia'?'Ngaruawahia':r;
// A camp lead remains in discovery notes: a short birthday/family booking was not established.
const venues=[...baseline,...additions].filter(v=>v.id!=='kauaeranga-valley-group-events').map(v=>{
 const row={...v,region:normalise(v.region)};
 if(row.region==='other'&&labels[row.town])row.region=row.town;
 if(row.service_regions)row.service_regions=row.service_regions.map(normalise);
 if(row.type!=='mobile'){
   row.map_address=row.address.split('；')[0];
   row.map_precision=/待确认|确认|Collins Road|^Duke Street|^Minogue Park|^Innes Common/.test(row.address)?'area':'address';
 }
 return row;
});
const ids=new Set(),names=new Set();for(const v of venues){if(ids.has(v.id)||names.has(v.name_en))throw Error('Duplicate '+v.id);ids.add(v.id);names.add(v.name_en);if(!labels[v.region])throw Error('Unknown region '+v.region);}
const priority=['timezone-the-base','the-peak','fun-zone-hamilton','jago-town-hamilton','leap-megazone-hamilton','chipmunks-hamilton','ninja-valley-hamilton','blastacars-hamilton'];
venues.sort((a,b)=>Object.keys(labels).indexOf(a.region)-Object.keys(labels).indexOf(b.region)||(priority.includes(a.id)?priority.indexOf(a.id):100)-(priority.includes(b.id)?priority.indexOf(b.id):100)||(a.type==='hire')-(b.type==='hire'));
fs.writeFileSync(path.join(__dirname,'src/party-venues.json'),JSON.stringify(venues,null,2)+'\n');
let md='# 派对与场地：官方来源与核实记录（本轮扩充）\n\n核实日期：2026年11月11日（新西兰）。原28项已保留；以官网、运营方及市／区议会现行资料核实新增。搜索清单和社交平台只作发现线索；没有以第三方评价证明现营。未联系商家确认具体档期。\n\n金额为NZD，严格区分普通入场、按件活动费、场租、派对套餐、订金和可退押金。未刊价格、年龄、儿童派对许可与其他安排标待确认。中文名为阅读译名。\n\n地理统计只算实体场地，上门服务独立去重统计。前端城镇筛选会包含已证实服务当地的上门商家，故前端各地区计数互相重叠。Coromandel组包含Whitianga、Coroglen及邻近Hauraki/Karangahake。\n\n';
md+='|地区|实体／独立服务数|本轮新增|\n|---|---:|---:|\n';
for(const [id,label] of Object.entries(labels))md+=`|${label}|${venues.filter(v=>v.region===id).length}|${venues.filter(v=>v.region===id&&!baseline.some(b=>b.id===v.id)).length}|\n`;
md+=`|合计|${venues.length}|${venues.length-baseline.length}|\n\n`;
md+='## Timezone 与 The Peak\n\n- Timezone The Base Hamilton：已收录。官方分店页与派对预订选择器均明确Hamilton；只采用该店活动栏证实的街机与迷你保龄球，没有把通用营销文案中的Laser Tag误当Hamilton设施。Hamilton具体套餐价待确认。\n- The Peak：已收录。当前HTML生日页有完整2小时运动派对、带领员及年龄分组价格；采用当前网页，不沿用2023年旧PDF。\n- Leap与Megazone合并一个场地，官网当前搜索索引与直接链接的Roller预订页可查；本地直连官网TLS失败单独记录，不当停业或404。\n\n';
for(const [id,label] of Object.entries(labels)){
 md+=`## ${label}\n\n`;
 for(const v of venues.filter(v=>v.region===id)){
  md+=`### ${v.name_zh} · ${v.name_en}\n\n- 数据ID：\`${v.id}\`；类型：${v.type}；城镇：${v.town}；${baseline.some(b=>b.id===v.id)?'原有保留':'本轮新增'}\n- ${v.type==='mobile'?'服务范围：'+v.service_area_zh:'地址：'+v.address}\n- 年龄：${v.ages_zh}\n- 派对或租用：${v.details_zh}\n- 价格：${v.price_zh}\n- 官网／官方预订：[${v.name_en}](${v.url})\n`;
  for(const s of v.sources)md+=`- 官方证据：[${s.title}](${s.url})。${s.evidence}\n`;
  for(const p of v.unconfirmed||[])md+=`- 特别待确认：${p}\n`;
  if(v.map_precision==='area')md+='- 地图仅标区域／道路，不是已确认入口；页面链接明确显示「区域地图」。\n';
  md+='\n';
 }
}
md+='## 系统搜索范围、排除与空缺\n\n';
for(const area of ['hamilton','west','east','mobile']){const file=path.join(dir,'expansion-'+area+'-notes.md');if(fs.existsSync(file))md+=fs.readFileSync(file,'utf8').replace(/^# /,'### ')+'\n\n';}
md+='## 复核结果\n\n完整HTTP结果见 `../external-links-v18.json`；浏览器交互和保留项结果见 `../qa-v18.json`。403、TLS失败、限流或超时独立列出，不能当可访问验证通过，也不推断为404。资料核查不保证每个未来日期的营业与可订性。\n';
fs.writeFileSync(path.join(dir,'party-venues-sources.md'),md);
console.log(JSON.stringify({total:venues.length,added:venues.length-baseline.length,physical:venues.filter(v=>v.type!=='mobile').length,mobile:venues.filter(v=>v.type==='mobile').length,regions:Object.fromEntries(Object.keys(labels).map(r=>[r,venues.filter(v=>v.region===r).length]))},null,2));
