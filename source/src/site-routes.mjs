// Canonical paths, per-page copy, and legacy hash → path redirects.
// Imported by the app (esbuild) and by the static build (Node).

export const SITE_ORIGIN = 'https://hamiltonlocal.nz';
export const SECTION_ORDER = ['home', 'tools', 'living', 'weekend', 'kids', 'services'];
export const TOOL_TABS = [
  ['bins', '垃圾清运', 'Bins'], ['urgent', '急诊信息', 'Urgent care'],
  ['pay', '税后收入', 'Pay calculator'], ['checklist', '新移民清单', 'Arrival checklist'],
  ['gst', 'GST计算', 'GST calculator'], ['units', '单位换算', 'Unit converter'],
  ['seasonal', '季节提醒', 'Seasonal'], ['other', '其他', 'Other'],
];

const TOOL_ANCHORS = {
  'tool-bins': 'bins', 'urgent-clinics': 'urgent', 'tool-pay': 'pay', 'tool-checklist': 'checklist',
  'tool-gst': 'gst', 'tool-units': 'units', 'tool-fishing': 'seasonal', 'tool-pollen-flu': 'seasonal',
  'tool-school-terms': 'other', 'tool-find-school': 'other', 'tool-transport': 'other',
  'tool-weather': 'other', 'tool-outages': 'other', 'tool-government': 'other', 'tool-fuel': 'other',
};
const PET_IDS = ['pets', 'pet-shops', 'pet-boarding', 'pet-grooming', 'pet-vets', 'pet-dog-parks', 'pet-daycare'];
export const AT_IDS = new Set(['stays', 'upick', 'everyday-places', ...Object.keys(TOOL_ANCHORS), ...PET_IDS]);

const zh = (title, description, heading, points) => ({ title, description, heading, points });
const en = (title, description, heading, points) => ({ title, description, heading, points });

