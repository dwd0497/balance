import type { ReactNode } from 'react';
import { AppHeader } from '@/widgets/app-header';
import { AuthGuard } from '../_guards';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
    </AuthGuard>
  );
}
