'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 минута
        gcTime: 5 * 60 * 1000, // 5 минут (раньше было cacheTime)
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        // Ошибки обрабатываются в компонентах через try-catch и показываются в toast
        retry: 0, // Не повторяем запросы при ошибке
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

