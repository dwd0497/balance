'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { userKeys } from '@/entities/user';
import { isApiError } from '@/shared/api';
import { Toaster } from '@/shared/ui/sonner';

function createQueryClient() {
  // 401 сюда доходит, только если apiFetch не смог обновить сессию: сбрасываем пользователя,
  // и гард защищённых страниц сам уведёт на логин
  const onError = (error: Error) => {
    if (isApiError(error, 401)) queryClient.setQueryData(userKeys.me, null);
  };

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Клиентские ошибки (4xx) повторять бессмысленно
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status < 500) && failureCount < 2,
      },
    },
  });
  return queryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-center" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
