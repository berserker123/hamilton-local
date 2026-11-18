// 2026–27 source records live in tool-sources.json. M / M SL, constant weekly pay.
export const PAY_RULES = {
  taxYear: '1 April 2026 – 31 March 2027', minimumWage: 23.95,
  defaultKiwiSaver: .035, accRate: .0175, accCap: 156641,
  studentWeeklyThreshold: 464, studentRate: .12,
} as const;
export const MAX_WEEKLY_HOURS = 168;
export const KIWISAVER_RATES = [0, .03, .035, .04, .06, .08, .10] as const;
const BRACKETS = [[15600,.105],[53500,.175],[78100,.30],[180000,.33],[Infinity,.39]] as const;
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const nonnegative = (value: number) => Number.isFinite(value) && value >= 0;
export function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function incomeTax(annual: number): number {
  let tax = 0, previous = 0;
  for (const [ceiling, rate] of BRACKETS) {
    tax += Math.max(0, Math.min(annual, ceiling) - previous) * rate;
    if (annual <= ceiling) break;
    previous = ceiling;
  }
  return tax;
}
export function calculatePay(hourly: number, hours: number, kiwiRate: number, student: boolean) {
  if (!nonnegative(hourly) || !nonnegative(hours) || hours > MAX_WEEKLY_HOURS || !(KIWISAVER_RATES as readonly number[]).includes(kiwiRate)) return null;
  const gross = hourly * hours * 52;
  if (!Number.isFinite(gross) || gross > Number.MAX_SAFE_INTEGER / 100) return null;
  const tax = incomeTax(gross);
  const acc = Math.min(gross, PAY_RULES.accCap) * PAY_RULES.accRate;
  const loan = student ? Math.max(0, gross - PAY_RULES.studentWeeklyThreshold * 52) * PAY_RULES.studentRate : 0;
  function period(divisor: number) {
    const grossPay = cents(gross / divisor), paye = cents((tax + acc) / divisor);
    const accPay = cents(acc / divisor), kiwisaver = cents(gross * kiwiRate / divisor), studentLoan = cents(loan / divisor);
    return { gross: grossPay, incomeTax: cents(paye - accPay), acc: accPay, paye, kiwisaver, studentLoan, net: cents(grossPay - paye - kiwisaver - studentLoan) };
  }
  return { weekly: period(52), fortnightly: period(26), annual: period(1) };
}
export function calculateGST(amount: number, direction: 'inclusive' | 'exclusive') {
  if (!nonnegative(amount) || amount > Number.MAX_SAFE_INTEGER / 115) return null;
  const inclusive = cents(direction === 'inclusive' ? amount : amount * 1.15);
  const exclusive = cents(direction === 'exclusive' ? amount : amount / 1.15);
  return { exclusive, gst: cents(inclusive - exclusive), inclusive };
}
export type Unit = 'c' | 'f' | 'k' | 'kg' | 'jin' | 'lb' | 'm2' | 'ft2';
export type UnitKind = 'temperature' | 'weight' | 'area';
export const ABSOLUTE_ZERO = { c: -273.15, f: -459.67, k: 0 } as const;
const WEIGHT = { kg: 1, jin: .5, lb: .45359237 };
const AREA = { m2: 1, ft2: .09290304 };
function isTempUnit(u: Unit): u is 'c' | 'f' | 'k' {
  return u === 'c' || u === 'f' || u === 'k';
}
export function convertUnits(value: number, from: Unit, to: Unit): number | null {
  if (!Number.isFinite(value)) return null;
  let converted: number;
  if (isTempUnit(from) && isTempUnit(to)) {
    if (value < ABSOLUTE_ZERO[from]) return null;
    if (from === to) converted = value;
    else {
      const celsius = from === 'c' ? value : from === 'f' ? (value - 32) / 1.8 : value - 273.15;
      converted = to === 'c' ? celsius : to === 'f' ? celsius * 1.8 + 32 : celsius + 273.15;
    }
  }
  else if (value < 0) return null;
  else if (from in WEIGHT && to in WEIGHT) converted = value * WEIGHT[from as keyof typeof WEIGHT] / WEIGHT[to as keyof typeof WEIGHT];
  else if (from in AREA && to in AREA) converted = value * AREA[from as keyof typeof AREA] / AREA[to as keyof typeof AREA];
  else return null;
  return Number.isFinite(converted) ? converted : null;
}
export function formatUnitResult(value: number, kind: UnitKind): string {
  const maxDigits = kind === 'temperature' ? 1 : 2;
  const factor = 10 ** maxDigits;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  const normalized = Object.is(rounded, -0) || rounded === 0 ? 0 : rounded;
  return new Intl.NumberFormat('en-NZ', { maximumFractionDigits: maxDigits }).format(normalized);
}
