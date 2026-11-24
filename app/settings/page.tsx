'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings as SettingsIcon, Bell, Palette, Globe, Database, Activity, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('ar');
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ listings: 0, sources: 0, searches: 0, fetches: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    async function loadStats() {
      const [l, s, ss, f] = await Promise.all([
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('sources').select('*', { count: 'exact', head: true }),
        supabase.from('saved_searches').select('*', { count: 'exact', head: true }),
        supabase.from('fetch_logs').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ listings: l.count ?? 0, sources: s.count ?? 0, searches: ss.count ?? 0, fetches: f.count ?? 0 });
      setLoadingStats(false);
    }
    loadStats();
  }, []);

  const handleClearNotifications = () => { toast.success('تم مسح الإشعارات'); };
  const handleResetSettings = () => { setTheme('light'); setLanguage('ar'); toast.success('تم إعادة ضبط الإعدادات'); };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-20 md:pb-6">
      <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><SettingsIcon className="w-6 h-6 text-primary" />الإعدادات</h1><p className="text-sm text-muted-foreground mt-1">تخصيص التطبيق والتفضيلات</p></div>
      <Card className="mb-4"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-primary" />الإشعارات</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm">إشعارات الإعلانات الجديدة</span><Badge variant="default">مفعّل</Badge></div>
          <div className="flex items-center justify-between"><span className="text-sm">إشعار تغيير السعر</span><Badge variant="secondary">معطّل</Badge></div>
          <Button variant="outline" size="sm" onClick={handleClearNotifications}><Trash2 className="w-3 h-3 ml-2" />مسح الإشعارات</Button>
        </CardContent></Card>
      <Card className="mb-4"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4 text-primary" />المظهر</CardTitle></CardHeader>
        <CardContent className="space-y-3"><div className="flex items-center justify-between"><span className="text-sm">الوضع</span>{mounted && (<Select value={theme ?? 'light'} onValueChange={(v) => setTheme(v)}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">فاتح</SelectItem><SelectItem value="dark">داكن</SelectItem><SelectItem value="system">تلقائي</SelectItem></SelectContent></Select>)}</div></CardContent></Card>
      <Card className="mb-4"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />اللغة</CardTitle></CardHeader>
        <CardContent><div className="flex items-center justify-between"><span className="text-sm">لغة الواجهة</span><Select value={language} onValueChange={setLanguage}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ar">العربية</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></div></CardContent></Card>
      <Card className="mb-4"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4 text-primary" />البيانات</CardTitle></CardHeader>
        <CardContent>{loadingStats ? (<div className="space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /></div>) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3"><div className="text-2xl font-bold text-primary">{stats.listings}</div><div className="text-xs text-muted-foreground">إعلان</div></div>
            <div className="rounded-lg bg-muted/50 p-3"><div className="text-2xl font-bold text-primary">{stats.sources}</div><div className="text-xs text-muted-foreground">مصدر</div></div>
            <div className="rounded-lg bg-muted/50 p-3"><div className="text-2xl font-bold text-primary">{stats.searches}</div><div className="text-xs text-muted-foreground">بحث محفوظ</div></div>
            <div className="rounded-lg bg-muted/50 p-3"><div className="text-2xl font-bold text-primary">{stats.fetches}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3" />عملية جلب</div></div>
          </div>)}</CardContent></Card>
      <Card><CardContent className="p-4"><Button variant="outline" onClick={handleResetSettings} className="w-full"><RotateCcw className="w-4 h-4 ml-2" />إعادة ضبط الإعدادات</Button></CardContent></Card>
    </div>
  );
}
