'use client';

import { useLinkStatus } from 'next/link';
import { useEffect } from 'react';

/**
 * Rendered inside a Link: tells the strip around it that this href is on its
 * way. The app router moves the URL only once the server's first chunk lands,
 * so for the whole round trip (and, in dev, a route's first compile) nothing
 * on screen would move but the thin bar at the top. A strip paints the pending
 * link as current meanwhile, so the indicator leaves on the click and the page
 * follows it. `aria-current` stays with the URL: a screen reader is told where
 * the reader is, not where they are going.
 */
export function LinkPending({ href, onChange }: { href: string; onChange: (href: string | null) => void }) {
  const { pending } = useLinkStatus();
  useEffect(() => {
    if (!pending) return;
    onChange(href);
    return () => onChange(null);
  }, [pending, href, onChange]);
  return null;
}
