'use client';

import { useQuery } from '@tanstack/react-query';
import type { RendererThemeOptions } from '@temply/shared/theme';
import { DEFAULT_RENDERER_THEME } from '@temply/shared/theme';
import { applyKnobs, knobsFromTheme } from '@temply/shared/brand-knobs';
import { ChevronDownIcon, ChevronUpIcon, PaletteIcon, RotateCcwIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Select } from '~/components/ui/select';
import { BrandKnobsControl } from '~/components/brand/brand-knobs';
import { RawThemeFields } from '~/components/brand/raw-theme-fields';
import { ThemeWarnings } from '~/components/theme-warnings';
import { BRAND_PRESETS } from '@temply/shared/brand-presets';
import { brandsQueryOptions } from '~/lib/brands';
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

/** Parses a stored brand theme, falling back to the current theme if it's malformed. */
function safeParse(raw: string, fallback: Theme): Theme {
  try {
    return JSON.parse(raw) as Theme;
  } catch {
    return fallback;
  }
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
  const { data } = useQuery(brandsQueryOptions());
  const brands = data?.brands ?? [];
  const [selectedBrandId, setSelectedBrandId] = useState('custom');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleBrandChange = (id: string) => {
    setSelectedBrandId(id);
    if (id === 'custom') return;
    // Presets ship with the app; saved brands come from the API. Presets first —
    // their ids ('classic', …) never collide with a saved brand's UUID.
    const preset = BRAND_PRESETS.find((p) => p.id === id);
    if (preset) {
      onChange(structuredClone(preset.theme));
      return;
    }
    const brand = brands.find((b) => b.id === id);
    if (!brand) return;
    onChange(structuredClone(safeParse(brand.theme, theme)));
  };

  const handleEdit = (next: Theme) => {
    setSelectedBrandId('custom');
    onChange(next);
  };

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
          onClick={() => handleEdit(structuredClone(DEFAULT_RENDERER_THEME))}
        >
          <RotateCcwIcon />
          Reset
        </Button>
      </header>

      <div className="space-y-4 p-3.5">
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-ink">Brand</span>
          <Select
            label="Brand"
            value={selectedBrandId}
            onValueChange={handleBrandChange}
            // max-w-none: the base Select shrink-wraps for the editor's bubble
            // menus; here the border must reach the chevron at the row's end.
            className="w-full max-w-none"
            options={[
              { value: 'custom', label: 'Custom' },
              ...BRAND_PRESETS.map((p) => ({ value: p.id, label: p.name })),
              ...brands.map((brand) => ({ value: brand.id, label: brand.name })),
            ]}
          />
        </div>

        <BrandKnobsControl
          value={knobsFromTheme(theme)}
          onChange={(knobs) => handleEdit(applyKnobs(theme, knobs))}
        />

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-faint transition-colors hover:text-muted [&_svg]:size-3.5"
          >
            {showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {showAdvanced ? 'Hide advanced' : 'Advanced'}
          </button>
          {showAdvanced && (
            <div className="mt-3">
              <RawThemeFields theme={theme} onChange={handleEdit} />
            </div>
          )}
        </div>
      </div>

      <ThemeWarnings theme={theme} />
    </section>
  );
}
