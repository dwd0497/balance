'use client';

import { getFullName, useCurrentUser } from '@/entities/user';
import { ChangePasswordForm } from '@/features/auth/change-password';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' });

export function ProfilePage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Профиль</h1>
      <Card>
        <CardHeader>
          <CardTitle>{getFullName(user)}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          С нами с {dateFormatter.format(new Date(user.createdAt))}
        </CardContent>
      </Card>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Смена пароля</CardTitle>
          <CardDescription>Все остальные сессии будут завершены</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
