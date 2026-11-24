import type { NormalizedListing, SortOrder } from './types';

export function sortListings(listings: NormalizedListing[], order: SortOrder): NormalizedListing[] {
  const copy = [...listings];
  switch (order) {
    case 'price_asc': copy.sort((a, b) => { if (a.price == null && b.price == null) return 0; if (a.price == null) return 1; if (b.price == null) return -1; return a.price - b.price; }); break;
    case 'price_desc': copy.sort((a, b) => { if (a.price == null && b.price == null) return 0; if (a.price == null) return 1; if (b.price == null) return -1; return b.price - a.price; }); break;
    case 'newest': copy.sort((a, b) => { const ta = a.postedAt ? new Date(a.postedAt).getTime() : 0; const tb = b.postedAt ? new Date(b.postedAt).getTime() : 0; return tb - ta; }); break;
  }
  return copy;
}
