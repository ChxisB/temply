'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useContext } from 'react';
import { cn } from '~/lib/classname';
import { ShellFrameContext } from './shell-context';

/**
 * A panel that rises from the bottom of a phone screen. Radix Dialog does
 * the focus trap, the escape key and the overlay; the sheet adds the
 * slide, a grab handle and two heights. Half leaves the canvas visible
 * above it so a colour change is seen as it is made.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  showTitle = true,
  height = 'half',
  returnFocus = true,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  showTitle?: boolean;
  height?: 'half' | 'full';
  /** False while the sheet is closing to hand the keyboard to the shell's
   *  input dock: Radix would otherwise put focus back on the trigger and
   *  drop the keyboard the dock just raised. */
  returnFocus?: boolean;
  children: React.ReactNode;
}) {
  // Rendered inside the shell's frame, not on the page: the frame is sized
  // to the visual viewport, so a sheet holding a text field rises with the
  // keyboard instead of being covered by it. Percent heights are of the
  // frame for the same reason.
  const frame = useContext(ShellFrameContext);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={frame ?? undefined}>
        <DialogPrimitive.Overlay className={cn('overlay-fade z-50 bg-black/40', frame ? 'absolute inset-0' : 'fixed inset-0')} />
        <DialogPrimitive.Content
          // The sheet's own title is the whole description; Radix warns on
          // every open unless the absence is stated rather than left implied.
          aria-describedby={undefined}
          // The sheets are full of icon-only controls whose only label is a
          // tooltip, and Radix opens a tooltip on focus — so letting the
          // dialog focus its first control pops an unanchored tooltip over
          // the sheet the moment it appears, and an input would raise the
          // keyboard over the sheet besides. Focus the sheet itself; the
          // focus trap and Escape are unaffected.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement).focus();
          }}
          onCloseAutoFocus={(event) => {
            if (!returnFocus) event.preventDefault();
          }}
          className={cn(
            'sheet-up inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl border-t border-line bg-raised shadow-xl outline-none',
            frame ? 'absolute' : 'fixed',
            // The height transition covers a sheet growing when Advanced opens.
            'transition-[max-height] duration-base ease-out motion-reduce:transition-none',
            height === 'half' ? (frame ? 'max-h-[55%]' : 'max-h-[55dvh]') : frame ? 'max-h-[92%]' : 'max-h-[92dvh]',
          )}
        >
          <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
            <span className="h-1 w-9 rounded-full bg-line" />
          </div>
          <DialogPrimitive.Title className={cn('px-4 pb-2 text-sm font-medium text-ink', !showTitle && 'sr-only')}>
            {title}
          </DialogPrimitive.Title>
          {/* 16px in every field: smaller text makes iOS zoom the page on focus. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&_input]:text-lg [&_textarea]:text-lg">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
