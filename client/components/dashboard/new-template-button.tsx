'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { httpPost } from '~/lib/http';
import { toast } from 'sonner';
import defaultEmailJSON from '~/lib/default-editor-json.json';

type SaveTemplateResponse = {
  template: { id: string };
};

export function NewTemplateButton({ disabled = false }: { disabled?: boolean } = {}) {
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
    <Button variant="primary" onClick={() => createTemplate()} disabled={isPending || disabled}>
      {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
      New template
    </Button>
  );
}
