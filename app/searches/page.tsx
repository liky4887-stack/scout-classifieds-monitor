'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark, Plus, Trash2, Bell, Search } from 'lucide-react';
import { toast } from 'sonner';

interface SavedSearch {
  id: string;
  name: string;
  keywords: string | null;
  category: string | null;
  max_price: number | null;
  city: string | null;
  source_id: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: '', label: 'كل الفئات' },
  { value: 'phones', label: 'هواتف' },
  { value: 'cars', label: 'سيارات' },
  { value: 'real-estate', label: 'عقارات' },
  { value: 'electronics', label: 'إلكترونيات' },
];

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', keywords: '', category: '', maxPrice: '', city: '', sourceId: '' });
  const [sources, setSources] = useState<{ id: string; name_ar: string }[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('saved_searches').select('*').order('created_at', { ascending: false });
    if (!error) setSearches((data ?? []) as SavedSearch[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.from('sources').select('id, name_ar').then(({ data }) => {
      setSources((data ?? []) as { id: string; name_ar: string }[]);
    });
  }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('الاسم مطلوب'); return; }
    const { error } = await supabase.from('saved_searches').insert({
      name: form.name, keywords: form.keywords || null, category: form.category || null,
      max_price: form.maxPrice ? parseFloat(form.maxPrice) : null, city: form.city || null, source_id: form.sourceId || null,
    });
    if (error) { toast.error('فشل حفظ البحث'); return; }
    toast.success('تم حفظ البحث');
    setForm({ name: '', keywords: '', category: '', maxPrice: '', city: '', sourceId: '' });
    setShowForm(false); load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('saved_searches').delete().eq('id', id);
    if (error) { toast.error('فشل الحذف'); return; }
    toast.success('تم حذف البحث'); load();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20 md:pb-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bookmark className="w-6 h-6 text-primary" />البحوث المحفوظة</h1>
          <p className="text-sm text-muted-foreground mt-1">احفظ معايير البحث واحصل على إشعارات عند ظهور إعلانات جديدة مطابقة</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 ml-2" />بحث جديد</Button>
      </div>

      {showForm && (
        <Card className="mb-6 animate-fade-in">
          <CardHeader><CardTitle className="text-base">بحث محفوظ جديد</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">الاسم *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: آيفون في طرابلس" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">الكلمات المفتاحية</label>
                <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="مثال: آيفون 13" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">السعر الأقصى</label>
                <Input type="number" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} placeholder="مثال: 5000" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">الفئة</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="كل الفئات" /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent></Select></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">المدينة</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="مثال: طرابلس" /></div>
              <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground mb-1.5 block">المصدر</label>
                <Select value={form.sourceId} onValueChange={(v) => setForm({ ...form, sourceId: v })}><SelectTrigger><SelectValue placeholder="كل المصادر" /></SelectTrigger><SelectContent><SelectItem value="">كل المصادر</SelectItem>{sources.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="flex gap-2"><Button onClick={handleSave}>حفظ</Button><Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button></div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full rounded-xl" />))}</div>
      ) : searches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><Bookmark className="w-8 h-8 text-muted-foreground" /></div>
          <h3 className="font-semibold text-lg">لا توجد بحوث محفوظة</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">أنشئ بحثاً محفوظاً لتصلك إشعارات عند ظهور إعلانات جديدة مطابقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2"><Bell className="w-4 h-4 text-primary shrink-0" /><h3 className="font-semibold text-sm truncate">{s.name}</h3></div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {s.keywords && (<span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted"><Search className="w-3 h-3" />{s.keywords}</span>)}
                      {s.category && (<span className="px-2 py-0.5 rounded-md bg-muted">{CATEGORIES.find((c) => c.value === s.category)?.label ?? s.category}</span>)}
                      {s.max_price != null && (<span className="px-2 py-0.5 rounded-md bg-muted">حتى {s.max_price} د.ل</span>)}
                      {s.city && (<span className="px-2 py-0.5 rounded-md bg-muted">{s.city}</span>)}
                      {s.source_id && (<span className="px-2 py-0.5 rounded-md bg-muted">{sources.find((src) => src.id === s.source_id)?.name_ar ?? s.source_id}</span>)}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
