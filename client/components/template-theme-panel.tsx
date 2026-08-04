'use client';

import type { RendererThemeOptions } from '@temply/shared/theme';
import { DEFAULT_RENDERER_THEME } from '@temply/shared/theme';
import { PaletteIcon, RotateCcwIcon } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { RawThemeFields } from '~/components/brand/raw-theme-fields';
import { ThemeWarnings } from '~/components/theme-warnings';
import { cn } from '~/lib/classname';

/**
 * Brand settings for the email being edited.
 *
 * These controls used to live on /editor — a route with no link pointing at it
 * anywhere in the app, whose state was kept in a base64 URL parameter. So the
 * one feature that makes an email look like the sender's own brand was
 * unreachable. It belongs beside the thing it changes.
 */

type Theme = RendererThemeOptions;

export function TemplateThemePanel({
  theme,
  onChange,
  className,
}: {
  theme: Theme;
  onChange: (next: Theme) => void;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-line bg-raised', className)}>
      <header className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <PaletteIcon className="size-4 text-faint" />
          Brand
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(structuredClone(DEFAULT_RENDERER_THEME))}
        >
          <RotateCcwIcon />
          Reset
        </Button>
      </header>

      <div className="p-3.5">
        <RawThemeFields theme={theme} onChange={onChange} />
      </div>

      <ThemeWarnings theme={theme} />
    </section>
  );
}