/** @type {Array<{path:string, route:string, tab:string, sectionDefault?:boolean, image:string, zh:any, en:any}>} */
export const PAGES = [
  {
    path: '/', route: 'home', tab: '', sectionDefault: true, image: 'og-image.jpg',
    zh: zh(
      '首页 · Hamilton Local',
      'Hamilton Local：汉密尔顿本地生活、周末活动、亲子遛娃、便民黄页与实用工具箱。独立整理的本地生活指南。',
      '在汉密尔顿，把日子过得更顺手',
      ['从一日三餐到周末时光，从带娃出门到日常琐事。', '栏目顺序：实用工具箱、本地生活、周末活动、亲子遛娃、便民黄页。', '资料为独立整理，与所列机构及商家无关联，出发前请以官方渠道为准。'],
    ),
    en: en(
      'Home · Hamilton Local',
      'Hamilton Local: local living, weekends, family outings, local services and a practical toolbox in Hamilton. An independent local guide.',
      'Life in Hamilton, made a little easier',
      ['From the weekly shop to a weekend outside.', 'The sections are the toolbox, local living, what\'s on, kids and family, and local services.', 'An independent guide, unaffiliated with the organisations and businesses it lists.'],
    ),
  },
  {
    path: '/supermarkets', route: 'living', tab: 'grocers', sectionDefault: true, image: 'photos/band-market.webp',
    zh: zh(
      '亚超与杂货 · Hamilton Local',
      '汉密尔顿亚洲超市与杂货：新宜超市（市中心与 The Base）、物美超市、绿盈超市、华盛超市，以及品牌待核实的 Borman Fresh 门店。可按门店、区域或地址查找，并附街景与地图。',
      '亚超与杂货',
      ['新宜超市：市中心 Tristram Street，以及 Te Rapa 的 The Base。', '物美超市 Wellmart：Vialou Street。绿盈超市 Green Patch：Hamilton East Grey Street。华盛超市 Garden Fresh Rototuna：Horsham Downs Road。', 'Gordonton / Rototuna North 的公开目录名称为 Borman Fresh，Green Patch 品牌待核实。', '营业时间沿用现有资料。jany.io / edan.io 为第三方目录信息，非商家官网。出发前请确认。'],
    ),
    en: en(
      'Asian grocers · Hamilton Local',
      'Asian supermarkets in Hamilton: New Save (city centre and The Base), Wellmart, Green Patch, Garden Fresh Rototuna, and a Borman Road shop whose Green Patch branding is unconfirmed. Search by store, suburb or address.',
      'Asian grocers',
      ['New Save Asian Fresh Supermarket on Tristram Street and at The Base, Te Rapa.', 'Wellmart on Vialou Street, Green Patch on Grey Street in Hamilton East, and Garden Fresh Rototuna on Horsham Downs Road.', 'Public listings name the Gordonton / Rototuna North unit Borman Fresh; the Green Patch brand there is unconfirmed.', 'Hours come from the existing records. jany.io and edan.io are directory listings, not official shop sites.'],
    ),
  },
  {
    path: '/living/dining', route: 'living', tab: 'dining', image: 'photos/band-market.webp',
    zh: zh(
      '美食探索 · Hamilton Local',
      '汉密尔顿美食探索正在整理中。确认好实用的餐饮信息后，再收录到本地生活这一栏，目前还没有商家名单。',
      '美食探索',
      ['这一栏用于本地餐饮信息。', '目前内容整理中，暂未列出商家。', '核对完成后再与你分享。'],
    ),
    en: en(
      'Food discoveries · Hamilton Local',
      'Food discoveries for Hamilton are still being gathered. Listings will be shared after the details are checked.',
      'Food discoveries',
      ['This section is for local dining.', 'There are no listings yet.', 'Useful information will be added once it has been checked.'],
    ),
  },
  {
    path: '/living/places', route: 'living', tab: 'places', image: 'photos/band-market.webp',
    zh: zh(
      '日常好去处 · Hamilton Local',
      '汉密尔顿日常好去处：从公园到步道，找一处适合今天出门的地方。页面收录距市中心不远的户外地点，以及茶园、河岸步道、Sanctuary Mountain 和 Wairere Falls。',
      '日常好去处',
      ['从公园到步道，找一处适合今天出门的地方。', '主要收录距市中心约 10 公里内的户外地点。', '另外收录 Zealong、Te Awa、Sanctuary Mountain 和 Wairere Falls。', '可用关键词搜索地点名称、区域或简介。'],
    ),
    en: en(
      'Everyday outings · Hamilton Local',
      'Parks, walks and places to spend a little time outside Hamilton, including nearby outdoor spots plus Zealong, Te Awa, Sanctuary Mountain and Wairere Falls.',
      'Everyday outings',
      ['Find a park, a walk or somewhere to spend a little time outside.', 'Most entries are outdoor places within about 10 km of central Hamilton.', 'Zealong, Te Awa, Sanctuary Mountain and Wairere Falls are included as well.', 'Search by name, area or description.'],
    ),
  },
  {
    path: '/living/upick', route: 'living', tab: 'upick', image: 'photos/band-market.webp',
    zh: zh(
      '季节采摘 · Hamilton Local',
      '汉密尔顿附近的季节采摘：按农场查看水果和采摘月份。果季与开放日会随天气、成熟度和余量变化；未核实的月份标为「待确认」，出发前请确认开放。',
      '季节采摘',
      ['按农场列出可采水果与采摘月份。', '未核实的月份标为「待确认」。', '果季和开放日会变化，出发前请向农场确认是否开放。'],
    ),
    en: en(
      'U-Pick farms · Hamilton Local',
      'Seasonal U-pick farms near Hamilton, with fruit and picking months. Seasons change with weather and supply. Unverified months are marked Unconfirmed — confirm the farm is open before visiting.',
      'U-Pick farms',
      ['Each farm lists its fruit and picking months.', 'Unverified months are marked Unconfirmed.', 'Confirm opening days before you go.'],
    ),
  },
  {
    path: '/living/stays', route: 'living', tab: 'stays', image: 'photos/band-market.webp',
    zh: zh(
      '精选住宿 · Hamilton Local',
      '汉密尔顿精选住宿：按区域找落脚点。房型、价格与空房不在本页报价，请打开住宿页面自行查看。',
      '精选住宿',
      ['按区域浏览指南中的住宿。', '房型、价格与空房请查看各住宿页面。', '本页不代替预订网站。'],
    ),
    en: en(
      'Stays · Hamilton Local',
      'A short list of places to stay in Hamilton, grouped by area. Rooms, prices and availability are on each property page, not quoted here.',
      'Stays',
      ['Browse stays by area.', 'Check the property page for rooms, prices and availability.', 'This guide does not take bookings.'],
    ),
  },
  {
    path: '/weekend', route: 'weekend', tab: 'picks', sectionDefault: true, image: 'photos/band-weekend-nightglow.webp',
    zh: zh(
      '本周活动精选 · Hamilton Local',
      '汉密尔顿与怀卡托本周活动精选，时间窗口为 2026年11月10日至16日。可按汉密尔顿、剑桥、拉格伦和其他怀卡托地区查看，条目附来源。出发前请核对时间与费用。',
      '本周精选',
      ['本周窗口：11月10日–16日（10–16 November 2026）。', '可按汉密尔顿、剑桥、拉格伦和其他怀卡托地区筛选。', '每条活动附来源。时间或费用标为待确认的，出发前请再核对。'],
    ),
    en: en(
      'This week in Hamilton · Hamilton Local',
      'What\'s on in Hamilton and the Waikato for 10–16 November 2026. Filter by Hamilton, Cambridge, Raglan or elsewhere in the Waikato. Each entry links to its source.',
      'This week',
      ['The week shown is 10–16 November 2026.', 'Filter by Hamilton, Cambridge, Raglan or elsewhere in the Waikato.', 'Open the source on each entry and confirm times and prices before you go.'],
    ),
  },
  {
    path: '/weekend/markets', route: 'weekend', tab: 'markets', image: 'photos/band-weekend-nightglow.webp',
    zh: zh(
      '周末集市 · Hamilton Local',
      '汉密尔顿与怀卡托周末集市，包括汉密尔顿农贸市场、日落市集、花园美食集，以及剑桥、拉格伦和其他地区的市集。若本周无场次或时间待确认，页面会注明。',
      '周末集市',
      ['收录指南中的周末集市，而不是把所有集市都当作本周场次。', '包括汉密尔顿农贸市场、日落市集、花园美食集，以及剑桥、拉格伦和怀卡托其他市集。', '标有「本周无场次」或「时间待确认」的条目，请先看来源再出发。'],
    ),
    en: en(
      'Weekend markets · Hamilton Local',
      'Weekend markets in Hamilton and the Waikato, including Hamilton Farmers\' Market, Sunset Market, Gourmet in the Gardens, and markets in Cambridge, Raglan and elsewhere. Entries say when there is no session this week or the time is unconfirmed.',
      'Weekend markets',
      ['Market listings from this guide, including ones with no session in the current week.', 'Hamilton Farmers\' Market, Sunset Market and Gourmet in the Gardens are among the Hamilton entries.', 'Cambridge, Raglan and other Waikato markets are included. Confirm anything marked unconfirmed.'],
    ),
  },
  {
    path: '/weekend/festivals', route: 'weekend', tab: 'festivals', image: 'photos/band-weekend-nightglow.webp',
    zh: zh(
      '节日活动 · Hamilton Local',
      '汉密尔顿与怀卡托节日活动，按地区浏览并附来源。怀卡托热气球节只保留主办方入口；日期、场地与节目待确认，不列入本周场次。',
      '节日活动',
      ['按汉密尔顿、剑桥、拉格伦和其他怀卡托地区查看节日活动。', '怀卡托热气球节（Balloons over Waikato）只提供主办方链接。', '热气球节的日期、场地与节目待确认，不作为本周场次。'],
    ),
    en: en(
      'Festivals · Hamilton Local',
      'Festivals in Hamilton and the Waikato, with sources. Balloons over Waikato is an organiser link only — dates, venue and programme are unconfirmed and it is not listed as a session this week.',
      'Festivals',
      ['Browse festival entries by town.', 'Balloons over Waikato stays as a link to the organiser.', 'Its dates, venue and programme are unconfirmed, so it is not a listing for this week.'],
    ),
  },
  {
    path: '/kids', route: 'kids', tab: 'map', sectionDefault: true, image: 'photos/band-hamilton-lake.webp',
    zh: zh(
      '游乐场地图 · Hamilton Local',
      '汉密尔顿游乐场地图：查看位置和设施，打开导航，并可按设施筛选后再决定要不要出发。出发前仍建议对照现场。',
      'Playground 地图',
      ['在地图上查看指南收录的游乐场。', '可以按设施筛选，并打开地图导航。', '出发前仍建议对照现场与市政信息。'],
    ),
    en: en(
      'Playground map · Hamilton Local',
      'A map of playgrounds in the Hamilton guide, with facilities and directions. Filter by facility before you head out.',
      'Playground map',
      ['See the playgrounds in this guide on a map.', 'Filter by facility and open directions.', 'Check the site and council information before you go.'],
    ),
  },
  {
    path: '/kids/places', route: 'kids', tab: 'places', image: 'photos/band-hamilton-lake.webp',
    zh: zh(
      '遛娃好去处 · Hamilton Local',
      '汉密尔顿适合带孩子去的地方：选自指南中写明适合儿童或家庭、且距市中心不远的地点，附距离、地址和简介。',
      '遛娃好去处',
      ['选自现有地点资料里写明适合儿童、家庭或幼儿的条目。', '距离按距汉密尔顿市中心估算。', '打开详情可查看来源与简介。'],
    ),
    en: en(
      'Family outings · Hamilton Local',
      'Family outings in Hamilton, chosen from nearby places whose descriptions mention children or families, with distance, address and a short introduction.',
      'Family outings',
      ['Chosen from existing place records that mention kids, children, families or toddlers.', 'Distances are rough estimates from central Hamilton.', 'Open a place for its description and source.'],
    ),
  },
  {
    path: '/kids/parties', route: 'kids', tab: 'parties', image: 'photos/band-hamilton-lake.webp',
    zh: zh(
      '派对与场地 · Hamilton Local',
      '汉密尔顿与怀卡托的派对和场地条目，可按区域和类型查看地址、简介与来源。预订和费用请以场地页面为准。',
      '派对与场地',
      ['收录 Hamilton 与 Waikato 的派对和场地。', '可按区域和类型筛选。', '价格、档期和容纳人数请打开条目中的来源确认。'],
    ),
    en: en(
      'Parties and venues · Hamilton Local',
      'Party and venue entries for Hamilton and the Waikato. Filter by area and type, then check each source for booking, price and availability.',
      'Parties & venues',
      ['Party and venue records for Hamilton and the Waikato.', 'Filter by area and type.', 'Confirm price, availability and capacity with the venue.'],
    ),
  },
  {
    path: '/services', route: 'services', tab: 'home', sectionDefault: true, image: 'photos/band-tools.webp',
    zh: zh(
      '房屋维护 · Hamilton Local',
      '汉密尔顿房屋维护分类：园艺与庭院、房屋维修、清洁整理。这些分类正在整理，目前暂无商家名单。',
      '房屋维护',
      ['园艺与庭院。', '房屋维修。', '清洁整理。', '内容整理中，暂无商家。商家入驻尚未开放。'],
    ),
    en: en(
      'Home maintenance · Hamilton Local',
      'Home-maintenance categories for Hamilton: garden and grounds, home repairs, and cleaning. No businesses are listed yet.',
      'Home maintenance',
      ['Garden and grounds, home repairs, and cleaning.', 'Coming soon — no listings yet.', 'Business listings are not open.'],
    ),
  },
  {
    path: '/services/trades', route: 'services', tab: 'trades', image: 'photos/band-tools.webp',
    zh: zh(
      '专业工种 · Hamilton Local',
      '汉密尔顿专业工种分类：水管服务、电工服务、木工与油漆。分类已列出，商家名单仍在整理，暂无收录。',
      '专业工种',
      ['水管服务。', '电工服务。', '木工与油漆。', '内容整理中，暂无商家。'],
    ),
    en: en(
      'Skilled trades · Hamilton Local',
      'Trade categories for Hamilton: plumbing, electrical, and carpentry and painting. The categories are here; there are no business listings yet.',
      'Skilled trades',
      ['Plumbing, electrical, and carpentry and painting.', 'Coming soon — no listings yet.'],
    ),
  },
  {
    path: '/services/daily', route: 'services', tab: 'daily', image: 'photos/band-tools.webp',
    zh: zh(
      '生活便民 · Hamilton Local',
      '汉密尔顿生活便民分类：搬家运输、生活协助、社区服务。分类已经列出，目前还没有商家名单。',
      '生活便民',
      ['搬家运输。', '生活协助。', '社区服务。', '内容整理中，暂无商家。'],
    ),
    en: en(
      'Everyday services · Hamilton Local',
      'Everyday-service categories for Hamilton: moving, everyday help, and community services. No businesses are listed yet.',
      'Everyday services',
      ['Moving, everyday help, and community services.', 'Coming soon — no listings yet.'],
    ),
  },
  {
    path: '/services/pets', route: 'services', tab: 'pets', image: 'photos/band-tools.webp',
    zh: zh(
      '宠物指南 · Hamilton Local',
      '汉密尔顿宠物指南目前只列出六个分类：宠物用品、寄养与猫舍、洗护美容、兽医与夜间急诊、遛狗与放绳区、狗狗日托。商家招募中，暂无商家名称、地址或电话。页面有「商家入驻 / 广告合作」按钮。',
      '宠物指南',
      ['六个分类：宠物用品、寄养与猫舍、洗护美容。', '兽医与夜间急诊、遛狗与放绳区、狗狗日托。', '每张卡片都写着「商家招募中」，不列出商家。', '每张卡片有「商家入驻 / 广告合作」按钮。'],
    ),
    en: en(
      'Pet guide · Hamilton Local',
      'The Hamilton pet guide lists six categories only: pet shops, boarding and catteries, grooming, vets and after-hours care, dog parks and off-leash areas, and doggy daycare. No business names, addresses or phone numbers are published. Each card has a listing and advertising enquiry button.',
      'Pet guide',
      ['Six category cards, and no merchant listings.', 'Pet shops, boarding and catteries, and grooming.', 'Vets and after-hours care, dog exercise areas, and doggy daycare.', 'Each card says listings are coming soon and offers a button for a listing or advertising enquiry.'],
    ),
  },
  {
    path: '/tools/bins', route: 'tools', tab: 'bins', sectionDefault: true, image: 'photos/band-tools.webp',
    zh: zh(
      '垃圾清运 · Hamilton Local',
      '汉密尔顿市政垃圾与回收：红盖桶与黄盖桶隔周交替，玻璃箱与黄桶同一周，绿色厨余桶每周收取。你家的收运日和本周是红周还是黄周，请到 HCC 官网按地址查询。',
      '垃圾与回收怎么放',
      ['红盖桶是一般垃圾，隔周收取，和黄周交替。', '黄盖桶是可回收物：塑料 1/2/5、罐头、纸和纸板，洗净后直接放入。', '玻璃箱与黄桶同一周收取，瓶盖要拿掉。绿色厨余桶每周都收，锁好盖子。', '收运日早上 7 点前放到路边；最早前一天下午 5 点后再放。具体哪一天、这周是红周还是黄周，以 HCC 按地址查询为准。'],
    ),
    en: en(
      'Bin days · Hamilton Local',
      'Hamilton City Council bins: red-lid rubbish and yellow-lid recycling alternate fortnightly, the glass crate goes out with the yellow bin, and the green food-scraps bin is weekly. Look up your street on the HCC website.',
      'How the bins work',
      ['Red-lid rubbish is fortnightly, alternating with yellow week.', 'Yellow-lid recycling takes rinsed plastics 1, 2 and 5, tins, cans, paper and card, put in loose.', 'The glass crate is collected with the yellow bin, lids off. Food scraps are collected every week.', 'Put bins out by 7am on collection day, and not before 5pm the evening before. Your day and colour week come from the HCC address lookup.'],
    ),
  },
  {
    path: '/tools/urgent', route: 'tools', tab: 'urgent', image: 'photos/band-urgent.webp',
    zh: zh(
      '急诊信息 · Hamilton Local',
      '汉密尔顿急诊信息：有生命危险请拨打 111。Healthline 0800 611 116 全天开放，可要求翻译。诊所包括 24 小时的 Anglesea Clinic 与 Tui Medical Te Rapa，以及每日 8:00–20:00 的 Victoria Clinic 与 Tui Medical Rototuna。本站不提供医疗建议。',
      '急诊信息',
      ['紧急情况请立即拨打 111。本站不提供医疗建议。', 'Healthline：0800 611 116，全天，可要求翻译。', 'Anglesea Clinic Urgent Care（Thackeray Street）与 Tui Medical Te Rapa（Bryant Road）的急诊为每天 24 小时。', 'Victoria Clinic（Anglesea Street）急诊为每天 8:00–20:00，圣诞节除外。Tui Medical Rototuna 为每天 8:00–20:00，关门后去 Te Rapa。营业安排可能变化，出发前请致电确认。'],
    ),
    en: en(
      'Urgent care · Hamilton Local',
      'Urgent care in Hamilton. Call 111 in an emergency. Healthline is 0800 611 116, 24/7, with interpreters. Anglesea Clinic and Tui Medical Te Rapa list 24-hour urgent care; Victoria Clinic and Tui Medical Rototuna list 8am–8pm daily. This site does not give medical advice.',
      'Urgent care',
      ['In an emergency, call 111. This page is not medical advice.', 'Healthline: 0800 611 116, 24/7, interpreters available.', 'Anglesea Clinic Urgent Care and Tui Medical Te Rapa list urgent care 24 hours, 7 days.', 'Victoria Clinic lists 8am–8pm daily except Christmas Day. Tui Medical Rototuna lists 8am–8pm daily, then Tui Medical Te Rapa. Call before you go — hours change.'],
    ),
  },
  {
    path: '/tools/pay', route: 'tools', tab: 'pay', image: 'photos/band-tools.webp',
    zh: zh(
      '税后收入计算器 · Hamilton Local',
      '新西兰税后收入估算：输入税前时薪和每周工时，按税码 M 或 M SL 估算 PAYE、KiwiSaver 和学生贷款后的到手收入。成人最低工资 $23.95/小时，自 2026年4月1日起。仅供估算，不代替工资单或 IRD。',
      '最低工资与税后收入计算器',
      ['适用于固定周薪的主要工作，税码 M；勾选学生贷款后为 M SL。', '成人最低工资 $23.95/小时，自 2026-04-01 起。起薪与培训最低工资另有条件。', '税年按 2026-04-01 至 2027-03-31 的分段估算。ACC 个人征费含在 PAYE 中。', '仅供估算，未计 ME 税收抵免、奖金、副业和其他扣款。'],
    ),
    en: en(
      'Take-home pay calculator · Hamilton Local',
      'Estimate New Zealand take-home pay from an hourly rate and weekly hours, tax code M or M SL, including PAYE, KiwiSaver and student loan. Adult minimum wage $23.95 an hour from 1 April 2026. An estimate only — not a payslip or IRD calculation.',
      'Pay calculator',
      ['For a main job with steady weekly pay, tax code M, or M SL if student loan is included.', 'Adult minimum wage is $23.95 an hour from 1 April 2026. Starting-out and training rates differ.', 'Tax bands used are for 1 April 2026 to 31 March 2027. The ACC earners\' levy is inside PAYE.', 'Estimate only. It excludes the IETC, bonuses, secondary jobs and other deductions.'],
    ),
  },
  {
    path: '/tools/checklist', route: 'tools', tab: 'checklist', image: 'photos/band-tools.webp',
    zh: zh(
      '新移民办事清单 · Hamilton Local',
      '刚到新西兰可参考的办事清单：申请 IRD 税号、开银行账户、转换海外驾照、登记家庭医生、申请社区服务卡。步骤、材料和费用以所引官方页面为准；页面未写明的费用会标为待确认。',
      '新移民办事清单',
      ['申请税号（IRD number）。', '开银行账户（文中以 ANZ 新移民通道为例）。', '转换海外驾照；中国大陆驾照走 NZTA 非豁免流程。', '登记家庭医生，并了解社区服务卡（Community Services Card）的申请条件。', '未在所引页面写明的费用和时长，清单里标为待确认。'],
    ),
    en: en(
      'New arrival checklist · Hamilton Local',
      'A first-weeks checklist for people new to New Zealand: IRD number, a bank account, converting an overseas licence, enrolling with a GP, and the Community Services Card. Fees that the cited pages do not state are marked unconfirmed.',
      'New arrival checklist',
      ['Apply for an IRD number.', 'Open a bank account. The notes use ANZ\'s new-migrant path as one example.', 'Convert an overseas driver licence. Mainland China follows the NZTA non-exempt process.', 'Enrol with a GP, and check Community Services Card criteria.', 'Costs and times the official pages do not state are marked unconfirmed.'],
    ),
  },
  {
    path: '/tools/gst', route: 'tools', tab: 'gst', image: 'photos/band-tools.webp',
    zh: zh(
      'GST计算 · Hamilton Local',
      '新西兰 GST 15% 计算器：含税价与不含税价双向换算，并单独显示 GST 金额。同一页也可以换算温度、重量和面积。加 GST 为不含税价 × 1.15，去 GST 为含税价 ÷ 1.15。',
      '消费税计算器',
      ['标准 GST 税率为 15%。', '含税价换算不含税价：除以 1.15。不含税价加 GST：乘以 1.15。', '含税价中的 GST 等于含税价 × 3/23。', '本页同时提供温度、市斤与面积换算。特殊或免税交易请另查。'],
    ),
    en: en(
      'GST calculator · Hamilton Local',
      'New Zealand GST at 15%: add or remove GST and see the tax amount. This page also converts temperature, weight and area. Add GST by multiplying by 1.15; remove it by dividing by 1.15.',
      'GST 15% calculator',
      ['Standard GST is 15%.', 'Remove GST by dividing by 1.15. Add GST by multiplying by 1.15.', 'GST inside a tax-inclusive price is that price times 3/23.', 'Temperature, jin and area conversions are on this page too. Zero-rated or exempt supplies need their own rules.'],
    ),
  },
  {
    path: '/tools/units', route: 'tools', tab: 'units', image: 'photos/band-tools.webp',
    zh: zh(
      '单位换算 · Hamilton Local',
      '日常单位换算：摄氏与华氏、公斤、市斤和磅，以及平方米与平方英尺。市斤按中国大陆常用的 1 斤 = 0.5 公斤。1 磅 = 0.45359237 公斤。',
      '单位换算',
      ['温度：°F = °C × 1.8 + 32。', '重量：公斤、市斤、磅。市斤按 1 斤 = 0.5 kg。1 lb = 0.45359237 kg。', '面积：平方米与平方英尺。1 ft² = 0.09290304 m²。', '重量和面积不能为负数。'],
    ),
    en: en(
      'Unit converter · Hamilton Local',
      'Convert Celsius and Fahrenheit, kilograms, jin and pounds, and square metres and square feet. Jin uses the mainland China convention of 0.5 kg. One pound is 0.45359237 kg.',
      'Unit converter',
      ['°F = °C × 1.8 + 32.', 'Weight: kilograms, jin and pounds. One jin is 0.5 kg. One pound is 0.45359237 kg.', 'Area: square metres and square feet. 1 ft² = 0.09290304 m².', 'Weight and area cannot be negative.'],
    ),
  },
  {
    path: '/tools/seasonal', route: 'tools', tab: 'seasonal', image: 'photos/band-tools.webp',
    zh: zh(
      '季节提醒 · Hamilton Local',
      '怀卡托季节提醒：淡水鳗鱼每人每天最多 6 条（长鳍与短鳍合计）；贝类须先确认海区、关闭区和生物毒素警报。花粉季的起止月份在所引 Health NZ 页面上待确认。流感疫苗每年 4 月 1 日起提供。身体不适可打 Healthline 0800 611 116。',
      '季节提醒',
      ['怀卡托河淡水鳗鱼：每人每天最多 6 条，长鳍与短鳍合计。受保护水域可能禁止捕捞。', '贝类限额和 Auckland–Coromandel 潮间带限制不同；Coromandel 扇贝渔场 SCA CS 关闭。出发前用 NZ Fishing Rules 和 MPI 警报核对。', '所引 Health NZ 页面没有给出全国统一的花粉季月份，请从其花粉预报查看当地情况。', '流感在冬季最常见。疫苗每年 4 月 1 日起提供，免费资格以 Health NZ 当年说明为准。Healthline：0800 611 116。'],
    ),
    en: en(
      'Seasonal reminders · Hamilton Local',
      'Seasonal notes for the Waikato: a daily bag of 6 freshwater eels, shellfish limits that depend on area and closures, pollen forecasts via Health NZ, and the annual flu vaccine from 1 April. Healthline is 0800 611 116.',
      'Seasonal reminders',
      ['Waikato River freshwater eels: 6 per person per day, longfin and shortfin combined. Some waters are closed.', 'Shellfish limits are not the same as the Auckland–Coromandel intertidal closure. Coromandel scallop fishery SCA CS is closed. Check MPI and the NZ Fishing Rules app.', 'The cited Health NZ page does not give one national pollen calendar.', 'Flu vaccine is offered from 1 April each year. Free eligibility is whatever Health NZ publishes for that season. Healthline: 0800 611 116.'],
    ),
  },
  {
    path: '/tools/other', route: 'tools', tab: 'other', image: 'photos/band-tools.webp',
    zh: zh(
      '其他 · Hamilton Local',
      '实用工具箱的「其他」页：Busit 市区公交、MetService 天气与 NIWA 紫外线、学期和公共假期、学区查询、停水停电与道路施工、govt.nz 与市政网站、油价和电动车充电。链接指向已核对的外部网站。',
      '更多日常入口',
      ['市区公交（Busit）在本页：Orbiter 环城（顺时针和逆时针），Comet 南北（The Base 与医院方向，C1 Mahoe / C2 Glenview），Meteor 东西（Rotokauri、市中心与 Silverdale），以及列出的其他市区路线名称。时刻表、票价和临时变更请查 Busit，客服电话 0800 205 305。', '天气与 UV、教育部学期与公共假期、Education Counts 学区查询。', 'WEL 停电、市政道路施工和供水，以及 govt.nz、汉密尔顿市政网站。', '油价（Gaspy）和充电桩（ChargeNet、PlugShare）。具体信息以这些官网为准。'],
    ),
    en: en(
      'Other · Hamilton Local',
      'The toolbox Other page: Busit city buses, MetService weather and NIWA UV, school terms and public holidays, the school finder, outages and roadworks, govt.nz and the council, plus fuel prices and EV charging.',
      'More everyday essentials',
      ['City buses are on this page: Orbiter around the city, Comet north–south (The Base and the hospital, C1 Mahoe / C2 Glenview), Meteor west–east (Rotokauri, the CBD and Silverdale), plus the other city route names. Timetables, fares and disruptions are on Busit, 0800 205 305.', 'Weather and UV, school terms, public holidays, and Education Counts.', 'Power and water outages, road works, govt.nz and Hamilton City Council.', 'Gaspy for fuel prices, ChargeNet and PlugShare for EV charging. Use those sites for live details.'],
    ),
  },
];

