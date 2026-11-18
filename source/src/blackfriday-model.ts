export type Verdict = '真优惠' | '一般' | '先别急' | '待核实';
export type TaxFreeOffer = {
  price: number;
  storeZh: string;
  storeEn: string;
  url: string;
  includesSurcharge?: boolean;
};
export type Deal = {
  id: string; name: string; nameZh: string; category: string; store: string;
  salePrice: number; typicalPrice: number | null; lowestPrice90d: number | null;
  historyVerified: boolean; raisedBeforeSale?: boolean; regularPromo?: boolean;
  historyScope?: 'market' | 'retailer';
  currentPriceRecheck?: { status: string }; offerNote?: string;
  taxFreeOffer?: TaxFreeOffer;
  blackFridayConfirmed: boolean; saleEnds: string | null; checkedAt: string; addedAt: string;
  productUrl: string; priceSpyUrl: string | null; sources: string[]; historyNote: string;
};
export const CATEGORIES = [
  ['数码', 'Tech'], ['家电', 'Appliances'], ['家居家具', 'Home & furniture'], ['美妆个护', 'Beauty & care'],
  ['母婴玩具', 'Baby & toys'], ['收藏潮玩', 'Collectibles'], ['户外运动', 'Outdoors & sport'], ['其他', 'Other'],
] as const;
export function realDiscount(deal: Deal): number | null {
  if (!deal.historyVerified || deal.typicalPrice == null || deal.typicalPrice <= 0) return null;
  return Math.round((1 - deal.salePrice / deal.typicalPrice) * 1000) / 10;
}
export function verdict(deal: Deal): Verdict {
  const discount = realDiscount(deal);
  if (discount == null || deal.lowestPrice90d == null) return '待核实';
  if (deal.salePrice >= deal.typicalPrice!) return '先别急';
  if (deal.salePrice <= deal.lowestPrice90d + 1) return '真优惠';
  if (deal.raisedBeforeSale && deal.salePrice >= deal.typicalPrice! - 1) return '先别急';
  return '一般';
}
export function selectDeals<T extends Deal>(deals: T[], category: string, store: string, sort: string): T[] {
  return deals.filter(d => (category === 'all' || d.category === category) && (store === 'all' || d.store === store)).sort((a, b) => {
    if (sort === 'price') return a.salePrice - b.salePrice;
    if (sort === 'newest') return b.addedAt.localeCompare(a.addedAt);
    return (realDiscount(b) ?? -Infinity) - (realDiscount(a) ?? -Infinity) || a.id.localeCompare(b.id);
  });
}
