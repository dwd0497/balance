import type { PublicUser } from '@balance/shared';
import { apiFetch, isApiError } from '@/shared/api';

/** Текущий пользователь или `null`, если сессии нет. */
export async function getMe(): Promise<PublicUser | null> {
  try {
    return await apiFetch<PublicUser>('/auth/me');
  } catch (error) {
    if (isApiError(error, 401)) return null;
    throw error;
  }
}