export const NOT_FOUND = {
  zh: zh(
    '页面未找到 · Hamilton Local',
    '这个地址不在 Hamilton Local 的目录里。可以从首页、亚超、周末活动或实用工具箱继续看。',
    '这一页还没有收录',
    ['地址可能已更换，或链接里多了一段路径。', '旧的 #/ 链接会自动打开对应的新页面。'],
  ),
  en: en(
    'Page not found · Hamilton Local',
    'That address is not in the Hamilton Local guide. Try the home page, grocers, what\'s on, or the toolbox.',
    'This page is not in the guide',
    ['The address may have changed, or the link has an extra segment.', 'Older #/ links still open the matching page.'],
  ),
};

const KEEP_PARAMS = ['q', 'cards', 'hero'];

export function slash(path) {
  if (!path || path === '/') return '/';
  return path.endsWith('/') ? path : path + '/';
}

export function normalizePath(pathname) {
  let path = pathname || '/';
  try { path = decodeURIComponent(path); } catch { /* keep raw */ }
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path || '/';
}

export function pageFor(route, tab = '') {
  if (!route || route === 'home') return PAGES.find(page => page.route === 'home') || null;
  if (route === 'tools' && tab === 'transport') tab = 'other';
  if (tab) {
    const exact = PAGES.find(page => page.route === route && page.tab === tab);
    if (exact) return exact;
  }
  return PAGES.find(page => page.route === route && page.sectionDefault) || null;
}

