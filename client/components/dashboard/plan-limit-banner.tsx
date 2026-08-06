import { ArrowUpRightIcon, SparklesIcon } from 'lucide-react';
import Link from 'next/link';

/**
 * Shown when a plan limit is reached, above the list it caps. States the limit
 * and offers the way out, so the wall arrives before the click rather than as
 * an error after it.
 */
export function PlanLimitBanner({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-wash bg-accent-wash/40 px-3.5 py-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-accent-ink" />
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          <p className="mt-0.5 text-sm text-muted">{detail}</p>
        </div>
      </div>
      <Link
        href="/dashboard/settings/plan"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Upgrade
        <ArrowUpRightIcon className="size-4" />
      </Link>
    </div>
  );
}
