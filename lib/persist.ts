import type { NormalizedListing } from './types';
import { supabase } from './supabase';
import { dedupeBySourceId, areLikelyDuplicates } from './dedupe';

export async function persistListings(listings: NormalizedListing[]): Promise<number> {
  const deduped = dedupeBySourceId(listings);
  let newCount = 0;
  const { data: existing } = await supabase.from('listings').select('id, source_id, source_listing_id, price, dupe_group_id, title').in('source_id', Array.from(new Set(deduped.map((l) => l.source))));
  const existingMap = new Map<string, { id: string; price: number | null; dupeGroupId: string | null; title: string }>();
  for (const e of existing ?? []) { existingMap.set(`${e.source_id}:${e.source_listing_id}`, { id: e.id, price: e.price, dupeGroupId: e.dupe_group_id, title: e.title }); }
  const allExisting = (existing ?? []).map((e) => ({ source: e.source_id, sourceId: e.source_listing_id, title: e.title, price: e.price, dupeGroupId: e.dupe_group_id })) as NormalizedListing[];
  const toInsert: Record<string, unknown>[] = [];
  const priceHistoryEntries: Record<string, unknown>[] = [];
  const toUpdate: { id: string; data: Record<string, unknown> }[] = [];
  for (const listing of deduped) {
    const key = `${listing.source}:${listing.sourceId}`;
    const existingEntry = existingMap.get(key);
    if (existingEntry) {
      if (listing.price != null && existingEntry.price != null && listing.price !== existingEntry.price) { priceHistoryEntries.push({ listing_id: existingEntry.id, price: existingEntry.price, seen_at: new Date().toISOString() }); }
      toUpdate.push({ id: existingEntry.id, data: { price: listing.price, price_raw: listing.priceRaw, is_new: false } });
    } else {
      let dupeGroupId: string | null = null;
      for (const ex of allExisting) { if (areLikelyDuplicates(listing, ex)) { dupeGroupId = ex.dupeGroupId ?? crypto.randomUUID(); break; } }
      toInsert.push({ source_id: listing.source, source_listing_id: listing.sourceId, title: listing.title, description: listing.description, price: listing.price, currency: listing.currency, price_raw: listing.priceRaw, city: listing.city, category: listing.category, condition: listing.condition, images: listing.images, posted_at: listing.postedAt, url: listing.url, is_new: true, is_range: listing.isRange ?? false, dupe_group_id: dupeGroupId });
      newCount++;
    }
  }
  if (toInsert.length > 0) await supabase.from('listings').insert(toInsert);
  if (priceHistoryEntries.length > 0) await supabase.from('price_history').insert(priceHistoryEntries);
  for (const upd of toUpdate) await supabase.from('listings').update(upd.data).eq('id', upd.id);
  return newCount;
}
