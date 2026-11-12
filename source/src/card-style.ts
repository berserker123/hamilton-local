export type CardStyle = '' | 'a' | 'b' | 'c';
export type CardKind = 'place' | 'market' | 'stay' | 'pet' | 'upick' | 'playground' | 'event' | 'party';

function valid(value: string | null): value is Exclude<CardStyle, ''> {
  return value === 'a' || value === 'b' || value === 'c';
}

export function readCardStyle(search?: string, hash?: string): CardStyle {
  const page = search ?? (typeof location === 'undefined' ? '' : location.search);
  const rawHash = hash ?? (typeof location === 'undefined' ? '' : location.hash);
  const hashQuery = rawHash.indexOf('?');
  const fromHash = new URLSearchParams(hashQuery < 0 ? '' : rawHash.slice(hashQuery + 1)).get('cards');
  const fromPage = new URLSearchParams(page).get('cards');
  if (valid(fromHash)) return fromHash;
  if (valid(fromPage)) return fromPage;
  return '';
}

type AttrRoot = { setAttribute(name: string, value: string): void; removeAttribute(name: string): void; getAttribute?(name: string): string | null };
export function applyCardStyle(doc?: { documentElement: AttrRoot } | null, style?: CardStyle) {
  const root = doc?.documentElement ?? (typeof document === 'undefined' ? null : document.documentElement);
  if (!root) return;
  const value = style === undefined ? readCardStyle() : style;
  if (value) root.setAttribute('data-cards', value);
  else root.removeAttribute('data-cards');
}

export function installCardStyle() {
  if (typeof window === 'undefined') return;
  applyCardStyle();
  window.addEventListener('hashchange', () => applyCardStyle());
  window.addEventListener('popstate', () => applyCardStyle());
}

export function placeQuickInfo(p: { area?: string; km?: number | null; free?: boolean; tag?: string }, lang: 'zh' | 'en') {
  const items: { key: string; text: string }[] = [];
  if (p.area) items.push({ key: 'area', text: p.area });
  if (p.km != null) items.push({ key: 'km', text: (lang === 'zh' ? '约' : '~') + p.km + ' km' });
  if (p.free === true) items.push({ key: 'price', text: lang === 'zh' ? '免费' : 'Free' });
  else if (p.free === false) items.push({ key: 'price', text: lang === 'zh' ? '收费' : 'Paid' });
  if (p.tag) items.push({ key: 'tag', text: p.tag });
  return items;
}
