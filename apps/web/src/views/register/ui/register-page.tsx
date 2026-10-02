'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RegisterForm } from '@/features/auth/register';
import { NEXT_PARAM, routes, withNext } from '@/shared/config';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

export function RegisterPage() {
  const next = useSearchParams().get(NEXT_PARAM);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Регистрация</CardTitle>
        <CardDescription>Создайте аккаунт, чтобы вести бюджет ремонта</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Уже есть аккаунт?&nbsp;
        <Link href={withNext(routes.login, next)} className="text-foreground underline">
          Войти
        </Link>
      </CardFooter>
    </Card>
  );
}
