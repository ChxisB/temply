'use client';

import { ImageIcon, Loader2Icon, UploadIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '~/lib/http';
import { UPLOAD_MIME_TYPES, type Asset } from '~/lib/assets';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { EmptyState, ErrorState } from '~/components/ui/surfaces';
import { AssetGrid } from './asset-grid';
import { useAssets } from './use-assets';

const inputClass =
  'h-9 w-full rounded-md border border-line bg-raised px-3 text-sm text-ink placeholder:text-faint';

export function AssetPickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (asset: Asset) => void;
}) {
  const { query, upload } = useAssets();
  const [search, setSearch] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const assets = (query.data?.assets ?? []).filter((asset) =>
    asset.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  // Uploading from inside the picker is "use this now", so the new asset is
  // picked without a second click.
  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const asset = await upload.mutateAsync(file);
      toast.success('Image uploaded');
      onPick(asset);
    } catch (error) {
      toast.error(errorMessage(error) || 'Image upload failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full min-w-0 max-w-2xl overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
          <DialogDescription>Images you have uploaded before, ready to reuse.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <input
            className={inputClass}
            placeholder="Search by file name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search images"
          />
          <input
            ref={fileInput}
            type="file"
            accept={UPLOAD_MIME_TYPES.join(',')}
            className="hidden"
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <Button variant="primary" disabled={upload.isPending} onClick={() => fileInput.current?.click()}>
            {upload.isPending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
            Upload
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2Icon className="size-5 animate-spin text-faint" />
            </div>
          ) : query.isError ? (
            <ErrorState description="We could not load your images. They are still there." onRetry={() => query.refetch()} />
          ) : assets.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title={search ? 'No images match' : 'No images yet'}
              description={search ? 'Try a different file name.' : 'Upload one to use it here'}
              action={search ? undefined : <Button variant="primary" onClick={() => fileInput.current?.click()}>Upload</Button>}
            />
          ) : (
            <AssetGrid mode="pick" assets={assets} onPick={onPick} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
