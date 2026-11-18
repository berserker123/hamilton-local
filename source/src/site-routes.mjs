// Shared by the SPA and the static GitHub Pages build.
export const SECTION_ORDER = ['home','tools','living','weekend','kids','services'];
export const TOOL_TABS = [
  ['bins','垃圾清运','Bins'], ['urgent','急诊信息','Urgent care'], ['bus','市区公交','City buses'],
  ['pay','税后收入','Pay calculator'], ['checklist','新移民清单','Arrival checklist'],
  ['gst','GST计算','GST calculator'], ['units','单位换算','Unit converter'],
  ['seasonal','季节提醒','Seasonal'], ['other','其他工具','Other tools'],
];
const toolAnchors = {
  'tool-bins':'bins', 'urgent-clinics':'urgent', 'tool-transport':'bus', 'tool-pay':'pay', 'tool-checklist':'checklist',
  'tool-gst':'gst', 'tool-units':'units', 'tool-fishing':'seasonal', 'tool-pollen-flu':'seasonal',
  'tool-school-terms':'other', 'tool-find-school':'other',
  'tool-weather':'other', 'tool-outages':'other', 'tool-government':'other', 'tool-fuel':'other',
};
const petAnchors = new Set(['pets', ...['shops','boarding','grooming','vets','dog-parks','daycare'].map(id=>'pet-'+id)]);
export const AT_IDS = new Set(['stays','upick','everyday-places',...Object.keys(toolAnchors),...petAnchors]);
export function canonicalHash(hash) {
  const bare = hash.slice(1);
  if (petAnchors.has(bare)) return '#/services?tab=pets&at='+bare;
  if (Object.hasOwn(toolAnchors,bare)) return '#/tools?tab='+toolAnchors[bare]+'&at='+bare;
  if (!hash.startsWith('#/')) return '#/';
  const [path,query] = hash.slice(2).split('?');
  const params = new URLSearchParams(query);
  if (path === 'tools') {
    if (params.get('tab') === 'transport') {
      params.set('tab','bus');
      if (!params.has('at')) params.set('at','tool-transport');
    }
    const at = params.get('at') || '';
    if (Object.hasOwn(toolAnchors,at)) params.set('tab',toolAnchors[at]);
    return '#/tools'+(params.size?'?'+params:'');
  }
  if (path === 'weekend' && params.get('tab') === 'festivals') {
    params.set('tab','picks');
    return '#/weekend?'+params;
  }
  if (path === 'living' && (params.get('tab') === 'pets' || petAnchors.has(params.get('at') || ''))) {
    params.set('tab','pets');
    return '#/services?'+params;
  }
  return hash;
}

