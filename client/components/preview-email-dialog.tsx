import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { httpPost } from '~/lib/http';
import type { Editor } from '@tiptap/core';
import { useState } from 'react';
import { EmailPreviewIFrame } from './email-preview-iframe';
import { cn } from '~/lib/classname';
import { EyeIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

type PreviewEmailDialogProps = {
  subject?: string;
  previewText?: string;
  /** Shown as the sender in the inbox mock. Previously hardcoded to a name
   *  carried over from the project this was forked from. */
  from?: string;
  /** The brand settings being edited, so the preview matches what will send. */
  theme?: unknown;
  editor: Editor | null;
};

type PreviewEmailResponse = {
  html: string;
};

export function PreviewEmailDialog(props: PreviewEmailDialogProps) {
  const { subject = '', previewText = '', from = '', theme, editor } = props;

  const senderName = from.trim() || 'Your sender address';
  const senderInitial = (from.trim()[0] ?? '?').toUpperCase();

  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState('');
  // Scoped to this dialog: checking dark survival is not an editing state, so
  // it never touches the canvas or the saved template.
  const [forceDark, setForceDark] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const json = editor?.getJSON();
      return httpPost<PreviewEmailResponse>('/api/v1/emails/preview', {
        content: JSON.stringify(json),
        previewText,
        theme,
      });
    },
    onSuccess: (data) => {
      setHtml(data?.html);
      setOpen(true);
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to preview email');
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setForceDark(false);
      }}
    >
      <DialogTrigger
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-raised px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!editor) {
            toast.error('No email content to preview');
            return;
          }

          setHtml('');
          mutate();
        }}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2Icon className="inline-block size-4 shrink-0 animate-spin lg:mr-1" />
        ) : (
          <EyeIcon className="inline-block size-4 shrink-0 lg:mr-1" />
        )}
        <span className="hidden lg:inline-block">Preview Email</span>
      </DialogTrigger>

      {open && (
        <DialogContent className="z-[99999] flex max-w-[620px] flex-col border-none bg-transparent p-0 shadow-none max-[680px]:h-full max-[680px]:border-0 max-[680px]:p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview Email</DialogTitle>
            <DialogDescription>
              Preview of the email that end users will receive
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-3 rounded-lg border border-line bg-raised p-3 shadow-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hover text-sm font-medium text-muted">
              {senderInitial}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="truncate text-sm font-medium text-ink">{senderName}</h3>
              <h4 className="truncate text-sm text-ink">{subject || 'No subject yet'}</h4>
              <p className="truncate text-sm text-muted">
                {previewText || 'No preview text — inbox clients will show the opening line instead.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-raised px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Forced dark</p>
              <p className="text-xs text-muted">
                Approximates the most aggressive transform a client can apply. Not a
                reproduction of any one client.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={forceDark}
              aria-label="Preview as a client that forces dark mode"
              onClick={() => setForceDark((current) => !current)}
              className={cn(
                'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                forceDark ? 'bg-accent' : 'bg-line-strong',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-4 rounded-full bg-white transition-[left]',
                  forceDark ? 'left-[18px]' : 'left-0.5',
                )}
              />
            </button>
          </div>

          <div className="flex min-h-[70vh] w-full grow overflow-hidden rounded-lg border border-line bg-canvas shadow-xs">
            <EmailPreviewIFrame
              wrapperClassName="w-full"
              className="h-full w-full grow"
              innerHTML={html}
              forceDark={forceDark}
            />
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
