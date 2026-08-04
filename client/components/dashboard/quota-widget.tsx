'use client';

import { useQuery } from '@tanstack/react-query';
import { httpGet } from '~/lib/http';

type Quota = {
  plan: 'free' | 'pro' | 'enterprise';
  email: { used: number; limit: number; remaining: number };
  resetInHours: number;
};

export function QuotaWidget() {
  const { data } = useQuery({
    queryKey: ['quota'],
    queryFn: () => httpGet<Quota>('/api/v1/quota', {}),
    staleTime: 30_000,
  });

  if (!data) return null;

  const { used, limit } = data.email;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const over = pct >= 100;

  return (
    <div className="rounded-sm border border-line bg-surface p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink capitalize">{data.plan} plan</span>
        <span className="text-2xs text-muted tabular-nums">{used}/{limit}</span>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-hover"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${used} of ${limit} daily emails used`}
      >
        <div
          className={over ? 'h-full rounded-full bg-danger' : 'h-full rounded-full bg-accent'}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-2xs text-muted">
        <span>{pct}% of today's emails</span>
        <span>resets in {data.resetInHours}h</span>
      </div>
    </div>
  );
}
