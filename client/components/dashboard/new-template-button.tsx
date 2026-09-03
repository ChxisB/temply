'use client';

import { useMutation } from '@tanstack/react-query';
import {
  FileTextIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailCheckIcon,
  MegaphoneIcon,
  PlusIcon,
  ReceiptIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Tile } from '~/components/ui/item';
import { httpPost } from '~/lib/http';
import { STARTER_TEMPLATES, type StarterTemplate } from '~/lib/starter-templates';
import { toast } from 'sonner';

type SaveTemplateResponse = {
  template: { id: string };
};

/** One glyph per starter, so the gallery reads at a glance. */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  blank: FileTextIcon,
  welcome: SparklesIcon,
  'verify-email': MailCheckIcon,
  'password-reset': KeyRoundIcon,
  receipt: ReceiptIcon,
  invite: UsersIcon,
  announcement: MegaphoneIcon,
};

/**
 * "New template" opens a gallery rather than an empty editor: the emails a
 * startup sends first, each a finished draft to reword. Picking one creates
 * the template and opens it.
 */
export function NewTemplateButton({ disabled = false }: { disabled?: boolean } = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const { mutateAsync: createTemplate, isPending } = useMutation({
    mutationFn: async (starter: StarterTemplate) => {
      return httpPost<SaveTemplateResponse>('/api/v1/templates', {
        title: starter.subject,
        previewText: starter.previewText,
        content: JSON.stringify(starter.content),
      });
    },
    onSuccess: (data) => {
      router.push(`/templates/${data.template.id}`);
    },
    onError: (error) => {
      setPicked(null);
      toast.error(error.message || 'Could not create the template');
    },
  });

  const pick = (starter: StarterTemplate) => {
    if (isPending) return;
    setPicked(starter.id);
    void createTemplate(starter);
  };

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)} disabled={disabled}>
        <PlusIcon />
        New template
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          // The dialog stays up while the pick is in flight, so the busy tile
          // is the feedback and the redirect closes it.
          if (!next && isPending) return;
          setOpen(next);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start a template</DialogTitle>
            <DialogDescription>
              Pick the email closest to the one you need. Everything is yours to change.
            </DialogDescription>
          </DialogHeader>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy={isPending || undefined}>
            {STARTER_TEMPLATES.map((starter) => {
              const Icon = ICONS[starter.id] ?? FileTextIcon;
              const busy = picked === starter.id;
              return (
                <Tile
                  key={starter.id}
                  busy={busy}
                  onClick={() => pick(starter)}
                  primaryLabel={`Start from ${starter.name}`}
                  media={
                    <div className="flex aspect-[5/3] items-center justify-center bg-sunken">
                      {busy ? (
                        <Loader2Icon className="size-5 animate-spin text-faint" />
                      ) : (
                        <Icon className="size-6 text-muted" />
                      )}
                    </div>
                  }
                  title={starter.name}
                  subtitle={starter.description}
                  subtitleLines={2}
                />
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
