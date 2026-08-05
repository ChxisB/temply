'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandMark } from '~/components/brand-mark';
import { ThemeToggle } from '~/components/theme-toggle';
import { UserMenu } from '~/components/dashboard/user-menu';
import { Button } from '~/components/ui/button';

// The landing page sections these point at. Smooth scrolling and the offset that
// keeps a heading clear of this sticky bar are both handled in globals.css.
const sections = [
  { label: 'Features', hash: '#features' },
  { label: 'Blocks', hash: '#blocks' },
  { label: 'Contact', hash: '#contact' },
];

/** Which section the viewport is currently in. The rule is positional, not
 *  intersection-based: the active section is the last one whose top has passed
 *  a line 35% down the viewport. Deterministic at every scroll position, and
 *  cheap enough to run on a throttled scroll listener. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setActive(null);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current: string | null = null;
      for (const { hash } of sections) {
        const el = document.getElementById(hash.slice(1));
        if (el && el.getBoundingClientRect().top <= line) current = hash;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return active;
}

export function Header() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  // This header is shared with the playground, where those sections do not
  // exist — from anywhere but the landing page the links have to route home
  // first rather than scroll to nothing.
  const onLanding = pathname === '/';
  const active = useActiveSection(onLanding);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark className="size-6 text-accent" />
            <span className="font-display text-base font-semibold tracking-tight text-ink">Temply</span>
          </Link>

          <nav aria-label="Page sections" className="hidden items-center gap-6 md:flex">
            {sections.map((section) => {
              const isActive = onLanding && active === section.hash;
              const className = `text-sm transition-colors ${
                isActive ? 'font-medium text-accent-ink' : 'text-muted hover:text-ink'
              }`;
              return onLanding ? (
                <a
                  key={section.hash}
                  href={section.hash}
                  aria-current={isActive ? 'true' : undefined}
                  className={className}
                >
                  {section.label}
                </a>
              ) : (
                <Link key={section.hash} href={`/${section.hash}`} className={className}>
                  {section.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isSignedIn ? (
            <>
              <Button asChild>
                <Link href="/dashboard/templates">Dashboard</Link>
              </Button>
              <div className="hidden sm:block">
                <UserMenu align="end" showLabel={false} surface="page" />
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
