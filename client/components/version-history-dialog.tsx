'use client';

import { HistoryIcon, Loader2Icon, RotateCcwIcon } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpGet, httpPost } from '~/lib/http';
import { Button } from '~/components/ui/button';
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
    onError: (error) => toast.error(error.message || 'Failed to restore version'),
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
    onError: (error) => toast.error(error.message || 'Failed to load version detail'),
  });

  if (!templateId) return null;

  const versions = data?.versions ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setPreviewVersion(null); }}>
      <DialogTrigger asChild>
        <Button type="button">
          <HistoryIcon />
          <span className="hidden sm:inline">History</span>
        </Button>
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
              <h3 className="text-sm font-medium text-ink">
                Version {previewVersion.version_number}
              </h3>
              <button
                onClick={() => setPreviewVersion(null)}
                className="text-xs text-muted hover:text-ink"
              >
                &larr; Back to list
              </button>
            </div>
            <div className="max-h-80 overflow-auto rounded-lg border border-line bg-surface p-3">
              <pre className="whitespace-pre-wrap text-xs text-ink">
                {JSON.stringify(JSON.parse(previewVersion.content), null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewVersion(null)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:bg-hover"
              >
                Cancel
              </button>
              <button
                onClick={() => restoreVersion(previewVersion.id)}
                disabled={isRestoring}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
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
            <Loader2Icon className="h-6 w-6 animate-spin text-faint" />
          </div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No versions saved yet. Each save creates a new version.
          </div>
        ) : (
          <div className="space-y-1">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-lg border border-line p-3 transition-colors hover:bg-hover"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink">
                    Version {version.version_number}
                  </span>
                  <span className="text-xs text-muted">
                    {version.created_at
                      ? new Date(version.created_at).toLocaleString()
                      : 'Unknown date'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchVersionDetail(version.id)}
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-hover"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => restoreVersion(version.id)}
                    disabled={isRestoring}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-accent-ink transition-colors hover:bg-accent-wash"
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
