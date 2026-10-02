'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/features/auth/login';
import { NEXT_PARAM, routes, withNext } from '@/shared/config';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

export function LoginPage() {
  const next = useSearchParams().get(NEXT_PARAM);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Вход</CardTitle>
        <CardDescription>Войдите, чтобы продолжить учёт расходов на ремонт</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Нет аккаунта?&nbsp;
        <Link href={withNext(routes.register, next)} className="text-foreground underline">
          Зарегистрироваться
        </Link>
      </CardFooter>
    </Card>
  );
}
