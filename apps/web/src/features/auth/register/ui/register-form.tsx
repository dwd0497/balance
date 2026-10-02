'use client';

import { RegisterSchema } from '@balance/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type FieldPath } from 'react-hook-form';
import { userKeys } from '@/entities/user';
import { getApiErrorMessage, isApiError } from '@/shared/api';
import { routes } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';
import { register } from '../api/register';
import { RegisterFormSchema, type RegisterFormValues } from '../model/register-form-schema';

const FIELDS: {
  name: Exclude<FieldPath<RegisterFormValues>, 'acceptTerms'>;
  label: string;
  type?: string;
  autoComplete: string;
}[] = [
  { name: 'firstName', label: 'Имя', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Фамилия', autoComplete: 'family-name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Пароль', type: 'password', autoComplete: 'new-password' },
  {
    name: 'confirmPassword',
    label: 'Повторите пароль',
    type: 'password',
    autoComplete: 'new-password',
  },
];

export function RegisterForm() {
  const queryClient = useQueryClient();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const mutation = useMutation({
    // parse базовой схемы отбрасывает confirmPassword
    mutationFn: (values: RegisterFormValues) => register(RegisterSchema.parse(values)),
    // Редирект после регистрации делает гостевой гард, увидев пользователя в кеше
    onSuccess: (user) => queryClient.setQueryData(userKeys.me, user),
    onError: (error) =>
      form.setError(isApiError(error, 409) ? 'email' : 'root', {
        message: getApiErrorMessage(error),
      }),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="grid gap-4"
      >
        {FIELDS.map(({ name, label, type, autoComplete }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input type={type} autoComplete={autoComplete} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                    className="mt-0.5"
                  />
                </FormControl>
                <FormLabel className="block leading-snug font-normal">
                  Согласен с{' '}
                  <a
                    href={routes.userAgreement}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-primary"
                  >
                    пользовательским соглашением
                  </a>{' '}
                  и{' '}
                  <a
                    href={routes.privacyPolicy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-primary"
                  >
                    политикой обработки данных
                  </a>
                </FormLabel>
              </div>
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
          Зарегистрироваться
        </Button>
      </form>
    </Form>
  );
}
