import { cn } from '@/lib/utils';

const SOURCE_STYLES: Record<string, { label: string; className: string }> = {
  opensooq: { label: 'OpenSooq', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  facebook: { label: 'Facebook', className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
};

export function SourceBadge({ source, className }: { source: string; className?: string }) {
  const style = SOURCE_STYLES[source] ?? { label: source, className: 'bg-muted text-muted-foreground' };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium shrink-0', style.className, className)}>{style.label}</span>;
}
