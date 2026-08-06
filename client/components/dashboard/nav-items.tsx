'use client';

import { FileTextIcon, LayoutDashboardIcon, PaletteIcon, SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { cn } from '~/lib/classname';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Overview would otherwise light up for every page beneath /dashboard. */
  exact?: boolean;
  /** Draws a rule above the item, setting account-level destinations apart
   *  from the ones you work in. */
  separatorBefore?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboardIcon, exact: true },
  { href: '/dashboard/templates', label: 'Templates', icon: FileTextIcon },
  { href: '/dashboard/brands', label: 'Brands', icon: PaletteIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon, separatorBefore: true },
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
          <Fragment key={item.href}>
            {item.separatorBefore ? <div className="my-1.5 border-t border-rail-line" /> : null}
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-rail-active-bg font-medium text-rail-active-ink'
                  : 'text-rail-muted hover:bg-rail-hover hover:text-rail-ink',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
