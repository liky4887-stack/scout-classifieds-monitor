import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const CATEGORIES = [
  { key: 'phones', path: '/ar/phones' },
  { key: 'cars', path: '/ar/cars' },
  { key: 'real-estate', path: '/ar/real-estate' },
  { key: 'electronics', path: '/ar/electronics' },
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parsePrice(raw: string): { price: number | null; currency: string | null; isRange: boolean } {
  if (!raw) return { price: null, currency: null, isRange: false };
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  let normalized = '';
  for (const ch of raw) { const idx = arabicDigits.indexOf(ch); normalized += idx >= 0 ? String(idx) : ch; }
  normalized = normalized.trim().toLowerCase();
  if (normalized.includes('مجاني') || normalized === 'free') return { price: null, currency: null, isRange: false };
  let currency: string | null = null;
  if (normalized.includes('دينار') || normalized.includes('د.ل') || normalized.includes('lyd')) currency = 'LYD';
  else if (normalized.includes('$') || normalized.includes('usd') || normalized.includes('دولار')) currency = 'USD';
  const tokens = normalized.match(/[\d,]+(?:\.\d+)?/g);
  if (!tokens) return { price: null, currency, isRange: false };
  const numbers = tokens.map((t) => parseFloat(t.replace(/,/g, ''))).filter((n) => !isNaN(n));
  if (numbers.length === 0) return { price: null, currency, isRange: false };
  const hasRange = /[-–]|to|إلى|او|or|\bمن\b/.test(normalized);
  return { price: Math.min(...numbers), currency, isRange: hasRange && numbers.length >= 2 };
}

function extractText(html: string, regex: RegExp): string | null {
  const m = html.match(regex); return m ? m[1].replace(/<[^>]*>/g, '').trim() : null;
}

function parseListPage(html: string, category: string, sourceId: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const articleRegex = /<article[^>]*data-id="([^"]+)"[^>]*>([\s\S]*?)<\/article>|<div[^>]*class="[^"]*post[^"]*"[^>]*data-id="([^"]+)"[^>]*>([\s\S]*?)<\/div>/gi;
  let match: RegExpExecArray | null;
  while ((match = articleRegex.exec(html)) !== null) {
    const rawId = match[1] || match[3]; const rawHtml = match[2] || match[4];
    if (!rawId || !rawHtml) continue;
    out.push(parsePost(rawId, rawHtml, category, sourceId));
  }
  if (out.length === 0) {
    const anchorRegex = /<a[^>]*href="(\/ar\/[^"]*post[^"]*|\/ar\/[^"]*\/[^"]+-\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let amatch: RegExpExecArray | null;
    const seen = new Set<string>();
    while ((amatch = anchorRegex.exec(html)) !== null) {
      const href = amatch[1]; const inner = amatch[2];
      if (!href || seen.has(href)) continue;
      seen.add(href);
      const idMatch = href.match(/(\d+)(?:\?|$|#)/);
      out.push(parsePost(idMatch ? idMatch[1] : href, inner, category, sourceId, href));
    }
  }
  return out;
}

function parsePost(rawId: string, html: string, category: string, sourceId: string, href?: string): Record<string, unknown> {
  const title = extractText(html, /<h[23][^>]*>([\s\S]*?)<\/h[23]>/i) || extractText(html, /title="([^"]+)"/i) || 'بدون عنوان';
  const description = extractText(html, /<p[^>]*>([\s\S]*?)<\/p>/i) || '';
  const priceRaw = extractText(html, /(?:price|postPrice)[^>]*>([\s\S]*?)<\//i) || extractText(html, /(\d[\d,]*\s*(?:دينار|د\.ل|دولار)?)/i) || '';
  const city = extractText(html, /(?:city|location)[^>]*>([\s\S]*?)<\//i) || '';
  const imgMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
  const images = imgMatch ? [imgMatch[1]] : [];
  const parsed = parsePrice(priceRaw);
  const baseUrl = 'https://ly.opensooq.com';
  const url = href ? `${baseUrl}${href}` : `${baseUrl}/ar/post/${rawId}`;
  return { source_id: sourceId, source_listing_id: rawId, title, description, price: parsed.price, currency: parsed.currency ?? 'LYD', price_raw: priceRaw, city: city || null, category, images, posted_at: new Date().toISOString(), url, is_new: true, is_range: parsed.isRange };
}

async function fetchWithBackoff(url: string, cookies: string): Promise<{ status: number; html: string | null }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ar,en;q=0.9', Cookie: cookies || '' } });
      if (res.status === 403 || res.status === 429) {
        const delay = 3000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (!res.ok) return { status: res.status, html: null };
      return { status: res.status, html: await res.text() };
    } catch {
      await new Promise((r) => setTimeout(r, 3000 * Math.pow(2, attempt)));
    }
  }
  return { status: 0, html: null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const { data: sources } = await supabase.from('sources').select('id, name, base_url, enabled').eq('enabled', true);
    let totalNew = 0;
    for (const source of sources ?? []) {
      const { data: session } = await supabase.from('sessions').select('cookies_encrypted').eq('source_id', source.id).maybeSingle();
      const cookies = session?.cookies_encrypted ?? '';
      let sourceNew = 0; let lastError: string | null = null; let lastStatus: number | null = null;
      for (const cat of CATEGORIES) {
        const url = `${source.base_url}${cat.path}`;
        const { status, html } = await fetchWithBackoff(url, cookies);
        lastStatus = status;
        if (!html) { continue; }
        const parsed = parseListPage(html, cat.key, source.id);
        if (parsed.length === 0) { continue; }
        const { data: existing } = await supabase.from('listings').select('source_listing_id').eq('source_id', source.id).in('source_listing_id', parsed.map((p) => p.source_listing_id as string));
        const existingIds = new Set((existing ?? []).map((e) => e.source_listing_id));
        const toInsert = parsed.filter((p) => !existingIds.has(p.source_listing_id as string));
        if (toInsert.length > 0) { const { error: insertErr } = await supabase.from('listings').insert(toInsert); if (!insertErr) { sourceNew += toInsert.length; } else { lastError = insertErr.message; } }
        await new Promise((r) => setTimeout(r, 3000 + Math.random() * 2000));
      }
      totalNew += sourceNew;
      await supabase.from('fetch_logs').insert({ source_id: source.id, status_code: lastStatus, new_count: sourceNew, duration_ms: 0, error: lastError });
      await new Promise((r) => setTimeout(r, 3000 + Math.random() * 2000));
    }
    return new Response(JSON.stringify({ ok: true, newCount: totalNew }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
