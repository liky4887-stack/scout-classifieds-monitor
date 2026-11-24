'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/app-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Server, ShieldCheck, ShieldAlert, ShieldX, Clock, Activity, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { encryptCookies } from '@/lib/crypto';
import { cn } from '@/lib/utils';
import type { SessionStatus } from '@/lib/types';

const STATUS_CONFIG: Record<SessionStatus, { label: string; icon: typeof ShieldCheck; color: string; bg: string }> = {
  valid: { label: 'صالح', icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10' },
  expired: { label: 'منتهي', icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10' },
  missing: { label: 'غير موجود', icon: ShieldX, color: 'text-destructive', bg: 'bg-destructive/10' },
};

export default function SourcesPage() {
  const { sources, loadingSources, refreshSources } = useApp();
  const [cookieInputs, setCookieInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, { new_count: number; status_code: number | null; created_at: string; error: string | null }[]>>({});

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase.from('fetch_logs').select('source_id, new_count, status_code, created_at, error').order('created_at', { ascending: false }).limit(20);
      const map: Record<string, { new_count: number; status_code: number | null; created_at: string; error: string | null }[]> = {};
      for (const log of data ?? []) {
        if (!map[log.source_id]) map[log.source_id] = [];
        map[log.source_id]!.push(log);
        if (map[log.source_id]!.length >= 5) break;
      }
      setLogs(map);
    }
    loadLogs();
  }, [sources]);

  const handleSaveCookies = async (sourceId: string) => {
    setSaving(sourceId);
    const cookies = cookieInputs[sourceId];
    if (!cookies || !cookies.trim()) { toast.error('الصق ملفات تعريف الارتباط أولاً'); setSaving(null); return; }
    const encrypted = await encryptCookies(cookies.trim());
    const { error } = await supabase.from('sessions').update({ cookies_encrypted: encrypted, status: 'valid', updated_at: new Date().toISOString() }).eq('source_id', sourceId);
    if (error) { toast.error('فشل حفظ الجلسة'); setSaving(null); return; }
    toast.success('تم حفظ الجلسة بنجاح');
    setCookieInputs({ ...cookieInputs, [sourceId]: '' }); setSaving(null); refreshSources();
  };

  const handleToggleEnable = async (sourceId: string, currentEnabled: boolean) => {
    const { error } = await supabase.from('sources').update({ enabled: !currentEnabled }).eq('id', sourceId);
    if (error) { toast.error('فشل تحديث المصدر'); return; }
    toast.success(!currentEnabled ? 'تم تفعيل المصدر' : 'تم تعطيل المصدر'); refreshSources();
  };

  const handleUpdateInterval = async (sourceId: string, interval: number) => {
    const { error } = await supabase.from('sources').update({ poll_interval_seconds: interval }).eq('id', sourceId);
    if (error) { toast.error('فشل تحديث الفاصل الزمني'); return; }
    refreshSources();
  };

  if (loadingSources) {
    return (<div className="mx-auto max-w-3xl px-4 py-6"><Skeleton className="h-8 w-48 mb-6" /><div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => (<Skeleton key={i} className="h-64 w-full rounded-xl" />))}</div></div>);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20 md:pb-6">
      <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Server className="w-6 h-6 text-primary" />المصادر</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة مصادر الإعلانات، الجلسات، وفترات التحديث</p></div>

      <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="text-sm"><p className="font-semibold text-warning">تنبيه قانوني</p>
          <p className="text-muted-foreground mt-1">استخدام أدوات جمع البيانات قد يخالف شروط استخدام بعض المواقع. تأكد من مراجعة شروط كل مصدر قبل التفعيل. مجموعات فيسبوك ليس لديها واجهة برمجية عامة للإعلانات، واستخراج بياناتها قد يؤدي إلى حظر الحساب.</p></div>
      </div>

      <div className="space-y-4">
        {sources.map((source) => {
          const status = STATUS_CONFIG[source.sessionStatus]; const StatusIcon = status.icon; const sourceLogs = logs[source.id] ?? [];
          return (
            <Card key={source.id} className="animate-fade-in">
              <CardHeader><div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', status.bg)}><StatusIcon className={cn('w-5 h-5', status.color)} /></div>
                  <div><CardTitle className="text-base flex items-center gap-2">{source.nameAr}<span className="text-xs font-normal text-muted-foreground">{source.name}</span></CardTitle>
                    <a href={source.baseUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">{source.baseUrl}<ExternalLink className="w-3 h-3" /></a></div>
                </div>
                <Badge variant={source.enabled ? 'default' : 'secondary'}>{source.enabled ? 'مفعّل' : 'معطّل'}</Badge>
              </div></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">حالة الجلسة:</span><span className={cn('flex items-center gap-1 font-medium', status.color)}><StatusIcon className="w-4 h-4" />{status.label}</span></div>
                <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">ملفات تعريف الارتباط (Cookies) من متصفحك بعد تسجيل الدخول</label>
                  <Textarea value={cookieInputs[source.id] ?? ''} onChange={(e) => setCookieInputs({ ...cookieInputs, [source.id]: e.target.value })} placeholder="الصق ملفات الكوكيز هنا — سيتم تشفيرها بـ AES-256" className="text-xs font-mono" rows={3} />
                  <div className="flex items-center gap-2"><Button size="sm" onClick={() => handleSaveCookies(source.id)} disabled={saving === source.id}>{saving === source.id ? 'جارٍ الحفظ...' : 'حفظ الجلسة'}</Button>
                    {source.sessionStatus === 'expired' && (<span className="text-xs text-warning flex items-center gap-1"><ShieldAlert className="w-3 h-3" />الجلسة منتهية — أعد لصق الكوكيز</span>)}</div>
                </div>
                <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />فترة التحديث:</span>
                  <Select value={String(source.pollIntervalSeconds)} onValueChange={(v) => handleUpdateInterval(source.id, parseInt(v))}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="60">1 دقيقة</SelectItem><SelectItem value="120">2 دقيقة</SelectItem><SelectItem value="300">5 دقائق</SelectItem><SelectItem value="600">10 دقائق</SelectItem></SelectContent></Select>
                </div>
                <Button variant={source.enabled ? 'outline' : 'default'} size="sm" onClick={() => handleToggleEnable(source.id, source.enabled)}>{source.enabled ? 'تعطيل المصدر' : 'تفعيل المصدر'}</Button>
                {sourceLogs.length > 0 && (<div className="pt-3 border-t border-border/40"><h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Activity className="w-3 h-3" />آخر عمليات الجلب</h4>
                  <div className="space-y-1">{sourceLogs.slice(0, 3).map((log, i) => (<div key={i} className="flex items-center justify-between text-xs"><span className={cn('px-1.5 py-0.5 rounded font-mono', log.error ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>{log.status_code ?? '—'}</span><span className="text-muted-foreground">{log.new_count} إعلان جديد</span>{log.error && (<span className="text-destructive truncate max-w-[120px]">{log.error}</span>)}</div>))}</div>
                </div>)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
