import type { LineItem } from './types';

export interface Totals {
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
}

// Money is rounded to cents at every step, so the figures on screen, in the
// database and in the PDF always agree.
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineTotal(item: LineItem): number {
  return round2((Number(item.quantity) || 0) * (Number(item.unit_price) || 0));
}

export function computeTotals(items: LineItem[], discount: number, taxRate: number, amountPaid: number): Totals {
  const subtotal = round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const appliedDiscount = round2(Math.min(Math.max(discount || 0, 0), subtotal));
  const taxAmount = round2(((subtotal - appliedDiscount) * Math.max(taxRate || 0, 0)) / 100);
  const total = round2(subtotal - appliedDiscount + taxAmount);
  const paid = round2(Math.max(amountPaid || 0, 0));
  return { subtotal, discount: appliedDiscount, taxAmount, total, amountPaid: paid, balanceDue: round2(total - paid) };
}

export function formatMoney(amount: number, currency: string): string {
  const value = new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(amount) || 0,
  );
  return `${currency} ${value}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "2026-07-28" -> "28 July 2026", without time-zone shifts.
export function formatDate(value: string | null): string {
  if (!value) return '';
  // Accept 'YYYY-MM-DD' or a full ISO datetime; take only the date part.
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
