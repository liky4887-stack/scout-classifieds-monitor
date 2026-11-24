import type { NormalizedListing, SourceSession } from '../types';
import type { SourceAdapter } from './interface';
import { parsePrice } from '../price';

const CATEGORIES = [
  { key: 'phones', path: '/ar/phones' },
  { key: 'cars', path: '/ar/cars' },
  { key: 'real-estate', path: '/ar/real-estate' },
  { key: 'electronics', path: '/ar/electronics' },
] as const;

export class OpenSooqAdapter implements SourceAdapter {
  readonly id = 'opensooq';
  readonly name = 'OpenSooq';
  readonly nameAr = 'أوپن سوق';
  readonly baseUrl = 'https://ly.opensooq.com/ar';

  async fetchNewPosts(session: SourceSession): Promise<NormalizedListing[]> {
    const all: NormalizedListing[] = [];
    for (const cat of CATEGORIES) {
      const html = await this.fetchPage(`${this.baseUrl}${cat.path}`, session.cookies);
      if (html) { const posts = this.parseListPage(html, cat.key); all.push(...posts); }
    }
    return all;
  }

  private async fetchPage(url: string, cookies: string): Promise<string | null> {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept-Language': 'ar,en;q=0.9', Cookie: cookies || '' } });
      if (res.status === 403 || res.status === 429) return null;
      if (!res.ok) return null;
      return await res.text();
    } catch { return null; }
  }

  parseListPage(html: string, category: string): NormalizedListing[] {
    const listings: NormalizedListing[] = [];
    const articleRegex = /<article[^>]*data-id="([^"]+)"[^>]*>([\s\S]*?)<\/article>|<div[^>]*class="[^"]*post[^"]*"[^>]*data-id="([^"]+)"[^>]*>([\s\S]*?)<\/div>/gi;
    let match: RegExpExecArray | null;
    while ((match = articleRegex.exec(html)) !== null) {
      const rawId = match[1] || match[3]; const rawHtml = match[2] || match[4];
      if (!rawId || !rawHtml) continue;
      listings.push(this.parsePost({ id: rawId, html: rawHtml, category }));
    }
    if (listings.length === 0) {
      const anchorRegex = /<a[^>]*href="(\/ar\/[^"]*post[^"]*|\/ar\/[^"]*\/[^"]+-\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let amatch: RegExpExecArray | null;
      const seen = new Set<string>();
      while ((amatch = anchorRegex.exec(html)) !== null) {
        const href = amatch[1]; const inner = amatch[2];
        if (!href || seen.has(href)) continue;
        seen.add(href);
        const idMatch = href.match(/(\d+)(?:\?|$|#)/);
        listings.push(this.parsePost({ id: idMatch ? idMatch[1] : href, html: inner, category, href }));
      }
    }
    return listings;
  }

  parsePost(raw: unknown): NormalizedListing {
    const r = raw as { id: string; html: string; category: string; href?: string };
    const html = r.html || '';
    const title = extractText(html, /<h[23][^>]*>([\s\S]*?)<\/h[23]>/i) || extractText(html, /title="([^"]+)"/i) || 'بدون عنوان';
    const description = extractText(html, /<p[^>]*>([\s\S]*?)<\/p>/i) || '';
    const priceRaw = extractText(html, /(?:price|postPrice)[^>]*>([\s\S]*?)<\//i) || extractText(html, /(\d[\d,]*\s*(?:دينار|د\.ل|دولار)?)/i) || '';
    const city = extractText(html, /(?:city|location)[^>]*>([\s\S]*?)<\//i) || '';
    const imgMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
    const images = imgMatch ? [imgMatch[1]] : [];
    const parsed = parsePrice(priceRaw);
    const url = r.href ? `${this.baseUrl}${r.href}` : `${this.baseUrl}/ar/post/${r.id}`;
    return { source: this.id, sourceId: r.id, title: title.trim(), description: description.trim(), price: parsed.price, currency: parsed.currency ?? 'LYD', priceRaw: priceRaw.trim(), city: city.trim() || undefined, category: r.category, images, url, isNew: true, isRange: parsed.isRange };
  }
}

function extractText(html: string, regex: RegExp): string | null {
  const m = html.match(regex);
  if (!m) return null;
  return m[1].replace(/<[^>]*>/g, '').trim();
}

export const opensooqAdapter = new OpenSooqAdapter();
