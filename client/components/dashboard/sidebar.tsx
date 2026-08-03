'use client';

import Link from 'next/link';
import { NavLinks } from './nav-items';
import { QuotaWidget } from './quota-widget';
import { UserMenu } from './user-menu';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full flex-col border-r border-line bg-raised">
      <div className="flex h-12 items-center border-b border-line px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="text-base font-semibold tracking-tight text-ink"
        >
          Temply
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="space-y-2 border-t border-line p-2">
        <QuotaWidget />
        <UserMenu align="start" />
      </div>
    </aside>
  );
}
