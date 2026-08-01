'use client';

import { DialogClose } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { Loader2Icon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { httpDelete } from '~/lib/http';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

type DeleteEmailDialogProps = {
  templateId?: string;
};

export function DeleteEmailDialog(props: DeleteEmailDialogProps) {
  const { templateId } = props;

  const router = useRouter();

  const { mutate: deleteTemplate, isPending: isDeleteTemplatePending } =
    useMutation({
      mutationFn: async () => {
        return httpDelete(`/api/v1/templates/${templateId}`);
      },
      onSettled: () => {
        router.refresh();
      },
      onSuccess: () => {
        router.push('/dashboard/templates');
      },
    });

  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:border-red-300 hover:bg-red-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400 dark:hover:border-red-800/50 dark:hover:bg-red-900/30"
        disabled={isDeleteTemplatePending || !templateId}
      >
        {isDeleteTemplatePending ? (
          <Loader2Icon className="inline-block size-4 shrink-0 animate-spin lg:mr-1" />
        ) : (
          <Trash2Icon className="inline-block size-4 shrink-0 lg:mr-1" />
        )}
        <span className="hidden lg:inline-block">Delete</span>
      </DialogTrigger>

      <DialogContent className="w-full max-w-xs p-4">
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the email
            and remove data from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <DialogClose>
            <button
              className="flex min-h-[28px] w-full cursor-pointer items-center justify-center rounded-md bg-gray-100 px-2 py-1.5 text-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={isDeleteTemplatePending}
            >
              Cancel
            </button>
          </DialogClose>
          <button
            className="flex min-h-[28px] w-full cursor-pointer items-center justify-center rounded-md bg-black px-2 py-1.5 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 max-lg:w-7"
            type="button"
            disabled={isDeleteTemplatePending || !templateId}
            onClick={() => deleteTemplate()}
          >
            {isDeleteTemplatePending ? (
              <Loader2Icon className="inline-block size-4 shrink-0 animate-spin lg:mr-1" />
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
