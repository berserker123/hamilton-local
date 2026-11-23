// Common mattress sizes in centimetres. Brands can differ by a few centimetres.
export const NZ_BEDS = [
  { id: 'nz-single', zh: 'Single 单人', en: 'Single', w: 92, l: 188 },
  { id: 'nz-long-single', zh: 'Long Single 加长单人', en: 'Long Single', w: 92, l: 203 },
  { id: 'nz-king-single', zh: 'King Single 大单人', en: 'King Single', w: 107, l: 203 },
  { id: 'nz-double', zh: 'Double 双人', en: 'Double', w: 138, l: 188 },
  { id: 'nz-queen', zh: 'Queen 大双人', en: 'Queen', w: 153, l: 203 },
  { id: 'nz-king', zh: 'King 特大', en: 'King', w: 167, l: 203 },
  { id: 'nz-super-king', zh: 'Super King 超大', en: 'Super King', w: 183, l: 203 },
];

export const CN_BEDS = [
  { id: 'cn-90-190', zh: '0.9 米床（190 长）', en: '0.9 m bed (190 long)', w: 90, l: 190 },
  { id: 'cn-90-200', zh: '0.9 米床（200 长）', en: '0.9 m bed (200 long)', w: 90, l: 200 },
  { id: 'cn-120-200', zh: '1.2 米床', en: '1.2 m bed', w: 120, l: 200 },
  { id: 'cn-135-190', zh: '1.35 米床（190 长）', en: '1.35 m bed (190 long)', w: 135, l: 190 },
  { id: 'cn-135-200', zh: '1.35 米床（200 长）', en: '1.35 m bed (200 long)', w: 135, l: 200 },
  { id: 'cn-150-200', zh: '1.5 米床', en: '1.5 m bed', w: 150, l: 200 },
  { id: 'cn-180-200', zh: '1.8 米床', en: '1.8 m bed', w: 180, l: 200 },
  { id: 'cn-200-200', zh: '2.0 米床', en: '2.0 m bed', w: 200, l: 200 },
];

/** Closest size by width first, because width decides whether bedding fits. */
export function closestBed(bed, options) {
  const score = item => Math.abs(item.w - bed.w) + Math.abs(item.l - bed.l) * 0.5;
  return options.reduce((best, item) => (score(item) < score(best) ? item : best));
}

/** How bedding sized for `sheet` fits on `bed`. */
export function beddingFit(bed, sheet) {
  const dw = sheet.w - bed.w;
  const dl = sheet.l - bed.l;
  const gap = Math.max(Math.abs(dw), Math.abs(dl));
  if (gap <= 1) return { level: 'same', dw, dl };
  if (gap > 5) return { level: 'different', dw, dl };
  return { level: dw < 0 || dl < 0 ? 'tight' : 'loose', dw, dl };
}
