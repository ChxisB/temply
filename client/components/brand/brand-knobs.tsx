'use client';
import type { BrandKnobs } from '@temply/shared/brand-knobs';
import { ColorPickerPopover } from '~/components/ui/color-picker-popover';
import { pressable } from '~/components/ui/button';

const CORNERS: { v: BrandKnobs['corner']; label: string }[] = [
  { v: 'sharp', label: 'Sharp' }, { v: 'soft', label: 'Soft' }, { v: 'round', label: 'Round' },
];
const DENSITIES: { v: BrandKnobs['density']; label: string }[] = [
  { v: 'compact', label: 'Compact' }, { v: 'comfortable', label: 'Comfortable' },
];

export function BrandKnobsControl({ value, onChange }: { value: BrandKnobs; onChange: (k: BrandKnobs) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-ink">Brand color</span>
        <ColorPickerPopover
          label="Brand color"
          value={value.accent}
          onChange={(accent) => onChange({ ...value, accent })}
          swatchClassName="size-8"
          hexClassName="text-xs text-muted"
        />
      </div>
      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-ink">Corner</span>
        <div className="flex gap-1">
          {CORNERS.map((c) => (
            <button key={c.v} type="button" onClick={() => onChange({ ...value, corner: c.v })}
              className={`h-8 flex-1 rounded-sm border px-2 text-xs ${pressable} ${value.corner === c.v ? 'border-accent bg-accent-wash text-accent-ink' : 'border-line text-muted hover:bg-hover'}`}>{c.label}</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-ink">Density</span>
        <div className="flex gap-1">
          {DENSITIES.map((c) => (
            <button key={c.v} type="button" onClick={() => onChange({ ...value, density: c.v })}
              className={`h-8 flex-1 rounded-sm border px-2 text-xs ${pressable} ${value.density === c.v ? 'border-accent bg-accent-wash text-accent-ink' : 'border-line text-muted hover:bg-hover'}`}>{c.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
