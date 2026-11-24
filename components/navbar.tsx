'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radar, RefreshCw, Sun, Moon, LayoutGrid, Bookmark, Server, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useApp } from '@/components/app-provider';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'الساحة', icon: LayoutGrid },
  { href: '/searches', label: 'بحوثي', icon: Bookmark },
  { href: '/sources', label: 'المصادر', icon: Server },
  { href: '/settings', label: 'الإعدادات', icon: SettingsIcon },
];

export function Navbar() {
  const pathname = usePathname(); const { theme, setTheme } = useTheme(); const { triggerWorker } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => { setRefreshing(true); await triggerWorker(); setTimeout(() => setRefreshing(false), 2000); };

  return (<>
    <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl h-full px-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Radar className="w-5 h-5 text-primary" /></div>
          <span className="font-bold text-lg tracking-tight">سكاوت</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => { const Icon = item.icon; const active = pathname === item.href;
            return (<Link key={item.href} href={item.href} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}><Icon className="w-4 h-4" />{item.label}</Link>); })}
        </nav>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="h-8 w-8"><RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} /></Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="h-8 w-8"><Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /><Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /></Button>
        </div>
      </div>
    </header>
    <nav className="fixed bottom-0 inset-x-0 z-50 h-16 border-t border-border/60 bg-background/80 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-4 h-full">
        {NAV_ITEMS.map((item) => { const Icon = item.icon; const active = pathname === item.href;
          return (<Link key={item.href} href={item.href} className={cn('flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors', active ? 'text-primary' : 'text-muted-foreground')}><Icon className="w-5 h-5" /><span>{item.label}</span></Link>); })}
      </div>
    </nav>
  </>);
}
