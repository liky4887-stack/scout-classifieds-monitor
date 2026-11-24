import type { NormalizedListing } from './types';

export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[\u064B-\u0652\u0670]/g, '').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length; const n = b.length;
  if (m === 0) return n; if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { const cost = a[i - 1] === b[j - 1] ? 0 : 1; dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost); } }
  return dp[m][n];
}

export function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a); const nb = normalizeTitle(b);
  if (na === '' || nb === '') return 0;
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  return 1 - levenshtein(na, nb) / maxLen;
}

export function areLikelyDuplicates(a: NormalizedListing, b: NormalizedListing): boolean {
  if (a.source === b.source) return false;
  if (titleSimilarity(a.title, b.title) < 0.8) return false;
  if (a.price == null && b.price == null) return true;
  if (a.price == null || b.price == null) return false;
  return a.price === b.price;
}

export function dedupeBySourceId(listings: NormalizedListing[]): NormalizedListing[] {
  const seen = new Set<string>(); const out: NormalizedListing[] = [];
  for (const l of listings) { const key = `${l.source}:${l.sourceId}`; if (seen.has(key)) continue; seen.add(key); out.push(l); }
  return out;
}
