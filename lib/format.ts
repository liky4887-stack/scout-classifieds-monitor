import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return formatDistanceToNow(d, { addSuffix: true, locale: ar });
}

export function timeAgoEn(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return formatDistanceToNow(d, { addSuffix: true, locale: enUS });
}

export function formatNumber(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}
