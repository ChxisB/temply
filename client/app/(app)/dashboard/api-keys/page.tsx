'use client';

import { KeyIcon, Loader2Icon, PlusIcon, Trash2Icon, CopyIcon, CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpDelete, httpGet, httpPost } from '~/lib/http';
import { toast } from 'sonner';

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

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => httpGet<ApiKeyListResponse>('/api/v1/api-keys', {}),
  });

  const { mutateAsync: createKey, isPending: isCreating } = useMutation({
    mutationFn: (name: string) => httpPost<CreateKeyResponse>('/api/v1/api-keys', { name }),
    onSuccess: (result) => {
      setNewlyCreatedKey(result.key.full_key);
      setKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to create API key'),
  });

  const { mutateAsync: revokeKey } = useMutation({
    mutationFn: (id: string) => httpDelete(`/api/v1/api-keys/${id}`),
    onSuccess: () => {
      toast.success('API key revoked');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to revoke API key'),
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">API Keys</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Create and manage API keys for programmatic access to your templates.
          </p>
        </div>
        <button
          onClick={() => {
            setNewlyCreatedKey(null);
            setShowCreate(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 active:scale-[0.97] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <PlusIcon className="h-4 w-4" />
          Create Key
        </button>
      </div>

      {newlyCreatedKey && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/30 dark:bg-emerald-400/10">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            API Key Created
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
            Copy this key now. You won&apos;t be able to see it again.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-mono dark:border-emerald-400/30 dark:bg-black">
              {newlyCreatedKey}
            </code>
            <button
              onClick={() => copyKey(newlyCreatedKey)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-black dark:text-emerald-300 dark:hover:bg-emerald-400/20"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2Icon className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-zinc-700">
          <KeyIcon className="mx-auto mb-4 h-10 w-10 text-gray-400" />
          <h3 className="text-base font-medium text-gray-900 dark:text-white">No API keys</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
            Create an API key to access your templates programmatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.02]">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Key</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Created</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Last Used</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr
                  key={key.id}
                  className="border-b border-gray-100 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {key.name}
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {key.key_prefix}...
                    </code>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">
                    {key.created_at
                      ? new Date(key.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {key.revoked_at ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-400/10 dark:text-red-400">
                        Revoked
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!key.revoked_at && (
                      <button
                        onClick={() => {
                          if (confirm('Revoke this API key? This cannot be undone.')) {
                            revokeKey(key.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-400/10"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Using your API key</h3>
        <div className="mt-3 space-y-2">
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Include your API key in the Authorization header when making requests to the public API:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
            <code>{`curl -H "Authorization: Bearer tply_live_..." \\
  https://temply.app/api/public/v1/templates/tpl_abc123`}</code>
          </pre>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create API Key</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
              Give your key a descriptive name.
            </p>
            <input
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
              placeholder="e.g. Production API"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowCreate(false); setKeyName(''); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!keyName.trim() || isCreating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {isCreating && <Loader2Icon className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
