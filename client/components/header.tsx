'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { ThemeToggle } from '~/components/theme-toggle';
import { UserMenu } from '~/components/dashboard/user-menu';
import { Button } from '~/components/ui/button';

export function Header() {
  const { isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="text-base font-semibold tracking-tight text-ink">
          Temply
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isSignedIn ? (
            <>
              <Button asChild>
                <Link href="/dashboard/templates">Dashboard</Link>
              </Button>
              <div className="hidden sm:block">
                <UserMenu align="end" showLabel={false} />
              </div>
            </>
          ) : (
            <Button asChild variant="primary">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