export function pageHref(route, tab = '', q = '', at = '') {
  if (route === 'tools' && tab === 'transport') {
    tab = 'other';
    if (!at) at = 'tool-transport';
  }
  const page = pageFor(route, tab || '') || PAGES[0];
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const search = params.size ? '?' + params.toString() : '';
  const hash = at ? '#' + at : '';
  return slash(page.path) + search + hash;
}

export function matchPath(pathname) {
  const path = normalizePath(pathname);
  return PAGES.find(page => page.path === path) || null;
}

export function canonicalUrl(page) {
  return SITE_ORIGIN + slash(page ? page.path : '/');
}

function legacyData() {
  return {
    pages: PAGES.map(page => ({ path: page.path, route: page.route, tab: page.tab, sectionDefault: !!page.sectionDefault })),
    toolAnchors: TOOL_ANCHORS,
    petIds: PET_IDS,
    keep: KEEP_PARAMS,
    sections: ['living', 'weekend', 'kids', 'services', 'tools'],
  };
}

/** Pure mapper so the static boot script and Node tests share one function. */
export function resolveLegacyHash(hash, data) {
  if (!hash || hash === '#') return null;
  const body = hash.charAt(0) === '#' ? hash.slice(1) : hash;
  if (!body) return null;
  const splitAt = body.indexOf('?');
  const head = splitAt < 0 ? body : body.slice(0, splitAt);
  const params = new URLSearchParams(splitAt < 0 ? '' : body.slice(splitAt + 1));
  if (!head.startsWith('/') && head.indexOf('?') === -1 && !data.petIds.includes(head) && !Object.prototype.hasOwnProperty.call(data.toolAnchors, head)) return null;

  let route = 'home';
  let tab = '';
  let at = params.get('at') || '';
  if (!head.startsWith('/')) {
    if (data.petIds.includes(head)) {
      route = 'services';
      tab = 'pets';
      if (!at) at = head;
    } else {
      route = 'tools';
      tab = data.toolAnchors[head];
      if (!at) at = head;
    }
  } else {
    const section = head.split('/').filter(Boolean)[0] || '';
    const name = section === 'whatson' ? 'weekend' : section;
    if (name && name !== 'home' && data.sections.indexOf(name) < 0) return '/';
    route = name || 'home';
    tab = params.get('tab') || '';
    const petAt = data.petIds.includes(at);
    if (route === 'living' && (tab === 'pets' || petAt)) {
      route = 'services';
      tab = 'pets';
    }
    if (route === 'living' && at === 'upick' && (tab === 'places' || !tab)) tab = 'upick';
    if (route === 'tools' && tab === 'transport' && !at) at = 'tool-transport';
    if (route === 'tools' && Object.prototype.hasOwnProperty.call(data.toolAnchors, at)) tab = data.toolAnchors[at];
    if (route === 'tools' && tab === 'transport') tab = 'other';
  }

  const exact = data.pages.find(page => page.route === route && page.tab === tab);
  const fallback = data.pages.find(page => page.route === route && page.sectionDefault);
  const page = exact || fallback || data.pages.find(item => item.route === 'home');
  if (!page) return '/';
  const out = new URLSearchParams();
  data.keep.forEach(key => {
    const value = params.get(key);
    if (value) out.set(key, value);
  });
  const search = out.size ? '?' + out.toString() : '';
  const anchor = at && /^[A-Za-z0-9_-]+$/.test(at) ? '#' + at : '';
  const path = page.path === '/' ? '/' : page.path + '/';
  return path + search + anchor;
}

