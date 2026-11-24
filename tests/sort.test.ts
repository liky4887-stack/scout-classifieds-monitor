import { sortListings } from '../lib/sort';
import type { NormalizedListing } from '../lib/types';

let passed = 0; let failed = 0;
function assert(cond: boolean, msg: string) { if (cond) { passed++; } else { failed++; console.error(`FAIL: ${msg}`); } }

console.log('=== Sort Tests ===');

const listings: NormalizedListing[] = [
  { source: 's', sourceId: '3', title: 'C', price: 300, currency: 'LYD', priceRaw: '300', images: [], url: 'c', postedAt: '2025-01-03T00:00:00Z' },
  { source: 's', sourceId: '1', title: 'A', price: null, currency: null, priceRaw: '', images: [], url: 'a', postedAt: '2025-01-01T00:00:00Z' },
  { source: 's', sourceId: '2', title: 'B', price: 100, currency: 'LYD', priceRaw: '100', images: [], url: 'b', postedAt: '2025-01-02T00:00:00Z' },
];

const asc = sortListings(listings, 'price_asc');
assert(asc[0].price === 100, 'price_asc first is 100');
assert(asc[1].price === 300, 'price_asc second is 300');
assert(asc[2].price === null, 'price_asc nulls last');

const desc = sortListings(listings, 'price_desc');
assert(desc[0].price === 300, 'price_desc first is 300');
assert(desc[1].price === 100, 'price_desc second is 100');
assert(desc[2].price === null, 'price_desc nulls last');

const newest = sortListings(listings, 'newest');
assert(newest[0].title === 'C', 'newest first is C (Jan 3)');
assert(newest[2].title === 'A', 'newest last is A (Jan 1)');

const allNull: NormalizedListing[] = [
  { source: 's', sourceId: '1', title: 'A', price: null, currency: null, priceRaw: '', images: [], url: 'a' },
  { source: 's', sourceId: '2', title: 'B', price: null, currency: null, priceRaw: '', images: [], url: 'b' },
];
const nullSort = sortListings(allNull, 'price_asc');
assert(nullSort.length === 2, 'All nulls returns all items');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
