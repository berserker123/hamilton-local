import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Trash2, Phone, MapPin, Clock, Calendar, ShieldCheck,
  Stethoscope, Copy, ChevronRight, X, Sparkles, AlertCircle,
  Sun, Cloud, CloudRain, CloudSun, CloudFog, CloudLightning, Snowflake, Droplets, ExternalLink, Globe, Umbrella, Bus, ArrowDown, ArrowUpRight
} from 'lucide-react';
import PLACES from './places.json';
import { LogoMark } from './Logo';

type Lang = 'zh' | 'en';
const CHECKED = '2026-11-03';
const HCC_LOOKUP = 'https://hamilton.govt.nz/fight-the-landfill/kerbside-collection';
const HCC_FAQ = 'https://hamilton.govt.nz/fight-the-landfill/help/faq';

// --- Asian supermarkets: only entries verified from public listings (checked 2026-11-03) ---
const SUPERMARKETS = [
  {
    id: 'newsave-tristram',
    name: 'New Save Asian Fresh Supermarket', zhName: '新时代亚超（New Save）',
    type: 'cn', suburb: 'Hamilton Central',
    address: '130 Tristram Street, Hamilton Central, Hamilton 3204',
    hours: { zh: '每天 8:30–19:00', en: 'Daily 8:30am–7pm' },
    phone: '07 834 9989',
    tags: { zh: ['市中心', '综合亚洲食品'], en: ['City centre', 'General Asian groceries'] },
    sources: ['https://www.yellow.co.nz/hamilton/bpp/new-save-asian-fresh-supermarket-579494705', 'https://maps.apple.com/place?place-id=IF844D396626F50B1'],
  },
  {
    id: 'newsave-clyde',
    name: 'New Save Asian Fresh Supermarket (Clyde St)', zhName: 'New Save 亚超（Clyde St 店）',
    type: 'cn', suburb: 'Hamilton East / Chartwell',
    address: '247 Clyde Street, Hamilton 3216',
    hours: null,
    phone: '07 960 7389',
    tags: { zh: ['东区', '综合亚洲食品'], en: ['East side', 'General Asian groceries'] },
    sources: ['https://yellow.co.nz/hamilton/bpp/new-save-asian-fresh-supermarket-579500713', 'https://www.zenbu.co.nz/entry/1096906-new-save-asian-supermarket-chartwell'],
  },
  {
    id: 'wellmart',
    name: 'Wellmart Asian Supermarket', zhName: 'Wellmart 亚超',
    type: 'cn', suburb: 'Frankton / Hamilton Central',
    address: '25/27A/27C Vialou Street, Hamilton 3204',
    hours: { zh: '每天 8:30–19:00（目录信息）', en: 'Daily 8:30am–7pm (directory listing)' },
    phone: '07 839 9058',
    tags: { zh: ['生鲜', '冷冻', '调料'], en: ['Fresh produce', 'Frozen', 'Sauces'] },
    sources: ['https://nz.oceaniabiz.com/waikato/wellmart-asian-supermarket-240616'],
  },
  {
    id: 'ings',
    name: 'Ings Trading', zhName: 'Ings Trading（亚洲食品零售/批发）',
    type: 'cn', suburb: 'Frankton',
    address: '4 Keddell Street, Frankton, Hamilton 3204',
    hours: null,
    phone: '07 848 1668',
    tags: { zh: ['批发价', '餐饮食材', '厨具'], en: ['Wholesale prices', 'Restaurant supplies', 'Kitchenware'] },
    sources: ['https://www.yellow.co.nz/hamilton/bpp/ings-trading-ltd-579436100'],
  },
  {
    id: 'garden-fresh', name: 'Garden Fresh Rototuna', zhName: 'Garden Fresh 亚洲果蔬（Rototuna）', type: 'cn', suburb: 'Rototuna',
    address: '16 Horsham Downs Road, Rototuna, Hamilton 3210',
    hours: { zh: '每天 8:30–19:00（目录信息）', en: 'Daily 8:30am–7pm (directory listing)' }, phone: '07 855 6188',
    tags: { zh: ['蔬菜水果', '中式调料'], en: ['Fruit & veg', 'Chinese pantry'] },
    sources: ['https://2pos.co.nz/1402/11850', 'https://nz.directmap.info/hamilton/5925'],
  },
  {
    id: 'manbok', name: 'Manbok Mart', zhName: 'Manbok Mart 万福韩国超市', type: 'kr', suburb: 'Hamilton East',
    address: '509 Grey Street, Hamilton East, Hamilton 3216',
    hours: { zh: '周一至六 8:30–19:00（目录信息）', en: 'Mon–Sat 8:30am–7pm (directory listing)' }, phone: '07 839 1971',
    tags: { zh: ['韩国食品', '日本食品', '肉类'], en: ['Korean food', 'Japanese food', 'Meat'] },
    sources: ['https://www.yellowpages.net/phone-64-78391971-asian-grocery-store-Hamilton-NZ26105.html', 'https://nz.near-place.com/manbok-mart-509-grey-street-hamilton-east-hamilton'],
  },
  {
    id: 'indian-supermarket', name: 'Indian Supermarket', zhName: 'Indian Supermarket 印度超市', type: 'in', suburb: 'Frankton',
    address: '89 Greenwood Street, Frankton, Hamilton 3204',
    hours: { zh: '每天 10:00–20:00', en: 'Daily 10am–8pm' }, phone: '027 271 4040',
    tags: { zh: ['印度香料', '米面豆类'], en: ['Indian spices', 'Rice, flour & lentils'] },
    sources: ['https://indiansupermarket.co.nz/contact-us/'],
  },
  {
    id: 'super-save', name: 'Super Save Hamilton', zhName: 'Super Save 印度超市', type: 'in', suburb: 'Frankton',
    address: '1/254 Kahikatea Drive, Frankton, Hamilton 3204',
    hours: { zh: '每天 8:00–20:00（目录信息）', en: 'Daily 8am–8pm (directory listing)' }, phone: '07 846 0688',
    tags: { zh: ['印度食品', '冷冻', '散装'], en: ['Indian groceries', 'Frozen', 'Bulk'] },
    sources: ['https://supersavehamilton.co.nz/indian-grocery-store-in-hamilton/', 'https://www.chamberofcommerce.co.nz/business-directory/waikato/frankton-junction/indian-grocery-store/143047-super-save-hamilton'],
  },
  {
    id: 'pino-plus', name: 'Pino Plus – The Filipino Store', zhName: 'Pino Plus 菲律宾食品店', type: 'sea', suburb: 'Frankton',
    address: '241 Kahikatea Drive, Hamilton 3204',
    hours: null, phone: '07 846 2566',
    tags: { zh: ['菲律宾食品'], en: ['Filipino groceries'] },
    sources: ['https://2pos.co.nz/1402/11882'],
  },
];
const SM_TYPES = [
  { id: 'all', zh: '全部', en: 'All' }, { id: 'cn', zh: '中式/综合', en: 'Chinese / general' }, { id: 'kr', zh: '韩国', en: 'Korean' },
  { id: 'in', zh: '印度', en: 'Indian' }, { id: 'sea', zh: '东南亚', en: 'Southeast Asian' },
];

