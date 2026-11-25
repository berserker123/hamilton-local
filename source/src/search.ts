import { href } from './site-routes.mjs';
import { SUPERMARKETS } from './local-data';
import PLACES from './places.json';
import PLAYGROUNDS from './playgrounds.json';
import BLACKFRIDAY from './data/blackfriday.json';
import { Deal, matchesDealQuery } from './blackfriday-model';
import TALK from './data/river-talk.json';
import { activeArticles, activeNews, talkHref } from './river-talk.mjs';
import FOOD from './data/food-guide.json';
import { FOOD_OCCASIONS } from './food-guide.mjs';

export type SearchResultItem = {
  id: string;
  href: string;
  tagZh: string;
  tagEn: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
};

export const POPULAR_SUGGESTIONS: readonly SearchResultItem[] = [
  {
    id: 'bins', href: href('tools', 'bins'),
    tagZh: '实用工具', tagEn: 'Daily Essentials',
    titleZh: '垃圾分类与收运', titleEn: 'Rubbish & recycling',
    descZh: 'HCC 红桶、黄桶、玻璃箱与厨余桶分类说明及地址查询入口', descEn: 'HCC red, yellow, glass & food scrap bin guide and address lookup',
  },
  {
    id: 'urgent', href: href('tools', 'urgent', undefined, 'urgent-clinics'),
    tagZh: '实用工具', tagEn: 'Daily Essentials',
    titleZh: '急诊信息与健康热线', titleEn: 'Urgent care & Healthline',
    descZh: 'Hamilton 急诊诊所地址、时间与免费 24/7 Healthline', descEn: 'Hamilton urgent care clinics, hours and free 24/7 Healthline',
  },
  {
    id: 'checklist', href: href('tools', 'checklist', undefined, 'tool-checklist'),
    tagZh: '实用工具', tagEn: 'Daily Essentials',
    titleZh: '新移民办事清单（含登记家庭医生）', titleEn: 'New Arrival Checklist (incl. GP enrolment)',
    descZh: '税号 IRD、银行开户、海外驾照转换、登记家庭医生与社区服务卡', descEn: 'IRD number, bank account, licence conversion, GP enrolment & CSC',
  },
  {
    id: 'blackfriday', href: href('living', 'blackfriday'),
    tagZh: '本地生活', tagEn: 'Local Living',
    titleZh: '黑五专区 · 真假优惠对比', titleEn: 'Black Friday · Real savings check',
    descZh: '用近 90 天平时价核对热门商品与数码家电折扣', descEn: 'Compare current retailer prices against 90-day typical prices',
  },
  {
    id: 'grocers', href: href('living', 'grocers'),
    tagZh: '本地生活', tagEn: 'Local Living',
    titleZh: '亚超与杂货', titleEn: 'Asian grocers',
    descZh: '按门店与区域查找 Hamilton 亚洲超市与日常采买地点', descEn: 'Find Hamilton Asian supermarkets by store, suburb or address',
  },
  {
    id: 'playgrounds', href: href('kids', 'map'),
    tagZh: '亲子遛娃', tagEn: 'Kids & Family',
    titleZh: 'Playground 地图', titleEn: 'Playground map',
    descZh: '按设施与区域筛选游乐场，含地址与导航', descEn: 'Filter playgrounds by facilities and area with map directions',
  },
  {
    id: 'whatson', href: href('weekend', 'picks'),
    tagZh: '周末活动', tagEn: "What's On",
    titleZh: '周末活动日历', titleEn: 'Events Calendar',
    descZh: '本周本地活动、演出与周末集市', descEn: 'This week’s local events, shows and weekend markets',
  },
  {
    id: 'pay', href: href('tools', 'pay', undefined, 'tool-pay'),
    tagZh: '实用工具', tagEn: 'Daily Essentials',
    titleZh: '税后收入与单位换算', titleEn: 'Pay calculator & converters',
    descZh: '2026–27 新西兰税后工资、GST 15% 与日常单位换算', descEn: '2026–27 NZ take-home pay, GST 15% and everyday unit converters',
  },
];

const GP_PATTERN = /\b(?:gp|doctors?|family\s*doctor|general\s*practitioner)\b|家庭医生|全科医生|找医生|看医生|看病/i;
const PLAYGROUND_PATTERN = /\bplaygrounds?\b|游乐场|儿童乐园|滑梯/i;
const BLACKFRIDAY_GENERIC = /黑五|black\s*friday/i;
const GROCER_GENERIC = /亚超|亚洲超市|华人超市|杂货|asian\s*grocer|grocers?|supermarkets?/i;

const TALK_COLUMN = /屯里|二三事|tron\s*talk|市政大白话|人生通关|通关攻略|抠门研究所|喊一嗓子|^(?:每日)?快讯$|^新闻$|^news$|^daily\s*briefing$/i;

