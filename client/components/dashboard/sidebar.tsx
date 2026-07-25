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
import { UserMenu } from './user-menu';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboardIcon },
  { href: '/dashboard/templates', label: 'Templates', icon: FileTextIcon },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: KeyIcon, disabled: false },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCardIcon, disabled: false },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-white dark:border-white/10 dark:bg-black">
      <div className="flex h-14 items-center px-6 border-b border-gray-200 dark:border-white/10">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Temply
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3 dark:border-white/10">
        <UserMenu align="start" />
      </div>
    </aside>
  );
}
