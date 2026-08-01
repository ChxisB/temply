'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { NavigationLoadingBar } from '~/components/navigation-loader';
import { ThemeProvider } from '~/components/theme-provider';
import { queryClient } from '~/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster
          toastOptions={{
            classNames: {
              toast: 'bg-raised text-ink border border-line',
              description: 'text-muted',
            },
          }}
        />
        <NavigationLoadingBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
