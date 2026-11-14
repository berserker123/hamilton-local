import DATA from './pay-scales.json';

// Speech-language therapists and designated allied roles stay in the source file.
// They are not offered: the brief covers teacher scales and the degree-based core scale only.
export const HIDDEN_SCALE_IDS = ['ptca-slt', 'aphst-designated'] as const;

export const MERAS_NOTE = {
  zh: '需加入工会（MERAS）才能自动获得集体协议更新后的涨薪和一次性补贴',
  en: 'You need to be a MERAS union member to automatically receive collective agreement pay rises and lump-sum payments.',
} as const;

export const SCALE_DISCLAIMERS = [
  { zh: '仅含基本工资，不含加班、津贴', en: 'Base pay only. Overtime and allowances are not included.' },
  { zh: '仅供估算，请以工资单和适用集体协议为准', en: 'Estimate only. Check your payslip and the applicable collective agreement.' },
] as const;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Amount = number | string;
export type PayStep = { step: string; label: string; amounts: Record<string, Amount>; footnote?: string };
export type PayScale = { id: string; name: string; columns: string[]; steps: PayStep[] };
export type PayOccupation = {
  id: string;
  name_zh: string;
  name_en: string;
  agreement: string;
  source_urls: string[];
  pay_basis: 'annual' | 'hourly';
  current_effective_from: string;
  pending_increase: { effective_from: string; note?: string } | null;
  notes: string[];
  scales: PayScale[];
};

export const PAY_SCALES = DATA as { research_date: string; occupations: PayOccupation[] };

export function offeredOccupations(today = todayISO()): PayOccupation[] {
  return PAY_SCALES.occupations.map(occupation => ({
    ...occupation,
    scales: occupation.scales
      .filter(scale => !(HIDDEN_SCALE_IDS as readonly string[]).includes(scale.id))
      .map(scale => ({ ...scale, steps: selectableSteps(scale, today) })),
  })).filter(occupation => occupation.scales.some(scale => scale.steps.length > 0));
}

export function todayISO(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function activeColumn(columns: readonly string[], today: string) {
  const sorted = [...columns].sort();
  let current = sorted[0];
  for (const date of sorted) if (date <= today) current = date;
  return { current, pending: sorted.find(date => date > today) ?? null };
}

export function numericAmount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function selectableSteps(scale: PayScale, today: string) {
  const { current } = activeColumn(scale.columns, today);
  const steps = scale.steps.filter(step => numericAmount(step.amounts[current]) !== null);
  const numbers = steps.map(step => Number(step.step));
  if (numbers.length === steps.length && numbers.every(Number.isFinite) && numbers[0] > numbers[numbers.length - 1]) return [...steps].reverse();
  return steps;
}

export function annualToHourly(annual: number) {
  return annual / 52 / 40;
}

export function hourlyInput(value: number) {
  const rounded = Math.round((value + Number.EPSILON) * 10000) / 10000;
  return String(rounded);
}

export function officialSource(occupation: PayOccupation) {
  const page = occupation.source_urls.find(url => !/\.pdf$/i.test(url.split('?')[0]));
  return page ?? occupation.source_urls[0];
}

export function formatScaleDate(iso: string, english: boolean) {
  const [year, month, day] = iso.split('-').map(Number);
  if (!english) return `${year}年${month}月${day}日`;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

const money = (value: number, hourly: boolean) => new Intl.NumberFormat('en-NZ', {
  style: 'currency', currency: 'NZD', minimumFractionDigits: hourly ? 2 : 0, maximumFractionDigits: hourly ? 2 : 0,
}).format(value);

export function conversionLabel(annual: number) {
  const formatted = money(annual, false);
  return {
    zh: `年薪 ${formatted}，按每周40小时折算`,
    en: `Annual salary ${formatted}, converted at 40 hours a week.`,
  };
}

export type ScaleQuote = {
  occupationId: string;
  scaleId: string;
  stepId: string;
  basis: 'annual' | 'hourly';
  amount: number;
  hourly: number;
  hours: number | null;
  effectiveFrom: string;
  pending: { date: string; amount: number | null; note?: string } | null;
  sourceUrl: string;
  agreement: string;
  meras: boolean;
};

export function quoteScale(occupationId: string, scaleId: string, stepId: string, today = todayISO()): ScaleQuote | null {
  const occupation = offeredOccupations(today).find(item => item.id === occupationId);
  const scale = occupation?.scales.find(item => item.id === scaleId);
  const step = scale?.steps.find(item => item.step === stepId);
  if (!occupation || !scale || !step) return null;
  const { current, pending } = activeColumn(scale.columns, today);
  const amount = numericAmount(step.amounts[current]);
  if (amount === null) return null;
  const pendingAmount = pending ? numericAmount(step.amounts[pending]) : null;
  const hourly = occupation.pay_basis === 'hourly' ? amount : annualToHourly(amount);
  return {
    occupationId, scaleId, stepId,
    basis: occupation.pay_basis,
    amount, hourly,
    hours: occupation.pay_basis === 'annual' ? 40 : null,
    effectiveFrom: current,
    pending: pending ? { date: pending, amount: pendingAmount, note: occupation.pending_increase?.note } : null,
    sourceUrl: officialSource(occupation),
    agreement: occupation.agreement,
    meras: occupation.id === 'meras-midwife',
  };
}