const URGENT = [
  { id: 'anglesea', name: 'Anglesea Clinic Urgent Care', zh: 'Anglesea 急症诊所', address: 'Gate 1, 3 Thackeray Street, Hamilton Central', phone: '07 858 0800',
    open: [0, 24], hours: { zh: '24 小时 · 每天', en: '24 hours, 7 days' }, note: { zh: '无需预约，按病情紧急程度看诊，需现场付费。', en: 'Walk in, seen by urgency; payment upfront.' },
    sources: ['https://www.angleseaclinic.org.nz/contact/', 'https://www.healthnz.govt.nz/hospitals-services/hospitals/waikato/waikato-hospital'] },
  { id: 'terapa', name: 'Tui Medical Te Rapa', zh: 'Tui Medical Te Rapa 急症', address: '26 Bryant Road, Te Rapa, Hamilton 3200', phone: '07 849 4181',
    open: [0, 24], hours: { zh: '急症 24 小时 · 每天（GP 周一至五 8:00–17:00）', en: 'Urgent care 24/7 (GP Mon–Fri 8am–5pm)' }, note: { zh: '按病情紧急程度看诊；收费标准见官网（按年龄、是否注册、社区服务卡而定）。', en: 'Seen by urgency; fees on the website (vary by age, enrolment and Community Services Card).' },
    sources: ['https://www.tuimedical.co.nz/te-rapa', 'https://www.healthpoint.co.nz/gps-accident-urgent-medical-care/accident-urgent-medical-care-ae/tui-medical-te-rapa-urgent-care-and-medical/'] },
  { id: 'victoria', name: 'Victoria Clinic', zh: 'Victoria Clinic 急症', address: '173 Anglesea Street, Hamilton Central 3204', phone: '07 834 0333',
    open: [8, 20], hours: { zh: '急症 每天 8:00–20:00（圣诞节除外）', en: 'Urgent care daily 8am–8pm (except Christmas Day)' }, note: { zh: '无需预约，护士分诊；已注册和临时病人都可以看。', en: 'Walk in, nurse triage; enrolled and casual patients.' },
    sources: ['https://victoriaclinic.co.nz/urgent-care/', 'https://victoriaclinic.co.nz/contact-us/'] },
  { id: 'rototuna', name: 'Tui Medical Rototuna', zh: 'Tui Medical Rototuna 急症', address: 'Rototuna Shopping Centre, cnr Horsham Downs Rd & Thomas Rd, Hamilton 3210', phone: '0800 175 175',
    open: [8, 20], hours: { zh: '急症 每天 8:00–20:00（8 月 31 日起调整）', en: 'Urgent care daily 8am–8pm (changed from 31 August)' }, note: { zh: '关门后请去 Tui Medical Te Rapa。', en: 'After hours, go to Tui Medical Te Rapa.' },
    sources: ['https://www.tuimedical.co.nz/rototuna', 'https://www.healthpoint.co.nz/gps-accident-urgent-medical-care/accident-urgent-medical-care-ae/tui-medical-rototuna-urgent-care-and-medical/'] },
];

