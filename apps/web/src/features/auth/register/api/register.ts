import type { PublicUser, RegisterInput } from '@balance/shared';
import { apiFetch } from '@/shared/api';

export function register(input: RegisterInput) {
  return apiFetch<PublicUser>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
}
