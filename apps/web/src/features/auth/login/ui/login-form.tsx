'use client';

import { LoginSchema, type LoginInput } from '@balance/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { userKeys } from '@/entities/user';
import { getApiErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';
import { login } from '../api/login';

export function LoginForm() {
  const queryClient = useQueryClient();
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: login,
    // Редирект после входа делает гостевой гард, увидев пользователя в кеше
    onSuccess: (user) => queryClient.setQueryData(userKeys.me, user),
    onError: (error) => form.setError('root', { message: getApiErrorMessage(error) }),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="grid gap-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Войти
        </Button>
      </form>
    </Form>
  );
}
