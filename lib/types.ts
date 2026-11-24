export type Currency = 'LYD' | 'USD' | 'EUR' | 'EGP' | 'SAR' | 'AED' | null;
export type SessionStatus = 'valid' | 'expired' | 'missing';

export interface NormalizedListing {
  id?: string;
  source: string;
  sourceId: string;
  title: string;
  description?: string;
  price: number | null;
  currency: Currency;
  priceRaw: string;
  city?: string;
  category?: string;
  condition?: string;
  images: string[];
  postedAt?: string;
  url: string;
  seenAt?: string;
  isNew?: boolean;
  isRange?: boolean;
  dupeGroupId?: string;
}

export interface SourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly baseUrl: string;
  readonly disabledByDefault?: boolean;
  fetchNewPosts(session: SourceSession): Promise<NormalizedListing[]>;
  parsePost(raw: unknown): NormalizedListing;
}

export interface SourceSession { sourceId: string; cookies: string; status: SessionStatus; }
export interface SavedSearch { id?: string; name: string; keywords?: string; category?: string; maxPrice?: number | null; city?: string; sourceId?: string; createdAt?: string; }
export interface PriceHistoryEntry { id?: string; listingId?: string; price: number | null; currency: Currency; seenAt: string; }
export interface FetchLog { id?: string; sourceId: string; statusCode?: number; newCount: number; durationMs: number; error?: string; createdAt?: string; }
export type SortOrder = 'price_asc' | 'price_desc' | 'newest';
export interface FeedFilters { category?: string; city?: string; priceMin?: number; priceMax?: number; source?: string; newOnly?: boolean; keywords?: string; }
