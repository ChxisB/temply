'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from '~/components/theme-provider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:bg-hover hover:text-ink"
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </button>
  );
}
