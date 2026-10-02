'use client';

import { useMutation } from '@tanstack/react-query';
import { routes } from '@/shared/config';
import { logout } from '../api/logout';

export function useLogout() {
  return useMutation({
    mutationFn: logout,
    // Полная перезагрузка сбрасывает весь клиентский кеш и не даёт гарду защищённых страниц
    // успеть перенаправить на `/login?next=...`. Даже если запрос упал, считаем пользователя вышедшим.
    onSettled: () => window.location.replace(routes.login),
  });
}
