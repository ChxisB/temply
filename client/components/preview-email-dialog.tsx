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
import { EyeIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

type PreviewEmailDialogProps = {
  subject?: string;
  previewText?: string;
  /** Shown as the sender in the inbox mock. Previously hardcoded to a name
   *  carried over from the project this was forked from. */
  from?: string;
  editor: Editor | null;
};

type PreviewEmailResponse = {
  html: string;
};

export function PreviewEmailDialog(props: PreviewEmailDialogProps) {
  const { subject = '', previewText = '', from = '', editor } = props;

  const senderName = from.trim() || 'Your sender address';
  const senderInitial = (from.trim()[0] ?? '?').toUpperCase();

  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const json = editor?.getJSON();
      return httpPost<PreviewEmailResponse>('/api/v1/emails/preview', {
        content: JSON.stringify(json),
        previewText,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
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

          <div className="shadow-xs flex min-h-[75vh] w-full grow overflow-hidden rounded-xl border border-gray-200 bg-white">
            <EmailPreviewIFrame
              wrapperClassName="w-full"
              className="h-full w-full grow"
              innerHTML={html}
            />
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
