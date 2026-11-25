// 屯里食堂 Tron Eats: places to eat in Hamilton, grouped by occasion.

export const FOOD_OCCASIONS = [
  { id: 'parents', zh: '带爸妈吃饭', en: 'With parents' },
  { id: 'birthday', zh: '过生日', en: 'Birthdays' },
  { id: 'kids', zh: '带娃吃饭', en: 'With kids' },
  { id: 'date', zh: '约会和纪念日', en: 'Date night' },
  { id: 'group', zh: '十人以上聚餐', en: 'Groups of 10+' },
  { id: 'client', zh: '请客户吃饭', en: 'Client meals' },
  { id: 'solo', zh: '一个人吃', en: 'Eating solo' },
  { id: 'vegetarian', zh: '素食', en: 'Vegetarian' },
  { id: 'everyday', zh: '日常好吃', en: 'Everyday eats' },
  { id: 'trending', zh: '网红打卡', en: 'Trending' },
];

export const PERKS_ID = 'perks';
export const DEFAULT_OCCASION = 'parents';

export function isOccasion(id) {
  return id === PERKS_ID || FOOD_OCCASIONS.some(o => o.id === id);
}

/** Places tagged with this occasion, in name order so no place is ranked above another. */
export function placesFor(places, occasionId) {
  return places
    .filter(p => p.occasions.some(o => o.id === occasionId))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function reasonFor(place, occasionId) {
  return place.occasions.find(o => o.id === occasionId) || null;
}

/** "Starbucks Chartwell, Hamilton (branch: https://...)" -> "Starbucks Chartwell, Hamilton" */
export function cleanWhere(text) {
  return String(text || '').replace(/\s*\((?:[^()]*https?:\/\/[^()]*)\)/g, '').trim();
}

export function occasionCounts(places) {
  return Object.fromEntries(FOOD_OCCASIONS.map(o => [o.id, placesFor(places, o.id).length]));
}

/** Random pick for the ��ҡһ���� button; never repeats the last pick when there is a choice. */
export function pickRandom(places, lastId, rnd = Math.random) {
  const pool = places.length > 1 ? places.filter(p => p.id !== lastId) : places;
  return pool.length ? pool[Math.floor(rnd() * pool.length)] : null;
}
