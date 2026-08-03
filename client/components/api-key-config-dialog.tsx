import { ExternalLinkIcon, Loader2Icon, PlugZapIcon, Settings2Icon } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { httpGet, httpPost } from '~/lib/http';

type ApiKeyConfig = {
  apiKey: string;
  provider: string;
};

export function apiKeyQueryOptions() {
  return queryOptions({
    queryKey: ['api-key-config'],
    queryFn: async () => {
      return httpGet<ApiKeyConfig>('/api/v1/config', {});
    },
  });
}

export function ApiKeyConfigDialog() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const { isLoading } = useQuery(apiKeyQueryOptions());
  const { mutateAsync: saveApiKey, isPending } = useMutation({
    // Resend is the only provider, so it is fixed here rather than chosen —
    // picking from a list of one is a decision the user should not have to make.
    mutationFn: async () => {
      return httpPost('/api/v1/config', { apiKey, provider: 'resend' });
    },
    onSettled: () => {
      queryClient.invalidateQueries(apiKeyQueryOptions());
    },
  });

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      toast.promise(saveApiKey(), {
        loading: 'Saving...',
        success: 'Sending connected',
        error: (err) => err?.message || 'Could not save',
      });
    },
    [saveApiKey]
  );

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-raised px-3 py-2 text-sm font-medium text-muted transition-all hover:border-line-strong hover:bg-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={isLoading}
        >
          <Settings2Icon className="size-4" />
          {/* Named for what it does — connect a sending account — not "Config".
              The other API-key surface (/dashboard/api-keys) issues Temply's
              own keys; this one holds your Resend key so Temply can send on
              your behalf. Same words, opposite direction, so they get
              different names. */}
          <span className="hidden sm:inline">Sending</span>
        </button>
      </DialogTrigger>
      <DialogContent className="w-full min-w-0 max-w-sm overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>Sending</DialogTitle>
          <DialogDescription className="text-balance">
            Temply sends through your Resend account. Paste your Resend API key
            so it can send on your behalf. It is stored in this browser.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
          <Label className="font-normal">
            <span className="after:ml-0.5 after:text-danger-ink after:content-['*']">
              Resend key
            </span>
            <Input
              className="mt-2 h-10 font-normal"
              name="apiKey"
              placeholder="re_..."
              required
              spellCheck={false}
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </Label>

          <button
            className="flex h-10 items-center justify-center rounded-md bg-accent px-2 py-1 text-sm text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
          >
            {isPending ? (
              <Loader2Icon className="mr-1 inline-block size-4 animate-spin" />
            ) : (
              <PlugZapIcon className="mr-1 inline-block size-4" />
            )}
            Save Changes
          </button>
        </form>

        {/* Opens the guided checklist in a new tab so this dialog — and whatever
            the user was doing behind it — stays put to paste into. */}
        <a
          href="/dashboard/get-sending"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1 inline-flex items-center gap-1.5 text-sm text-accent-ink underline-offset-4 hover:underline"
        >
          <ExternalLinkIcon className="size-3.5" />
          New to this? Set up sending step by step
        </a>
      </DialogContent>
    </Dialog>
  );
}
