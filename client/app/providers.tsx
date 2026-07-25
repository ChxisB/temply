'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { NavigationLoadingBar } from '~/components/navigation-loader';
import { queryClient } from '~/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      <NavigationLoadingBar />
    </QueryClientProvider>
  );
}
