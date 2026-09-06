'use client';

import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
} from 'lucide-react';
import { useRef, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import type { AutosaveStatus } from '~/lib/autosave';
import { useCopyToClipboard } from '~/hooks/use-copy-to-clipboard';
import { cn } from '~/lib/classname';
import { Button } from './ui/button';
import { PageLoading } from './ui/page-loading';
import { useMediaQuery } from '~/hooks/use-media-query';
import { DesktopEditorLayout } from './editor/desktop-layout';
import { MobileEditorLayout } from './editor/mobile-layout';
import { useTemplateEditor, type EmailEditorSandboxProps } from './editor/use-template-editor';

export type { EmailEditorSandboxProps };

/**
 * The autosave's one word. Idle and dirty say nothing — the pause is short
 * and a flicker of "unsaved" on every keystroke is noise; the word appears
 * once a save is under way and stays as "Saved". A failure is the only state
 * that asks for anything, and it asks with a button.
 */
export function SaveStatus({ status, onRetry }: { status: AutosaveStatus; onRetry: () => void }) {
  const visible = status === 'saving' || status === 'saved' || status === 'error';
  return (
    <span
      aria-live="polite"
      className={cn(
        'flex items-center gap-1 text-xs transition-opacity duration-base ease-out motion-reduce:transition-none',
        visible ? 'opacity-100' : 'opacity-0',
        status === 'error' ? 'text-danger-ink' : 'text-muted',
      )}
    >
      {status === 'error' ? (
        <>
          Not saved
          <Button variant="link" size="sm" className="h-auto px-1 text-xs" onClick={onRetry}>
            Retry
          </Button>
        </>
      ) : status === 'saving' ? (
        'Saving…'
      ) : (
        'Saved'
      )}
    </span>
  );
}

/** "12 minutes ago" tells you whether the draft is worth having; a timestamp
 *  would make you do the subtraction. */
export function formatDraftAge(savedAt: number): string {
  const minutes = Math.round((Date.now() - savedAt) / 60_000);
  if (minutes < 1) return 'a moment ago';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** A file name from the subject line: "Welcome to Temply" → welcome-to-temply. */
export function fileSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'email';
}

/**
 * Saves what the view shows as a file. The escape hatch that makes the
 * product safe to try: the HTML is yours, with or without an account.
 * Nothing is rendered again — it is the same source the pane is showing.
 */
export function DownloadButton({ content, filename, mimeType, label }: { content: string; filename: string; mimeType: string; label: string }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    // The browser has the blob by now; the URL only needs to outlive the click.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} title={label} onClick={download} disabled={!content}>
      <DownloadIcon />
    </Button>
  );
}

/** Copies the source already on screen — no second render to fetch it. The
 *  label names what is being copied: the same pane serves HTML and text. */
export function CopyHtmlButton({ html, label = 'Copy HTML' }: { html: string; label?: string }) {
  // Through the hook, not navigator.clipboard directly: the phone is opened
  // over plain http on the LAN, where the API is undefined and a bare call
  // rejects into nothing. A copy that cannot happen has to say so.
  const [copiedText, copy] = useCopyToClipboard();
  const copied = copiedText === html;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      onClick={async () => {
        if (!(await copy(html))) toast.error('Could not copy — this browser blocks the clipboard here.');
      }}
      className={cn(copied && 'text-accent-ink hover:text-accent-ink')}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

/** False on the server and during hydration, true from the first client
 *  render after it. */
function useHydrated(): boolean {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

export function EmailEditorSandbox(props: EmailEditorSandboxProps) {
  const { imageUploads = true, autofocus } = props;
  const model = useTemplateEditor(props);
  // Width chooses the shell. The server and the first client render pick
  // desktop, so the markup agrees during hydration; a phone switches on its
  // first effect, before the editor has mounted.
  const phone = useMediaQuery('(max-width: 639px)');
  const hydrated = useHydrated();
  // The two shells are different trees, so crossing 640px unmounts one editor
  // and mounts another from `model.editorContent` — which the autosave only
  // refreshes on a 1000 ms debounce. Rotating a phone within a second of the
  // last keystroke would drop that run of typing with no history to undo it
  // back, so the live document is taken here, during render, before the new
  // shell mounts. A layout effect runs after the new editor already has the
  // stale content and is too late.
  const lastShell = useRef(phone);
  if (lastShell.current !== phone) {
    lastShell.current = phone;
    model.flushContent();
  }
  if (phone) {
    return <MobileEditorLayout model={model} autofocus={autofocus} imageUploads={imageUploads} />;
  }
  // Until the client has hydrated, only CSS knows the width: the server's
  // desktop markup is hidden below `sm` and the page's wait state shows in
  // its place, so a phone never paints the desktop page while its JavaScript
  // is still on the way. The wrapper stays after hydration, as `contents`,
  // so lifting the class does not remount the desktop shell.
  return (
    <>
      <div className={hydrated ? 'contents' : 'contents max-sm:hidden'}>
        <DesktopEditorLayout model={model} autofocus={autofocus} imageUploads={imageUploads} />
      </div>
      {hydrated ? null : (
        <div className="sm:hidden">
          <PageLoading label="Loading the editor…" />
        </div>
      )}
    </>
  );
}
