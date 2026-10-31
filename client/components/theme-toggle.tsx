'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from '~/components/theme-provider';
import { Button } from '~/components/ui/button';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    // 44px: it sits beside the sidebar's Settings row, which is that tall for
    // every pointer, and a 32px button next to it read as a different kit.
    <Button
      variant="secondary"
      size="icon"
      className="size-11"
      onClick={toggle}
      aria-label="Dark theme"
      aria-pressed={isDark}
    >
      {/* Both icons share the box; the one leaving fades as it turns a
          quarter away and the other turns in, so the switch reads as one
          motion rather than a swap. */}
      <span className="relative size-4 [&_svg]:absolute [&_svg]:inset-0 [&_svg]:transition-[opacity,rotate] [&_svg]:duration-base [&_svg]:ease-out [&_svg]:motion-reduce:transition-none">
        <SunIcon className={isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'} />
        <MoonIcon className={isDark ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'} />
      </span>
    </Button>
  );
}
