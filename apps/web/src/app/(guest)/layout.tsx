import { Suspense, type ReactNode } from 'react';
import { FullPageSpinner } from '@/shared/ui/spinner';
import { GuestGuard } from '../_guards';

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    // useSearchParams в гарде и страницах требует Suspense-границы
    <Suspense fallback={<FullPageSpinner />}>
      <GuestGuard>
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </GuestGuard>
    </Suspense>
  );
}
