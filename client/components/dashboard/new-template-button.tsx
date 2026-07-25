'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { httpPost } from '~/lib/http';
import { toast } from 'sonner';
import defaultEmailJSON from '~/lib/default-editor-json.json';

type SaveTemplateResponse = {
  template: { id: string };
};

export function NewTemplateButton() {
  const router = useRouter();

  const { mutateAsync: createTemplate, isPending } = useMutation({
    mutationFn: async () => {
      return httpPost<SaveTemplateResponse>('/api/v1/templates', {
        title: 'Untitled Template',
        content: JSON.stringify(defaultEmailJSON),
      });
    },
    onSuccess: (data) => {
      router.push(`/templates/${data.template.id}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create template');
    },
  });

  return (
    <button
      onClick={() => createTemplate()}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {isPending ? (
        <Loader2Icon className="h-4 w-4 animate-spin" />
      ) : (
        <PlusIcon className="h-4 w-4" />
      )}
      New Template
    </button>
  );
}
