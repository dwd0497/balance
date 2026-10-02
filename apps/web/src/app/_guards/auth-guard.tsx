'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useCurrentUser } from '@/entities/user';
import { routes, withNext } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { FullPageSpinner } from '@/shared/ui/spinner';

/** Пускает только авторизованных; остальных отправляет на логин с возвратом на текущую страницу. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: user, isPending, isError, refetch } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null) router.replace(withNext(routes.login, pathname));
  }, [user, router, pathname]);

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Не удалось связаться с сервером</p>
        <Button variant="outline" onClick={() => refetch()}>
          Повторить
        </Button>
      </div>
    );
  }
  if (isPending || !user) return <FullPageSpinner />;
  return children;
}
