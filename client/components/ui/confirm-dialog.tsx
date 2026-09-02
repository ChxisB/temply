'use client';

import { useState } from 'react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

/**
 * The in-app stand-in for window.confirm. A native confirm blocks the whole
 * tab, ignores the theme, and is invisible to automation — every destructive
 * action confirms through this instead.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  /** The trigger, rendered as-is (asChild) — keep it a single Button. Omit
   *  when the dialog is opened programmatically through `open`. */
  children?: React.ReactNode;
  /** Controlled mode, for confirmations whose copy is only known after an
   *  async lookup (e.g. "used in 2 templates"). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="w-full max-w-xs p-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
