'use client';

import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/get-me';
import { userKeys } from './user-keys';

/** Источник истины об авторизации на клиенте: `data === null` — пользователь не вошёл. */
export function useCurrentUser() {
  return useQuery({ queryKey: userKeys.me, queryFn: getMe, retry: false });
}
