import type { Currency } from './types';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const WESTERN_DIGITS = '0123456789';

export function convertArabicDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const idx = ARABIC_DIGITS.indexOf(ch);
    out += idx >= 0 ? WESTERN_DIGITS[idx] : ch;
  }
  return out;
}

const CURRENCY_MAP: Record<string, Currency> = {
  'دينار': 'LYD', 'د.ل': 'LYD', 'دل': 'LYD', 'lyd': 'LYD',
  '$': 'USD', 'usd': 'USD', 'دولار': 'USD',
  '€': 'EUR', 'eur': 'EUR', 'جنيه': 'EGP', 'egp': 'EGP', 'ريال': 'SAR', 'sar': 'SAR', 'درهم': 'AED', 'aed': 'AED',
};

const FREE_MARKERS = ['مجاني', 'free', 'مجاناً', 'مجانا'];

export interface ParsedPrice { price: number | null; currency: Currency; isRange: boolean; }

export function parsePrice(raw: string | null | undefined): ParsedPrice {
  if (raw == null) return { price: null, currency: null, isRange: false };
  const normalized = convertArabicDigits(raw).trim().toLowerCase();
  if (normalized === '' || FREE_MARKERS.some((m) => normalized === m || normalized.includes(m))) return { price: null, currency: null, isRange: false };
  let currency: Currency = null;
  for (const [marker, curr] of Object.entries(CURRENCY_MAP)) { if (normalized.includes(marker.toLowerCase())) { currency = curr; break; } }
  const numberTokens = normalized.match(/[\d,]+(?:\.\d+)?/g);
  if (!numberTokens || numberTokens.length === 0) return { price: null, currency, isRange: false };
  const numbers = numberTokens.map((t) => parseFloat(t.replace(/,/g, ''))).filter((n) => !isNaN(n));
  if (numbers.length === 0) return { price: null, currency, isRange: false };
  const hasRangeSeparator = /[-–]|to|إلى|او|or|\bمن\b/.test(normalized);
  const isRange = hasRangeSeparator && numbers.length >= 2;
  return { price: Math.min(...numbers), currency, isRange };
}

export function formatPrice(price: number | null, currency: Currency): string {
  if (price == null) return '—';
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(price);
  const currLabel = currency === 'LYD' ? ' د.ل' : currency ? ` ${currency}` : '';
  return `${formatted}${currLabel}`;
}
