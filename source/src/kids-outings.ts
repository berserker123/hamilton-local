import PLACES from './places.json';

export const OUTING_CATEGORIES = [
  { id: 'indoor', zh: '室内游乐与街机', en: 'Indoor Play & Arcades' },
  { id: 'swim', zh: '游泳', en: 'Swimming' },
  { id: 'sport', zh: '运动场馆', en: 'Sports Centres' },
  { id: 'climb', zh: '攀岩·障碍·高尔夫', en: 'Climbing, Ninja & Golf' },
  { id: 'learn', zh: '博物馆与学习', en: 'Museums & Learning' },
  { id: 'outdoors', zh: '动物与户外', en: 'Animals & Outdoors' },
  { id: 'skate', zh: '滑板·泵道·轮滑', en: 'Skate, Pump & Roller' },
] as const;

type Cat = typeof OUTING_CATEGORIES[number]['id'];

type Spec = {
  id: string;
  category: Cat;
  placeId?: string;
  name: string;
  zh: string;
  area?: string;
  areaEn?: string;
  address?: string;
  hours?: string;
  hoursEn?: string;
  price?: string;
  priceEn?: string;
  ages?: string;
  agesEn?: string;
  description?: string;
  descriptionEn?: string;
  url?: string;
};

// Members follow the kids-a brief. Facts that were not in that brief, and not already
// on an existing place or playground record, are left blank.
const SPECS: Spec[] = [
  { id: 'jago-town', category: 'indoor', name: 'Jago Town', zh: 'Jago Town 室内游乐' },
  { id: 'chipmunks-hamilton', category: 'indoor', name: 'Chipmunks Hamilton', zh: 'Chipmunks Hamilton 室内游乐' },
  { id: 'timezone-the-base', category: 'indoor', name: 'Timezone The Base', zh: 'Timezone The Base 街机' },
  { id: 'timezone-victoria', category: 'indoor', name: 'Timezone Victoria Street', zh: 'Timezone 维多利亚街店', area: 'Hamilton Central', areaEn: 'Hamilton Central', address: '460 Victoria Street, Hamilton', description: '与 The Base 店是两家。', descriptionEn: 'A separate shop from Timezone The Base.' },
  { id: 'fun-zone-hamilton', category: 'indoor', name: 'Fun Zone Hamilton', zh: 'Fun Zone Hamilton', area: 'Hamilton Central', areaEn: 'Hamilton Central', address: 'Centre Place, 501 Victoria Street, Hamilton' },
  { id: 'inflatable-world', category: 'indoor', name: 'Inflatable World', zh: 'Inflatable World 充气乐园', hours: '开放日有限，请以官网为准', hoursEn: 'Open days are limited. Check the official site.' },
  { id: 'waterworld', category: 'swim', placeId: 'waterworld', name: 'Waterworld', zh: 'Waterworld 水上中心' },
  { id: 'gallagher-aquatic', category: 'swim', name: 'Gallagher Aquatic Centre', zh: 'Gallagher 水上中心' },
  { id: 'the-peak', category: 'sport', name: 'The Peak', zh: 'The Peak 运动中心', area: 'Rototuna North', areaEn: 'Rototuna North', address: '60 Kimbrae Drive, Rototuna North, Hamilton', hours: 'Peak-A-Boo：周三、周五 9:30', hoursEn: 'Peak-A-Boo: Wednesday and Friday, 9:30', price: '场地空闲时散客：成人 $6，18 岁以下 $4。Peak-A-Boo $4。请先致电 07 854 0546', priceEn: 'Casual entry when a court is free: adult $6, under 18 $4. Peak-A-Boo $4. Call 07 854 0546 first.', ages: 'Peak-A-Boo 0–5 岁', agesEn: 'Peak-A-Boo ages 0–5' },
  { id: 'the-y-hamilton', category: 'sport', name: 'The Y Hamilton', zh: 'The Y Hamilton' },
  { id: 'waikato-tennis', category: 'sport', name: 'Waikato Tennis Centre', zh: '怀卡托网球中心' },
  { id: 'topspin-pickleball', category: 'sport', name: 'Topspin Pickleball', zh: 'Topspin 匹克球' },
  { id: 'porritt-stadium', category: 'sport', name: 'Porritt Stadium', zh: 'Porritt 体育场', hours: '未被预订时对公众开放，请查看预订表', hoursEn: 'Open to the public when it is not booked. Check the booking schedule.' },
  { id: 'bowl-and-social', category: 'sport', name: 'Bowl & Social', zh: 'Bowl & Social' },
  { id: 'extreme-edge', category: 'climb', name: 'Extreme Edge ClimbZone', zh: 'Extreme Edge ClimbZone 攀岩' },
  { id: 'boulder-co', category: 'climb', name: 'Boulder Co.', zh: 'Boulder Co. 抱石' },
  { id: 'ninja-valley', category: 'climb', name: 'Ninja Valley', zh: 'Ninja Valley 障碍' },
  { id: 'prodrive-golf', category: 'climb', name: 'Prodrive Golf', zh: 'Prodrive 高尔夫' },
  { id: 'waikato-museum', category: 'learn', placeId: 'waikato-museum', name: 'Waikato Museum', zh: '怀卡托博物馆与美术馆' },
  { id: 'classics-museum', category: 'learn', name: 'Classics Museum', zh: 'Classics 博物馆', price: '请以官网为准', priceEn: 'Check the official website.' },
  { id: 'central-library', category: 'learn', placeId: 'central-library', name: 'Hamilton Central Library', zh: '汉密尔顿中央图书馆' },
  { id: 'hamilton-zoo', category: 'outdoors', placeId: 'hamilton-zoo', name: 'Hamilton Zoo', zh: '汉密尔顿动物园' },
  { id: 'hamilton-gardens', category: 'outdoors', placeId: 'hamilton-gardens', name: 'Hamilton Gardens', zh: '汉密尔顿花园' },
  { id: 'hamilton-lake', category: 'outdoors', placeId: 'hamilton-lake', name: 'Hamilton Lake Domain', zh: '汉密尔顿湖公园' },
  { id: 'waiwhakareke', category: 'outdoors', placeId: 'waiwhakareke', name: 'Waiwhakareke Natural Heritage Park', zh: 'Waiwhakareke 自然遗产公园' },
  { id: 'kaipaki-farmyard', category: 'outdoors', name: 'Kaipaki Farmyard', zh: 'Kaipaki 农场', area: 'Ōhaupō', areaEn: 'Ōhaupō', description: '在 Ōhaupō，距汉密尔顿约 15 分钟。', descriptionEn: 'In Ōhaupō, about 15 minutes from Hamilton.' },
  { id: 'hamilton-model-engineers', category: 'outdoors', name: 'Hamilton Model Engineers', zh: 'Hamilton Model Engineers 小火车', area: 'Minogue Park', areaEn: 'Minogue Park', address: 'Minogue Park, Hamilton', hours: '周日小火车', hoursEn: 'Sunday train' },
  { id: 'magical-bridge', category: 'outdoors', placeId: 'magical-bridge', name: 'Magical Bridge Destination Playground', zh: 'Magical Bridge 无障碍游乐场' },
  { id: 'parana-park', category: 'outdoors', name: 'Parana Park', zh: 'Parana 公园', area: 'Hamilton East', areaEn: 'Hamilton East', address: 'Memorial Drive, Hamilton East, Hamilton', description: '以 kōwhai 花为灵感的滑梯与喷泉，邻近河畔步道。', descriptionEn: 'Kōwhai-inspired slides and fountain beside riverside walking paths.', ages: '具体适合年龄待确认', agesEn: 'Specific age range unconfirmed', url: 'https://hamilton.govt.nz/community-spaces/playgrounds/detail/parana-park-destination-playground/' },
  { id: 'melville-park', category: 'skate', name: 'Melville Park', zh: 'Melville 公园', area: 'Melville', areaEn: 'Melville', hours: '周日 10:00–12:00 汉密尔顿轮滑俱乐部公众轮滑', hoursEn: 'Sunday 10:00–12:00 public roller skating with the Hamilton Roller Skating Club' },
  { id: 'hillcrest-pump', category: 'skate', name: 'Hillcrest Stadium pump track', zh: 'Hillcrest Stadium 泵道', area: 'Hillcrest', areaEn: 'Hillcrest' },
  { id: 'elliott-park', category: 'skate', name: 'Elliott Park', zh: 'Elliott 公园' },
  { id: 'chedworth-bowl', category: 'skate', name: 'Chedworth mini bowl', zh: 'Chedworth 迷你碗池', area: 'Chedworth', areaEn: 'Chedworth' },
  { id: 'fairfield-skatepark', category: 'skate', name: 'Fairfield Skatepark', zh: 'Fairfield 滑板场', area: 'Fairfield', areaEn: 'Fairfield' },
];

export function familyOutings() {
  return SPECS.map(spec => {
    const cat = OUTING_CATEGORIES.find(item => item.id === spec.category)!;
    const base = spec.placeId ? PLACES.find(place => place.id === spec.placeId) : undefined;
    if (base) return { ...base, categoryId: spec.category, categoryZh: cat.zh, categoryEn: cat.en, ages: spec.ages, agesEn: spec.agesEn };
    return {
      id: spec.id,
      name: spec.name,
      zh: spec.zh,
      area: spec.area || '',
      address: spec.address || '',
      indoor: spec.category === 'indoor' || spec.category === 'learn' || spec.category === 'swim',
      free: false,
      tag: cat.zh,
      description: spec.description || '',
      hours: spec.hours,
      price: spec.price,
      url: spec.url,
      km: null as number | null,
      categoryId: spec.category,
      categoryZh: cat.zh,
      categoryEn: cat.en,
      ages: spec.ages,
      agesEn: spec.agesEn,
      en: {
        tag: cat.en,
        description: spec.descriptionEn || '',
        area: spec.areaEn || spec.area || '',
        hours: spec.hoursEn,
        price: spec.priceEn,
      },
    };
  });
}
