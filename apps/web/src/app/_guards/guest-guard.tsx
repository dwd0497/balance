'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useCurrentUser } from '@/entities/user';
import { NEXT_PARAM, routes, safeNext } from '@/shared/config';
import { FullPageSpinner } from '@/shared/ui/spinner';

/** Страницы входа/регистрации: вошедшего пользователя отправляет по `?next=` или на главную. */
export function GuestGuard({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useCurrentUser();
  const router = useRouter();
  const next = useSearchParams().get(NEXT_PARAM);

  useEffect(() => {
    if (user) router.replace(safeNext(next) ?? routes.home);
  }, [user, router, next]);

  if (isPending || user) return <FullPageSpinner />;
  return children;
}
