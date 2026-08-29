'use client';

import { useMutation } from '@tanstack/react-query';
import { CopyIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { httpDelete, httpPost } from '~/lib/http';

type TemplateActionsProps = {
  templateId: string;
  /** Duplicating adds a template; hide the action once the plan cap is hit. */
  canDuplicate?: boolean;
};

export function TemplateActions({ templateId, canDuplicate = true }: TemplateActionsProps) {
  const router = useRouter();

  const { mutateAsync: duplicateTemplate, isPending: isDuplicating } = useMutation({
    mutationFn: async () => {
      return httpPost<{ template: { id: string } }>(`/api/v1/templates/${templateId}/duplicate`, {});
    },
    onSuccess: (data) => {
      toast.success('Template duplicated');
      router.push(`/templates/${data.template.id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to duplicate template');
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
    onError: (error) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {canDuplicate ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => duplicateTemplate()}
          disabled={isDuplicating}
          aria-label="Duplicate template"
        >
          <CopyIcon />
        </Button>
      ) : null}
      <Button
        variant="danger-quiet"
        size="icon-sm"
        onClick={() => {
          if (confirm('Delete this template? This cannot be undone.')) {
            deleteTemplate();
          }
        }}
        disabled={isDeleting}
        aria-label="Delete template"
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}
