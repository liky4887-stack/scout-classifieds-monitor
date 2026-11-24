'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { sortListings } from '@/lib/sort';
import { ListingCard, type ListingCardData } from '@/components/listing-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, X, ArrowUpDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortOrder, Currency, NormalizedListing } from '@/lib/types';

const CATEGORIES = [
  { value: 'all', label: 'كل الفئات' },
  { value: 'phones', label: 'هواتف' },
  { value: 'cars', label: 'سيارات' },
  { value: 'real-estate', label: 'عقارات' },
  { value: 'electronics', label: 'إلكترونيات' },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'price_asc', label: 'السعر: الأقل أولاً' },
  { value: 'price_desc', label: 'السعر: الأعلى أولاً' },
  { value: 'newest', label: 'الأحدث' },
];

export default function FeedPage() {
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOrder>('price_asc');
  const [filters, setFilters] = useState({
    category: 'all',
    city: '',
    priceMin: '',
    priceMax: '',
    source: 'all',
    newOnly: false,
    keywords: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [sources, setSources] = useState<{ id: string; name_ar: string }[]>([]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('listings').select('*').order('seen_at', { ascending: false }).limit(200);

    const { data, error } = await query;
    if (error) {
      setLoading(false);
      return;
    }

    // Fetch price history for "dropped from" display
    const listingIds = (data ?? []).map((l) => l.id);
    const { data: history } = await supabase
      .from('price_history')
      .select('listing_id, price, currency')
      .in('listing_id', listingIds)
      .order('seen_at', { ascending: false });

    const historyMap = new Map<string, number>();
    for (const h of history ?? []) {
      if (!historyMap.has(h.listing_id)) {
        historyMap.set(h.listing_id, h.price);
      }
    }

    const enriched: ListingCardData[] = (data ?? []).map((l) => ({
      id: l.id,
      source_id: l.source_id,
      source_listing_id: l.source_listing_id,
      title: l.title,
      description: l.description,
      price: l.price,
      currency: l.currency,
      price_raw: l.price_raw,
      city: l.city,
      category: l.category,
      condition: l.condition,
      images: l.images ?? [],
      posted_at: l.posted_at,
      url: l.url,
      is_new: l.is_new,
      is_range: l.is_range,
      previous_price: historyMap.get(l.id) ?? null,
    }));

    // Extract unique cities and sources for filter dropdowns
    const uniqueCities = Array.from(new Set(enriched.map((l) => l.city).filter((c): c is string => c !== null && c !== undefined)));
    setCities(uniqueCities.sort());

    const { data: srcData } = await supabase.from('sources').select('id, name_ar');
    setSources((srcData ?? []) as { id: string; name_ar: string }[]);

    setListings(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const filtered = useMemo(() => {
    let result = listings;

    if (filters.category !== 'all') {
      result = result.filter((l) => l.category === filters.category);
    }
    if (filters.city) {
      result = result.filter((l) => l.city === filters.city);
    }
    if (filters.source !== 'all') {
      result = result.filter((l) => l.source_id === filters.source);
    }
    if (filters.priceMin) {
      const min = parseFloat(filters.priceMin);
      result = result.filter((l) => l.price != null && l.price >= min);
    }
    if (filters.priceMax) {
      const max = parseFloat(filters.priceMax);
      result = result.filter((l) => l.price != null && l.price <= max);
    }
    if (filters.newOnly) {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
      result = result.filter((l) => {
        const seen = l.posted_at ? new Date(l.posted_at) : null;
        return l.is_new || (seen && seen > fifteenMinAgo);
      });
    }
    if (filters.keywords) {
      const kw = filters.keywords.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(kw) || (l.description?.toLowerCase().includes(kw) ?? false)
      );
    }

    const normalized = result.map((l) => ({
      ...l,
      source: l.source_id,
      sourceId: l.source_listing_id,
      priceRaw: l.price_raw ?? '',
      currency: (l.currency as Currency) ?? null,
    }));
    const sorted = sortListings(normalized as unknown as NormalizedListing[], sortBy);
    return sorted as unknown as ListingCardData[];
  }, [listings, filters, sortBy]);

  const newCount = filtered.filter((l) => l.is_new).length;
  const activeFilterCount = [
    filters.category !== 'all',
    filters.city !== '',
    filters.source !== 'all',
    filters.priceMin !== '',
    filters.priceMax !== '',
    filters.newOnly,
    filters.keywords !== '',
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">إعلانات مبوبة</h1>
            <p className="text-sm text-muted-foreground mt-1">
              مراقبة الإعلانات من مصادر متعددة، مرتبة حسب السعر
            </p>
          </div>
          {newCount > 0 && (
            <Badge className="bg-success/15 text-success border-success/20 hover:bg-success/20">
              <Zap className="w-3 h-3 ml-1" />
              {newCount} إعلان جديد
            </Badge>
          )}
        </div>

        {/* Search bar + sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن إعلان..."
              value={filters.keywords}
              onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
              className="pr-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOrder)}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="w-4 h-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="w-4 h-4 ml-2" />
            تصفية
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -left-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الفئة</label>
                <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">المدينة</label>
                <Select value={filters.city} onValueChange={(v) => setFilters({ ...filters, city: v })}>
                  <SelectTrigger><SelectValue placeholder="كل المدن" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">كل المدن</SelectItem>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">المصدر</label>
                <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المصادر</SelectItem>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant={filters.newOnly ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, newOnly: !filters.newOnly })}
                  className="w-full"
                >
                  <Zap className="w-4 h-4 ml-2" />
                  جديد (15 دقيقة)
                </Button>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">السعر الأدنى</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">السعر الأعلى</label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({ category: 'all', city: '', priceMin: '', priceMax: '', source: 'all', newOnly: false, keywords: '' })}>
                <X className="w-3 h-3 ml-1" />
                مسح التصفية
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {loading ? 'جارٍ التحميل...' : `${filtered.length} إعلان`}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">لا توجد إعلانات</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            لم يتم العثور على إعلانات مطابقة. جرّب تعديل التصفية أو تأكد من أن المصادر مفعّلة ولديها جلسة صالحة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
