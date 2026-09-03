'use client';

import { HistoryIcon, Loader2Icon, RotateCcwIcon } from 'lucide-react';
import { List, Row } from '~/components/ui/item';
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
              <Button variant="ghost" size="sm" onClick={() => setPreviewVersion(null)}>
                &larr; Back to list
              </Button>
            </div>
            <div className="max-h-80 overflow-auto rounded-lg border border-line bg-surface p-3">
              <pre className="whitespace-pre-wrap text-xs text-ink">
                {JSON.stringify(JSON.parse(previewVersion.content), null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPreviewVersion(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => restoreVersion(previewVersion.id)}
                disabled={isRestoring}
              >
                {isRestoring ? <Loader2Icon className="animate-spin" /> : <RotateCcwIcon />}
                Restore this version
              </Button>
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
          <List>
            {versions.map((version) => (
              <Row
                key={version.id}
                onClick={() => fetchVersionDetail(version.id)}
                primaryLabel={`Preview version ${version.version_number}`}
                title={`Version ${version.version_number}`}
                subtitle={
                  version.created_at ? new Date(version.created_at).toLocaleString() : 'Unknown date'
                }
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreVersion(version.id)}
                    disabled={isRestoring}
                    className="text-accent-ink hover:bg-accent-wash hover:text-accent-ink"
                  >
                    <RotateCcwIcon />
                    Restore
                  </Button>
                }
              />
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