const HERO = { name: 'Waikato River, Hamilton', zh: '怀卡托河 · 汉密尔顿市区', credit: 'Umedha Hettigoda', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', source: 'https://commons.wikimedia.org/wiki/File:Waikato_River,_Hamilton_city,_New_Zealand_(8162680016).jpg' };
const LAKE_BAND = { name: 'Hamilton Lake (Lake Rotoroa)', zh: '汉密尔顿湖（Rotoroa 湖）', credit: 'Michal Klajban', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Lake_Rotoroa,_Waikato,_New_Zealand_02.jpg' };
const B = 'https://www.busit.co.nz/hamilton-routes/';
const ROUTES = [
  { n: 'O', name: 'Orbiter', zh: '环城线（顺/逆时针）', en: 'Ring route, both directions', slug: 'orbiter', hf: true },
  { n: 'C', name: 'Comet', zh: '南北线：The Base ↔ 医院（C1 Mahoe / C2 Glenview）', en: 'North–south: The Base ↔ Hospital (C1 Mahoe / C2 Glenview)', slug: 'comet', hf: true },
  { n: 'M', name: 'Meteor', zh: '东西线：Rotokauri ↔ 市中心 ↔ Silverdale', en: 'West–east: Rotokauri ↔ CBD ↔ Silverdale', slug: 'meteor', hf: true },
  { n: '1', name: 'Pukete', slug: 'pukete' }, { n: '3', name: 'Dinsdale', slug: 'dinsdale' }, { n: '4', name: 'Flagstaff', slug: 'flagstaff' },
  { n: '4N', name: 'Flagstaff North', slug: 'flagstaff-north' }, { n: '5', name: 'Chartwell', slug: 'chartwell' }, { n: '9', name: 'Nawton', slug: 'nawton' },
  { n: '10', name: 'Hillcrest', slug: 'hillcrest' }, { n: '11', name: 'Fairfield', slug: 'fairfield' }, { n: '12', name: 'Fitzroy', slug: 'fitzroy' },
  { n: '13', name: 'University', slug: 'university' }, { n: '14', name: 'Claudelands', slug: 'claudelands' }, { n: '16', name: 'Rototuna', slug: 'rototuna' },
  { n: 'RC', name: 'Rototuna Circular', slug: 'rototuna-circular' }, { n: '17', name: 'Hamilton Gardens Uni', slug: 'hamilton-gardens-uni' },
  { n: '18', name: 'Te Rapa', slug: 'te-rapa' }, { n: '19', name: 'Bremworth / Temple View', slug: 'bremworth-temple-view' },
];

function nzNow() {
  const parts = new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
  const h = +parts.find(p => p.type === 'hour')!.value, m = +parts.find(p => p.type === 'minute')!.value;
  return h + m / 60;
}


const DEST_CATS = [
  { id: 'all', zh: '全部', en: 'All' },
  { id: 'near', zh: '10 km 内', en: 'Within 10 km' },
  { id: 'mid', zh: '10–50 km', en: '10–50 km' },
  { id: 'far', zh: '50 km 以上', en: '50 km+' },
  { id: 'free', zh: '免费', en: 'Free' },
  { id: 'indoor', zh: '下雨天', en: 'Rainy day' },
];

const TEXT = {
  zh: {
    brand: '汉密尔顿生活指南', sub: 'Hamilton 本地生活实用信息', checkedBadge: `信息核对于 ${CHECKED}`,
    heroBadge: '整理 Hamilton 与周边 Waikato 的日常生活信息',
    heroA: '在汉密尔顿，', heroB: '把日子过得更顺手',
    lakeA: '周末慢一点，', lakeB: '去湖边走走',
    heroP: '垃圾桶怎么放、坐哪路公交、亚超在哪、周末带娃去哪、生病找谁——每条信息都附来源，可以自己核对。',
    searchPh: '搜索亚超、地点、区域（如 Frankton）…', search: '搜索', clear: '清除',
    nav: { home: '首页', tools: '实用工具箱', supermarkets: '亚超指南', weekend: '周末遛娃' },
    tabs: { bins: '垃圾清运', transport: '交通信息', urgent: '急诊信息' }, tabsSub: { bins: 'HCC 红桶/黄桶规则', transport: 'Busit 公交路线', urgent: '急症诊所 · 开门状态' },
    openNow: '现在营业', closedNow: '现在已关门', nowNote: '开门状态按新西兰时间计算，节假日可能不同。', call: '拨打',
    busH: 'Hamilton 市区公交（Busit）', busP: '点路线查看时刻表和路线图。高频线工作日白天约 15 分钟一班。', hf: '高频线', allRoutes: '其他市区路线',
    planner: '行程规划', plannerP: 'Busit 官网首页输入起点终点', transit: 'Transit 实时到站', transitP: 'Busit 官方推荐的免费 App，可看公交实时位置', bee: 'Bee Card 与票价', beeP: '刷卡比现金便宜：市中心区成人 $1.50，1 区 $2.90；有每周封顶和免费换乘', mapL: '全市线路图', busHelp: 'Busit 客服 0800 205 305',
    toolsH: '实用工具箱', toolsP: '垃圾清运、公交路线、急诊信息',
    binH: '垃圾与回收怎么放', binP: 'HCC 四件套：红桶、黄桶、玻璃箱、厨余桶',
    redWeek: '红周', yellowWeek: '黄周', weekly: '每周都收',
    red: '红盖桶 · 一般垃圾', yellow: '黄盖桶 · 可回收', glass: '玻璃箱 · 玻璃瓶罐', food: '绿色厨余桶 · 食物残渣',
    redNote: '隔周收，和黄周交替', yellowNote: '塑料 1/2/5、罐头、纸和纸板，洗净直接放入', glassNote: '与黄桶同一周收，去掉瓶盖', foodNote: '每周都收，锁好盖子防动物',
    binDay: '你家具体哪天收、这周是红周还是黄周，HCC 按门牌地址查询，各街区不同。',
    lookup: '去 HCC 官网按地址查询', binTip: '收运日早上 7 点前放到路边；最早前一天 17:00 后再放。',
    medBadge: '就医指引', medH: 'Anglesea 急症诊所', medP: 'Anglesea Clinic Urgent Care，24 小时 · 每天开放，无需预约，按病情紧急程度看诊，需现场付费。',
    medPhone: '电话', medAddr: '地址', copy: '复制', healthline: '免费健康热线 Healthline', healthlineNote: '24/7，可要求翻译',
    life: '有生命危险请直接拨打', srcs: '来源',
    em111Big: '紧急情况请立即拨打', medDisc: '本站不提供医疗建议。营业时间可能变动，请以诊所官方信息为准。',
    wxBy: '天气数据来自', photoCredits: '图片来源', creditsH: '图片来源与授权', creditsP: '本站照片均来自 Wikimedia Commons，按各自授权使用（按需裁剪、压缩尺寸及调色）。', cPlace: '地点', cAuthor: '作者', cLicense: '授权', cSource: '原图', heroImg: '首屏大图', interludeImg: '过渡大图', close: '关闭',
    indep: '本站为个人独立整理的信息网站，与所列任何商家、诊所、机构或市政府均无关联，也未获其背书。',
    smH: '亚洲超市与食材', smP: '只收录能在官网或公开商家目录里核对到地址和电话的门店；标“目录信息”的营业时间来自第三方目录', smCount: (n:number)=>`已核对 ${n} 家`,
    hoursUnknown: '营业时间未核实，出发前请电话确认', copyAddr: '复制地址', area: '区域',
    wkH: '周末遛娃 & 周边去处', wkP: '距离按 Hamilton 市中心估算；照片来自 Wikimedia Commons', km: '约 {n} km',
    freeTag: '免费', paidTag: '收费', indoorTag: '室内', official: '官网', noMatch: '没有匹配的结果，试试清除搜索词。',
    photoBy: '照片', hoursL: '开放', priceL: '价格',
    footAbout: '一个非商业的 Hamilton 本地生活信息站，面向所有居民，也照顾华人社区的需求。',
    footLinks: '常用市政与公共链接', footEm: '紧急与健康电话', footDisc: '免责声明',
    footDiscP: `信息核对于 ${CHECKED}，可能随时变化，请以官方来源为准。垃圾收运以 HCC 官网按地址查询结果为准。`,
    em111: '火警 / 警察 / 救护车', em105: '非紧急警察', copied: (l:string)=>`已复制：${l}`, filterKw: (k:string)=>`筛选关键词：「${k}」`,
    wx: { loading: '天气加载中', err: '天气暂不可用', now: '现在', feels: '体感', today: '今天', hi: '最高', lo: '最低', rain: '降雨概率', next: '未来几天', src: '数据：Open-Meteo，每 30 分钟更新', close: '关闭', city: 'Hamilton 汉密尔顿', retry: '重试',
      tipRain: '今天下雨可能性大，建议选室内去处，比如博物馆或图书馆。', tipHot: '今天较晒，户外记得防晒和带水。', tipGood: '天气不错，适合去公园、花园或湖边走走。', tipCool: '有点凉，户外记得带外套。' },
    days: ['周日','周一','周二','周三','周四','周五','周六'],
  },
  en: {
    brand: 'Hamilton Local', sub: 'Practical everyday info for Hamilton', checkedBadge: `Checked ${CHECKED}`,
    heroBadge: 'Everyday info for Hamilton and the wider Waikato',
    heroA: 'Life in Hamilton, ', heroB: 'made a little easier',
    lakeA: 'Slow down this weekend,', lakeB: 'take a walk by the lake',
    heroP: 'Bin days, buses, Asian grocers, weekend outings with kids, where to go when you are unwell — every entry links to its source so you can check it yourself.',
    searchPh: 'Search grocers, places, suburbs (e.g. Frankton)…', search: 'Search', clear: 'Clear',
    nav: { home: 'Home', tools: 'Toolbox', supermarkets: 'Asian grocers', weekend: 'Weekend' },
    tabs: { bins: 'Bins', transport: 'Buses', urgent: 'Urgent care' }, tabsSub: { bins: 'HCC red/yellow week', transport: 'Busit routes', urgent: 'Clinics · open now' },
    openNow: 'Open now', closedNow: 'Closed now', nowNote: 'Open status uses New Zealand time; public holidays may differ.', call: 'Call',
    busH: 'Hamilton city buses (Busit)', busP: 'Tap a route for its timetable and map. Frequent routes run about every 15 min on weekdays.', hf: 'Frequent', allRoutes: 'Other city routes',
    planner: 'Journey planner', plannerP: 'On the Busit home page — enter from and to', transit: 'Transit app (real time)', transitP: 'Free app recommended by Busit, with live bus locations', bee: 'Bee Card & fares', beeP: 'Cheaper than cash: adult $1.50 in the central zone, $2.90 for 1 zone; weekly cap and free transfers', mapL: 'City route map', busHelp: 'Busit help 0800 205 305',
    toolsH: 'Toolbox', toolsP: 'Bins, buses and urgent care',
    binH: 'How the bins work', binP: 'Four containers: red bin, yellow bin, glass crate, food scraps bin',
    redWeek: 'Red week', yellowWeek: 'Yellow week', weekly: 'Every week',
    red: 'Red-lid bin · Rubbish', yellow: 'Yellow-lid bin · Recycling', glass: 'Glass crate · Bottles & jars', food: 'Green food scraps bin',
    redNote: 'Fortnightly, alternating with yellow week', yellowNote: 'Plastics 1/2/5, tins, cans, paper and card — rinsed, loose', glassNote: 'Collected with the yellow bin; lids off', foodNote: 'Collected weekly; lock the lid against animals',
    binDay: 'Your collection day, and whether this is a red or yellow week, depends on your street address — HCC looks it up by address.',
    lookup: 'Look up your address on HCC', binTip: 'Bins out by 7am on collection day; not before 5pm the night before.',
    medBadge: 'Medical help', medH: 'Anglesea Clinic Urgent Care', medP: 'Open 24 hours, 7 days. No appointment needed; patients are seen by urgency. Payment is required upfront.',
    medPhone: 'Phone', medAddr: 'Address', copy: 'Copy', healthline: 'Free Healthline', healthlineNote: '24/7, interpreters available',
    life: 'Life-threatening emergency? Call', srcs: 'Sources',
    em111Big: 'In an emergency, call', medDisc: 'This site does not give medical advice. Hours may change — please check with the clinic.',
    wxBy: 'Weather data by', photoCredits: 'Photo credits', creditsH: 'Photo credits & licences', creditsP: 'All photos are from Wikimedia Commons and used under their stated licences (cropped, resized and colour-graded where needed).', cPlace: 'Place', cAuthor: 'Author', cLicense: 'Licence', cSource: 'Source', heroImg: 'Hero image', interludeImg: 'Interlude image', close: 'Close',
    indep: 'This is an independent, personally compiled site. It is not affiliated with or endorsed by any business, clinic, organisation or council listed.',
    smH: 'Asian grocers', smP: 'Only stores whose address and phone we could check on an official site or public business listing; hours marked "directory listing" come from third-party directories', smCount: (n:number)=>`${n} checked`,
    hoursUnknown: 'Hours not verified — call ahead', copyAddr: 'Copy address', area: 'Area',
    wkH: 'Weekend outings', wkP: 'Distances are rough estimates from central Hamilton; photos from Wikimedia Commons', km: '~{n} km',
    freeTag: 'Free', paidTag: 'Paid', indoorTag: 'Indoor', official: 'Website', noMatch: 'Nothing matches — try clearing the search.',
    photoBy: 'Photo', hoursL: 'Hours', priceL: 'Price',
    footAbout: 'A non-commercial local info site for everyone in Hamilton, with the Chinese-speaking community in mind.',
    footLinks: 'Council & public links', footEm: 'Emergency & health numbers', footDisc: 'Disclaimer',
    footDiscP: `Checked ${CHECKED}. Details can change — always confirm with the official source. For bin days, the HCC address lookup is authoritative.`,
    em111: 'Fire / police / ambulance', em105: 'Police non-emergency', copied: (l:string)=>`Copied: ${l}`, filterKw: (k:string)=>`Filtering: "${k}"`,
    wx: { loading: 'Loading weather', err: 'Weather unavailable', now: 'Now', feels: 'Feels like', today: 'Today', hi: 'High', lo: 'Low', rain: 'Rain chance', next: 'Next few days', src: 'Data: Open-Meteo, refreshed every 30 min', close: 'Close', city: 'Hamilton', retry: 'Retry',
      tipRain: 'Rain is likely today — an indoor pick like the museum or library is a good bet.', tipHot: 'Strong sun today — bring sunscreen and water.', tipGood: 'Nice weather — a good day for a park, garden or lake walk.', tipCool: 'A bit cool — bring a jacket if heading out.' },
    days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  },
};

// --- Weather (Open-Meteo) ---
const WX_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-37.787&longitude=175.279&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=Pacific%2FAuckland&forecast_days=6';
const WX_KEY = 'hl-weather-v1';
function wxInfo(code: number) {
  if (code === 0) return { Icon: Sun, zh: '晴', en: 'Clear' };
  if (code <= 2) return { Icon: CloudSun, zh: '多云间晴', en: 'Partly cloudy' };
  if (code === 3) return { Icon: Cloud, zh: '阴', en: 'Overcast' };
  if (code <= 48) return { Icon: CloudFog, zh: '雾', en: 'Fog' };
  if (code <= 57) return { Icon: CloudRain, zh: '毛毛雨', en: 'Drizzle' };
  if (code <= 67) return { Icon: CloudRain, zh: '雨', en: 'Rain' };
  if (code <= 77) return { Icon: Snowflake, zh: '雪', en: 'Snow' };
  if (code <= 82) return { Icon: CloudRain, zh: '阵雨', en: 'Showers' };
  if (code <= 86) return { Icon: Snowflake, zh: '阵雪', en: 'Snow showers' };
  return { Icon: CloudLightning, zh: '雷雨', en: 'Thunderstorm' };
}
function useWeather() {
  const [state, setState] = useState<{ data: any; error: boolean }>({ data: null, error: false });
  const load = () => {
    try {
      const c = JSON.parse(sessionStorage.getItem(WX_KEY) || 'null');
      if (c && Date.now() - c.t < 30 * 60 * 1000) { setState({ data: c.d, error: false }); return; }
    } catch {}
    setState(s => ({ ...s, error: false }));
    fetch(WX_URL).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => {
      try { sessionStorage.setItem(WX_KEY, JSON.stringify({ t: Date.now(), d })); } catch {}
      setState({ data: d, error: false });
    }).catch(() => setState({ data: null, error: true }));
  };
  useEffect(load, []);
  return { ...state, reload: load };
}

function WeatherPill({ lang, T }: { lang: Lang; T: any }) {
  const { data, error, reload } = useWeather();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node) && !dialogRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const cur = data?.current; const d = data?.daily;
  const info = cur ? wxInfo(cur.weather_code) : null;
  const Icon = info ? info.Icon : (error ? AlertCircle : Cloud);
  let tip = '';
  if (d) {
    const rain = d.precipitation_probability_max[0] ?? 0, hi = d.temperature_2m_max[0], uv = d.uv_index_max?.[0] ?? 0;
    tip = rain >= 60 ? T.wx.tipRain : (uv >= 7 || hi >= 26) ? T.wx.tipHot : hi < 14 ? T.wx.tipCool : T.wx.tipGood;
  }
  return (
    <div ref={ref} className="relative">
      <button data-testid="wx-pill" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(o => !o)}
        className="sb-pill flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition">
        <Icon className="w-4 h-4 text-amber-300" />
        {cur ? (<><span className="font-bold">{Math.round(cur.temperature_2m)}°</span><span className="hidden sm:inline text-white/80">{lang === 'zh' ? info!.zh : info!.en}</span></>)
          : <span className="text-white/80">{error ? T.wx.err : T.wx.loading}</span>}
      </button>
      {open && createPortal(
        <div className="sb-modal-backdrop sb-weather-backdrop" onClick={() => setOpen(false)}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={T.wx.city} data-testid="wx-card"
            className="sb-card sb-wx" onClick={e => e.stopPropagation()}>
            <div className="sb-wx-heading">
              <div>
                <h2>{T.wx.city} <span>· {T.wx.now}</span></h2>
                {cur ? (
                  <div className="sb-wx-current">
                    <Icon />
                    <div><strong className="sb-wx-temperature">{Math.round(cur.temperature_2m)}°C</strong>
                      <p>{lang === 'zh' ? info!.zh : info!.en} · {T.wx.feels} {Math.round(cur.apparent_temperature)}°</p>
                    </div>
                  </div>
                ) : (
                  <p className="sb-wx-loading">{error ? T.wx.err : T.wx.loading}
                    {error && <button onClick={reload} className="sb-wx-retry">{T.wx.retry}</button>}
                  </p>
                )}
              </div>
              <button autoFocus onClick={() => setOpen(false)} aria-label={T.wx.close} className="sb-action sb-icon-close"><X /></button>
            </div>
            {d && (<>
              <div className="sb-wx-summary">
                <div><span>{T.wx.hi}</span><strong>{Math.round(d.temperature_2m_max[0])}°</strong></div>
                <div><span>{T.wx.lo}</span><strong>{Math.round(d.temperature_2m_min[0])}°</strong></div>
                <div><span>{T.wx.rain}</span><strong>{d.precipitation_probability_max[0] ?? '–'}%</strong></div>
              </div>
              <div className="sb-wx-tip"><Umbrella /><p>{tip}</p></div>
              <h3 className="sb-label">{T.wx.next}</h3>
              <div className="sb-wx-forecast">
                {d.time.slice(1, 6).map((day: string, i: number) => {
                  const k = i + 1; const wi = wxInfo(d.weather_code[k]); const DI = wi.Icon;
                  const dow = new Date(day + 'T12:00:00').getDay();
                  return (
                    <div key={day}>
                      <span>{T.days[dow]}</span><DI />
                      <strong>{Math.round(d.temperature_2m_max[k])}°<span>/{Math.round(d.temperature_2m_min[k])}°</span></strong>
                      <span className="sb-wx-rain"><Droplets />{d.precipitation_probability_max[k] ?? '–'}%</span>
                    </div>);
                })}
              </div>
            </>)}
            <p className="sb-wx-source">{T.wx.src}</p>
          </div>
        </div>, document.body
      )}
    </div>
  );
}

