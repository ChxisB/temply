'use client';

import type { RendererThemeOptions } from '@temply/shared/theme';
import { DEFAULT_RENDERER_THEME } from '@temply/shared/theme';
import { PaletteIcon, RotateCcwIcon } from 'lucide-react';
import { Button } from '~/components/ui/button';
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

const SWATCH_LABEL = 'text-xs text-muted';

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (next: string) => void;
}) {
  const current = value ?? fallback;
  const id = `theme-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className={SWATCH_LABEL}>
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-2xs text-faint uppercase">{current}</span>
        <input
          id={id}
          type="color"
          value={current}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="size-6 cursor-pointer rounded-xs border border-line bg-raised p-0.5"
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (next: string) => void;
}) {
  const current = parseInt(value ?? fallback, 10);
  const id = `theme-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className={SWATCH_LABEL}>
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="number"
          min={0}
          max={120}
          value={Number.isNaN(current) ? 0 : current}
          onChange={(event) => onChange(`${event.target.value || 0}px`)}
          className="h-7 w-14 rounded-xs border border-line bg-raised px-1.5 text-right text-sm tabular-nums text-ink"
        />
        <span className="text-2xs text-faint">px</span>
      </div>
    </div>
  );
}

export function TemplateThemePanel({
  theme,
  onChange,
  className,
}: {
  theme: Theme;
  onChange: (next: Theme) => void;
  className?: string;
}) {
  const d = DEFAULT_RENDERER_THEME;

  const patch = (part: Partial<Theme>) => onChange({ ...theme, ...part });

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

      <div className="grid gap-x-6 gap-y-2.5 p-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2.5">
          <p className="text-2xs font-medium tracking-wide text-faint uppercase">Page</p>
          <ColorField
            label="Background"
            value={theme.body?.backgroundColor}
            fallback={d.body?.backgroundColor ?? '#F4F4F5'}
            onChange={(backgroundColor) =>
              patch({ body: { ...theme.body, backgroundColor } })
            }
          />
          <NumberField
            label="Top space"
            value={theme.body?.paddingTop}
            fallback={d.body?.paddingTop ?? '50px'}
            onChange={(paddingTop) => patch({ body: { ...theme.body, paddingTop } })}
          />
        </div>

        <div className="space-y-2.5">
          <p className="text-2xs font-medium tracking-wide text-faint uppercase">Card</p>
          <ColorField
            label="Background"
            value={theme.container?.backgroundColor}
            fallback={d.container?.backgroundColor ?? '#FFFFFF'}
            onChange={(backgroundColor) =>
              patch({ container: { ...theme.container, backgroundColor } })
            }
          />
          <NumberField
            label="Padding"
            value={theme.container?.paddingTop}
            fallback={d.container?.paddingTop ?? '40px'}
            onChange={(v) =>
              patch({
                container: {
                  ...theme.container,
                  paddingTop: v,
                  paddingRight: v,
                  paddingBottom: v,
                  paddingLeft: v,
                },
              })
            }
          />
          <NumberField
            label="Corner"
            value={theme.container?.borderRadius}
            fallback={d.container?.borderRadius ?? '0'}
            onChange={(borderRadius) =>
              patch({ container: { ...theme.container, borderRadius } })
            }
          />
        </div>

        <div className="space-y-2.5">
          <p className="text-2xs font-medium tracking-wide text-faint uppercase">Buttons & links</p>
          <ColorField
            label="Button"
            value={theme.button?.backgroundColor}
            fallback={d.button?.backgroundColor ?? '#000000'}
            onChange={(backgroundColor) =>
              patch({ button: { ...theme.button, backgroundColor } })
            }
          />
          <ColorField
            label="Button text"
            value={theme.button?.color}
            fallback={d.button?.color ?? '#FFFFFF'}
            onChange={(color) => patch({ button: { ...theme.button, color } })}
          />
          <ColorField
            label="Link"
            value={theme.link?.color}
            fallback={d.link?.color ?? '#346FE4'}
            onChange={(color) => patch({ link: { ...theme.link, color } })}
          />
        </div>
      </div>
    </section>
  );
}
