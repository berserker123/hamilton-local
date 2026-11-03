import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Trash2, Phone, MapPin, Clock, Calendar, ShieldCheck,
  Stethoscope, Copy, ChevronRight, X, Sparkles, AlertCircle,
  Sun, Cloud, CloudRain, CloudSun, CloudFog, CloudLightning, Snowflake, Droplets, ExternalLink, Globe, Umbrella, Bus
} from 'lucide-react';
import PLACES from './places.json';

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
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
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
        className="flex items-center gap-1.5 bg-teal-900/60 hover:bg-teal-900 px-2.5 py-1.5 rounded-full border border-teal-700 text-xs text-teal-50 transition">
        <Icon className="w-4 h-4 text-amber-300" />
        {cur ? (<><span className="font-bold">{Math.round(cur.temperature_2m)}°</span><span className="hidden sm:inline text-teal-200">{lang === 'zh' ? info!.zh : info!.en}</span></>)
          : <span className="text-teal-200">{error ? T.wx.err : T.wx.loading}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label={T.wx.city} data-testid="wx-card"
          className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[68px] sm:top-full sm:mt-2 sm:w-[360px] z-50 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-500">{T.wx.city} · {T.wx.now}</div>
              {cur ? (
                <div className="flex items-center gap-3 mt-1">
                  <Icon className="w-10 h-10 text-amber-500" />
                  <div>
                    <div className="text-4xl font-extrabold tracking-tight">{Math.round(cur.temperature_2m)}°C</div>
                    <div className="text-xs text-slate-500">{lang === 'zh' ? info!.zh : info!.en} · {T.wx.feels} {Math.round(cur.apparent_temperature)}°</div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-500">{error ? T.wx.err : T.wx.loading}
                  {error && <button onClick={reload} className="ml-2 text-teal-700 underline">{T.wx.retry}</button>}</div>
              )}
            </div>
            <button onClick={() => setOpen(false)} aria-label={T.wx.close} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          {d && (<>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
              <div className="bg-slate-50 rounded-xl p-2"><div className="text-slate-500">{T.wx.hi}</div><div className="font-bold text-base">{Math.round(d.temperature_2m_max[0])}°</div></div>
              <div className="bg-slate-50 rounded-xl p-2"><div className="text-slate-500">{T.wx.lo}</div><div className="font-bold text-base">{Math.round(d.temperature_2m_min[0])}°</div></div>
              <div className="bg-sky-50 rounded-xl p-2"><div className="text-slate-500">{T.wx.rain}</div><div className="font-bold text-base text-sky-700">{d.precipitation_probability_max[0] ?? '–'}%</div></div>
            </div>
            <div className="mt-3 flex gap-2 items-start bg-emerald-50 text-emerald-900 text-xs rounded-xl p-3 leading-relaxed">
              <Umbrella className="w-4 h-4 shrink-0 mt-0.5" /><span>{tip}</span>
            </div>
            <div className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{T.wx.next}</div>
            <div className="grid grid-cols-5 gap-1 mt-2 text-center text-xs">
              {d.time.slice(1, 6).map((day: string, i: number) => {
                const k = i + 1; const wi = wxInfo(d.weather_code[k]); const DI = wi.Icon;
                const dow = new Date(day + 'T12:00:00').getDay();
                return (
                  <div key={day} className="rounded-xl py-2 bg-slate-50">
                    <div className="text-slate-500">{T.days[dow]}</div>
                    <DI className="w-5 h-5 mx-auto my-1 text-slate-600" />
                    <div className="font-semibold">{Math.round(d.temperature_2m_max[k])}°<span className="text-slate-400 font-normal">/{Math.round(d.temperature_2m_min[k])}°</span></div>
                    <div className="text-[10px] text-sky-700 flex items-center justify-center gap-0.5"><Droplets className="w-3 h-3" />{d.precipitation_probability_max[k] ?? '–'}%</div>
                  </div>);
              })}
            </div>
          </>)}
          <div className="mt-3 text-[10px] text-slate-400">{T.wx.src}</div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <span className="w-2.5 h-6 bg-teal-600 rounded-full inline-block"></span><span>{title}</span>
      </h2>
      <p className="text-sm text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function SourceLinks({ urls, label }: { urls: string[]; label: string }) {
  return (
    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-2">
      <span>{label}:</span>
      {urls.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer" className="underline hover:text-teal-700">{new URL(u).hostname.replace('www.', '')}{urls.length > 1 ? '' : ''}</a>)}
    </div>
  );
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
  const [toolTab, setToolTab] = useState<'bins' | 'transport' | 'urgent'>('bins');
  const [smType, setSmType] = useState('all');
  const [now, setNow] = useState(nzNow());
  useEffect(() => { const t = setInterval(() => setNow(nzNow()), 60000); return () => clearInterval(t); }, []);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };
  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    showToast(T.copied(label));
  };
  const go = (id: string) => { setActiveTab(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

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
    { k: 'red', color: 'bg-red-500 text-white border-red-600', label: T.red, note: T.redNote, week: T.redWeek },
    { k: 'yellow', color: 'bg-yellow-400 text-yellow-950 border-yellow-500', label: T.yellow, note: T.yellowNote, week: T.yellowWeek },
    { k: 'glass', color: 'bg-sky-600 text-white border-sky-700', label: T.glass, note: T.glassNote, week: T.yellowWeek },
    { k: 'food', color: 'bg-emerald-600 text-white border-emerald-700', label: T.food, note: T.foodNote, week: T.weekly },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      {toastMessage && (
        <div role="status" className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-xl text-sm font-medium flex items-center gap-2 max-w-[90vw]">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" /><span>{toastMessage}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-teal-800 text-white shadow-md border-b border-teal-700/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button className="flex items-center gap-3 text-left min-w-0" onClick={() => go('home')}>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 text-teal-950 flex items-center justify-center font-black text-lg shadow-inner">
              {lang === 'zh' ? '汉' : 'HL'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight truncate">{T.brand}</span>
                {lang === 'zh' && <span className="hidden sm:inline text-[10px] bg-teal-900/80 text-teal-200 border border-teal-600 px-1.5 py-0.5 rounded-full">Hamilton Local</span>}
              </div>
              <p className="text-[11px] text-teal-200/80 hidden sm:block">{T.sub}</p>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {NAV.map(id => (
              <button key={id} onClick={() => go(id)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${activeTab === id ? 'bg-teal-700 text-white font-bold shadow-sm' : 'text-teal-100 hover:bg-teal-700/50 hover:text-white'}`}>
                {T.nav[id]}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <WeatherPill lang={lang} T={T} />
            <button data-testid="lang" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} aria-label="Switch language"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-teal-600 bg-teal-900/40 hover:bg-teal-900 text-xs font-bold">
              <Globe className="w-3.5 h-3.5" />{lang === 'zh' ? 'EN' : '中'}
            </button>
          </div>
        </div>

        <div className="flex lg:hidden overflow-x-auto px-2 py-2 bg-teal-900/90 border-t border-teal-700/50 text-xs gap-1 no-scrollbar">
          {NAV.slice(1).map(id => (
            <button key={id} onClick={() => go(id)} className="px-3 py-1.5 bg-teal-800/80 rounded-full text-teal-50 whitespace-nowrap active:bg-teal-700">{T.nav[id]}</button>
          ))}
        </div>
      </header>

      <section id="home" className="bg-gradient-to-b from-teal-800 via-teal-900 to-slate-900 text-white py-12 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-3xl mx-auto space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 shrink-0" /><span>{T.heroBadge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {T.heroA}<span className="text-emerald-400">{T.heroB}</span>
          </h1>
          <p className="text-teal-100 text-[15px] sm:text-base max-w-xl mx-auto leading-relaxed">{T.heroP}</p>
          <form onSubmit={e => { e.preventDefault(); if (q) { showToast(T.filterKw(searchQuery)); document.getElementById('supermarkets')?.scrollIntoView({ behavior: 'smooth' }); } }}
            className="max-w-xl mx-auto bg-white rounded-2xl p-1.5 shadow-2xl flex items-center text-slate-800 border-2 border-teal-400/50">
            <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
            <input type="search" aria-label={T.search} placeholder={T.searchPh} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full min-w-0 px-3 py-2 text-base sm:text-sm outline-none bg-transparent placeholder:text-slate-400" />
            {searchQuery && <button type="button" aria-label={T.clear} onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600 mr-1"><X className="w-4 h-4" /></button>}
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition shrink-0 shadow-md">{T.search}</button>
          </form>
          <div className="flex flex-wrap justify-center gap-2 pt-1 text-xs">
            {['Hamilton Central', 'Frankton', 'Hamilton East', 'Chartwell', 'Cambridge', 'Raglan'].map(sub => (
              <button key={sub} onClick={() => setSearchQuery(sub)} className="bg-teal-800/80 hover:bg-teal-700 border border-teal-600/50 px-2.5 py-1 rounded-full text-teal-100 transition flex items-center gap-1">
                <MapPin className="w-3 h-3" />{sub}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-6xl w-full mx-auto px-4 py-10 space-y-16 flex-1">
        {/* 1. TOOLBOX */}
        <section id="tools" className="scroll-mt-28">
          <div className="flex items-start justify-between mb-5 gap-3">
            <SectionTitle title={T.toolsH} sub={T.toolsP} />
            <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 font-medium px-2.5 py-1 rounded-full hidden sm:block whitespace-nowrap">{T.checkedBadge}</span>
          </div>
          <div role="tablist" className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
            {([['bins', Trash2], ['transport', Bus], ['urgent', Stethoscope]] as const).map(([id, Ic]) => (
              <button key={id} role="tab" aria-selected={toolTab === id} data-testid={'tab-' + id} onClick={() => setToolTab(id)}
                className={`rounded-2xl p-3 sm:p-4 text-left border transition flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 ${toolTab === id ? 'bg-teal-800 text-white border-teal-800 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'}`}>
                <span className={`p-2 rounded-xl self-start sm:self-auto ${toolTab === id ? 'bg-teal-700' : id === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-700'}`}><Ic className="w-5 h-5" /></span>
                <span className="min-w-0"><span className="block font-bold text-sm sm:text-base">{T.tabs[id]}</span>
                  <span className={`hidden sm:block text-xs ${toolTab === id ? 'text-teal-100' : 'text-slate-500'}`}>{T.tabsSub[id]}</span></span>
              </button>))}
          </div>

          {toolTab === 'bins' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="p-3 bg-teal-50 text-teal-700 rounded-xl"><Trash2 className="w-6 h-6" /></div>
                  <div><h3 className="font-bold text-slate-900 text-base">{T.binH}</h3><p className="text-xs text-slate-500">{T.binP}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{ w: T.redWeek, items: [bins[0], bins[3]] }, { w: T.yellowWeek, items: [bins[1], bins[2], bins[3]] }].map((col, ci) => (
                    <div key={ci} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />{col.w}
                      </div>
                      <div className="space-y-2">
                        {col.items.map(b => (
                          <div key={b.k} className={`p-2.5 rounded-lg border text-xs shadow-sm ${b.color}`}>
                            <div className="font-bold">{b.label}</div><div className="opacity-90 mt-0.5">{b.note}</div>
                          </div>))}
                      </div>
                    </div>))}
                </div>
                <div className="mt-4 bg-teal-50/70 p-3.5 rounded-xl border border-teal-100 text-sm text-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="leading-relaxed">{T.binDay}</span>
                  <a href={HCC_LOOKUP} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center justify-center gap-1 bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold">
                    {T.lookup}<ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-start text-xs text-slate-600 gap-2"><Clock className="w-4 h-4 text-amber-500 shrink-0" /><span>{T.binTip}</span></div>
                <SourceLinks urls={[HCC_LOOKUP, HCC_FAQ]} label={T.srcs} />
              </div>
            </div>
          )}

          {toolTab === 'transport' && (
            <div data-testid="panel-transport" className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-50 text-teal-700 rounded-xl"><Bus className="w-6 h-6" /></div>
                <div><h3 className="font-bold text-slate-900 text-base">{T.busH}</h3><p className="text-xs text-slate-500">{T.busP}</p></div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{T.hf}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {ROUTES.filter(r => r.hf).map(r => (
                    <a key={r.slug} href={B + r.slug + '/'} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition">
                      <span className="w-10 h-10 shrink-0 rounded-xl bg-violet-600 text-white font-black flex items-center justify-center">{r.n}</span>
                      <span className="min-w-0"><span className="block font-bold text-sm text-slate-900">{r.name}</span><span className="block text-xs text-slate-500">{lang === 'zh' ? r.zh : r.en}</span></span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
                    </a>))}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{T.allRoutes}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {ROUTES.filter(r => !r.hf).map(r => (
                    <a key={r.slug} href={B + r.slug + '/'} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-100 text-sm">
                      <span className="min-w-[2.25rem] h-7 px-1 rounded-md bg-teal-700 text-white text-xs font-bold flex items-center justify-center">{r.n}</span>
                      <span className="text-slate-700 leading-tight">{r.name}</span>
                    </a>))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {[
                  { href: 'https://www.busit.co.nz/', t: T.planner, p: T.plannerP },
                  { href: 'https://www.busit.co.nz/using-the-bus/transit-app/', t: T.transit, p: T.transitP },
                  { href: 'https://www.busit.co.nz/fares/', t: T.bee, p: T.beeP },
                ].map(x => (
                  <a key={x.href} href={x.href} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 hover:border-teal-300">
                    <span className="font-bold text-teal-900 flex items-center gap-1">{x.t}<ExternalLink className="w-3.5 h-3.5" /></span>
                    <span className="block text-xs text-teal-800/80 mt-1 leading-relaxed">{x.p}</span>
                  </a>))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex flex-wrap gap-3">
                  <a href="https://www.busit.co.nz/using-the-bus/map-city-and-regional-bus-routes/" target="_blank" rel="noreferrer" className="underline text-teal-700">{T.mapL}</a>
                  <a href="https://www.busit.co.nz/fares/beecard/" target="_blank" rel="noreferrer" className="underline text-teal-700">Bee Card</a>
                  <a href="tel:0800205305" className="underline text-teal-700">{T.busHelp}</a>
                </span>
                <SourceLinks urls={['https://www.busit.co.nz/hamilton-routes/']} label={T.srcs + ' ' + CHECKED} />
              </div>
            </div>
          )}

          {toolTab === 'urgent' && (
            <div data-testid="panel-urgent" className="space-y-4">
              <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><AlertCircle className="w-5 h-5 shrink-0" />{T.life} <a href="tel:111" className="text-xl underline font-extrabold">111</a></div>
                <a href="tel:0800611116" className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-3 py-2 text-sm"><ShieldCheck className="w-4 h-4 text-emerald-200" />{T.healthline}: <strong>0800 611 116</strong><span className="text-[11px] text-red-100">· {T.healthlineNote}</span></a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {URGENT.map(c => {
                  const isOpen = now >= c.open[0] && now < c.open[1];
                  return (
                    <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{lang === 'zh' ? c.zh : c.name}</h3>
                          <span data-testid="open-status" className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>{isOpen ? T.openNow : T.closedNow}</span>
                        </div>
                        <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                          <div className="flex gap-2"><Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" /><span className="font-semibold text-slate-800">{c.hours[lang]}</span></div>
                          <div className="flex gap-2"><MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" /><span>{c.address}</span></div>
                          <p className="text-xs text-slate-500 pl-6">{c.note[lang]}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <SourceLinks urls={c.sources} label={T.srcs} />
                        <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{c.phone}</a>
                      </div>
                    </div>);
                })}
              </div>
              <p className="text-xs text-slate-500">{T.nowNote} {T.checkedBadge}.</p>
            </div>
          )}
        </section>

        {/* 2. SUPERMARKETS */}
        <section id="supermarkets" className="scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <SectionTitle title={T.smH} sub={T.smP} />
            <span className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto whitespace-nowrap">{T.smCount(SUPERMARKETS.length)} · {CHECKED}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs mb-5">
            {SM_TYPES.map(c => (
              <button key={c.id} data-testid={'sm-' + c.id} onClick={() => setSmType(c.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition ${smType === c.id ? 'bg-teal-800 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                {c[lang]} <span className="opacity-60">{c.id === 'all' ? SUPERMARKETS.length : SUPERMARKETS.filter(x => x.type === c.id).length}</span>
              </button>))}
          </div>
          {filteredSupermarkets.length === 0 ? <div className="p-8 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">{T.noMatch}</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSupermarkets.map(sup => (
              <div key={sup.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-slate-900 text-base">{lang === 'zh' ? sup.zhName : sup.name}</h3>
                    <span className="shrink-0 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded">{SM_TYPES.find(t => t.id === sup.type)![lang]}</span></div>
                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" /><span>{sup.address}</span></p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-start gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-px" /><span>{sup.hours ? sup.hours[lang] : T.hoursUnknown}</span></div>
                    <a href={`tel:${sup.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-teal-700"><Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" /><span>{sup.phone}</span></a>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {sup.tags[lang].map((tag, i) => <span key={i} className="text-[11px] bg-teal-50 text-teal-800 border border-teal-100 px-2.5 py-0.5 rounded-full font-medium">{tag}</span>)}
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <SourceLinks urls={sup.sources} label={T.srcs} />
                  <button onClick={() => copyToClipboard(sup.address, sup.name)} className="shrink-0 text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/60">
                    <Copy className="w-3.5 h-3.5" /><span>{T.copyAddr}</span></button>
                </div>
              </div>))}
          </div>)}
        </section>

        {/* 3. WEEKEND */}
        <section id="weekend" className="scroll-mt-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-3">
            <SectionTitle title={T.wkH} sub={T.wkP} />
            <div className="flex flex-wrap gap-1.5 text-xs">
              {DEST_CATS.map(cat => (
                <button key={cat.id} onClick={() => setSelectedDestCat(cat.id)}
                  className={`px-3 py-1.5 rounded-full font-medium transition ${selectedDestCat === cat.id ? 'bg-teal-800 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                  {cat[lang]}
                </button>))}
            </div>
          </div>
          {filteredDestinations.length === 0 ? <div className="p-8 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">{T.noMatch}</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((p: any) => (
              <article key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-teal-300 hover:shadow-md transition">
                <div className="relative aspect-[16/10] bg-gradient-to-br from-teal-700 to-emerald-800">
                  {p.photo ? <img src={`./photos/${p.photo}`} alt={lang === 'zh' ? p.photoAlt : p.en.photoAlt} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0 flex items-center justify-center text-teal-100/70 text-sm font-semibold px-6 text-center">{p.name}</div>}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="text-[11px] bg-white/90 text-slate-800 font-semibold px-2 py-0.5 rounded-full">{T.km.replace('{n}', p.km)}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.free ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-white'}`}>{p.free ? T.freeTag : T.paidTag}</span>
                    {p.indoor && <span className="text-[11px] bg-sky-600 text-white font-semibold px-2 py-0.5 rounded-full">{T.indoorTag}</span>}
                  </div>
                </div>
                <div className="p-4 space-y-2 flex-1">
                  <div className="text-[11px] font-semibold text-teal-700">{lang === 'zh' ? p.tag : p.en.tag}</div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">{lang === 'zh' ? <>{p.zh} <span className="text-slate-400 font-medium text-sm">{p.name}</span></> : p.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{lang === 'zh' ? p.description : p.en.description}</p>
                  <dl className="text-xs text-slate-500 space-y-1 pt-1">
                    <div className="flex gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0 mt-px text-teal-600" /><dd className="line-clamp-2">{lang === 'zh' ? p.hours : p.en.hours}</dd></div>
                    <div className="flex gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 mt-px text-teal-600" /><dd>{p.address}</dd></div>
                  </dl>
                </div>
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] text-slate-400 truncate">
                    {p.photo && <>{T.photoBy}: <a href={p.photoSource} target="_blank" rel="noreferrer" className="underline">{p.photoCredit}</a>, <a href={p.photoLicenseUrl} target="_blank" rel="noreferrer" className="underline">{p.photoLicense}</a></>}
                  </span>
                  <a href={p.url} target="_blank" rel="noreferrer" className="shrink-0 text-teal-700 font-semibold hover:text-teal-900 flex items-center gap-0.5">{T.official}<ChevronRight className="w-3.5 h-3.5" /></a>
                </div>
              </article>))}
          </div>)}
        </section>

        </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-4 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-black">{lang === 'zh' ? '汉' : 'HL'}</span>
              <span>{T.brand}</span>
            </div>
            <p className="leading-relaxed">{T.footAbout}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-200 mb-3 uppercase tracking-wider">{T.footLinks}</h4>
            <ul className="space-y-2">
              <li><a href="https://hamilton.govt.nz" target="_blank" rel="noreferrer" className="hover:text-teal-300">Hamilton City Council</a></li>
              <li><a href="https://www.busit.co.nz" target="_blank" rel="noreferrer" className="hover:text-teal-300">Busit (Waikato buses)</a></li>
              <li><a href="https://www.waikatodistrict.govt.nz" target="_blank" rel="noreferrer" className="hover:text-teal-300">Waikato District Council</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-200 mb-3 uppercase tracking-wider">{T.footEm}</h4>
            <ul className="space-y-1.5">
              <li>{T.em111}: <strong className="text-white">111</strong></li>
              <li>{T.em105}: <strong className="text-white">105</strong></li>
              <li>Healthline: <strong className="text-white">0800 611 116</strong></li>
              <li>Anglesea Urgent Care: <strong className="text-white">07 858 0800</strong></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-200 mb-3 uppercase tracking-wider">{T.footDisc}</h4>
            <p className="leading-relaxed text-slate-500">{T.footDiscP}</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-slate-500 text-[11px] gap-2">
          <p>© 2026 {lang === 'zh' ? '汉密尔顿生活指南 · Hamilton Local' : 'Hamilton Local'}</p>
          <span>Hamilton · Waikato · New Zealand</span>
        </div>
      </footer>
    </div>
  );
}