// Motion stays local to these primitives; scrolling never re-renders the page.

function BlurText({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  let index = 0;
  return (
    <span className={`sb-blur-text ${className}`}>
      <span className="sr-only">{text}</span>
      {text.split(/(\s+)/).filter(Boolean).map((word, wi) => (
        <span className="sb-blur-word" aria-hidden="true" key={wi}>
          {Array.from(word).map(char => (
            <span key={index} className="sb-blur-char" style={{ animationDelay: `${delay + index++ * 40}ms` }}>
              {char === ' ' ? '\u00a0' : char}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function Reveal({ children, id, className = '' }: { children: React.ReactNode; id?: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const show = () => { element.classList.remove('is-pending'); element.classList.add('is-visible'); };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { show(); observer.disconnect(); }
    }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
    element.classList.add('is-pending');
    observer.observe(element);
    const onMotion = () => { if (motion.matches) { show(); observer.disconnect(); } };
    const onFocus = () => { show(); observer.disconnect(); };
    motion.addEventListener('change', onMotion);
    element.addEventListener('focusin', onFocus);
    return () => { observer.disconnect(); motion.removeEventListener('change', onMotion); element.removeEventListener('focusin', onFocus); };
  }, []);
  return <section id={id} ref={ref} className={`sb-reveal ${className}`}>{children}</section>;
}

function HeroMedia() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;
      const height = element.parentElement?.offsetHeight || window.innerHeight;
      element.style.transform = motion.matches ? '' : `translate3d(0, ${Math.min(window.scrollY, height) * 0.12}px, 0)`;
    };
    const onScroll = () => { if (!frame && !motion.matches) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    motion.addEventListener('change', update);
    return () => { window.removeEventListener('scroll', onScroll); motion.removeEventListener('change', update); cancelAnimationFrame(frame); };
  }, []);
  return <div ref={ref} className="sb-hero-media" aria-hidden="true"><img src="./photos/hero-train.webp" alt="" fetchPriority="high" decoding="async" /></div>;
}

function SectionTitle({ title, sub, eyebrow }: { title: string; sub: string; eyebrow: string }) {
  return (
    <div className="sb-section-title">
      <p className="sb-eyebrow">{eyebrow}</p>
      <h2 className="sb-h2" key={title}><BlurText text={title} /></h2>
      <p className="sb-section-sub">{sub}</p>
    </div>
  );
}

function SourceLinks({ urls, label }: { urls: string[]; label: string }) {
  return (
    <div className="sb-sources">
      <span>{label}:</span>
      {urls.map(u => <a key={u} href={u} target="_blank" rel="noreferrer">{new URL(u).hostname.replace('www.', '')}</a>)}
    </div>
  );
}

// Only visible bands respond to scrolling; transforms never update React state.
function BandMedia({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (motion.matches) { element.style.transform = ''; return; }
      const rect = element.parentElement!.getBoundingClientRect();
      const offset = (window.innerHeight / 2 - rect.top - rect.height / 2) * 0.07;
      element.style.transform = `translate3d(0, ${Math.max(-48, Math.min(48, offset))}px, 0)`;
    };
    const schedule = () => { if (visible && !motion.matches && !frame) frame = requestAnimationFrame(update); };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) schedule();
    }, { rootMargin: '100px' }) : null;
    if (observer) observer.observe(element.parentElement!);
    else { visible = true; schedule(); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    motion.addEventListener('change', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', update);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <div ref={ref} className="sb-band-media" aria-hidden="true"><img src={src} alt="" loading="lazy" decoding="async" /></div>;
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (typeof localStorage !== 'undefined' && localStorage.getItem('hl-lang') === 'en') ? 'en' : 'zh');
  const T: any = TEXT[lang];
  useEffect(() => {
    try { localStorage.setItem('hl-lang', lang); } catch {}
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en-NZ';
    document.title = lang === 'zh' ? '汉密尔顿生活指南 · Hamilton Local' : 'Hamilton Local — everyday info for Hamilton, NZ';
  }, [lang]);

  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestCat, setSelectedDestCat] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [showCredits, setShowCredits] = useState(false);
  useEffect(() => { if (!showCredits) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCredits(false); }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [showCredits]);
  const [toolTab, setToolTab] = useState<'bins' | 'transport' | 'urgent'>('bins');
  const [smType, setSmType] = useState('all');
  const [now, setNow] = useState(nzNow());
  useEffect(() => { const t = setInterval(() => setNow(nzNow()), 60000); return () => clearInterval(t); }, []);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };
  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    showToast(T.copied(label));
  };
  const go = (id: string) => { setActiveTab(id); document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };

  const q = searchQuery.trim().toLowerCase();
  const filteredSupermarkets = useMemo(() => SUPERMARKETS.filter(s => (smType === 'all' || s.type === smType) && (!q ||
    [s.name, s.zhName, s.suburb, s.address, ...s.tags.zh, ...s.tags.en].some(x => x.toLowerCase().includes(q)))), [q, smType]);
  const filteredDestinations = useMemo(() => (PLACES as any[]).filter(p => {
    const c = selectedDestCat;
    const okCat = c === 'all' || (c === 'near' && p.km <= 10) || (c === 'mid' && p.km > 10 && p.km <= 50) || (c === 'far' && p.km > 50) || (c === 'free' && p.free) || (c === 'indoor' && p.indoor);
    const okQ = !q || [p.name, p.zh, p.area, p.address, p.description, p.en.description, p.tag, p.en.tag].some((x: string) => (x || '').toLowerCase().includes(q));
    return okCat && okQ;
  }), [selectedDestCat, q]);

  const NAV = ['home', 'tools', 'supermarkets', 'weekend'];
  const bins = [
    { k: 'red', color: 'sb-dot-red', label: T.red, note: T.redNote, week: T.redWeek },
    { k: 'yellow', color: 'sb-dot-yellow', label: T.yellow, note: T.yellowNote, week: T.yellowWeek },
    { k: 'glass', color: 'sb-dot-glass', label: T.glass, note: T.glassNote, week: T.yellowWeek },
    { k: 'food', color: 'sb-dot-food', label: T.food, note: T.foodNote, week: T.weekly },
  ];

  return (
    <div className="sb-root min-h-screen text-slate-800 font-sans flex flex-col antialiased selection:bg-amber-200 selection:text-slate-900">
      {toastMessage && (
        <div role="status" className="sb-toast fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 shadow-xl text-sm font-medium flex items-center gap-2 max-w-[90vw]">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" /><span>{toastMessage}</span>
        </div>
      )}

      <header className="sb-header text-white">
        <div className="sb-header-inner">
          <button className="sb-brand" onClick={() => go('home')}>
            <span className="sb-logo"><LogoMark /></span>
            <span className="min-w-0 text-left">
              <span className="sb-brand-name">Hamilton Local</span>
              <span className="sb-brand-sub">{lang === 'zh' ? T.brand : T.sub}</span>
            </span>
          </button>
          <nav className="sb-desktop-nav" aria-label={T.nav.tools}>
            {NAV.map(id => (
              <button key={id} onClick={() => go(id)} aria-current={activeTab === id ? 'location' : undefined}
                className={`sb-nav ${activeTab === id ? 'sb-nav-on' : ''}`}>{T.nav[id]}</button>
            ))}
            <button onClick={() => { setToolTab('urgent'); go('tools'); }} className="sb-nav">{T.tabs.urgent}</button>
          </nav>
          <div className="sb-header-actions">
            <button data-testid="lang" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} aria-label="Switch language" className="sb-pill sb-language">
              <Globe className="w-3.5 h-3.5" />{lang === 'zh' ? 'EN' : '中'}
            </button>
            <button className="sb-header-cta" onClick={() => go('tools')}>{T.nav.tools}<ArrowUpRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <nav className="sb-mobile-nav no-scrollbar" aria-label={T.nav.tools}>
          {NAV.map(id => <button key={id} onClick={() => go(id)} aria-current={activeTab === id ? 'location' : undefined} className={`sb-mnav ${activeTab === id ? 'sb-nav-on' : ''}`}>{T.nav[id]}</button>)}
          <button onClick={() => { setToolTab('urgent'); go('tools'); }} className="sb-mnav">{T.tabs.urgent}</button>
        </nav>
      </header>

      <section id="home" className="sb-hero">
        <HeroMedia />
        <div className="sb-hero-shade" aria-hidden="true" />
        <div className="sb-hero-content">
          <div className="sb-sticker"><Sparkles className="w-3.5 h-3.5 shrink-0" /><span>{T.heroBadge}</span></div>
          <h1 className="sb-h1" key={lang}>
            <BlurText text={T.heroA} className="sb-h1a" />
            <BlurText text={T.heroB} className="sb-h1b" delay={160} />
          </h1>
          <p className="sb-lead">{T.heroP}</p>
            <form onSubmit={e => { e.preventDefault(); if (q) { showToast(T.filterKw(searchQuery)); go('supermarkets'); } }}
              className="sb-search p-1.5 flex items-center">
              <Search className="w-5 h-5 text-white/80 ml-2 shrink-0" />
              <input type="search" aria-label={T.search} placeholder={T.searchPh} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full min-w-0 px-3 py-2 text-base sm:text-sm outline-none bg-transparent placeholder:text-white/65" />
              {searchQuery && <button type="button" aria-label={T.clear} onClick={() => setSearchQuery('')} className="p-2 text-white/80 hover:text-white mr-1"><X className="w-4 h-4" /></button>}
              <button type="submit" className="sb-btn px-4 sm:px-5 py-2.5 text-sm font-bold shrink-0">{T.search}</button>
            </form>
            <div className="sb-hero-places flex flex-wrap justify-center gap-2 text-xs">
              {['Hamilton Central', 'Frankton', 'Hamilton East', 'Chartwell', 'Cambridge', 'Raglan'].map(sub => (
                <button key={sub} onClick={() => setSearchQuery(sub)} aria-pressed={searchQuery === sub} className={`sb-chip px-2.5 py-1 flex items-center gap-1 ${searchQuery === sub ? 'sb-chip-on' : ''}`}>
                  <MapPin className="w-3 h-3" />{sub}
                </button>
              ))}
            </div>
          <button className="sb-ghost" onClick={() => go('tools')}>{lang === 'zh' ? '开始探索' : 'Start exploring'}<ArrowDown className="w-4 h-4" /></button>
        </div>
        <div className="sb-hero-weather"><WeatherPill lang={lang} T={T} /></div>
        <span className="sb-hero-location">Hamilton · Waikato · New Zealand</span>
      </section>

      <main className="sb-main w-full flex-1">
        {/* 1. TOOLBOX */}
        <Reveal id="tools" className="sb-section sb-tools sb-dark">
          <BandMedia src="./photos/band-tools.webp" />
          <div className="sb-container">
            <div className="sb-section-heading">
              <SectionTitle eyebrow={TEXT.en.toolsH} title={T.toolsH} sub={T.toolsP} />
              <span className="sb-tag sb-checked">{T.checkedBadge}</span>
            </div>
            <div role="tablist" aria-label={T.toolsH} className="sb-tabs">
              {([['bins', Trash2], ['transport', Bus], ['urgent', Stethoscope]] as const).map(([id, Ic]) => (
                <button key={id} id={'tool-tab-' + id} role="tab" aria-selected={toolTab === id} aria-controls={'tool-panel-' + id}
                  data-testid={'tab-' + id} onClick={() => setToolTab(id)}
                  className={'sb-tab ' + (toolTab === id ? 'sb-tab-on' : '')}>
                  <Ic className="sb-tab-icon" />
                  <span><span className="sb-tab-label">{T.tabs[id]}</span><span className="sb-tab-sub">{T.tabsSub[id]}</span></span>
                </button>))}
            </div>

            {toolTab === 'bins' && (
              <div id="tool-panel-bins" role="tabpanel" aria-labelledby="tool-tab-bins" className="sb-card sb-panel">
                <div className="sb-panel-heading">
                  <span className="sb-icon-disc"><Trash2 /></span>
                  <div><h3>{T.binH}</h3><p>{T.binP}</p></div>
                </div>
                <div className="sb-bin-schedules sb-stagger">
                  {[{ w: T.redWeek, items: [bins[0], bins[3]] }, { w: T.yellowWeek, items: [bins[1], bins[2], bins[3]] }].map((col, ci) => (
                    <div key={ci} className="sb-bin-week">
                      <h4><Calendar />{col.w}</h4>
                      <div>
                        {col.items.map(b => (
                          <div key={b.k} className="sb-bin-row">
                            <span className={'sb-bin-dot ' + b.color} aria-hidden="true" />
                            <div><strong>{b.label}</strong><p>{b.note}</p></div>
                          </div>))}
                      </div>
                    </div>))}
                </div>
                <div className="sb-bin-lookup">
                  <p>{T.binDay}</p>
                  <a href={HCC_LOOKUP} target="_blank" rel="noreferrer" className="sb-action">{T.lookup}<ExternalLink /></a>
                </div>
                <div className="sb-panel-foot">
                  <p className="sb-icon-line"><Clock /><span>{T.binTip}</span></p>
                  <SourceLinks urls={[HCC_LOOKUP, HCC_FAQ]} label={T.srcs} />
                </div>
              </div>
            )}

            {toolTab === 'transport' && (
              <div id="tool-panel-transport" role="tabpanel" aria-labelledby="tool-tab-transport" data-testid="panel-transport" className="sb-card sb-panel sb-transport">
                <div className="sb-panel-heading">
                  <span className="sb-icon-disc"><Bus /></span>
                  <div><h3>{T.busH}</h3><p>{T.busP}</p></div>
                </div>
                <div className="sb-route-group">
                  <h4 className="sb-label">{T.hf}</h4>
                  <div className="sb-feature-routes sb-stagger">
                    {ROUTES.filter(r => r.hf).map(r => (
                      <a key={r.slug} href={B + r.slug + '/'} target="_blank" rel="noreferrer" className="sb-route sb-route-feature">
                        <span className="sb-route-number">{r.n}</span>
                        <span><strong>{r.name}</strong><span className="sb-route-description">{lang === 'zh' ? r.zh : r.en}</span></span>
                        <ExternalLink className="sb-route-external" />
                      </a>))}
                  </div>
                </div>
                <div className="sb-route-group">
                  <h4 className="sb-label">{T.allRoutes}</h4>
                  <div className="sb-routes">
                    {ROUTES.filter(r => !r.hf).map(r => (
                      <a key={r.slug} href={B + r.slug + '/'} target="_blank" rel="noreferrer" className="sb-route">
                        <span className="sb-route-number">{r.n}</span><span>{r.name}</span>
                      </a>))}
                  </div>
                </div>
                <div className="sb-transit-services">
                  {[
                    { href: 'https://www.busit.co.nz/', t: T.planner, p: T.plannerP },
                    { href: 'https://www.busit.co.nz/using-the-bus/transit-app/', t: T.transit, p: T.transitP },
                    { href: 'https://www.busit.co.nz/fares/', t: T.bee, p: T.beeP },
                  ].map(x => (
                    <a key={x.href} href={x.href} target="_blank" rel="noreferrer" className="sb-transit-service">
                      <strong>{x.t}<ExternalLink /></strong><p>{x.p}</p>
                    </a>))}
                </div>
                <div className="sb-panel-foot sb-transport-foot">
                  <div className="sb-link-pills">
                    <a href="https://www.busit.co.nz/using-the-bus/map-city-and-regional-bus-routes/" target="_blank" rel="noreferrer">{T.mapL}</a>
                    <a href="https://www.busit.co.nz/fares/beecard/" target="_blank" rel="noreferrer">Bee Card</a>
                    <a href="tel:0800205305">{T.busHelp}</a>
                  </div>
                  <SourceLinks urls={['https://www.busit.co.nz/hamilton-routes/']} label={T.srcs + ' ' + CHECKED} />
                </div>
              </div>
            )}

            {toolTab === 'urgent' && (
              <div id="tool-panel-urgent" role="tabpanel" aria-labelledby="tool-tab-urgent" data-testid="panel-urgent" className="sb-card sb-panel sb-urgent">
                <BandMedia src="./photos/band-urgent.webp" />
                <div data-testid="em111" className="sb-emergency">
                  <a href="tel:111"><span>{T.em111Big}</span><strong>111</strong></a>
                  <p>{T.medDisc}</p>
                </div>
                <div className="sb-healthline">
                  <div className="sb-icon-line"><AlertCircle /><span>{T.life} <a href="tel:111">111</a></span></div>
                  <a href="tel:0800611116" className="sb-healthline-call"><ShieldCheck /><span>{T.healthline}: <strong>0800 611 116</strong><span className="sb-healthline-note">· {T.healthlineNote}</span></span></a>
                </div>
                <div className="sb-clinics sb-stagger">
                  {URGENT.map(c => {
                    const isOpen = now >= c.open[0] && now < c.open[1];
                    return (
                      <div key={c.id} className="sb-clinic">
                        <div>
                          <div className="sb-card-heading">
                            <h3>{lang === 'zh' ? c.zh : c.name}</h3>
                            <span data-testid="open-status" className={'sb-tag sb-status ' + (isOpen ? 'sb-status-open' : 'sb-status-closed')}>
                              <span className="sb-status-dot" aria-hidden="true" />{isOpen ? T.openNow : T.closedNow}
                            </span>
                          </div>
                          <div className="sb-clinic-info">
                            <p className="sb-icon-line"><Clock /><strong>{c.hours[lang]}</strong></p>
                            <p className="sb-icon-line"><MapPin /><span>{c.address}</span></p>
                            <p className="sb-clinic-note">{c.note[lang]}</p>
                          </div>
                        </div>
                        <div className="sb-card-foot">
                          <SourceLinks urls={c.sources} label={T.srcs} />
                          <a href={'tel:' + c.phone.replace(/\s/g, '')} className="sb-action sb-call"><Phone />{c.phone}</a>
                        </div>
                      </div>);
                  })}
                </div>
                <p className="sb-urgent-note">{T.nowNote} {T.checkedBadge}.</p>
              </div>
            )}
          </div>
        </Reveal>

        {/* The river carries the charcoal band into the morning mist. */}
        <Reveal className="sb-river-section">
          <div className="sb-container">
            <figure className="sb-river">
              <picture>
                <source media="(max-width: 640px)" srcSet="./photos/hero-waikato-river-m.webp" />
                <img src="./photos/hero-waikato-river.webp" alt={lang === 'zh' ? '流经汉密尔顿市区的怀卡托河' : 'The Waikato River flowing through Hamilton'} loading="lazy" className="sb-river-image" />
              </picture>
              <figcaption className="sb-river-caption">{lang === 'zh' ? '怀卡托河 · 汉密尔顿' : 'Waikato River · Hamilton'}</figcaption>
              <a href={HERO.source} target="_blank" rel="noreferrer" className="sb-river-credit">{T.photoBy}: {HERO.credit}, {HERO.license}</a>
            </figure>
          </div>
        </Reveal>

        {/* 2. SUPERMARKETS */}
        <Reveal id="supermarkets" className="sb-section sb-market">
          <BandMedia src="./photos/band-market.webp" />
          <div className="sb-container">
            <div className="sb-section-heading">
              <SectionTitle eyebrow={TEXT.en.smH} title={T.smH} sub={T.smP} />
              <span className="sb-tag sb-checked">{T.smCount(SUPERMARKETS.length)} · {CHECKED}</span>
            </div>
            <div className="sb-filters" role="group" aria-label={T.smH}>
              {SM_TYPES.map(c => (
                <button key={c.id} data-testid={'sm-' + c.id} aria-pressed={smType === c.id} onClick={() => setSmType(c.id)}
                  className={'sb-chip ' + (smType === c.id ? 'sb-chip-on' : '')}>
                  {c[lang]} <span className="sb-filter-count">{c.id === 'all' ? SUPERMARKETS.length : SUPERMARKETS.filter(x => x.type === c.id).length}</span>
                </button>))}
            </div>
            {filteredSupermarkets.length === 0 ? <div className="sb-empty">{T.noMatch}</div> : (
              <div className="sb-market-grid sb-stagger">
                {filteredSupermarkets.map(sup => (
                  <div key={sup.id} className="sb-card sb-market-card">
                    <div>
                      <div className="sb-card-heading">
                        <h3>{lang === 'zh' ? sup.zhName : sup.name}</h3>
                        <span className="sb-tag">{SM_TYPES.find(t => t.id === sup.type)![lang]}</span>
                      </div>
                      <p className="sb-icon-line sb-address"><MapPin /><span>{sup.address}</span></p>
                      <div className="sb-market-info">
                        <p className="sb-icon-line"><Clock /><span>{sup.hours ? sup.hours[lang] : T.hoursUnknown}</span></p>
                        <a href={'tel:' + sup.phone.replace(/\s/g, '')} className="sb-icon-line"><Phone /><span>{sup.phone}</span></a>
                      </div>
                      <div className="sb-tags">{sup.tags[lang].map((tag, i) => <span key={i} className="sb-tag">{tag}</span>)}</div>
                    </div>
                    <div className="sb-card-foot">
                      <SourceLinks urls={sup.sources} label={T.srcs} />
                      <button onClick={() => copyToClipboard(sup.address, sup.name)} className="sb-action"><Copy /><span>{T.copyAddr}</span></button>
                    </div>
                  </div>))}
              </div>)}
          </div>
        </Reveal>

        {/* 3. DUSK / WEEKEND */}
        <Reveal className="sb-cinematic">
          <BandMedia src="./photos/band-hamilton-lake.webp" />
          <div className="sb-dusk-shade" aria-hidden="true" />
          <div className="sb-cinematic-content">
            <p className="sb-cinematic-eyebrow">Hamilton · Waikato · New Zealand</p>
            <h2 key={lang}><BlurText text={T.lakeA} /><BlurText text={T.lakeB} /></h2>
            <button className="sb-ghost" onClick={() => go('weekend')}>{T.nav.weekend}<ArrowDown className="w-4 h-4" /></button>
          </div>
          <a href={LAKE_BAND.source} target="_blank" rel="noreferrer" className="sb-river-credit">{T.photoBy}: {LAKE_BAND.credit}, {LAKE_BAND.license}</a>
        </Reveal>

        <Reveal id="weekend" className="sb-section sb-weekend sb-dark">
          <div className="sb-container">
            <div className="sb-section-heading"><SectionTitle eyebrow={TEXT.en.wkH} title={T.wkH} sub={T.wkP} /></div>
            <div className="sb-filters" role="group" aria-label={T.wkH}>
              {DEST_CATS.map(cat => (
                <button key={cat.id} onClick={() => setSelectedDestCat(cat.id)} aria-pressed={selectedDestCat === cat.id}
                  className={'sb-chip ' + (selectedDestCat === cat.id ? 'sb-chip-on' : '')}>{cat[lang]}</button>))}
            </div>
            {filteredDestinations.length === 0 ? <div className="sb-empty">{T.noMatch}</div> : (
              <div className="sb-weekend-grid sb-stagger">
                {filteredDestinations.map((p: any) => (
                  <article key={p.id} className="sb-card sb-place-card">
                    <div className={'sb-photo ' + (!p.photo ? 'sb-photo-fallback' : '')}>
                      {p.photo ? <img src={'./photos/' + p.photo} alt={lang === 'zh' ? p.photoAlt : p.en.photoAlt} loading="lazy" decoding="async" /> : null}
                      <div className="sb-photo-tags">
                        <span className="sb-tag">{T.km.replace('{n}', p.km)}</span>
                        <span className="sb-tag">{p.free ? T.freeTag : T.paidTag}</span>
                        {p.indoor && <span className="sb-tag">{T.indoorTag}</span>}
                      </div>
                    </div>
                    <div className="sb-place-body">
                      <p className="sb-place-kicker">{lang === 'zh' ? p.tag : p.en.tag}</p>
                      <h3>{lang === 'zh' ? <>{p.zh} <span className="sb-place-english">{p.name}</span></> : p.name}</h3>
                      <p className="sb-place-description">{lang === 'zh' ? p.description : p.en.description}</p>
                      <dl className="sb-place-details">
                        <div className="sb-icon-line"><Clock /><dd>{lang === 'zh' ? p.hours : p.en.hours}</dd></div>
                        <div className="sb-icon-line"><MapPin /><dd>{p.address}</dd></div>
                      </dl>
                    </div>
                    <div className="sb-card-foot">
                      <span className="sb-photo-attribution">
                        {p.photo && <>{T.photoBy}: <a href={p.photoSource} target="_blank" rel="noreferrer">{p.photoCredit}</a>, <a href={p.photoLicenseUrl} target="_blank" rel="noreferrer">{p.photoLicense}</a></>}
                      </span>
                      <a href={p.url} target="_blank" rel="noreferrer" className="sb-action">{T.official}<ChevronRight /></a>
                    </div>
                  </article>))}
              </div>)}
          </div>
        </Reveal>
      </main>

      <footer className="sb-footer sb-dark">
        <div className="sb-container">
          <div className="sb-footer-grid">
            <div className="sb-footer-about">
              <div className="sb-footer-brand"><span className="sb-logo"><LogoMark /></span><span>{T.brand}</span></div>
              <p>{T.footAbout}</p>
            </div>
            <div>
              <h4>{T.footLinks}</h4>
              <ul className="sb-link-pills">
                <li><a href="https://hamilton.govt.nz" target="_blank" rel="noreferrer">Hamilton City Council</a></li>
                <li><a href="https://www.busit.co.nz" target="_blank" rel="noreferrer">Busit (Waikato buses)</a></li>
                <li><a href="https://www.waikatodistrict.govt.nz" target="_blank" rel="noreferrer">Waikato District Council</a></li>
              </ul>
            </div>
            <div>
              <h4>{T.footEm}</h4>
              <ul className="sb-footer-numbers">
                <li>{T.em111}: <strong>111</strong></li>
                <li>{T.em105}: <strong>105</strong></li>
                <li>Healthline: <strong>0800 611 116</strong></li>
                <li>Anglesea Urgent Care: <strong>07 858 0800</strong></li>
              </ul>
            </div>
            <div className="sb-footer-disclaimer">
              <h4>{T.footDisc}</h4><p>{T.footDiscP}</p><p>{T.indep}</p>
              <p>{T.wxBy} <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>)</p>
              <button data-testid="credits-btn" onClick={() => setShowCredits(true)} className="sb-action">{T.photoCredits}<ArrowUpRight /></button>
            </div>
          </div>
          <div className="sb-footer-bottom">
            <p>© 2026 {lang === 'zh' ? '汉密尔顿生活指南 · Hamilton Local' : 'Hamilton Local'}</p>
            <span>Hamilton · Waikato · New Zealand</span>
          </div>
        </div>
      </footer>
      {showCredits && (
        <div data-testid="credits" className="sb-modal-backdrop" onClick={() => setShowCredits(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="credits-title" className="sb-card sb-modal" onClick={e => e.stopPropagation()}>
            <div className="sb-modal-heading"><h2 id="credits-title">{T.creditsH}</h2>
              <button onClick={() => setShowCredits(false)} className="sb-action">{T.close}<X /></button>
            </div>
            <p className="sb-modal-intro">{T.creditsP}</p>
            <ul className="sb-credits-list">
              <li>
                <span className="sb-credit-place">{lang === 'zh' ? T.heroImg + ' · ' + HERO.zh : T.heroImg + ' · ' + HERO.name}</span>
                <span>{T.cAuthor}: {HERO.credit}</span>
                <span><a href={HERO.licenseUrl} target="_blank" rel="noreferrer">{HERO.license}</a> · <a href={HERO.source} target="_blank" rel="noreferrer">{T.cSource}</a></span>
              </li>
              <li>
                <span className="sb-credit-place">{lang === 'zh' ? T.interludeImg + ' · ' + LAKE_BAND.zh : T.interludeImg + ' · ' + LAKE_BAND.name}</span>
                <span>{T.cAuthor}: {LAKE_BAND.credit}</span>
                <span><a href={LAKE_BAND.licenseUrl} target="_blank" rel="noreferrer">{LAKE_BAND.license}</a> · <a href={LAKE_BAND.source} target="_blank" rel="noreferrer">{T.cSource}</a></span>
              </li>
              {(PLACES as any[]).filter(p => p.photo).map(p => (
                <li key={p.id}>
                  <span className="sb-credit-place">{lang === 'zh' ? p.zh + ' · ' + p.name : p.name}</span>
                  <span>{T.cAuthor}: {p.photoCredit}</span>
                  <span><a href={p.photoLicenseUrl} target="_blank" rel="noreferrer">{p.photoLicense}</a> · <a href={p.photoSource} target="_blank" rel="noreferrer">{T.cSource}</a></span>
                </li>))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

