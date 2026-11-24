'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionStatus } from '@/lib/types';
import { toast } from 'sonner';

export interface SourceInfo { id: string; name: string; nameAr: string; baseUrl: string; enabled: boolean; pollIntervalSeconds: number; sessionStatus: SessionStatus; }

interface AppContextValue {
  sources: SourceInfo[];
  loadingSources: boolean;
  refreshSources: () => Promise<void>;
  triggerWorker: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  const refreshSources = useCallback(async () => {
    const { data, error } = await supabase.from('sources').select('id, name, name_ar, base_url, enabled, poll_interval_seconds').order('name');
    if (error) { setLoadingSources(false); return; }
    const sessionPromises = (data ?? []).map(async (s) => {
      const { data: sess } = await supabase.from('sessions').select('status').eq('source_id', s.id).maybeSingle();
      return { id: s.id, name: s.name, nameAr: s.name_ar, baseUrl: s.base_url, enabled: s.enabled, pollIntervalSeconds: s.poll_interval_seconds, sessionStatus: (sess?.status ?? 'missing') as SessionStatus };
    });
    const enriched = await Promise.all(sessionPromises);
    setSources(enriched); setLoadingSources(false);
  }, []);

  const triggerWorker = useCallback(async () => {
    const { error } = await supabase.functions.invoke('scout-worker');
    if (error) { toast.error('فشل تشغيل العامل'); return; }
    toast.success('تم تشغيل العامل بنجاح');
  }, []);

  useEffect(() => { refreshSources(); }, [refreshSources]);

  return <AppContext.Provider value={{ sources, loadingSources, refreshSources, triggerWorker }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