export const SITE_ORIGIN = 'https://hamiltonlocal.nz';
export const TABS = {
  living: [['grocers', '亚超与杂货', 'Asian grocers'], ['dining', '美食探索', 'Food discoveries'], ['places', '日常好去处', 'Everyday outings'], ['upick', '季节采摘', 'U-Pick farms'], ['stays', '精选住宿', 'Stays'], ['blackfriday', '黑五专区', 'Black Friday']],
  weekend: [['picks', '活动日历', 'Events Calendar'], ['markets', '周末集市', 'Weekend markets']],
  kids: [['map', 'Playground 地图', 'Playground map'], ['places', '遛娃好去处', 'Family outings'], ['parties', '派对与场地', 'Parties & venues']],
  services: [['home', '房屋维护', 'Home maintenance'], ['trades', '专业工种', 'Skilled trades'], ['daily', '生活便民', 'Everyday services'], ['pets', '宠物指南', 'Pet Guide'], ['advisors', '专业顾问', 'Professional Advice']],
  tools: TOOL_TABS,
};
const SECTIONS = {
  home: ['首页', 'Home', 'Hamilton Local：汉密尔顿本地生活、周末活动、亲子遛娃、便民黄页与实用工具。独立整理的本地生活指南。', 'An independent local guide to Hamilton: daily essentials, local living, events, family outings and local services.'],
  tools: ['实用工具', 'Daily Essentials', '把日常琐事，安排得更顺手。', 'The practical side of life, all in one place.'],
  living: ['本地生活', 'Local Living', '从一日三餐，到日常散步。', 'Groceries, good food and a little fresh air.'],
  weekend: ['周末活动', "What's On", '留一点时间，给周末。', 'Make a little room for the weekend.'],
  kids: ['亲子遛娃', 'Kids & Family', '陪孩子，把城市慢慢逛遍。', 'Small adventures, close to home.'],
  services: ['便民黄页', 'Local Services', '家里家外，总有需要帮忙的时候。', 'A little help for everyday life.'],
  privacy: ['隐私政策', 'Privacy Policy', 'Hamilton Local 隐私政策：我们如何处理访客统计、反馈与来信，以及你的隐私权利。', 'Hamilton Local privacy policy: how we handle visit statistics, feedback and emails, and your privacy rights.'],
  search: ['搜索结果', 'Search', '在 Hamilton Local 查找汉密尔顿本地生活、实用工具、周末活动与亲子信息。', 'Search Hamilton Local for daily essentials, local living, events and family outings.'],
};
export const NOINDEX_PATHS = new Set([
  '/living/dining/',
  '/services/home/',
  '/services/trades/',
  '/services/daily/',
  '/services/advisors/',
  '/search/',
]);
const sectionPath = route => route === 'weekend' ? 'whatson' : route;

export function href(route, tab, q, at) {
  const path = route === 'home' || !Object.hasOwn(SECTIONS, route) ? '/' : '/' + sectionPath(route) + '/' + (TABS[route]?.some(item => item[0] === tab) ? tab + '/' : '');
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (AT_IDS.has(at)) params.set('at', at);
  return path + (params.size ? '?' + params : '');
}

export const PAGES = [...SECTION_ORDER, 'privacy', 'search'].flatMap(route => {
  const section = SECTIONS[route];
  const make = (tab = '') => {
    const labels = TABS[route]?.find(item => item[0] === tab);
    const path = href(route, tab);
    return {
      path, route, tab: tab || TABS[route]?.[0][0] || '',
      noindex: NOINDEX_PATHS.has(path),
      zh: { title: (labels ? labels[1] + ' · ' + section[0] : section[0]) + ' · Hamilton Local', description: labels ? 'Hamilton Local · ' + section[0] + ' · ' + labels[1] + '：' + section[2] : section[2] },
      en: { title: (labels ? labels[2] + ' · ' + section[1] : section[1]) + ' · Hamilton Local', description: labels ? 'Hamilton Local · ' + section[1] + ' · ' + labels[2] + ': ' + section[3] : section[3] },
    };
  };
  return [make(), ...(TABS[route] || []).map(([tab]) => make(tab))];
});

function parse(pathname, search = '') {
  const parts = pathname.split('/').filter(Boolean);
  let route = parts[0] === 'whatson' ? 'weekend' : parts[0];
  const params = new URLSearchParams(search);
  if (parts[1]) params.set('tab', parts[1]);
  if (route === 'supermarkets') { route = 'living'; params.set('tab', 'grocers'); }
  if (!Object.hasOwn(SECTIONS, route)) route = 'home';
  // Reuse the current tool, pet and festival compatibility rules.
  const normalized = canonicalHash('#/' + (route === 'home' ? '' : route) + '?' + params);
  const [name, query] = normalized.slice(2).split('?');
  route = Object.hasOwn(SECTIONS, name) ? name : 'home';
  const next = new URLSearchParams(query);
  if (route === 'living' && next.get('tab') === 'places' && next.get('at') === 'upick') next.set('tab', 'upick');
  const tab = TABS[route]?.find(item => item[0] === next.get('tab'))?.[0] || TABS[route]?.[0][0] || '';
  return { route, tab, params: next, explicitTab: next.has('tab') };
}

