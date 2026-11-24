import type { NormalizedListing, SourceSession } from '../types';

export interface SourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly baseUrl: string;
  readonly disabledByDefault?: boolean;
  fetchNewPosts(session: SourceSession): Promise<NormalizedListing[]>;
  parsePost(raw: unknown): NormalizedListing;
}

export interface FetchResult { listings: NormalizedListing[]; statusCode: number; error?: string; }

export const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
export const MIN_DELAY_MS = 3000;
export const MAX_DELAY_MS = 5000;

export function randomDelay(): number { return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS); }
export function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
export function cookieHeader(cookies: string): string { return cookies.trim(); }
