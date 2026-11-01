/**
 * Indian Rupee formatting utility with Indian number system grouping (Lakhs & Crores)
 * e.g. ₹15,000 or ₹1,25,000
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format raw number with Indian comma grouping without currency sign
 */
export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage change with clean sign (e.g. +14.2% or -5.8%)
 */
export function formatPercentage(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0.0%';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(1)}%`;
}

/**
 * Month formatting helper (e.g. '2026-11' -> 'November 2026' or 'Nov 2026')
 */
export function formatMonthName(yearMonth: string, short: boolean = false): string {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return date.toLocaleDateString('en-IN', {
    month: short ? 'short' : 'long',
    year: 'numeric',
  });
}

/**
 * Calculate previous month string: '2026-11' -> '2026-10', '2026-01' -> '2025-12'
 */
export function getPreviousMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const y = prevDate.getFullYear();
  const m = String(prevDate.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
