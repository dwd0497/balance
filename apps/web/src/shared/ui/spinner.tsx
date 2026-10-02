import { Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2Icon aria-label="Загрузка" className={cn('size-4 animate-spin', className)} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}
