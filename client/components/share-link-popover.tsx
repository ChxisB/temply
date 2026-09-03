'use client';

import { useMutation } from '@tanstack/react-query';
import { CheckIcon, CopyIcon, Link2Icon, Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { ConfirmDialog } from '~/components/ui/confirm-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { httpDelete, httpPost } from '~/lib/http';

/**
 * A review link for a saved template: anyone holding it sees the draft,
 * signed out, as it stands when they open it. The lightest form of
 * collaboration — no members, no roles — and the one most small teams
 * actually need. The link can be turned off; making a new one afterwards
 * is a new secret, so the old one stays dead.
 */
export function ShareLinkPopover({
  templateId,
  initialToken,
}: {
  templateId: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [copied, setCopied] = useState(false);
  // The origin is the browser's; read after mount so the server render
  // never has to guess it.
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  const { mutateAsync: createLink, isPending: isCreating } = useMutation({
    mutationFn: () => httpPost<{ token: string }>(`/api/v1/templates/${templateId}/share`, {}),
    onSuccess: (data) => setToken(data.token),
    onError: (error) => toast.error(error.message || 'Could not create the link'),
  });

  const { mutateAsync: removeLink, isPending: isRemoving } = useMutation({
    mutationFn: () => httpDelete(`/api/v1/templates/${templateId}/share`),
    onSuccess: () => {
      setToken(null);
      toast.success('Link turned off');
    },
    onError: (error) => toast.error(error.message || 'Could not turn the link off'),
  });

  const url = token ? `${origin}/p/${token}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button aria-label="Share a review link">
          <Link2Icon />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <p className="text-sm font-medium text-ink">Review link</p>
        <p className="mt-1 text-sm text-muted">
          Anyone with the link can see this email without signing in. It shows your
          draft, so what they see follows your edits.
        </p>
        {token ? (
          <>
            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={url}
                aria-label="Review link"
                onFocus={(event) => event.currentTarget.select()}
                className="h-8 min-w-0 flex-1 rounded-sm border border-line bg-raised px-2.5 font-mono text-xs text-ink"
              />
              <Button size="sm" onClick={copy} aria-label={copied ? 'Copied' : 'Copy link'}>
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="mt-3 flex justify-end">
              <ConfirmDialog
                title="Turn off the link?"
                description="Anyone who has it will see a page saying it is no longer active. You can make a new link later."
                confirmLabel="Turn off"
                onConfirm={() => removeLink()}
              >
                <Button variant="danger-quiet" size="sm" disabled={isRemoving}>
                  {isRemoving ? <Loader2Icon className="animate-spin" /> : null}
                  Turn off link
                </Button>
              </ConfirmDialog>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <Button variant="primary" onClick={() => createLink()} disabled={isCreating}>
              {isCreating ? <Loader2Icon className="animate-spin" /> : <Link2Icon />}
              Create link
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
