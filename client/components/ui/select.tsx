import { useId } from 'react';
import { ChevronDownIcon, type LucideIcon } from 'lucide-react';
import { cn } from '~/lib/classname';

type SelectProps = {
  label: string;
  options: {
    value: string;
    label: string;
  }[];

  value: string;
  onValueChange: (value: string) => void;

  className?: string;

  icon?: LucideIcon;
  iconClassName?: string;
};

export function Select(props: SelectProps) {
  const {
    label,
    options,
    value,
    onValueChange,
    className,
    icon: Icon,
    iconClassName,
  } = props;

  // The whole body used `mly-`-prefixed classes — the editor's Tailwind
  // instance — inside an app-level component, where that prefix compiles to
  // nothing. Every caller was getting an unstyled browser select.
  const selectId = useId();

  return (
    <div className="relative">
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>

      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-2 z-20 flex items-center text-faint">
          <Icon className={cn('size-3.5', iconClassName)} />
        </div>
      )}

      <select
        id={selectId}
        className={cn(
          'flex h-8 max-w-max appearance-none items-center rounded-sm border border-line bg-raised px-2.5 pr-7 text-sm text-ink transition-colors hover:bg-hover',
          !!Icon && 'pl-7',
          className
        )}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-0 z-10 flex h-full w-7 items-center justify-center text-faint peer-disabled:opacity-50">
        <ChevronDownIcon
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          role="img"
        />
      </span>
    </div>
  );
}
