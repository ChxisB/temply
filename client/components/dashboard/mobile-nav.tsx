'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { MenuIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NavLinks } from './nav-items';
import { QuotaWidget } from './quota-widget';
import { UserMenu } from './user-menu';

/**
 * Below `md` the sidebar is hidden. Before this existed there was no
 * replacement, so a signed-in user on a phone could not move between dashboard
 * sections or sign out at all — the only way back was the URL bar.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A drawer that survives navigation would cover the page it just opened.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation"
          className="flex size-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-hover hover:text-ink md:hidden"
        >
          <MenuIcon className="size-4" />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 md:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-raised shadow-xl md:hidden">
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>

          <div className="flex h-12 items-center justify-between border-b border-line pr-2 pl-4">
            <Link href="/dashboard" className="text-base font-semibold tracking-tight text-ink">
              Temply
            </Link>
            <DialogPrimitive.Close
              aria-label="Close navigation"
              className="flex size-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-hover hover:text-ink"
            >
              <XIcon className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>

          <div className="space-y-2 border-t border-line p-2">
            <QuotaWidget />
            <UserMenu align="start" />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
