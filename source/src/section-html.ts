import { SECTION_META, SERVICE_CATS } from './section-content';
import { sectionPath } from './section-navigation';
import { SECTION_ORDER, TOOL_TABS } from './tool-navigation';
import { SUPERMARKETS } from './local-data';
import { AGENDA } from './agenda-data';
import DATA from './events-and-markets.json';
import PLAYGROUNDS from './playgrounds.json';
import PETS from './pets-v25.json';

const escape = (value: string) => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]!));
type Route = keyof typeof SECTION_META;
const item = (label: string, detail: string, href: string) => `<li><a href="${escape(href)}">${escape(label)}</a><p>${escape(detail)}</p></li>`;

export function sectionContent(route: Route) {
  const meta = SECTION_META[route];
  const links = SECTION_ORDER.map(id => `<a href="${sectionPath(id)}">${SECTION_META[id].title}</a>`).join(' · ');
  let rows: string[];
  if (route === 'living') rows = SUPERMARKETS.map(s => item(`${s.zhName} · ${s.name}`, `${s.address} · ${s.tags.zh.join('、')}`, '/living/?tab=grocers&q=' + encodeURIComponent(s.name)));
  else if (route === 'weekend') rows = [item('活动日历 · Events Calendar', DATA.week_label_zh + ' · ' + DATA.week_label_en, '/weekend/?tab=picks'), ...AGENDA.picks.slice(0, 8).map(e => item(`${e.title_zh} · ${e.title_en}`, `${e.dates.join(' / ')} · ${e.venue}`, e.source_url)), ...AGENDA.markets.slice(0, 4).map(m => item(`${m.title_zh} · ${m.title_en}`, m.venue || '', '/weekend/?tab=markets'))];
  else if (route === 'kids') rows = PLAYGROUNDS.map(p => item(`${p.zh} · ${p.name}`, `${p.address} · ${p.highlightZh}`, '/kids/?tab=map'));
  else if (route === 'services') rows = [...Object.entries(SERVICE_CATS).flatMap(([tab, cats]) => cats.map(([zh, en]) => item(`${zh} · ${en}`, '内容整理中 · 暂无商家 / Coming soon · No listings yet', '/services/?tab=' + tab))), ...PETS.flatMap(group => group.items.slice(0, 2).map(p => item(p.name, p.address, '/services/?tab=pets&at=pet-' + group.id)))];
  else if (route === 'tools') rows = TOOL_TABS.map(([tab, zh, en]) => item(`${zh} · ${en}`, '查看工具、说明与来源 / Tools, guidance and sources', '/tools/?tab=' + tab));
  else rows = SECTION_ORDER.filter(id => id !== 'home').map(id => item(SECTION_META[id].title, SECTION_META[id].description, sectionPath(id)));
  return `<div class="sb-container"><nav aria-label="主要栏目">${links}</nav><main><h1>${meta.title}</h1><p>${escape(meta.description)}</p><ul>${rows.join('')}</ul></main></div>`;
}

export function sectionDocument(template: string, route: Route) {
  const meta = SECTION_META[route];
  const title = meta.title + ' · Hamilton Local';
  const canonical = 'https://hamiltonlocal.nz' + sectionPath(route);
  return template.replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta (?:name="(?:description|twitter:description)"|property="og:description") content=")[^"]*(")/g, `$1${escape(meta.description)}$2`)
    .replace(/(<meta (?:name="twitter:title"|property="og:title") content=")[^"]*(")/g, `$1${escape(title)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`)
    .replace('<div id="root"></div>', `<div id="root">${sectionContent(route)}</div>`);
}
