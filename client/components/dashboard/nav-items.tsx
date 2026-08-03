'use client';

import {
  CreditCardIcon,
  FileTextIcon,
  KeyIcon,
  LayoutDashboardIcon,
  SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '~/lib/classname';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Overview would otherwise light up for every page beneath /dashboard. */
  exact?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboardIcon, exact: true },
  { href: '/dashboard/templates', label: 'Templates', icon: FileTextIcon },
  { href: '/dashboard/api-keys', label: 'API keys', icon: KeyIcon },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCardIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
];

/** Shared by the fixed sidebar and the narrow-viewport drawer, so the two can
 *  never drift apart. */
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Dashboard">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex h-8 items-center gap-2.5 rounded-sm px-2.5 text-sm transition-colors',
              isActive
                ? 'bg-accent-wash font-medium text-accent-ink'
                : 'text-muted hover:bg-hover hover:text-ink',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
