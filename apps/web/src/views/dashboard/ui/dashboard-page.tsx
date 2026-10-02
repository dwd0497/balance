'use client';

import { useCurrentUser } from '@/entities/user';

export function DashboardPage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        {user ? `Привет, ${user.firstName}!` : 'Расходы на ремонт'}
      </h1>
      <p className="text-muted-foreground">
        Здесь появится сводка бюджета, список трат и разбивка по категориям и комнатам.
      </p>
    </div>
  );
}
