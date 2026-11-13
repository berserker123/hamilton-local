export const PARTY_REGIONS = [
  { id: 'Hamilton', zh: '汉密尔顿', en: 'Hamilton' },
  { id: 'Cambridge', zh: '剑桥', en: 'Cambridge' },
  { id: 'Te Awamutu', zh: '蒂阿瓦穆图', en: 'Te Awamutu' },
  { id: 'Raglan', zh: '拉格伦', en: 'Raglan' },
  { id: 'Huntly', zh: '亨特利', en: 'Huntly' },
  { id: 'Morrinsville', zh: '莫林斯维尔', en: 'Morrinsville' },
  { id: 'Matamata', zh: '玛塔玛塔', en: 'Matamata' },
  { id: 'Tokoroa', zh: '托科罗阿', en: 'Tokoroa' },
  { id: 'Putaruru', zh: '普塔鲁鲁', en: 'Putaruru' },
  { id: 'Ngaruawahia', zh: '纳鲁阿瓦希亚', en: 'Ngāruawāhia' },
  { id: 'Thames', zh: '泰晤士', en: 'Thames' },
  { id: 'Coromandel', zh: '科罗曼德及周边', en: 'Coromandel & Hauraki' },
  { id: 'Te Aroha', zh: '蒂阿罗哈', en: 'Te Aroha' },
  { id: 'other', zh: '其他怀卡托', en: 'Elsewhere in Waikato' },
  { id: 'mobile', zh: '上门服务', en: 'Home visits' },
] as const;

export const PARTY_TYPES = [
  { id: 'indoor', zh: '室内游乐', en: 'Indoor play' },
  { id: 'sport', zh: '运动活动', en: 'Sport & activities' },
  { id: 'outdoor', zh: '动物与户外', en: 'Animals & outdoors' },
  { id: 'creative', zh: '创意与手作', en: 'Arts & making' },
  { id: 'hire', zh: '场地租用', en: 'Venue hire' },
  { id: 'mobile', zh: '上门派对服务', en: 'Mobile party services' },
] as const;

export function filterPartyVenues<T extends { region: string; type: string }>(items: readonly T[], region: string, type: string): T[] {
  return items.filter(item => (region === 'all' || item.region === region) && (type === 'all' || item.type === type));
}

export function partyRegionCounts<T extends { id: string; region: string }>(items: readonly T[]) {
  const unique = [...new Map(items.map(item => [item.id, item])).values()];
  const counts: Record<string, number> = { all: unique.length };
  for (const item of unique) counts[item.region] = (counts[item.region] || 0) + 1;
  return counts;
}

export const PARTY_PAGE_SIZE = 8;
export function partyPage<T>(items: readonly T[], expanded: boolean): T[] {
  return expanded ? [...items] : items.slice(0, PARTY_PAGE_SIZE);
}

export function partyPriceSummary(zh: string, en: string) {
  const lead = (text: string, pending: string, more: string) => {
    const normalized = text.replace(/／/g, '/').replace(/\s+/g, ' ').trim();
    if (/套餐待确认|package unconfirmed/i.test(normalized)) return pending;
    const first = normalized.split(/[；;]/)[0].trim();
    const money = first.match(/NZ\$[\d,.]+(?:起|\/人起|\/person)?/i);
    if (money && first.length > money[0].length) return money[0];
    if (first.length <= 16) return first;
    return more;
  };
  return { zh: lead(zh, '套餐待确认', '详见价格'), en: lead(en, 'Package unconfirmed', 'See price') };
}

export function partyDirections(address: string) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(address + ', New Zealand');
}
