import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/classname';

// Focus is not declared here. globals.css defines one :focus-visible treatment
// for the whole app, so every control gets it whether or not someone remembered.
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-hover',
        secondary: 'border border-line bg-raised text-ink hover:bg-hover',
        ghost: 'text-muted hover:bg-hover hover:text-ink',
        danger: 'bg-danger text-white hover:opacity-90',
        'danger-quiet': 'text-danger-ink hover:bg-danger-wash',
        link: 'text-accent-ink underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-7 px-2 text-xs [&_svg]:size-3.5',
        md: 'h-8 px-3 text-sm [&_svg]:size-4',
        lg: 'h-10 px-4 text-base [&_svg]:size-4',
        icon: 'size-8 [&_svg]:size-4',
        'icon-sm': 'size-7 [&_svg]:size-3.5',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        // A bare <button> inside a form defaults to submit; opt in explicitly.
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
