'use client';

import { ChangePasswordSchema } from '@balance/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm, type FieldPath } from 'react-hook-form';
import { toast } from 'sonner';
import { getApiErrorMessage, isApiError } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';
import { changePassword } from '../api/change-password';
import {
  ChangePasswordFormSchema,
  type ChangePasswordFormValues,
} from '../model/change-password-form-schema';

const FIELDS: { name: FieldPath<ChangePasswordFormValues>; label: string; autoComplete: string }[] =
  [
    { name: 'currentPassword', label: 'Текущий пароль', autoComplete: 'current-password' },
    { name: 'newPassword', label: 'Новый пароль', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Повторите новый пароль', autoComplete: 'new-password' },
  ];

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    // parse базовой схемы отбрасывает confirmPassword
    mutationFn: (values: ChangePasswordFormValues) =>
      changePassword(ChangePasswordSchema.parse(values)),
    onSuccess: () => {
      form.reset();
      toast.success('Пароль изменён. Остальные сессии завершены');
    },
    onError: (error) =>
      form.setError(isApiError(error, 400) ? 'currentPassword' : 'root', {
        message: getApiErrorMessage(error),
      }),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="grid gap-4"
      >
        {FIELDS.map(({ name, label, autoComplete }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete={autoComplete} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button type="submit" className="justify-self-start" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Сменить пароль
        </Button>
      </form>
    </Form>
  );
}
