'use client';

import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { BaseButton } from '../base-button';
import { TooltipLabel } from './tooltip';
import { cn } from '@/editor/utils/classname';
import { ColorPickerPanel } from '~/components/ui/color-picker-popover';
import { ReactNode } from 'react';

type ColorPickerProps = {
  color: string;
  onColorChange: (color: string) => void;

  borderColor?: string;
  backgroundColor?: string;
  tooltip?: string;
  className?: string;

  children?: ReactNode;
  onClose?: (color: string) => void;
  suggestedColors?: string[];
};

export function ColorPicker(props: ColorPickerProps) {
  const {
    color,
    onColorChange,
    borderColor,
    backgroundColor,
    tooltip,
    className,

    children,
    onClose,

    suggestedColors = [],
  } = props;

  const handleColorChange = (color: string) => {
    // HACK: This is a workaround for a bug in tiptap
    // https://github.com/ueberdosis/tiptap/issues/3580
    //
    //     ERROR: flushSync was called from inside a lifecycle
    //
    // To fix this, we need to make sure that the onChange
    // callback is run after the current execution context.
    queueMicrotask(() => {
      onColorChange(color);
    });
  };

  const popoverButton = (
    <PopoverTrigger asChild>
      {children || (
        <BaseButton
          variant="ghost"
          className="mly:h-7 mly:w-7 mly:shrink-0"
          size="sm"
          type="button"
        >
          <div
            className={cn(
              'mly:h-4 mly:w-4 mly:shrink-0 mly:rounded mly:border-2 mly:border-gray-700',
              className
            )}
            style={{
              ...(borderColor ? { borderColor } : {}),
              backgroundColor: backgroundColor || 'transparent',
            }}
          />
        </BaseButton>
      )}
    </PopoverTrigger>
  );

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) {
          onClose?.(color);
        }
      }}
    >
      {tooltip ? (
        <TooltipLabel label={tooltip}>{popoverButton}</TooltipLabel>
      ) : (
        popoverButton
      )}

      {/* The app's colour panel (components/ui/color-picker-popover.tsx) in
          the editor's popover: w-58 less p-4 is the 200px the picker draws. */}
      <PopoverContent
        aria-label={tooltip || 'Colour'}
        className="mly:w-58 mly:p-4"
        sideOffset={12}
      >
        <ColorPickerPanel
          label={tooltip || 'Colour'}
          value={color}
          onChange={handleColorChange}
          recent={suggestedColors}
        />
      </PopoverContent>
    </Popover>
  );
}
