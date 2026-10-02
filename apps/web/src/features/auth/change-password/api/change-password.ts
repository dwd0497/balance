import type { ChangePasswordInput } from '@balance/shared';
import { apiFetch } from '@/shared/api';

export function changePassword(input: ChangePasswordInput) {
  return apiFetch<void>('/auth/password', { method: 'PATCH', body: JSON.stringify(input) });
}
