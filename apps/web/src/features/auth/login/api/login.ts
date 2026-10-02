import type { LoginInput, PublicUser } from '@balance/shared';
import { apiFetch } from '@/shared/api';

export function login(input: LoginInput) {
  return apiFetch<PublicUser>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
}
