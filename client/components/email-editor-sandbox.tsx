'use client';

import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
} from 'lucide-react';
import { useState } from 'react';
import type { AutosaveStatus } from '~/lib/autosave';
import { cn } from '~/lib/classname';
import { Button } from './ui/button';
import { useMediaQuery } from '~/hooks/use-media-query';
import { DesktopEditorLayout } from './editor/desktop-layout';
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

/** Copies the HTML already on screen — no second render to fetch it. */
export function CopyHtmlButton({ html }: { html: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? 'Copied' : 'Copy HTML'}
      title={copied ? 'Copied' : 'Copy HTML'}
      onClick={async () => {
        await navigator.clipboard.writeText(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(copied && 'text-accent-ink hover:text-accent-ink')}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

export function EmailEditorSandbox(props: EmailEditorSandboxProps) {
  const { imageUploads = true, autofocus } = props;
  const model = useTemplateEditor(props);
  // Phase 1 swaps in the phone shell here; until then every width is desktop.
  void useMediaQuery;
  return <DesktopEditorLayout model={model} autofocus={autofocus} imageUploads={imageUploads} />;
}
