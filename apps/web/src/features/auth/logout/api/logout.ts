import { apiFetch } from '@/shared/api';

export function logout() {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}
