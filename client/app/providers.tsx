'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { NavigationLoadingBar } from '~/components/navigation-loader';
import { ThemeProvider } from '~/components/theme-provider';
import { queryClient } from '~/lib/query-client';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        {/* Top-centre, not the default bottom-right: in development Clerk
            parks its "Configure your application" panel there at the
            maximum z-index, and every toast — save, upload, delete — was
            drawn underneath it. */}
        <Toaster
          position="top-center"
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
