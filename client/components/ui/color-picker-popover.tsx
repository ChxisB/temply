'use client';

import { HexColorInput, HexColorPicker } from 'react-colorful';
import { COLOR_PRESETS } from '~/lib/color-presets';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { pressable } from '~/components/ui/button';

/**
 * The app's colour control: a swatch-plus-hex trigger opening a popover that
 * leads with the curated presets, with the free-form picker underneath for
 * anyone the presets don't cover. Values are always uppercase hex.
 */
export function ColorPickerPopover({
  id,
  label,
  value,
  onChange,
  swatchClassName = 'size-6',
  hexClassName = 'text-2xs text-faint',
}: {
  id?: string;
  /** Names the control for the hex input's aria-label. */
  label: string;
  value: string;
  onChange: (next: string) => void;
  swatchClassName?: string;
  hexClassName?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button id={id} type="button" className="flex items-center gap-1.5 rounded-xs">
          <span
            aria-hidden
            className={`shrink-0 rounded-xs border border-line ${swatchClassName}`}
            style={{ backgroundColor: value }}
          />
          <span className={`font-mono uppercase ${hexClassName}`}>{value}</span>
        </button>
      </PopoverTrigger>
      {/* w-56 minus p-3 leaves exactly the 200px react-colorful renders at. */}
      <PopoverContent align="start" className="w-56 p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_PRESETS.map((preset) => {
            const active = value.toUpperCase() === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-label={`Use ${preset}`}
                aria-pressed={active}
                onClick={() => onChange(preset)}
                className={`size-8 rounded-sm border ${pressable} ${
                  active ? 'border-accent ring-2 ring-accent/40' : 'border-line'
                }`}
                style={{ backgroundColor: preset }}
              />
            );
          })}
        </div>
        <div className="my-3 h-px bg-line" />
        <HexColorPicker color={value} onChange={(next) => onChange(next.toUpperCase())} />
        <HexColorInput
          prefixed
          color={value}
          onChange={(next) => onChange(next.toUpperCase())}
          aria-label={`${label} hex value`}
          className="mt-3 h-7 w-full rounded-xs border border-line bg-raised px-2 font-mono text-xs text-ink uppercase"
        />
      </PopoverContent>
    </Popover>
  );
}
