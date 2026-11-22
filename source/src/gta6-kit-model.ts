import { Deal, Verdict, realDiscount, verdict } from './blackfriday-model';

export type KitSlotConfig = { id: string; zh: string; en: string; noteZh: string; noteEn: string; dealIds: string[] };
export type KitSlot = KitSlotConfig & { pick: Deal; alternatives: Deal[] };
export type KitSummary = { slotCount: number; total: number; goodCount: number; firstChecked: string; lastChecked: string; hasPromoCode: boolean };

export const VERDICT_RANK: Record<Verdict, number> = { '真优惠': 0, '一般': 1, '先别急': 2, '待核实': 3 };

// The first deal id of a slot is the recommended pick; the rest are alternatives.
export function resolveKit(slots: KitSlotConfig[], deals: Deal[]): KitSlot[] {
  const byId = new Map(deals.map(d => [d.id, d]));
  return slots.map(slot => {
    const resolved = slot.dealIds.map(id => {
      const deal = byId.get(id);
      if (!deal) throw new Error(`GTA6 kit slot ${slot.id} references unknown deal ${id}`);
      return deal;
    });
    if (!resolved.length) throw new Error(`GTA6 kit slot ${slot.id} has no deals`);
    return { ...slot, pick: resolved[0], alternatives: resolved.slice(1) };
  });
}

// True when the pick is at least as good as every alternative (verdict first, then real discount).
export function pickIsBest(slot: KitSlot): boolean {
  const rank = (d: Deal) => VERDICT_RANK[verdict(d)];
  return slot.alternatives.every(alt =>
    rank(slot.pick) < rank(alt)
    || (rank(slot.pick) === rank(alt) && (realDiscount(slot.pick) ?? -Infinity) >= (realDiscount(alt) ?? -Infinity)));
}

export function kitSummary(slots: KitSlot[]): KitSummary {
  const dates = slots.map(s => s.pick.checkedAt.slice(0, 10)).sort();
  return {
    slotCount: slots.length,
    total: Math.round(slots.reduce((sum, s) => sum + s.pick.salePrice * 100, 0)) / 100,
    goodCount: slots.filter(s => verdict(s.pick) === '真优惠').length,
    firstChecked: dates[0] ?? '',
    lastChecked: dates[dates.length - 1] ?? '',
    hasPromoCode: slots.some(s => !!s.pick.offerNote),
  };
}