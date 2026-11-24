import { parsePrice, formatPrice, convertArabicDigits } from '../lib/price';

let passed = 0; let failed = 0;
function assert(cond: boolean, msg: string) { if (cond) { passed++; } else { failed++; console.error(`FAIL: ${msg}`); } }

console.log('=== Price Parser Tests ===');

assert(convertArabicDigits('٠١٢٣٤٥٦٧٨٩') === '0123456789', 'Arabic digits convert');
assert(convertArabicDigits('price ١٢٣ د.ل') === 'price 123 د.ل', 'Mixed Arabic+text converts');

let r = parsePrice('١٬٢٠٠ دينار');
assert(r.price === 1200, `Arabic thousands: got ${r.price}`);
assert(r.currency === 'LYD', 'Arabic currency LYD');

r = parsePrice('3,500 د.ل');
assert(r.price === 3500, 'Western commas stripped');

r = parsePrice('مجاني');
assert(r.price === null, 'Free marker returns null');

r = parsePrice('');
assert(r.price === null, 'Empty returns null');

r = parsePrice(null);
assert(r.price === null, 'null returns null');

r = parsePrice('500 - 800 دولار');
assert(r.price === 500 && r.isRange, `Range takes lower: got ${r.price}, isRange=${r.isRange}`);
assert(r.currency === 'USD', 'Range currency USD');

r = parsePrice('$1,200');
assert(r.price === 1200 && r.currency === 'USD', 'Dollar sign parsed');

r = parsePrice('9,999');
assert(r.price === 9999, 'Plain number parsed');

assert(formatPrice(1500, 'LYD') === '1,500 د.ل', 'Format LYD');
assert(formatPrice(null, null) === '—', 'Format null');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
