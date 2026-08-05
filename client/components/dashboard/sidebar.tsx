'use client';

import Link from 'next/link';
import { BrandMark } from '~/components/brand-mark';
import { NavLinks } from './nav-items';
import { QuotaWidget } from './quota-widget';
import { UserMenu } from './user-menu';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full flex-col bg-rail-bg text-rail-ink">
      <div className="flex h-12 items-center gap-2 border-b border-rail-line px-4">
        <BrandMark className="size-6 text-rail-active-ink" />
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="font-display text-base font-semibold tracking-tight text-rail-ink"
        >
          Temply
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="space-y-2 border-t border-rail-line p-2.5">
        <QuotaWidget />
        <UserMenu align="start" />
      </div>
    </aside>
  );
}
