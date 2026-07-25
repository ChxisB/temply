'use client';

import { useMutation } from '@tanstack/react-query';
import { CopyIcon, ExternalLinkIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { httpDelete, httpPost } from '~/lib/http';

type TemplateActionsProps = {
  templateId: string;
};

export function TemplateActions({ templateId }: TemplateActionsProps) {
  const router = useRouter();

  const { mutateAsync: duplicateTemplate, isPending: isDuplicating } = useMutation({
    mutationFn: async () => {
      return httpPost(`/api/v1/templates/${templateId}/duplicate`, {});
    },
    onSuccess: (data: any) => {
      toast.success('Template duplicated');
      router.push(`/templates/${data.template.id}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to duplicate template');
    },
  });

  const { mutateAsync: deleteTemplate, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      return httpDelete(`/api/v1/templates/${templateId}`);
    },
    onSuccess: () => {
      toast.success('Template deleted');
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete template');
    },
  });

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => duplicateTemplate()}
        disabled={isDuplicating}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        title="Duplicate"
      >
        <CopyIcon className="h-3.5 w-3.5" />
        Duplicate
      </button>
      <button
        onClick={() => {
          if (confirm('Are you sure you want to delete this template?')) {
            deleteTemplate();
          }
        }}
        disabled={isDeleting}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-400/10"
        title="Delete"
      >
        <Trash2Icon className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}
