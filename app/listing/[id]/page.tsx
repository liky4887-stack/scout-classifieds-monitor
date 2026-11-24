'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/price';
import { timeAgo } from '@/lib/format';
import { SourceBadge } from '@/components/source-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ExternalLink, MapPin, Tag, Clock, TrendingDown, ImageIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Currency } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = {
  phones: 'هواتف',
  cars: 'سيارات',
  'real-estate': 'عقارات',
  electronics: 'إلكترونيات',
};

interface PriceHistoryEntry {
  id: string;
  price: number | null;
  currency: string | null;
  seen_at: string;
}

interface ListingDetail {
  id: string;
  source_id: string;
  source_listing_id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  price_raw: string | null;
  city: string | null;
  category: string | null;
  condition: string | null;
  images: string[];
  posted_at: string | null;
  url: string;
  is_new: boolean;
  is_range: boolean;
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        setLoading(false);
        return;
      }
      setListing(data);

      const { data: histData } = await supabase
        .from('price_history')
        .select('id, price, currency, seen_at')
        .eq('listing_id', id)
        .order('seen_at', { ascending: false });

      setHistory((histData ?? []) as PriceHistoryEntry[]);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold">الإعلان غير موجود</h2>
        <p className="text-sm text-muted-foreground mt-2">ربما تم حذفه أو أن الرابط غير صحيح.</p>
        <Link href="/" className="inline-flex items-center gap-2 mt-4 text-primary hover:underline">
          <ArrowRight className="w-4 h-4" />
          العودة للإعلانات
        </Link>
      </div>
    );
  }

  const images = listing.images ?? [];
  const currency = (listing.currency as Currency) ?? 'LYD';
  const price = listing.price;
  const previousPrice = history.length > 0 ? history[0].price : null;
  const hasDropped = previousPrice != null && price != null && previousPrice > price;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-20 md:pb-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground">الإعلانات</Link>
        <ChevronRight className="w-3 h-3 rotate-180" />
        <span className="text-foreground line-clamp-1">{listing.title}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border">
            {images.length > 0 && images[activeImage] ? (
              <Image src={images[activeImage]} alt={listing.title} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <ImageIcon className="w-16 h-16 opacity-20" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={cn('relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all', i === activeImage ? 'border-primary' : 'border-border hover:border-primary/50')}>
                  <Image src={img} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold leading-snug">{listing.title}</h1>
            <SourceBadge source={listing.source_id} />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{formatPrice(price, currency)}</span>
            {hasDropped && (
              <Badge className="bg-success/15 text-success border-success/20">
                <TrendingDown className="w-3 h-3 ml-1" />
                انخفض من {formatPrice(previousPrice, currency)}
              </Badge>
            )}
            {listing.is_range && (
              <Badge variant="outline" className="border-warning/30 text-warning">نطاق سعر</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {listing.city && (<span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{listing.city}</span>)}
            {listing.category && (<span className="flex items-center gap-1"><Tag className="w-4 h-4" />{CATEGORY_LABELS[listing.category] ?? listing.category}</span>)}
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{timeAgo(listing.posted_at)}</span>
          </div>

          <Button className="w-full" onClick={() => window.open(listing.url, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="w-4 h-4 ml-2" />
            افتح الإعلان الأصلي
          </Button>

          {listing.description && (
            <div className="pt-2">
              <h3 className="text-sm font-semibold mb-2">الوصف</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold mb-3">سجل الأسعار</h3>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-right p-3 font-medium">السعر</th><th className="text-right p-3 font-medium">التاريخ</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-border">
                    <td className="p-3 font-medium">{formatPrice(h.price, (h.currency as Currency) ?? 'LYD')}</td>
                    <td className="p-3 text-muted-foreground">{timeAgo(h.seen_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