export function readRoute(pathname = '/', search = '') {
  const {route,tab,params} = parse(pathname, search);
  return { route, tab, q: params.get('q') || '', at: AT_IDS.has(params.get('at')) ? params.get('at') : '' };
}

function pathWithParams(parsed) {
  const {route,tab,params,explicitTab} = parsed;
  params.delete('tab');
  return href(route, explicitTab ? tab : undefined) + (params.size ? '?' + params : '');
}

export function legacyHashPath(hash) {
  const bare = hash.slice(1);
  if (!hash.startsWith('#/') && !AT_IDS.has(bare)) return null;
  if (['stays','upick','everyday-places'].includes(bare)) return href('living', bare === 'everyday-places' ? 'places' : bare, undefined, bare);
  const [path, query] = hash.startsWith('#/') ? hash.slice(1).split('?') : canonicalHash(hash).slice(1).split('?');
  return pathWithParams(parse(path, query));
}

export function normalizeLocation({pathname = '/', search = '', hash = ''}) {
  const legacy = legacyHashPath(hash);
  if (legacy !== null) {
    const url = new URL(legacy, SITE_ORIGIN);
    const params = new URLSearchParams(search);
    params.delete('tab');
    for (const [key, value] of url.searchParams) params.set(key, value);
    return url.pathname + (params.size ? '?' + params : '');
  }
  const knownSection = ['whatson','weekend','supermarkets','privacy','search',...Object.keys(TABS)].includes(pathname.split('/').filter(Boolean)[0]);
  if (pathname !== '/' && !knownSection) return pathname + search + hash;
  return pathWithParams(parse(pathname, search)) + hash;
}

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderDocument(template, page) {
  const {title,description} = page.zh;
  const url = SITE_ORIGIN + page.path;
  const baseTag = page.noindex ? '<base href="/"><meta name="robots" content="noindex">' : '<base href="/">';
  return template.replace(/\r\n/g, '\n').replace('<head>', '<head>' + baseTag)
    .replace(/<title>.*?<\/title>/, () => '<title>' + esc(title) + '</title>')
    .replace(/(<meta (?:name="(?:description|twitter:description)"|property="og:description") content=")[^"]*(")/g, (_all,start,end) => start + esc(description) + end)
    .replace(/(<meta (?:name="twitter:title"|property="og:title") content=")[^"]*(")/g, (_all,start,end) => start + esc(title) + end)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, (_all,start,end) => start + url + end)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, (_all,start,end) => start + url + end);
}

export function renderNotFound(template) {
  return renderDocument(template, { ...PAGES[0], noindex: true });
}

export function renderSitemap() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + PAGES.filter(page => !page.noindex).map(page => '  <url><loc>' + SITE_ORIGIN + page.path + '</loc></url>').join('\n')
    + '\n</urlset>\n';
}

export function applyDocumentMeta(pathname, lang) {
  const page = PAGES.find(page => page.path === pathname);
  const shouldNoindex = !page || !!page.noindex;
  const existing = document.querySelector('meta[name="robots"][content="noindex"]');
  if (shouldNoindex) {
    if (!existing) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      meta.setAttribute('content', 'noindex');
      document.head.appendChild(meta);
    }
  } else {
    existing?.remove();
  }
  const copy = (page || PAGES[0])[lang === 'en' ? 'en' : 'zh'];
  document.title = copy.title;
  document.documentElement.lang = lang === 'en' ? 'en-NZ' : 'zh-CN';
  const set = (selector, attr, value) => document.querySelector(selector)?.setAttribute(attr, value);
  for (const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]']) set(selector, 'content', copy.description);
  for (const selector of ['meta[property="og:title"]','meta[name="twitter:title"]']) set(selector, 'content', copy.title);
  set('link[rel="canonical"]', 'href', SITE_ORIGIN + (page?.path || pathname));
  set('meta[property="og:url"]', 'content', SITE_ORIGIN + (page?.path || pathname));
}
