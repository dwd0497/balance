import { z } from 'zod';

const JwtSecret = z.string().min(32, 'Секрет JWT должен быть не короче 32 символов');

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.url(),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    JWT_ACCESS_SECRET: JwtSecret,
    JWT_REFRESH_SECRET: JwtSecret,
    JWT_ACCESS_TTL_SEC: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60),
    JWT_REFRESH_TTL_SEC: z.coerce
      .number()
      .int()
      .positive()
      .default(30 * 24 * 60 * 60),
  })
  .refine((env) => env.JWT_ACCESS_SECRET !== env.JWT_REFRESH_SECRET, {
    message: 'JWT_ACCESS_SECRET и JWT_REFRESH_SECRET должны различаться',
    path: ['JWT_REFRESH_SECRET'],
  });

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return EnvSchema.parse(config);
}
