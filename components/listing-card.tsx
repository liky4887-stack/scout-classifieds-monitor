'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Tag, ExternalLink, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SourceBadge } from '@/components/source-badge';
import { formatPrice } from '@/lib/price';
import { timeAgo } from '@/lib/format';
import type { NormalizedListing } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = { phones: 'هواتف', cars: 'سيارات', 'real-estate': 'عقارات', electronics: 'إلكترونيات' };

export function ListingCard({ listing }: { listing: NormalizedListing }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 animate-fade-in group">
      <Link href={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {listing.images?.[0] ? (
            <Image src={listing.images[0]} alt={listing.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Tag className="w-8 h-8 text-muted-foreground/40" /></div>
          )}
          {listing.isNew && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-success text-white text-xs font-semibold shadow-sm">جديد</span>}
          {listing.isRange && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-warning/90 text-white text-xs font-medium">نطاق سعري</span>}
        </div>
      </Link>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/listing/${listing.id}`} className="flex-1 min-w-0"><h3 className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">{listing.title}</h3></Link>
          <SourceBadge source={listing.source} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">{formatPrice(listing.price, listing.currency)}</span>
          {listing.isRange && <span className="text-xs text-muted-foreground">+</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {listing.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.city}</span>}
          {listing.category && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{CATEGORY_LABELS[listing.category] ?? listing.category}</span>}
          {listing.postedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(listing.postedAt)}</span>}
        </div>
        <a href={listing.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="w-3 h-3" />عرض الإعلان الأصلي</a>
      </CardContent>
    </Card>
  );
}
