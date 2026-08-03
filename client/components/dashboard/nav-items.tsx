'use client';

import {
  CheckIcon,
  CreditCardIcon,
  FileTextIcon,
  KeyIcon,
  LayoutDashboardIcon,
  SendIcon,
  SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '~/lib/classname';
import { httpPost } from '~/lib/http';
import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { sendingStatusQueryOptions, stageOne } from '~/components/sending-setup/sending-status';

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

      {/* Divider, then the setup entry. Sending is the one thing a mail tool
          must get working, so it gets its own accent-tinted home below the
          regular sections rather than hiding among them. */}
      <div className="my-1.5 border-t border-line" />
      <GetSendingLink onNavigate={onNavigate} />
    </nav>
  );
}

function GetSendingLink({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const href = '/dashboard/get-sending';
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  const { data: status } = useQuery(sendingStatusQueryOptions());
  const s1 = stageOne(status);
  const dismissed = Boolean(status?.dismissed);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const skip = useMutation({
    mutationFn: () => httpPost('/api/v1/sending/setup', { dismissed: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sending-status'] }),
  });

  const enter = () => {
    setPopoverOpen(false);
    onNavigate?.();
    router.push(href);
  };

  return (
    <>
      {/* Clicking opens a short intro rather than jumping straight in, so the
          skip route is always one click away. Once dismissed the item stays,
          just quiet — no accent, no pill — so it can still be reopened. */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex h-8 w-full items-center gap-2.5 rounded-sm px-2.5 text-sm transition-colors',
              isActive
                ? 'bg-accent-wash font-medium text-accent-ink'
                : dismissed
                  ? 'text-muted hover:bg-hover hover:text-ink'
                  : 'text-accent-ink hover:bg-hover',
            )}
          >
            <SendIcon className="size-4 shrink-0" />
            Get sending
            {status && !dismissed ? (
              <span
                className={cn(
                  'ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-2xs font-semibold tabular-nums',
                  s1.ready
                    ? 'bg-success-wash text-success-ink'
                    : 'bg-accent-wash text-accent-ink',
                )}
              >
                {s1.ready ? <CheckIcon className="size-3" /> : `${s1.done}/${s1.total}`}
              </span>
            ) : null}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="right" className="w-64">
          <p className="text-sm font-medium text-ink">Set up sending</p>
          <p className="mt-1 text-xs text-muted">
            A short checklist to connect your account and send your first email — most of it is done outside Temply.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={enter}>
              {s1.done > 0 ? 'Continue' : 'Set it up'}
            </Button>
            {!dismissed ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPopoverOpen(false);
                  setConfirmOpen(true);
                }}
              >
                Skip
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Skip sending setup?</DialogTitle>
            <DialogDescription>
              We'll hide the reminders. Get sending stays in the menu, so you can reopen the checklist whenever you're ready.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                skip.mutate();
                setConfirmOpen(false);
              }}
            >
              Skip for now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
