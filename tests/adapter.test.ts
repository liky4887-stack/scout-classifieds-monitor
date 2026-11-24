import { opensooqAdapter } from '../lib/sources/opensooq';
import { readFileSync } from 'fs';
import { join } from 'path';

let passed = 0; let failed = 0;
function assert(cond: boolean, msg: string) { if (cond) { passed++; } else { failed++; console.error(`FAIL: ${msg}`); } }

console.log('=== Adapter Tests ===');

const fixturePath = join(__dirname, 'fixtures', 'opensooq_sample.html');
const html = readFileSync(fixturePath, 'utf-8');

const listings = opensooqAdapter.parseListPage(html, 'phones');
assert(listings.length >= 3, `parseListPage found >= 3 listings: got ${listings.length}`);

if (listings.length > 0) {
  const first = listings[0];
  assert(first.source === 'opensooq', 'source is opensooq');
  assert(first.sourceId.length > 0, 'sourceId not empty');
  assert(first.title.length > 0, 'title not empty');
  assert(first.url.includes('opensooq.com'), 'url includes opensooq.com');
}

const arabicPriceListing = listings.find((l) => l.priceRaw.includes('دينار') || l.priceRaw.includes('د.ل'));
if (arabicPriceListing) { assert(arabicPriceListing.price != null, 'Arabic price parsed to number'); assert(arabicPriceListing.currency === 'LYD', 'Arabic price currency is LYD'); }

const freeListing = listings.find((l) => l.priceRaw.includes('مجاني'));
if (freeListing) { assert(freeListing.price === null, 'Free listing price is null'); }

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
