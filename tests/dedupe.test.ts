import { normalizeTitle, titleSimilarity, areLikelyDuplicates, dedupeBySourceId } from '../lib/dedupe';
import type { NormalizedListing } from '../lib/types';

let passed = 0; let failed = 0;
function assert(cond: boolean, msg: string) { if (cond) { passed++; } else { failed++; console.error(`FAIL: ${msg}`); } }

console.log('=== Dedupe Tests ===');

assert(normalizeTitle('  آيفون  13! ') === 'آيفون 13', 'normalizeTitle strips punctuation');
assert(normalizeTitle('iPhone 13') === 'iphone 13', 'normalizeTitle lowercases');

assert(titleSimilarity('آيفون 13', 'آيفون 13') === 1, 'Identical titles = 1');
assert(titleSimilarity('آيفون 13', 'جالكسي s22') < 0.5, 'Different titles < 0.5');
assert(titleSimilarity('iPhone 13 Pro Max', 'iPhone 13 Pro') > 0.8, 'Similar titles > 0.8');

const a: NormalizedListing = { source: 'opensooq', sourceId: '1', title: 'آيفون 13', price: 3000, currency: 'LYD', priceRaw: '3000', images: [], url: 'http://a' };
const b: NormalizedListing = { source: 'facebook', sourceId: '2', title: 'آيفون 13', price: 3000, currency: 'LYD', priceRaw: '3000', images: [], url: 'http://b' };
assert(areLikelyDuplicates(a, b) === true, 'Cross-source dupe detected');

const c: NormalizedListing = { source: 'facebook', sourceId: '3', title: 'تويوتا كامري', price: 50000, currency: 'LYD', priceRaw: '50000', images: [], url: 'http://c' };
assert(areLikelyDuplicates(a, c) === false, 'Different title+price not dupe');

a.source = 'opensooq'; b.source = 'opensooq';
assert(areLikelyDuplicates(a, b) === false, 'Same source not cross-source dupe');

const listings: NormalizedListing[] = [
  { source: 's', sourceId: '1', title: 'A', price: 1, currency: 'LYD', priceRaw: '1', images: [], url: 'x' },
  { source: 's', sourceId: '1', title: 'A', price: 1, currency: 'LYD', priceRaw: '1', images: [], url: 'x' },
  { source: 's', sourceId: '2', title: 'B', price: 2, currency: 'LYD', priceRaw: '2', images: [], url: 'y' },
];
assert(dedupeBySourceId(listings).length === 2, 'dedupeBySourceId removes same source+id');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
