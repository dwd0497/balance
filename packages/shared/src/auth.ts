import { z } from 'zod';

const Email = z.string().trim().toLowerCase().pipe(z.email());
const Password = z.string().min(8, 'Минимум 8 символов').max(128);
const PersonName = z.string().trim().min(1).max(100);
export const TERMS_REQUIRED =
  'Необходимо согласиться с пользовательским соглашением и политикой обработки данных';

export const RegisterSchema = z.object({
  firstName: PersonName,
  lastName: PersonName,
  email: Email,
  password: Password,
  /** Согласие с пользовательским соглашением и политикой обработки данных — обязательно. */
  acceptTerms: z.literal(true, { error: TERMS_REQUIRED }),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: Email,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: Password,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const PublicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.iso.datetime(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;
