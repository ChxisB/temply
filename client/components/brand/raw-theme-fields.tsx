'use client';

import type { ReactNode } from 'react';
import type { RendererThemeOptions } from '@temply/shared/theme';
import { DEFAULT_RENDERER_THEME } from '@temply/shared/theme';
import { ColorPickerPopover } from '~/components/ui/color-picker-popover';
import { issuesForField, ThemeIssueHint } from '~/components/theme-warnings';

type Theme = RendererThemeOptions;

const SWATCH_LABEL = 'text-xs text-muted';

function ColorField({
  label,
  value,
  fallback,
  onChange,
  hint,
  touch,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (next: string) => void;
  /** A warning icon rendered beside the label when this colour causes a
   *  readability problem. */
  hint?: ReactNode;
  /** Passed to the colour popover, which is portalled out of any sheet. */
  touch?: boolean;
}) {
  const current = value ?? fallback;
  const id = `theme-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1">
      <span className="flex items-center gap-1">
        <label htmlFor={id} className={SWATCH_LABEL}>
          {label}
        </label>
        {hint}
      </span>
      <ColorPickerPopover id={id} label={label} value={current} onChange={onChange} touch={touch} />
    </div>
  );
}

function NumberField({
  label,
  value,
  fallback,
  onChange,
  max = 120,
  id: idOverride,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (next: string) => void;
  /** Upper bound for both the slider and the number box. */
  max?: number;
  /** Needed when two groups share a label (both cards and buttons have a
   *  "Corner") — the derived id would otherwise collide. */
  id?: string;
}) {
  const parsed = parseInt(value ?? fallback, 10);
  const current = Number.isNaN(parsed) ? 0 : parsed;
  const id = idOverride ?? `theme-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className={SWATCH_LABEL}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        {/* The slider moves in 4px steps for quick coarse setting; the box
            beside it accepts any exact value and stays the source of truth. */}
        <input
          type="range"
          min={0}
          max={max}
          step={4}
          value={current}
          aria-label={`${label} slider`}
          onChange={(event) => onChange(`${event.target.value}px`)}
          className="min-w-0 flex-1 cursor-pointer accent-accent"
        />
        <input
          id={id}
          type="number"
          min={0}
          max={max}
          value={current}
          onChange={(event) => onChange(`${event.target.value || 0}px`)}
          className="h-7 w-14 shrink-0 rounded-xs border border-line bg-raised px-1.5 text-right text-sm tabular-nums text-ink"
        />
        <span className="text-2xs text-faint">px</span>
      </div>
    </div>
  );
}

export function RawThemeFields({
  theme,
  onChange,
  touch,
}: {
  theme: Theme;
  onChange: (next: Theme) => void;
  /** Passed to every colour popover here; they are portalled out of any sheet. */
  touch?: boolean;
}) {
  const d = DEFAULT_RENDERER_THEME;

  const patch = (part: Partial<Theme>) => onChange({ ...theme, ...part });

  return (
    <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2.5">
        <p className="text-2xs font-medium tracking-wide text-faint uppercase">Page</p>
        <ColorField
          touch={touch}
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
          touch={touch}
          label="Background"
          value={theme.container?.backgroundColor}
          fallback={d.container?.backgroundColor ?? '#FFFFFF'}
          onChange={(backgroundColor) =>
            patch({ container: { ...theme.container, backgroundColor } })
          }
          hint={<ThemeIssueHint issues={issuesForField(theme, 'card-background')} />}
        />
        <NumberField
          label="Padding"
          max={80}
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
          max={24}
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
          touch={touch}
          label="Button"
          value={theme.button?.backgroundColor}
          fallback={d.button?.backgroundColor ?? '#000000'}
          onChange={(backgroundColor) =>
            patch({ button: { ...theme.button, backgroundColor } })
          }
        />
        <ColorField
          touch={touch}
          label="Button text"
          value={theme.button?.color}
          fallback={d.button?.color ?? '#FFFFFF'}
          onChange={(color) => patch({ button: { ...theme.button, color } })}
          hint={<ThemeIssueHint issues={issuesForField(theme, 'button-text')} />}
        />
        <NumberField
          id="theme-button-corner"
          label="Corner"
          max={24}
          value={theme.button?.borderRadius}
          fallback={d.button?.borderRadius ?? '6px'}
          onChange={(borderRadius) =>
            patch({ button: { ...theme.button, borderRadius } })
          }
        />
        <ColorField
          touch={touch}
          label="Link"
          value={theme.link?.color}
          fallback={d.link?.color ?? '#346FE4'}
          onChange={(color) => patch({ link: { ...theme.link, color } })}
          hint={<ThemeIssueHint issues={issuesForField(theme, 'link')} />}
        />
      </div>
    </div>
  );
}
