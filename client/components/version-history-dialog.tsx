'use client';

import { HistoryIcon, Loader2Icon, RotateCcwIcon } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpGet, httpPost } from '~/lib/http';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

type Version = {
  id: string;
  version_number: number;
  title: string;
  created_at: string | null;
};

type VersionDetail = Version & {
  preview_text: string | null;
  content: string;
};

type VersionHistoryDialogProps = {
  templateId?: string;
};

export function VersionHistoryDialog({ templateId }: VersionHistoryDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<VersionDetail | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['versions', templateId],
    queryFn: () => httpGet<{ versions: Version[] }>(`/api/v1/templates/${templateId}/versions`, {}),
    enabled: !!templateId && open,
  });

  const { mutateAsync: restoreVersion, isPending: isRestoring } = useMutation({
    mutationFn: (versionId: string) =>
      httpPost(`/api/v1/templates/${templateId}/versions/${versionId}/restore`, {}),
    onSuccess: () => {
      toast.success('Version restored successfully.');
      setOpen(false);
      setPreviewVersion(null);
      router.refresh();
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to restore version'),
  });

  const { mutateAsync: fetchVersionDetail } = useMutation({
    mutationFn: async (versionId: string) => {
      return httpGet<{ version: VersionDetail }>(
        `/api/v1/templates/${templateId}/versions/${versionId}`,
        {}
      );
    },
    onSuccess: (data) => {
      setPreviewVersion(data.version);
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to load version detail'),
  });

  if (!templateId) return null;

  const versions = data?.versions ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setPreviewVersion(null); }}>
      <DialogTrigger asChild>
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
          type="button"
        >
          <HistoryIcon className="size-4" />
          <span className="hidden sm:inline">History</span>
        </button>
      </DialogTrigger>
      <DialogContent className="w-full min-w-0 max-w-lg overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and restore previous versions. Only the last 10 versions are kept.
          </DialogDescription>
        </DialogHeader>

        {previewVersion ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Version {previewVersion.version_number}
              </h3>
              <button
                onClick={() => setPreviewVersion(null)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                &larr; Back to list
              </button>
            </div>
            <div className="max-h-80 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-zinc-300">
                {JSON.stringify(JSON.parse(previewVersion.content), null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewVersion(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => restoreVersion(previewVersion.id)}
                disabled={isRestoring}
                className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {isRestoring ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcwIcon className="h-4 w-4" />
                )}
                Restore This Version
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2Icon className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-zinc-400">
            No versions saved yet. Each save creates a new version.
          </div>
        ) : (
          <div className="space-y-1">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/[0.02]"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Version {version.version_number}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                    {version.created_at
                      ? new Date(version.created_at).toLocaleString()
                      : 'Unknown date'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchVersionDetail(version.id)}
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => restoreVersion(version.id)}
                    disabled={isRestoring}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-400/10"
                  >
                    <RotateCcwIcon className="h-3 w-3" />
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
