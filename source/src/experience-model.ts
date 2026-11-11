export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_LABELS: Record<Season, [string, string]> = {
  spring: ['春', 'Spring'], summer: ['夏', 'Summer'], autumn: ['秋', 'Autumn'], winter: ['冬', 'Winter'],
};
export function seasonForMonth(month: number): Season {
  return month >= 9 && month <= 11 ? 'spring' : month >= 3 && month <= 5 ? 'autumn' : month >= 6 && month <= 8 ? 'winter' : 'summer';
}
export function currentNZSeason(): Season {
  return seasonForMonth(Number(new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', month: 'numeric' }).format(new Date())));
}
export function nextSeason(season: Season): Season { return SEASONS[(SEASONS.indexOf(season) + 1) % SEASONS.length]; }
export const SCENES = [
  { src: './photos/hero-window-scenery.webp', zh: '怀卡托乡野', en: 'Waikato countryside' },
  { src: './photos/window-karapiro.webp', zh: '卡拉皮罗湖', en: 'Lake Karāpiro' },
  { src: './photos/window-waiwhakareke.webp', zh: 'Waiwhakareke 湿地', en: 'Waiwhakareke wetlands' },
  { src: './photos/window-hamilton-lake.webp', zh: '汉密尔顿湖', en: 'Hamilton Lake' },
];
export function nextScene(scene: number) { return (scene + 1) % SCENES.length; }
