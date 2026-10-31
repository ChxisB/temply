'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { useActiveIndicator } from '~/hooks/use-active-indicator';
import { useGuardedLink } from '~/hooks/use-guarded-link';
import { cn } from '~/lib/classname';

const sections = [
  { path: '', label: 'Edit email' },
  { path: '/variables', label: 'Variables' },
  { path: '/versions', label: 'Versions' },
  { path: '/review', label: 'Review & release' },
  { path: '/connect', label: 'Connect your app' },
];

/** The underline stops 14px (the tab's padding) short of each end of its tab. */
const BAR_INSET = 14;

/**
 * The row of sections under the editor's header. The current one is inked
 * and carries a 3px violet underline, and says so to a screen reader with
 * `aria-current`. The underline is one bar for the whole row that slides to
 * the chosen tab; every page in the frame renders its own copy of this row,
 * so the bar remembers where it stood and a fresh row starts there. Both
 * states share a weight, since a bolder tab would nudge its neighbours.
 * `trailing` is the row's right-hand end: the editor puts its view switch
 * there, and the pages that are not the editor leave it empty. When the two
 * do not fit side by side the trailing end wraps to a row of its own, and the
 * tabs scroll sideways rather than wrap, so the row is never more than two
 * lines.
 */
export function TemplateNavigation({ id, beforeNavigate, trailing }: {
  id: string;
  beforeNavigate?: () => Promise<boolean>;
  trailing?: React.ReactNode;
}) {
  const pathname = usePathname();
  const guarded = useGuardedLink(beforeNavigate);
  const strip = useRef<HTMLElement>(null);
  const bar = useActiveIndicator(strip, pathname, { inset: BAR_INSET, memoryKey: 'template-tabs' });
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 border-b-[1.5px] border-line bg-raised px-4 sm:px-7">
      {/* The padding and the equal negative margin give the focus ring room: a
          scroll container clips what is drawn outside its edge. */}
      <nav ref={strip} aria-label="Template" className="relative -mx-2 -my-2 flex max-w-full gap-1.5 overflow-x-auto px-2 py-2">
        {/* bottom-2 is the nav's own padding, so the bar stands on the rule
            under the tabs as the fallback inside a tab does. */}
        <span
          aria-hidden="true"
          style={bar.style}
          className={cn(
            'absolute bottom-2 left-0 h-[3px] rounded-t-[3px] bg-accent transition-[transform,width] duration-base ease-out motion-reduce:transition-none',
            bar.ready ? 'opacity-100' : 'opacity-0',
          )}
        />
        {sections.map(({ path, label }) => {
          const href = `/templates/${id}${path}`;
          const current = pathname === href;
          return (
            <Link
              key={path}
              href={href}
              onClick={guarded(href)}
              aria-current={current ? 'page' : undefined}
              data-active={current ? '' : undefined}
              className={cn(
                'relative inline-flex h-[54px] shrink-0 items-center rounded-field px-3.5 text-lg font-semibold transition-colors duration-fast ease-out motion-reduce:transition-none',
                current ? 'text-ink' : 'text-muted hover:text-ink',
              )}
            >
              {label}
              {current && !bar.ready ? (
                <span aria-hidden="true" className="absolute inset-x-3.5 bottom-0 h-[3px] rounded-t-[3px] bg-accent" />
              ) : null}
            </Link>
          );
        })}
      </nav>
      {trailing ? <div className="flex items-center py-1.5">{trailing}</div> : null}
    </div>
  );
}
