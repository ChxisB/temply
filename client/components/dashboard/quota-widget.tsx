'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { httpGet } from '~/lib/http';

type Quota = {
  plan: 'free' | 'pro' | 'enterprise';
  api: { used: number; limit: number | null; remaining: number | null };
  resetsOn: string;
};

function formatReset(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function QuotaWidget() {
  const { data } = useQuery({
    queryKey: ['quota'],
    queryFn: () => httpGet<Quota>('/api/v1/quota', {}),
    staleTime: 30_000,
  });

  if (!data) return null;

  const { used, limit } = data.api;
  const unlimited = limit === null;
  const pct = unlimited || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const over = !unlimited && pct >= 100;

  return (
    <div className="rounded-md border border-rail-line bg-rail-raised p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-rail-ink capitalize">{data.plan} plan</span>
        <span className="text-2xs text-rail-muted tabular-nums">
          {unlimited ? `${used.toLocaleString()} · ∞` : `${used.toLocaleString()}/${limit!.toLocaleString()}`}
        </span>
      </div>
      {!unlimited ? (
        <div
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-rail-hover"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`${used} of ${limit} monthly API calls used`}
        >
          <div className={over ? 'h-full rounded-full bg-danger' : 'h-full rounded-full bg-accent'} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      <div className="mt-1.5 flex items-center justify-between text-2xs text-rail-muted">
        <span>API calls this month</span>
        <span>resets {formatReset(data.resetsOn)}</span>
      </div>
      {data.plan === 'free' ? (
        <Link
          href="/dashboard/billing"
          className="mt-2 flex h-7 w-full items-center justify-center rounded-md bg-accent text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Upgrade
        </Link>
      ) : null}
    </div>
  );
}
