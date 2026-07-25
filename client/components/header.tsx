'use client';

import { useAuth, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { ThemeToggle } from '~/components/theme-toggle';
import { UserMenu } from '~/components/dashboard/user-menu';

export function Header() {
  const { isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 sm:px-10">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Temply
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isSignedIn ? (
            <div className="hidden sm:block">
              <UserMenu align="end" />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