const DAILY_EXTRA_IDS = ['zealong', 'te-awa', 'sanctuary-mountain', 'wairere-falls'];
const DAILY_PLACES = PLACES.filter(p => p.id !== 'magical-bridge' && ((p.km != null && p.km <= 10 && !p.indoor) || DAILY_EXTRA_IDS.includes(p.id)));
const DEALS = BLACKFRIDAY as Deal[];

function isMeaningfulToken(q: string): boolean {
  return q.length >= 2 || /[\u3400-\u9fff]/.test(q);
}

/** Current column articles whose text contains the query. Single characters are too broad to match. */
function talkMatches(q: string, now = Date.now()): SearchResultItem[] {
  if (Array.from(q).length < 2) return [];
  const lower = q.toLowerCase();
  return activeArticles(TALK, now).filter(a => {
    const board = TALK.boards.find(b => b.id === a.board);
    return [a.titleZh, a.titleEn, a.answerZh, a.answerEn, a.whoZh, a.whoEn, ...a.factsZh, ...a.factsEn, ...a.actionsZh, ...a.actionsEn, board?.zh, board?.en]
      .join(' ').toLowerCase().includes(lower);
  }).map(a => {
    const board = TALK.boards.find(b => b.id === a.board);
    return {
      id: 'talk-' + a.id, href: talkHref(a.id),
      tagZh: '屯里二三事 · ' + (board?.zh || ''), tagEn: 'Tron Talk · ' + (board?.en || ''),
      titleZh: a.titleZh, titleEn: a.titleEn, descZh: a.answerZh, descEn: a.answerEn,
    };
  });
}

function talkNewsMatches(q: string, now = Date.now()): SearchResultItem[] {
  if (Array.from(q).length < 2) return [];
  const lower = q.toLowerCase();
  return activeNews(TALK, now).filter(n => [n.titleZh, n.titleEn, n.bodyZh, n.bodyEn, n.takeZh, n.takeEn].join(' ').toLowerCase().includes(lower)).map(n => ({
    id: 'talk-news-' + n.id, href: talkHref(), tagZh: '屯里二三事 · 屯里这阵子', tagEn: 'Tron Talk · Lately',
    titleZh: n.titleZh, titleEn: n.titleEn, descZh: n.bodyZh, descEn: n.bodyEn,
  }));
}

const FOOD_WORDS = /美食|餐厅|饭店|吃饭|好吃|早茶|饮茶|生日|约会|素食|聚餐|食堂|restaurant|dining|food|eat|yum cha|dim sum|vegetarian|birthday/i;

function foodMatches(q: string): SearchResultItem[] {
  if (Array.from(q).length < 2) return [];
  const lower = q.toLowerCase();
  const places = FOOD.places.filter(p => [p.name, p.cuisineZh, p.cuisineEn, p.suburb, ...p.occasions.flatMap(o => [o.whyZh, o.whyEn]), ...p.facts.flatMap(f => [f.zh, f.en])].join(' ').toLowerCase().includes(lower));
  const results: SearchResultItem[] = places.slice(0, 6).map(p => {
    const first = p.occasions[0];
    const occasion = FOOD_OCCASIONS.find(o => o.id === first.id)!;
    return {
      id: 'food-' + p.id, href: href('living', 'dining') + '?o=' + first.id, tagZh: '本地生活 · 屯里食堂 · ' + occasion.zh, tagEn: 'Local Living · Tron Eats · ' + occasion.en,
      titleZh: p.name, titleEn: p.name, descZh: [p.cuisineZh, first.whyZh].filter(Boolean).join(' · '), descEn: [p.cuisineEn, first.whyEn].filter(Boolean).join(' · '),
    };
  });
  if (!results.length && FOOD_WORDS.test(q)) results.push({
    id: 'food-guide', href: href('living', 'dining'), tagZh: '本地生活 · 屯里食堂', tagEn: 'Local Living · Tron Eats',
    titleZh: '屯里食堂：按场合找地方吃饭', titleEn: 'Tron Eats: where to eat, by occasion',
    descZh: '带爸妈、过生日、带娃、约会、聚餐、请客户、一个人吃、素食、日常好吃、网红打卡，还有生日福利。', descEn: 'With parents, birthdays, kids, dates, groups, clients, solo, vegetarian, everyday, trending and birthday perks.',
  });
  return results;
}

