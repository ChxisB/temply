'use client';

import { CopyIcon, Loader2Icon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '~/lib/classname';
import { EMAIL_TRANSFORM, THUMB_TRANSFORM, withTransform, type Asset } from '~/lib/assets';
import { formatBytes } from '@temply/shared/bytes';
import type { AssetView } from './asset-view-switch';

/** A file whose upload is in flight — drawn as a card so the user sees where
 *  the asset will land, not just a spinner somewhere else on the page. */
export type PendingUpload = { id: string; name: string; bytes: number };

type Props = {
  assets: Asset[];
  pending?: PendingUpload[];
  /** Cards or rows. The picker only ever needs cards. */
  view?: AssetView;
  /** `sm` packs the page's grid; `md` suits a dialog that is only ~40rem wide. */
  size?: 'sm' | 'md';
} & (
  | { mode: 'pick'; onPick: (asset: Asset) => void; onDelete?: never; onPreview?: never }
  | {
      mode: 'manage';
      onDelete: (asset: Asset) => void;
      /** Clicking the image itself opens it large; omit to make it inert. */
      onPreview?: (asset: Asset) => void;
      onPick?: never;
    }
);

export function assetMeta(asset: Asset): string {
  return [formatBytes(asset.bytes), asset.width && asset.height ? `${asset.width} × ${asset.height}` : null]
    .filter(Boolean)
    .join(' · ');
}

export function assetDate(asset: Asset): string | null {
  return asset.created_at
    ? new Date(asset.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
}

/** Copies the email-weight URL, so a pasted URL weighs the same as a picked one. */
export async function copyAssetUrl(asset: Asset) {
  try {
    await navigator.clipboard.writeText(withTransform(asset.url, EMAIL_TRANSFORM));
    toast.success('URL copied');
  } catch {
    toast.error('Could not copy the URL.');
  }
}

/** One grid for the library page and the editor picker. In `pick` mode every
 *  card is a button; in `manage` mode the card carries copy and delete. */
export function AssetGrid(props: Props) {
  const { assets, mode, pending = [], view = 'grid', size = 'sm' } = props;

  if (view === 'list') return <AssetList {...props} />;

  return (
    <ul
      className={cn(
        'grid gap-3',
        size === 'sm' ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' : 'grid-cols-3 sm:grid-cols-4',
      )}
    >
      {pending.map((file) => (
        <li
          key={file.id}
          aria-busy="true"
          className="fade-in-mount rounded-lg border border-dashed border-line-strong bg-raised motion-reduce:transition-none"
        >
          <div className="flex aspect-[4/3] items-center justify-center rounded-t-lg bg-sunken">
            <Loader2Icon className="size-5 animate-spin text-faint" />
          </div>
          <div className="min-w-0 px-2 py-1.5">
            <p className="truncate text-xs text-ink" title={file.name}>{file.name}</p>
            <p className="text-2xs text-muted tabular-nums">Uploading · {formatBytes(file.bytes)}</p>
          </div>
        </li>
      ))}
      {assets.map((asset) => {
        const thumb = (
          // Odd shapes sit inside a fixed well instead of reflowing the row.
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-lg bg-sunken">
            <img
              src={withTransform(asset.url, THUMB_TRANSFORM)}
              alt={asset.name}
              loading="lazy"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        );
        const caption = (
          <div className="min-w-0 px-2 py-1.5">
            <p className="truncate text-xs text-ink" title={asset.name}>{asset.name}</p>
            <p className="truncate text-2xs text-muted tabular-nums">{assetMeta(asset)}</p>
          </div>
        );

        return (
          <li
            key={asset.id}
            className={cn(
              'group fade-in-mount rounded-lg border border-line bg-raised shadow-sm transition-colors motion-reduce:transition-none',
              (mode === 'pick' || props.onPreview) && 'hover:border-accent focus-within:border-accent',
            )}
          >
            {mode === 'pick' ? (
              <button
                type="button"
                onClick={() => props.onPick(asset)}
                className="block w-full rounded-lg text-left"
              >
                {thumb}
                {caption}
              </button>
            ) : (
              <div className="relative">
                {props.onPreview ? (
                  <button
                    type="button"
                    aria-label={`Preview ${asset.name}`}
                    onClick={() => props.onPreview?.(asset)}
                    className="block w-full rounded-lg text-left"
                  >
                    {thumb}
                    {caption}
                  </button>
                ) : (
                  <>
                    {thumb}
                    {caption}
                  </>
                )}
                <div
                  className={cn(
                    'absolute top-1 right-1 flex gap-0.5 rounded-md bg-raised/90 p-0.5 shadow-sm',
                    'opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none',
                  )}
                >
                  <CardAction label={`Copy URL of ${asset.name}`} title="Copy URL" onClick={() => void copyAssetUrl(asset)}>
                    <CopyIcon className="size-3.5" />
                  </CardAction>
                  <CardAction label={`Delete ${asset.name}`} title="Delete" danger onClick={() => props.onDelete(asset)}>
                    <Trash2Icon className="size-3.5" />
                  </CardAction>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Rows instead of cards: a small thumbnail, the name, the numbers and the
 *  date in columns, with the actions always visible rather than on hover. */
function AssetList(props: Props) {
  const { assets, mode, pending = [] } = props;

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-raised shadow-sm">
      {pending.map((file) => (
        <li key={file.id} aria-busy="true" className="fade-in-mount flex items-center gap-3 px-3 py-2 motion-reduce:transition-none">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-sunken">
            <Loader2Icon className="size-4 animate-spin text-faint" />
          </div>
          <p className="min-w-0 flex-1 truncate text-sm text-ink" title={file.name}>{file.name}</p>
          <p className="shrink-0 text-2xs text-muted tabular-nums">Uploading · {formatBytes(file.bytes)}</p>
        </li>
      ))}
      {assets.map((asset) => {
        const thumb = (
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-sunken">
            <img
              src={withTransform(asset.url, THUMB_TRANSFORM)}
              alt=""
              loading="lazy"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        );
        const name = (
          <p className="min-w-0 flex-1 truncate text-sm text-ink" title={asset.name}>{asset.name}</p>
        );
        const numbers = (
          <>
            <p className="hidden w-32 shrink-0 truncate text-2xs text-muted tabular-nums sm:block">{assetMeta(asset)}</p>
            <p className="hidden w-24 shrink-0 text-2xs text-muted tabular-nums md:block">{assetDate(asset)}</p>
          </>
        );
        const rowClass = 'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-hover motion-reduce:transition-none';

        return (
          <li key={asset.id} className="fade-in-mount motion-reduce:transition-none">
            {mode === 'pick' ? (
              <button type="button" onClick={() => props.onPick(asset)} className={rowClass}>
                {thumb}
                {name}
                {numbers}
              </button>
            ) : (
              <div className="flex items-center gap-1 pr-2">
                {props.onPreview ? (
                  <button
                    type="button"
                    aria-label={`Preview ${asset.name}`}
                    onClick={() => props.onPreview?.(asset)}
                    className={cn(rowClass, 'min-w-0 flex-1')}
                  >
                    {thumb}
                    {name}
                    {numbers}
                  </button>
                ) : (
                  <div className={cn(rowClass, 'min-w-0 flex-1')}>
                    {thumb}
                    {name}
                    {numbers}
                  </div>
                )}
                <CardAction label={`Copy URL of ${asset.name}`} title="Copy URL" onClick={() => void copyAssetUrl(asset)}>
                  <CopyIcon className="size-3.5" />
                </CardAction>
                <CardAction label={`Delete ${asset.name}`} title="Delete" danger onClick={() => props.onDelete(asset)}>
                  <Trash2Icon className="size-3.5" />
                </CardAction>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CardAction({
  label,
  title,
  danger,
  onClick,
  children,
}: {
  label: string;
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={onClick}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-sm text-muted transition-colors motion-reduce:transition-none',
        danger ? 'hover:bg-danger-wash hover:text-danger-ink' : 'hover:bg-hover hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
