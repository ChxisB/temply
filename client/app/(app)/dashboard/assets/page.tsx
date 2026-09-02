'use client';

import { ImageIcon, Loader2Icon, UploadIcon } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { formatBytes } from '@temply/shared/bytes';
import { AssetGrid } from '~/components/assets/asset-grid';
import { useAssets } from '~/components/assets/use-assets';
import { Button } from '~/components/ui/button';
import { ConfirmDialog } from '~/components/ui/confirm-dialog';
import { EmptyState, ErrorState, PageHeader } from '~/components/ui/surfaces';
import { assetUsage, UPLOAD_MIME_TYPES, type Asset } from '~/lib/assets';
import { cn } from '~/lib/classname';
import { errorMessage } from '~/lib/http';

const inputClass =
  'h-9 w-full max-w-xs rounded-md border border-line bg-raised px-3 text-sm text-ink placeholder:text-faint';

export default function AssetsPage() {
  const { query, upload, remove } = useAssets();
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ asset: Asset; templates: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const list = query.data;
  const assets = (list?.assets ?? []).filter((asset) =>
    asset.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const used = list?.usedBytes ?? 0;
  const limit = list?.limitBytes ?? null;
  const ratio = limit ? used / limit : 0;
  const usage = limit ? `${formatBytes(used)} of ${formatBytes(limit)} used` : `${formatBytes(used)} used`;

  const uploadFiles = async (files: FileList | File[] | null) => {
    for (const file of Array.from(files ?? [])) {
      try {
        await upload.mutateAsync(file);
        toast.success('Image uploaded');
      } catch (error) {
        toast.error(errorMessage(error) || `Could not upload ${file.name}.`);
        // A quota refusal will refuse the rest too; stop instead of toasting
        // the same sentence for every remaining file.
        break;
      }
    }
  };

  const askDelete = async (asset: Asset) => {
    try {
      const { templates } = await assetUsage(asset.id);
      setPendingDelete({ asset, templates: templates.length });
    } catch (error) {
      toast.error(errorMessage(error) || 'Could not check where this image is used.');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { asset } = pendingDelete;
    setPendingDelete(null);
    try {
      await remove.mutateAsync(asset.id);
      toast.success('Image deleted');
    } catch (error) {
      toast.error(errorMessage(error) || 'Could not delete the image.');
    }
  };

  return (
    <div
      className={cn(
        'space-y-5 rounded-lg border border-transparent transition-colors duration-200 motion-reduce:transition-none',
        dragging && 'border-accent bg-accent-wash/40',
      )}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => {
        // A child element's own drag-enter fires dragleave on this element
        // first; only clear the state once the pointer has actually left
        // the drop zone, or the border flickers while dragging over a card.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void uploadFiles(event.dataTransfer.files);
      }}
    >
      <PageHeader
        title="Assets"
        description={usage}
        actions={
          <>
            <input
              ref={fileInput}
              type="file"
              accept={UPLOAD_MIME_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={(event) => { void uploadFiles(event.target.files); event.target.value = ''; }}
            />
            <Button variant="primary" disabled={upload.isPending} onClick={() => fileInput.current?.click()}>
              {upload.isPending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
              Upload
            </Button>
          </>
        }
      />

      {limit && ratio >= 0.8 ? (
        <p className={cn('text-sm', ratio >= 1 ? 'text-danger-ink' : 'text-warn-ink')}>
          {ratio >= 1 ? 'Storage is full.' : 'Storage is almost full.'}{' '}
          <Link href="/dashboard/settings/plan" className="underline underline-offset-2">
            Delete images or upgrade
          </Link>
        </p>
      ) : null}

      {(list?.assets.length ?? 0) > 0 ? (
        <input
          className={inputClass}
          placeholder="Search by file name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search images"
        />
      ) : null}

      {query.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2Icon className="size-5 animate-spin text-faint" />
        </div>
      ) : query.isError ? (
        <ErrorState
          description="We could not load your images. Anything you uploaded is still there."
          onRetry={() => query.refetch()}
        />
      ) : assets.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={search ? 'No images match' : 'No images yet'}
          description={search ? 'Try a different file name.' : 'Upload one to reuse it across templates'}
          action={search ? undefined : <Button variant="primary" onClick={() => fileInput.current?.click()}>Upload</Button>}
        />
      ) : (
        <AssetGrid mode="manage" assets={assets} onDelete={askDelete} />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title={pendingDelete ? `Delete "${pendingDelete.asset.name}"?` : ''}
        description={
          pendingDelete && pendingDelete.templates > 0
            ? `It is used in ${pendingDelete.templates} template${pendingDelete.templates === 1 ? '' : 's'} — those images will stop showing.`
            : 'This removes the file from your library.'
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