/** Multi-destination matches displayed on the /search/ page (e.g. GP -> Urgent care + Arrival checklist). */
export function searchMatches(query: string): SearchResultItem[] {
  const q = query.trim();
  if (!q) return [];
  if (GP_PATTERN.test(q)) {
    return [
      {
        id: 'urgent-care',
        href: href('tools', 'urgent', undefined, 'urgent-clinics'),
        tagZh: '实用工具 · 急诊与医疗',
        tagEn: 'Daily Essentials · Urgent Care',
        titleZh: '急诊诊所与 Healthline 健康热线',
        titleEn: 'Urgent care clinics & Healthline',
        descZh: '查看 Anglesea 等急诊诊所营业时间与地址，或拨打免费 24/7 Healthline（0800 611 116）咨询就医建议。',
        descEn: 'Check Hamilton urgent care clinics and hours, or call free 24/7 Healthline (0800 611 116) for medical advice.',
      },
      {
        id: 'arrival-gp',
        href: href('tools', 'checklist', undefined, 'tool-checklist'),
        tagZh: '实用工具 · 新移民办事清单',
        tagEn: 'Daily Essentials · Arrival Checklist',
        titleZh: '新移民办事清单 · 登记家庭医生（GP）',
        titleEn: 'New Arrival Checklist · Enrol with a GP',
        descZh: '包含「04 · 登记家庭医生」完整步骤：确认公共医疗资助资格、联系接收新病人的诊所及准备材料。',
        descEn: 'Includes step “04 · Enrol with a GP”: check publicly funded eligibility, find a practice accepting new patients and prepare documents.',
      },
    ];
  }
  return [...talkMatches(q), ...talkNewsMatches(q), ...foodMatches(q)];
}

/** Resolves a search query to a destination URL. Never defaults unmatched queries to the grocers page. */
export function resolveSearch(query: string): string {
  const q = query.trim();
  if (!q) return href('search');

  if (TALK_COLUMN.test(q)) return talkHref();
  if (/床垫|床单|床笠|床尺寸|bed\s*sizes?|mattress\s*sizes?/i.test(q)) return href('tools', 'units', undefined, 'tool-beds');
  if (GP_PATTERN.test(q)) return href('search', undefined, q);
  if (PLAYGROUND_PATTERN.test(q)) return href('kids', 'map');
  if (isMeaningfulToken(q) && PLAYGROUNDS.some(p => [p.zh, p.name, p.area].join(' ').toLowerCase().includes(q.toLowerCase()))) {
    return href('kids', 'map');
  }

  if (BLACKFRIDAY_GENERIC.test(q)) return href('living', 'blackfriday');
  if (isMeaningfulToken(q) && DEALS.some(d => matchesDealQuery(d, q))) {
    return href('living', 'blackfriday', q);
  }

  if (/活动日历|events?\s*calendar|周末活动|what'?s\s*on/i.test(q)) return href('weekend', 'picks');
  if (/周末集市|集市|farmers?\s*market|weekend\s*market/i.test(q)) return href('weekend', 'markets');
  if (/派对|party|parties/i.test(q)) return href('kids', 'parties');
  if (/遛娃|亲子|family\s*outings?/i.test(q)) return href('kids', 'places');
  if (/采摘|u-?pick|草莓|蓝莓/i.test(q)) return href('living', 'upick');
  if (/住宿|stays?|hotel|motel/i.test(q)) return href('living', 'stays');
  if (/pet|宠物|兽医|vet|狗公园/i.test(q)) return href('services', 'pets', q);
  if (/pay|tax|salary|kiwi|税后|工资|时薪|最低工资/i.test(q)) return href('tools', 'pay');
  if (/gst|消费税/i.test(q)) return href('tools', 'gst');
  if (/unit|convert|换算|温度|公斤|市斤|面积/i.test(q)) return href('tools', 'units');
  if (/arrival|移民|清单|ird|税号|驾照|社区服务卡/i.test(q)) return href('tools', 'checklist');
  if (/fish|shellfish|pollen|flu|钓鱼|采集|贝类|花粉|流感/i.test(q)) return href('tools', 'seasonal');
  if (/bin|rubbish|recycl|垃圾/i.test(q)) return href('tools', 'bins');
  if (/bus|公交|巴士|orbiter|comet|meteor/i.test(q)) return href('tools', 'bus');
  if (/urgent|clinic|急诊|健康热线|healthline/i.test(q)) return href('tools', 'urgent', undefined, 'urgent-clinics');
  if (/weather|school|天气|学区|学期|假期|停水|停电|油价|充电|工具/i.test(q)) return href('tools', 'other');

  const lower = q.toLowerCase();
  if (isMeaningfulToken(q)) {
    const matchesStore = SUPERMARKETS.some(s =>
      [s.name, s.zhName, s.brand, s.address, s.suburb, ...s.tags.zh, ...s.tags.en].join(' ').toLowerCase().includes(lower),
    );
    if (matchesStore) return href('living', 'grocers', q);
  }
  if (GROCER_GENERIC.test(q)) return href('living', 'grocers');

  if (isMeaningfulToken(q)) {
    const matchesPlace = DAILY_PLACES.some(p =>
      [p.zh, p.name, p.area, p.description, p.en.description].join(' ').toLowerCase().includes(lower),
    );
    if (matchesPlace) return href('living', 'places', q);
  }

  return href('search', undefined, q);
}
