import { RegisterSchema, TERMS_REQUIRED } from '@balance/shared';
import { z } from 'zod';

export const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string(),
  // В контракте literal(true); в форме — boolean, чтобы чекбокс стартовал с false
  acceptTerms: z.boolean().refine(Boolean, TERMS_REQUIRED),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});
export type RegisterFormValues = z.input<typeof RegisterFormSchema>;
