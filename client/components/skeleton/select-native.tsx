import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '~/lib/classname';

/**
 * This component is why the token layer exists. It set `text-black` with no
 * dark counterpart and no background of its own, so in dark mode the page
 * showed through and three controls in the editor rendered black on black —
 * measured contrast 1.00. A semantic token cannot be light-only.
 */
export function SelectNative(props: React.ComponentProps<'select'>) {
  const { className, children, ...rest } = props;
  return (
    <div className="relative flex">
      <select
        data-slot="select-native"
        className={cn(
          'peer inline-flex w-full cursor-pointer appearance-none items-center rounded-sm border border-line bg-raised text-sm text-ink transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45',
          'aria-invalid:border-danger has-[option[disabled]:checked]:text-muted',
          props.multiple ? 'py-1 *:px-3 *:py-1' : 'h-8 pe-8 ps-2.5',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {!props.multiple && (
        <span className="pointer-events-none absolute inset-y-0 end-0 flex h-full w-8 items-center justify-center text-faint peer-disabled:opacity-45">
          <ChevronDownIcon size={14} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
