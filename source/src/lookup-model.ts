// 一键查: everything runs in the browser. The address the visitor types is never sent anywhere.
export type LookupZone = { school: number; poly: number; name: string; type: string; eff: string | null; count: number };
export type LookupData = {
  version: string;
  roads: string[];
  suburbs: string[];
  zones: LookupZone[];
  combos: number[][];
  a: [string, number, number, number, number, number][];
  clinics: Record<string, [number, number, string]>;
};
export type LookupAddress = { index: number; number: string; road: string; suburb: string; lat: number; lng: number; zones: LookupZone[] };
export type LookupIndex = { data: LookupData; labels: string[]; words: string[][] };

export const LOOKUP_DATA_URL = '/lookup/hamilton-2026-11-28.json';

const ABBREVIATIONS: Record<string, string> = {
  st: 'street', rd: 'road', ave: 'avenue', av: 'avenue', dr: 'drive', pl: 'place', cres: 'crescent', cr: 'crescent',
  tce: 'terrace', ln: 'lane', ct: 'court', cl: 'close', gr: 'grove', hwy: 'highway', pde: 'parade', sq: 'square', mt: 'mount',
};

export function normalise(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[,.'’]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function queryTokens(query: string): string[] {
  return normalise(query).split(' ').filter(Boolean).map(token => ABBREVIATIONS[token] || token);
}

export function buildIndex(data: LookupData): LookupIndex {
  const labels = data.a.map(row => row[0] + ' ' + data.roads[row[1]] + ', ' + data.suburbs[row[2]]);
  const words = labels.map(label => normalise(label).split(' '));
  return { data, labels, words };
}

export function addressAt(index: LookupIndex, i: number): LookupAddress {
  const [number, road, suburb, lat, lng, combo] = index.data.a[i];
  return {
    index: i, number, road: index.data.roads[road], suburb: index.data.suburbs[suburb],
    lat: lat / 1e5, lng: lng / 1e5, zones: index.data.combos[combo].map(z => index.data.zones[z]),
  };
}

// Numbers ("12", "3/12", "12a") must match the whole house number or its base number;
// words must be the start of a word in the address.
function tokenMatches(token: string, words: string[]): boolean {
  if (/^\d/.test(token)) {
    const house = words[0];
    return house === token || house.split('/').pop() === token;
  }
  return words.some(word => word.startsWith(token));
}

export function searchAddresses(index: LookupIndex, query: string, limit = 8): number[] {
  const tokens = queryTokens(query);
  if (!tokens.length || !tokens.some(token => /[a-z]/.test(token))) return [];
  const hits: number[] = [];
  for (let i = 0; i < index.words.length && hits.length < limit; i++) {
    if (tokens.every(token => tokenMatches(token, index.words[i]))) hits.push(i);
  }
  return hits;
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad, dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function nearest<T>(items: T[], point: { lat: number; lng: number }, position: (item: T) => { lat: number; lng: number } | null, limit: number) {
  return items
    .map(item => { const p = position(item); return p ? { item, km: distanceKm(point.lat, point.lng, p.lat, p.lng) } : null; })
    .filter((entry): entry is { item: T; km: number } => entry !== null)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

export function formatKm(km: number, chinese: boolean): string {
  if (km < 0.1) return chinese ? '就在附近（直线不到 0.1 公里）' : 'right nearby (under 0.1 km)';
  const value = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return chinese ? '直线约 ' + value + ' 公里' : 'about ' + value + ' km in a straight line';
}

// Ministry of Education institution types → plain labels. Year ranges follow the Ministry's school type definitions.
export function zoneTypeLabel(type: string): [string, string] {
  const key = type.toLowerCase();
  if (key === 'contributing') return ['小学（1–6 年级）', 'Primary (Years 1–6)'];
  if (key === 'full primary' || key === 'primary') return ['小学（1–8 年级）', 'Primary (Years 1–8)'];
  if (key === 'intermediate') return ['初中（7–8 年级）', 'Intermediate (Years 7–8)'];
  if (key === 'secondary') return ['中学', 'Secondary'];
  if (key === 'restricted c') return ['初中（年级以学校为准）', 'Middle school (check year levels with the school)'];
  return ['中小学一贯制', 'Composite'];
}

export function zoneOrder(zone: LookupZone): number {
  const key = zone.type.toLowerCase();
  if (key === 'contributing' || key === 'full primary' || key === 'primary') return 0;
  if (key === 'intermediate') return 1;
  if (key === 'secondary') return 3;
  return 2;
}

export function zoneStartsLater(zone: LookupZone, today: string): boolean {
  return !!zone.eff && zone.eff > today;
}
