'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageHeader } from '~/components/ui/surfaces';
import { pressable } from '~/components/ui/button';
import { cn } from '~/lib/classname';

/** Every tab is a leaf, so an exact match is the whole rule — Account sits at
 *  the section root and would otherwise light up for the other two. */
const TABS = [
  { href: '/dashboard/settings', label: 'Account' },
  { href: '/dashboard/settings/plan', label: 'Plan' },
  { href: '/dashboard/settings/api-keys', label: 'API keys' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Your account, plan and API access." />

      <nav className="flex gap-5 border-b border-line" aria-label="Settings">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-9 items-center rounded-sm px-1 text-sm',
                pressable,
                isActive
                  ? 'border-b-2 border-accent font-medium text-ink'
                  : 'text-muted hover:text-ink',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
