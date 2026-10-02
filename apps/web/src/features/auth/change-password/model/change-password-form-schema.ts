import { ChangePasswordSchema } from '@balance/shared';
import { z } from 'zod';

export const ChangePasswordFormSchema = z
  .object({ ...ChangePasswordSchema.shape, confirmPassword: z.string() })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
export type ChangePasswordFormValues = z.input<typeof ChangePasswordFormSchema>;
