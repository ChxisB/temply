'use client';

import { CopyIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '~/lib/classname';
import { THUMB_TRANSFORM, withTransform, type Asset } from '~/lib/assets';
import { formatBytes } from '@temply/shared/bytes';

type Props =
  | { mode: 'pick'; assets: Asset[]; onPick: (asset: Asset) => void; onDelete?: never }
  | { mode: 'manage'; assets: Asset[]; onDelete: (asset: Asset) => void; onPick?: never };

/** One grid for the library page and the editor picker. In `pick` mode every
 *  card is a button; in `manage` mode the card carries copy and delete. */
export function AssetGrid(props: Props) {
  const { assets, mode } = props;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => {
        const meta = [formatBytes(asset.bytes), asset.width && asset.height ? `${asset.width} × ${asset.height}` : null]
          .filter(Boolean)
          .join(' · ');
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
          <div className="min-w-0 px-2.5 py-2">
            <p className="truncate text-sm text-ink" title={asset.name}>{asset.name}</p>
            <p className="text-2xs text-muted tabular-nums">{meta}</p>
          </div>
        );

        return (
          <li
            key={asset.id}
            className="group fade-in-mount rounded-lg border border-line bg-raised shadow-sm motion-reduce:transition-none"
          >
            {mode === 'pick' ? (
              <button
                type="button"
                onClick={() => props.onPick(asset)}
                className="block w-full rounded-lg text-left transition-colors hover:border-accent focus-visible:outline-none"
              >
                {thumb}
                {caption}
              </button>
            ) : (
              <div className="relative">
                {thumb}
                {caption}
                <div
                  className={cn(
                    'absolute top-1.5 right-1.5 flex gap-1 rounded-md bg-raised/90 p-0.5 shadow-sm',
                    'opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none',
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Copy URL of ${asset.name}`}
                    title="Copy URL"
                    onClick={async () => {
                      await navigator.clipboard.writeText(asset.url);
                      toast.success('URL copied');
                    }}
                    className="flex size-7 items-center justify-center rounded-sm text-muted transition-colors hover:bg-hover hover:text-ink"
                  >
                    <CopyIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${asset.name}`}
                    title="Delete"
                    onClick={() => props.onDelete(asset)}
                    className="flex size-7 items-center justify-center rounded-sm text-muted transition-colors hover:bg-danger-wash hover:text-danger-ink"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
