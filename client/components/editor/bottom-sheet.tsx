'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '~/lib/classname';

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
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  showTitle?: boolean;
  height?: 'half' | 'full';
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="overlay-fade fixed inset-0 z-50 bg-black/40" />
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
          className={cn(
            'sheet-up fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl border-t border-line bg-raised shadow-xl outline-none',
            // The height transition covers a sheet growing when Advanced opens.
            'transition-[max-height] duration-base ease-out motion-reduce:transition-none',
            height === 'half' ? 'max-h-[55dvh]' : 'max-h-[92dvh]',
          )}
        >
          <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
            <span className="h-1 w-9 rounded-full bg-line" />
          </div>
          <DialogPrimitive.Title className={cn('px-4 pb-2 text-sm font-medium text-ink', !showTitle && 'sr-only')}>
            {title}
          </DialogPrimitive.Title>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
