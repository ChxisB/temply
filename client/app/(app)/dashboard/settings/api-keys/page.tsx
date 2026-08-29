'use client';

import { CheckIcon, CopyIcon, KeyIcon, Loader2Icon, LockIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { httpDelete, httpGet, httpPost } from '~/lib/http';
import { toast } from 'sonner';
import { isLimitReached } from '@temply/shared/plans';
import { Button } from '~/components/ui/button';
import { ConfirmDialog } from '~/components/ui/confirm-dialog';
import { PlanLimitBanner } from '~/components/dashboard/plan-limit-banner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Badge, Card, EmptyState, ErrorState } from '~/components/ui/surfaces';

type ApiKeyItem = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
};

type ApiKeyListResponse = {
  keys: ApiKeyItem[];
};

type CreateKeyResponse = {
  key: {
    id: string;
    name: string;
    key_prefix: string;
    full_key: string;
  };
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => httpGet<ApiKeyListResponse>('/api/v1/api-keys', {}),
  });

  const { data: billing } = useQuery({
    queryKey: ['billing'],
    queryFn: () => httpGet<{ usage: { apiKeys: number }; limits: { maxApiKeys: number | null } }>('/api/v1/billing', {}),
  });
  const apiKeyLimit = billing?.limits?.maxApiKeys ?? null;
  // Free's cap is 0 — the feature is locked, not used up. That reads
  // differently from a Pro user who has spent all five, so keep them apart.
  const featureLocked = apiKeyLimit === 0;
  const atLimit = billing ? isLimitReached(billing.usage?.apiKeys ?? 0, apiKeyLimit) : false;

  const { mutateAsync: createKey, isPending: isCreating } = useMutation({
    mutationFn: (name: string) => httpPost<CreateKeyResponse>('/api/v1/api-keys', { name }),
    onSuccess: (result) => {
      setNewlyCreatedKey(result.key.full_key);
      setKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error) => toast.error(error.message || 'Could not create the key'),
  });

  const { mutateAsync: revokeKey } = useMutation({
    mutationFn: (id: string) => httpDelete(`/api/v1/api-keys/${id}`),
    onSuccess: () => {
      toast.success('Key revoked');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error) => toast.error(error.message || 'Could not revoke the key'),
  });

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    await createKey(keyName.trim());
    setShowCreate(false);
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const keys = data?.keys ?? [];

  return (
    <div className="space-y-5">
      {/* The layout's header carries the title now, so the one action the page
          owns sits on its own row rather than being dropped with it. */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled={featureLocked || atLimit}
          onClick={() => {
            setNewlyCreatedKey(null);
            setShowCreate(true);
          }}
        >
          <PlusIcon />
          Create key
        </Button>
      </div>

      {atLimit && !featureLocked ? (
        <PlanLimitBanner
          title={`You've used all ${apiKeyLimit} API keys on your plan.`}
          detail="Upgrade for more."
        />
      ) : null}

      {newlyCreatedKey ? (
        <Card className="border-accent bg-accent-wash">
          <p className="text-sm font-medium text-ink">Your new key</p>
          <p className="mt-0.5 text-sm text-muted">
            Copy it now. For your safety it is not shown again.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-sm border border-line bg-raised px-2.5 py-1.5 font-mono text-sm text-ink">
              {newlyCreatedKey}
            </code>
            <Button onClick={() => copyKey(newlyCreatedKey)}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2Icon className="size-5 animate-spin text-faint" />
        </div>
      ) : isError ? (
        <ErrorState
          description="We could not load your keys. Any keys you already created are still active."
          onRetry={() => refetch()}
        />
      ) : featureLocked ? (
        <EmptyState
          icon={LockIcon}
          title="API keys are a Pro feature"
          description="Upgrade to create keys and read your templates from your own application."
          action={
            <Button variant="primary" asChild>
              <Link href="/dashboard/settings/plan">Upgrade to Pro</Link>
            </Button>
          }
        />
      ) : keys.length === 0 ? (
        <EmptyState
          icon={KeyIcon}
          title="No API keys"
          description="Create one to read your templates from your own application."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setNewlyCreatedKey(null);
                setShowCreate(true);
              }}
            >
              <PlusIcon />
              Create key
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-raised">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-3.5 py-2 text-left text-xs font-medium text-muted">Name</th>
                <th scope="col" className="px-3.5 py-2 text-left text-xs font-medium text-muted">Key</th>
                <th scope="col" className="px-3.5 py-2 text-left text-xs font-medium text-muted">Created</th>
                <th scope="col" className="px-3.5 py-2 text-left text-xs font-medium text-muted">Last used</th>
                <th scope="col" className="px-3.5 py-2 text-left text-xs font-medium text-muted">Status</th>
                <th scope="col" className="px-3.5 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="px-3.5 py-2.5 font-medium text-ink">{key.name}</td>
                  <td className="px-3.5 py-2.5">
                    <code className="rounded-xs bg-hover px-1.5 py-0.5 font-mono text-xs text-muted">
                      {key.key_prefix}…
                    </code>
                  </td>
                  <td className="px-3.5 py-2.5 text-muted tabular-nums">
                    {formatDate(key.created_at) ?? '—'}
                  </td>
                  <td className="px-3.5 py-2.5 text-muted tabular-nums">
                    {formatDate(key.last_used_at) ?? 'Never'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {key.revoked_at ? (
                      <Badge tone="danger">Revoked</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {!key.revoked_at && (
                      <ConfirmDialog
                        title="Revoke this key?"
                        description="Anything using it will stop working."
                        confirmLabel="Revoke"
                        onConfirm={() => revokeKey(key.id)}
                      >
                        <Button variant="danger-quiet" size="sm">
                          <Trash2Icon />
                          Revoke
                        </Button>
                      </ConfirmDialog>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden when the feature is locked — no point showing how to use a key
          you cannot create. */}
      {featureLocked ? null : (
        <Card>
          <h2 className="text-sm font-semibold text-ink">Using a key</h2>
          <p className="mt-1 text-sm text-muted">
            Send it as a bearer token when you call the public API.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-sm border border-line bg-surface p-3 font-mono text-xs text-ink">
            <code>{`# The template's details
curl -H "Authorization: Bearer tply_live_..." \\
  https://temply.app/api/public/v1/templates/tpl_abc123

# The finished email, with your data
curl -X POST -H "Authorization: Bearer tply_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"data":{"firstName":"Ada","isMember":true}}' \\
  https://temply.app/api/public/v1/templates/tpl_abc123/render`}</code>
          </pre>
        </Card>
      )}

      {/* Previously a bare fixed div: no role, no focus trap, no Escape, and Tab
          walked straight out into the page behind it. */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) setKeyName('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Name it after where it will be used, so you know what you are revoking later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="api-key-name" className="block text-sm font-medium text-ink">
              Key name
            </label>
            <input
              id="api-key-name"
              className="h-8 w-full rounded-sm border border-line bg-raised px-2.5 text-sm text-ink placeholder:text-faint"
              placeholder="Production server"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowCreate(false);
                setKeyName('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!keyName.trim() || isCreating}
            >
              {isCreating ? <Loader2Icon className="animate-spin" /> : null}
              Create key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
