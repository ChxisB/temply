'use client';

import { AlertTriangleIcon, ChevronDownIcon, InfoIcon } from 'lucide-react';
import { GMAIL_CLIP_BYTES, type PreflightIssue } from '@temply/shared/preflight';
import { cn } from '~/lib/classname';

/**
 * The preflight findings, as a banner above the content panes — never a
 * modal: the issues are about the work on screen, so covering it up would be
 * the wrong move. Send is never hard-blocked; with error-level findings the
 * first click opens this panel and the second goes through.
 *
 * This is app-UI chrome. It colours itself from the --ds-* tokens like the
 * rest of the dashboard and must never read the template's theme.
 */
export function PreflightPanel({
  issues,
  bytes,
  expanded,
  onToggle,
}: {
  issues: PreflightIssue[];
  /** Byte size of the as-sent render, or null while it is stale or unknown. */
  bytes: number | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (issues.length === 0) return null;

  const hasErrors = issues.some((issue) => issue.severity === 'error');

  return (
    <div className="border-b border-line p-3">
      <div
        className={cn(
          'rounded-lg border',
          hasErrors ? 'border-danger bg-danger-wash' : 'border-accent bg-accent-wash',
        )}
      >
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
        >
          <span className="flex items-center gap-2 text-sm text-ink">
            <AlertTriangleIcon
              className={cn('size-4 shrink-0', hasErrors ? 'text-danger-ink' : 'text-accent-ink')}
            />
            <span>
              <span className="font-medium">Preflight</span> — {issues.length} issue
              {issues.length === 1 ? '' : 's'} before this email is ready to send or export.
            </span>
          </span>
          <ChevronDownIcon
            className={cn('size-4 shrink-0 text-muted transition-transform', expanded && 'rotate-180')}
          />
        </button>

        {expanded && (
          <div className="px-3.5 pb-3">
            <ul className="space-y-1.5">
              {issues.map((issue) => (
                <li key={issue.id} className="flex items-start gap-2 text-sm text-ink">
                  {issue.severity === 'error' ? (
                    <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-danger-ink" />
                  ) : (
                    <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-accent-ink" />
                  )}
                  <span>
                    {issue.message}
                    {issue.detail ? <span className="text-muted"> — “{issue.detail}”</span> : null}
                  </span>
                </li>
              ))}
            </ul>
            {bytes != null && (
              <p className="mt-2 text-xs text-muted">
                ~{Math.round(bytes / 1024)} KB of {Math.round(GMAIL_CLIP_BYTES / 1024)} KB before
                Gmail clips.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
