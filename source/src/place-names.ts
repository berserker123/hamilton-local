// English spellings come from the existing location and venue records.
export const PLACE_NAMES: Record<string, string> = {
  '汉密尔顿东': 'Hamilton East',
  '汉密尔顿': 'Hamilton',
  '拉格伦': 'Raglan',
  '剑桥': 'Cambridge',
  '南怀卡托': 'South Waikato',
  '怀卡托': 'Waikato',
  '蒂阿瓦穆图': 'Te Awamutu',
  '特阿瓦穆图': 'Te Awamutu',
  '玛塔玛塔': 'Matamata',
  '马塔马塔': 'Matamata',
  '卡拉皮罗': 'Karāpiro',
  '亨特利': 'Huntly',
  '莫林斯维尔': 'Morrinsville',
  '托科罗阿': 'Tokoroa',
  '普塔鲁鲁': 'Putaruru',
  '纳鲁阿瓦希亚': 'Ngāruawāhia',
  '泰晤士': 'Thames',
  '科罗曼德尔': 'Coromandel',
  '科罗曼德': 'Coromandel',
  '科罗格伦': 'Coroglen',
  '菲蒂昂格': 'Whitianga',
  '蒂阿罗哈': 'Te Aroha',
  '奥托罗汉加': 'Ōtorohanga',
  '怀托摩': 'Waitomo',
  '蒂乌库': 'Te Uku',
  '豪塔普': 'Hautapu',
  '格伦维尤': 'Glenview',
  '弗兰克顿': 'Frankton',
  '费尔菲尔德': 'Fairfield',
  '普克特': 'Pukete',
  '特拉帕': 'Te Rapa',
  '戈登顿': 'Gordonton',
  '水星湾': 'Mercury Bay',
};
const pattern = new RegExp(Object.keys(PLACE_NAMES).sort((a, b) => b.length - a.length).join('|'), 'g');
const adjacentWord = /^[\u3400-\u9fffA-Za-z]/;

/** Display only: never change record IDs, filter values, addresses or URLs. */
export function placeNames(text: string, lang: 'zh' | 'en' = 'zh'): string {
  const localized = text.replace(pattern, (zh, offset: number) => {
    const en = PLACE_NAMES[zh];
    const tail = text.slice(offset + zh.length);
    // Also respect full bilingual names, e.g. 汉密尔顿花园 Hamilton Gardens.
    const existing = new RegExp('^[\\u3400-\\u9fff]*[\\s（(·:]*' + en + '(?=$|[^A-Za-z])', 'i').test(tail);
    if (lang === 'en') return existing ? '' : en;
    if (existing) return zh;
    return zh + ' ' + en + (adjacentWord.test(tail) ? ' ' : '');
  });
  return lang === 'en' ? localized.trim() : localized;
}
