'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRightIcon, SendIcon } from 'lucide-react';
import Link from 'next/link';
import { sendingStatusQueryOptions, stageOne } from './sending-status';

/**
 * The loud, first-run nudge on the Overview. It only shows while the user still
 * cannot send their first email, and removes itself the moment they can — so a
 * set-up account never has to look at it.
 */
export function SetupCard() {
  const { data: status, isSuccess } = useQuery(sendingStatusQueryOptions());
  const s1 = stageOne(status);

  // Wait for a real answer before rendering, so the card cannot flash in for a
  // user who has already finished setup.
  if (!isSuccess || s1.ready) return null;

  const left = s1.total - s1.done;

  return (
    <Link
      href="/dashboard/get-sending"
      className="group flex items-center gap-3 rounded-lg border border-accent bg-accent-wash px-4 py-3 transition-colors hover:bg-accent-wash/70"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-white">
        <SendIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-accent-ink">
          Set up sending — {left} step{left === 1 ? '' : 's'} to your first email
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          Connect a sending account and send yourself a test.
        </span>
      </span>
      <ArrowRightIcon className="size-4 shrink-0 text-accent-ink transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