export function legacyHashPath(hash) {
  return resolveLegacyHash(hash, legacyData());
}

export function readLocation(loc) {
  const page = matchPath(loc.pathname || '/');
  const params = new URLSearchParams(loc.search || '');
  const rawHash = (loc.hash || '').replace(/^#/, '');
  const hashId = rawHash && !rawHash.startsWith('/') && rawHash.indexOf('?') < 0 ? rawHash : '';
  const atParam = params.get('at') || '';
  const at = /^[\w-]+$/.test(hashId) ? hashId : AT_IDS.has(atParam) ? atParam : '';
  return { route: page ? page.route : 'missing', tab: page ? page.tab : '', q: params.get('q') || '', at, page };
}

/** Older #/tools?tab= form, still used by tests and any leftover hash normaliser. */
export function canonicalHash(hash) {
  const bare = hash.slice(1);
  const petAnchors = new Set(PET_IDS);
  if (petAnchors.has(bare)) return '#/services?tab=pets&at=' + bare;
  if (Object.prototype.hasOwnProperty.call(TOOL_ANCHORS, bare)) return '#/tools?tab=' + TOOL_ANCHORS[bare] + '&at=' + bare;
  if (!hash.startsWith('#/')) return '#/';
  const [path, query] = hash.slice(2).split('?');
  const params = new URLSearchParams(query || '');
  if (path === 'tools') {
    if (params.get('tab') === 'transport') {
      params.set('tab', 'other');
      if (!params.has('at')) params.set('at', 'tool-transport');
    }
    const at = params.get('at') || '';
    if (Object.prototype.hasOwnProperty.call(TOOL_ANCHORS, at)) params.set('tab', TOOL_ANCHORS[at]);
    return '#/tools' + (params.size ? '?' + params : '');
  }
  if (path === 'living' && (params.get('tab') === 'pets' || petAnchors.has(params.get('at') || ''))) {
    params.set('tab', 'pets');
    return '#/services?' + params;
  }
  return hash;
}

function urlsMatch(next, current) {
  const origin = 'https://hamiltonlocal.nz';
  const target = new URL(next, origin);
  const here = new URL(current, origin);
  if (normalizePath(target.pathname) !== normalizePath(here.pathname)) return false;
  if (target.hash !== here.hash) return false;
  const keys = new Set([...target.searchParams.keys(), ...here.searchParams.keys()]);
  for (const key of keys) if (target.searchParams.get(key) !== here.searchParams.get(key)) return false;
  return true;
}

export function legacyBootScript(fallback) {
  const data = JSON.stringify(legacyData());
  const fallbackJson = JSON.stringify(fallback || '');
  return `<script>(function(){var D=${data};var fallback=${fallbackJson};var resolve=${resolveLegacyHash.toString()};function norm(p){try{p=decodeURIComponent(p||'/')}catch(e){}if(p.length>1&&p.charAt(p.length-1)==='/')p=p.slice(0,-1);return p||'/'}function same(next){var t=new URL(next,location.origin),h=new URL(location.href);if(norm(t.pathname)!==norm(h.pathname)||t.hash!==h.hash)return false;var keys={};t.searchParams.forEach(function(v,k){keys[k]=1});h.searchParams.forEach(function(v,k){keys[k]=1});for(var k in keys)if(t.searchParams.get(k)!==h.searchParams.get(k))return false;return true}var next=resolve(location.hash,D);if(next&&!same(next)){location.replace(next);return}if(fallback){var cut=fallback.indexOf('#');var base=cut<0?fallback:fallback.slice(0,cut);var anchor=cut<0?'':fallback.slice(cut);if(norm(location.pathname)!==norm(base))location.replace(base+location.search+anchor)}})();</script>`;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function metaBlock({ title, description, url, image, fallback, noindex = false, home = false }) {
  const imageUrl = SITE_ORIGIN + '/' + String(image).replace(/^\//, '');
  const shareAlt = '汉密尔顿生活指南 · Hamilton Local — 怀卡托河畔';
  const homeTags = home ? `
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="${esc(shareAlt)}">
<meta name="twitter:image:alt" content="${esc(shareAlt)}">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebSite","name":"Hamilton Local","alternateName":"汉密尔顿生活指南","url":"${SITE_ORIGIN}/","inLanguage":["zh-Hans","en-NZ"]}
</script>
<link rel="preload" as="image" href="./photos/hero-train.webp">` : '';
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Hamilton Local">
<meta property="og:locale" content="zh_CN">
<meta property="og:locale:alternate" content="en_NZ">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(imageUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(imageUrl)}">${homeTags}
<link rel="icon" type="image/svg+xml" href="./favicon.svg">
<link rel="stylesheet" href="./app.css">
${legacyBootScript(fallback)}`;
}

function article(copy, links) {
  const items = copy.zh.points.map(point => `<li>${esc(point)}</li>`).join('');
  const nav = links.map(link => `<a href="${esc(slash(link.path))}">${esc(link.zh.heading)}</a>`).join('');
  return `<article class="seo-prerender"><p class="seo-kicker">Hamilton Local</p><h1>${esc(copy.zh.heading)}</h1><p>${esc(copy.zh.description)}</p><ul>${items}</ul><p class="seo-en" lang="en-NZ">${esc(copy.en.description)}</p><nav class="seo-nav" aria-label="Hamilton Local">${nav}</nav></article>`;
}

const shellLinks = () => PAGES.filter(page => page.sectionDefault);

export function renderDocument(page) {
  const copy = page;
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<base href="/">
${metaBlock({ title: page.zh.title, description: page.zh.description, url: canonicalUrl(page), image: page.image, home: page.route === 'home' })}
</head><body><div id="root">${article(copy, shellLinks())}</div><script src="./app.js"></script></body></html>
`;
}

export function renderNotFound() {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<base href="/">
${metaBlock({ title: NOT_FOUND.zh.title, description: NOT_FOUND.zh.description, url: SITE_ORIGIN + '/', image: 'photos/hero-train.webp', noindex: true })}
</head><body><div id="root">${article(NOT_FOUND, shellLinks())}</div><script src="./app.js"></script></body></html>
`;
}

export function renderAlias(target) {
  const url = new URL(target, SITE_ORIGIN);
  const page = matchPath(url.pathname) || PAGES[0];
  const dest = slash(page.path) + url.search + url.hash;
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<link rel="canonical" href="${esc(canonicalUrl(page))}">
<meta http-equiv="refresh" content="0; url=${esc(dest)}">
<title>${esc(page.zh.title)}</title>
${legacyBootScript(dest)}
</head><body><p><a href="${esc(dest)}">${esc(page.zh.heading)}</a></p></body></html>
`;
}

export const ALIASES = [
  ['living', '/supermarkets'],
  ['living/grocers', '/supermarkets'],
  ['tools', '/tools/bins'],
  ['tools/transport', '/tools/other/#tool-transport'],
  ['whatson', '/weekend'],
  ['weekend/picks', '/weekend'],
  ['kids/map', '/kids'],
  ['services/home', '/services'],
];

export function renderSitemap() {
  const urls = PAGES.map(page => `  <url><loc>${esc(canonicalUrl(page))}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

export function applyDocumentMeta(page, lang) {
  const copy = page ? page[lang === 'en' ? 'en' : 'zh'] : NOT_FOUND[lang === 'en' ? 'en' : 'zh'];
  const url = page ? canonicalUrl(page) : SITE_ORIGIN + (typeof location === 'undefined' ? '/' : location.pathname);
  document.title = copy.title;
  document.documentElement.lang = lang === 'en' ? 'en-NZ' : 'zh-CN';
  const set = (selector, attr, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  set('meta[name="description"]', 'content', copy.description);
  set('meta[property="og:title"]', 'content', copy.title);
  set('meta[property="og:description"]', 'content', copy.description);
  set('meta[property="og:url"]', 'content', url);
  set('meta[name="twitter:title"]', 'content', copy.title);
  set('meta[name="twitter:description"]', 'content', copy.description);
  if (page) set('link[rel="canonical"]', 'href', url);
}
