'use client';
import { useState } from 'react';
import type { RendererThemeOptions } from '@temply/shared/theme';
import { BRAND_PRESETS } from '@temply/shared/brand-presets';
import { applyKnobs, knobsFromTheme } from '@temply/shared/brand-knobs';
import { BrandKnobsControl } from './brand-knobs';
import { RawThemeFields } from './raw-theme-fields';

export function BrandEditor({ theme, onChange }: { theme: RendererThemeOptions; onChange: (t: RendererThemeOptions) => void }) {
  const [advanced, setAdvanced] = useState(false);
  const knobs = knobsFromTheme(theme);
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-medium text-ink">Start from a preset</p>
        <div className="flex flex-wrap gap-2">
          {BRAND_PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => onChange(structuredClone(p.theme))}
              className="flex items-center gap-1.5 rounded-sm border border-line px-2.5 py-1.5 text-xs text-ink hover:bg-hover">
              <span className="size-3 rounded-full" style={{ background: p.theme.button?.backgroundColor }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <BrandKnobsControl value={knobs} onChange={(k) => onChange(applyKnobs(theme, k))} />
      <div>
        <button type="button" onClick={() => setAdvanced((v) => !v)} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
          {advanced ? 'Hide advanced' : 'Advanced'}
        </button>
        {advanced ? <div className="mt-3"><RawThemeFields theme={theme} onChange={onChange} /></div> : null}
      </div>
    </div>
  );
}
