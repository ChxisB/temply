'use client';

import { AlertTriangleIcon } from 'lucide-react';
import type { RendererThemeOptions } from '@temply/shared/theme';
import { DEFAULT_RENDERER_THEME } from '@temply/shared/theme';
import { checkPair, type ContrastIssue } from '@temply/shared/contrast';

/**
 * The colours the renderer applies to text. They are not editable in the Brand
 * panel, but the background under them is, so they have to be part of the
 * check.
 */
const CONTENT_TEXT = {
  Headings: '#111827',
  'Body copy': '#374151',
  'Footer text': '#64748B',
} as const;

export function themeIssues(theme: RendererThemeOptions): ContrastIssue[] {
  const d = DEFAULT_RENDERER_THEME;
  const container = theme.container?.backgroundColor ?? d.container?.backgroundColor ?? '#FFFFFF';
  const link = theme.link?.color ?? d.link?.color ?? '#346FE4';
  const buttonFill = theme.button?.backgroundColor ?? d.button?.backgroundColor ?? '#000000';
  const buttonLabel = theme.button?.color ?? d.button?.color ?? '#FFFFFF';

  return [
    ...Object.entries(CONTENT_TEXT).flatMap(([subject, colour]) =>
      checkPair(subject, colour, container),
    ),
    ...checkPair('Links', link, container),
    ...checkPair('The button label', buttonLabel, buttonFill),
  ];
}

/**
 * Shown beside the controls that caused it, not as a dialog. Choosing an
 * awkward colour is not an error — the email still sends — so this states what
 * would be hard to read and leaves the decision alone.
 */
export function ThemeWarnings({ theme }: { theme: RendererThemeOptions }) {
  const issues = themeIssues(theme);
  if (issues.length === 0) return null;

  // One line per subject: saying the same thing twice for both renderings is
  // noise, and the harsher of the two is the one worth acting on.
  const worst = new Map<string, ContrastIssue>();
  for (const issue of issues) {
    const seen = worst.get(issue.subject);
    if (!seen || issue.ratio < seen.ratio) worst.set(issue.subject, issue);
  }

  return (
    <div className="border-t border-line px-3.5 py-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink">
        <AlertTriangleIcon className="size-3.5 text-danger-ink" />
        Hard to read at these colours
      </p>
      <ul className="mt-1.5 space-y-1">
        {[...worst.values()].map((issue) => (
          <li key={issue.subject} className="text-xs text-muted">
            <span className="text-ink">{issue.subject}</span> sit{issue.subject.endsWith('s') ? '' : 's'} at{' '}
            <span className="font-mono tabular-nums">{issue.ratio}:1</span> against the background
            {issue.where === 'forced dark' ? ' once a client forces dark mode' : ''}. Aim for{' '}
            <span className="font-mono tabular-nums">{issue.required}:1</span>.
          </li>
        ))}
      </ul>
    </div>
  );
}
