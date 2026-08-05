'use client';

import { useMutation } from '@tanstack/react-query';
import type { Editor, FocusPosition } from '@tiptap/core';
import {
  CheckIcon,
  CopyIcon,
  InfoIcon,
  LayoutTemplateIcon,
  Loader2Icon,
  MailIcon,
  SaveIcon,
  SendIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { httpDelete, httpPost } from '~/lib/http';
import { createImageKitUploader, UPLOAD_MIME_TYPES } from '~/lib/imagekit-upload';
import type { Mail } from '~/db/schema';
import { CopyEmailHtml } from './copy-email-html';
import { Button } from './ui/button';
import { DeleteEmailDialog } from './delete-email-dialog';
import { EmailEditor } from './email-editor';
import { PreviewEmailDialog } from './preview-email-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import defaultEmailJSON from '~/lib/default-editor-json.json';
import { VersionHistoryDialog } from './version-history-dialog';
import { TemplateThemePanel } from './template-theme-panel';
import { DEFAULT_RENDERER_THEME, type RendererThemeOptions } from '@temply/shared/theme';
// The app-wide input treatment; the global :focus-visible ring supplies focus.
const inputClass =
  'h-9 w-full rounded-md border border-line bg-raised px-3 text-sm text-ink placeholder:text-faint';

const labelClass = 'block text-sm font-medium text-ink';

type UpdateTemplateData = {
  title: string;
  previewText: string;
  content: string;
  theme: string;
};

type SaveTemplateResponse = {
  template: Mail;
};

type EmailEditorSandboxProps = {
  template?: Mail;
  showSaveButton?: boolean;
  autofocus?: FocusPosition;
};

export function EmailEditorSandbox(props: EmailEditorSandboxProps) {
  const { template, showSaveButton = true, autofocus } = props;

  const router = useRouter();

  const [subject, setSubject] = useState(template?.title || '');
  const [previewText, setPreviewText] = useState(template?.preview_text || '');
  const [fromName, setFromName] = useState('');
  const [to, setTo] = useState('');

  const [replyTo, setReplyTo] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [theme, setTheme] = useState<RendererThemeOptions>(() => {
    if (template?.theme) {
      try {
        return JSON.parse(template.theme) as RendererThemeOptions;
      } catch {
        // A malformed stored theme should not stop the editor opening.
      }
    }
    return structuredClone(DEFAULT_RENDERER_THEME);
  });

  const { mutateAsync: updateTemplate, isPending: isUpdateTemplatePending } =
    useMutation({
      mutationFn: (data: UpdateTemplateData) => {
        return httpPost(`/api/v1/templates/${template?.id}`, data) as Promise<SaveTemplateResponse>;
      },
      onSuccess: () => {
        toast.success('Template saved successfully.');
        router.refresh();
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to save template.');
      },
    });

  const { mutateAsync: createTemplate, isPending: isCreateTemplatePending } =
    useMutation({
      mutationFn: (data: UpdateTemplateData) => {
        return httpPost('/api/v1/templates', data) as Promise<SaveTemplateResponse>;
      },
      onSuccess: (data: SaveTemplateResponse) => {
        toast.success('Template created successfully.');
        router.push(`/templates/${data.template.id}`);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create template.');
      },
    });

  const { mutateAsync: deleteTemplate, isPending: isDeletePending } =
    useMutation({
      mutationFn: () => {
        return httpDelete(`/api/v1/templates/${template?.id}`);
      },
      onSuccess: () => {
        toast.success('Template deleted successfully.');
        router.push('/dashboard/templates');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete template.');
      },
    });

  const imageUploader = useMemo(() => createImageKitUploader(), []);

  const [editorContent, setEditorContent] = useState(() => {
    if (template?.content) {
      return typeof template.content === 'string'
        ? JSON.parse(template.content)
        : template.content;
    }
    return defaultEmailJSON;
  });

  const handleSave = async () => {
    const content = JSON.stringify(editor?.getJSON());
    const serialisedTheme = JSON.stringify(theme);
    if (template?.id) {
      await updateTemplate({ title: subject, previewText, content, theme: serialisedTheme });
    } else {
      await createTemplate({ title: subject, previewText, content, theme: serialisedTheme });
    }
  };

  const handleSend = async () => {
    if (!to) {
      toast.error('Add a To address before sending.');
      return;
    }
    const content = JSON.stringify(editor?.getJSON());
    try {
      await httpPost('/api/v1/emails/send', {
        theme,
        previewText,
        subject,
        fromName,
        replyTo,
        to,
        content,
      });
      toast.success('Email sent.');
    } catch (error: any) {
      toast.error(error?.message || 'Could not send the email.');
    }
  };

  const saveBtnPending = isUpdateTemplatePending || isCreateTemplatePending;
  const [shortCodeCopied, setShortCodeCopied] = useState(false);

  // The editor canvas is styled by --mly-* variables (declared at :root in
  // core/styles). Re-declaring them on this wrapper from the live theme makes
  // a brand or colour change visible in the content immediately, instead of
  // only at preview/render time.
  const canvasVars = useMemo(() => {
    const d = DEFAULT_RENDERER_THEME;
    const v: Record<string, string> = {};
    const set = (name: string, val?: string) => {
      if (val) v[name] = val;
    };
    set('--mly-body-background-color', theme.body?.backgroundColor ?? d.body?.backgroundColor);
    set('--mly-body-padding-top', theme.body?.paddingTop ?? d.body?.paddingTop);
    set('--mly-body-padding-right', theme.body?.paddingRight ?? d.body?.paddingRight);
    set('--mly-body-padding-bottom', theme.body?.paddingBottom ?? d.body?.paddingBottom);
    set('--mly-body-padding-left', theme.body?.paddingLeft ?? d.body?.paddingLeft);
    set('--mly-container-background-color', theme.container?.backgroundColor ?? d.container?.backgroundColor);
    set('--mly-container-padding-top', theme.container?.paddingTop ?? d.container?.paddingTop);
    set('--mly-container-padding-right', theme.container?.paddingRight ?? d.container?.paddingRight);
    set('--mly-container-padding-bottom', theme.container?.paddingBottom ?? d.container?.paddingBottom);
    set('--mly-container-padding-left', theme.container?.paddingLeft ?? d.container?.paddingLeft);
    set('--mly-container-border-radius', theme.container?.borderRadius ?? d.container?.borderRadius);
    set('--mly-container-border-width', theme.container?.borderWidth ?? d.container?.borderWidth);
    set('--mly-container-border-color', theme.container?.borderColor ?? d.container?.borderColor);
    set('--mly-container-max-width', theme.container?.maxWidth ?? d.container?.maxWidth);
    set('--mly-button-background-color', theme.button?.backgroundColor ?? d.button?.backgroundColor);
    set('--mly-button-text-color', theme.button?.color ?? d.button?.color);
    set('--mly-link-color', theme.link?.color ?? d.link?.color);
    return v as React.CSSProperties;
  }, [theme]);

  const copyShortCode = async () => {
    if (!template?.short_code) return;
    await navigator.clipboard.writeText(template.short_code);
    setShortCodeCopied(true);
    setTimeout(() => setShortCodeCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-raised p-3">
        <div className="flex flex-wrap items-center gap-2">
          {showSaveButton && (
            <Button variant="primary" disabled={saveBtnPending} onClick={handleSave}>
              {saveBtnPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <SaveIcon />
              )}
              {template?.id ? 'Save' : 'Save New'}
            </Button>
          )}

          <PreviewEmailDialog
            editor={editor}
            previewText={previewText}
            subject={subject}
            theme={theme}
          />
          <VersionHistoryDialog templateId={template?.id} />
        </div>

        <div className="flex items-center gap-2">
          <CopyEmailHtml editor={editor} />
          <DeleteEmailDialog templateId={template?.id} />

          {/* Internal-debug delivery — only for a saved template. The
              anonymous playground must not advertise a send capability the
              product does not offer. */}
          {template?.id && (
            <Button onClick={handleSend}>
              <SendIcon />
              <span className="hidden sm:inline">Send</span>
            </Button>
          )}
        </div>
      </div>

      {/* Template ID */}
      {template?.short_code && (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-raised p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-faint">Template ID</span>
            <code className="rounded-md bg-hover px-2 py-1 text-sm font-mono text-ink">
              {template.short_code}
            </code>
          </div>
          <button
            onClick={copyShortCode}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            {shortCodeCopied ? (
              <><CheckIcon className="h-3.5 w-3.5" /> Copied</>
            ) : (
              <><CopyIcon className="h-3.5 w-3.5" /> Copy</>
            )}
          </button>

          <Popover>
            <PopoverTrigger
              className="ml-auto flex size-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink"
              aria-label="What is the template ID for?"
            >
              <InfoIcon className="size-4" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <p className="text-sm font-medium text-ink">Using this template ID</p>
              <p className="mt-1 text-sm text-muted">
                Fetch this template from your own code with an API key, so your app
                pulls the latest version instead of hardcoding the email.
              </p>
              <pre className="mt-2.5 overflow-x-auto rounded-sm border border-line bg-surface p-2 font-mono text-2xs text-ink">
{`curl -H "Authorization: Bearer tply_..." \\
  ${typeof window !== 'undefined' ? window.location.origin : ''}/api/public/v1/templates/${template.short_code}`}
              </pre>
              <p className="mt-2 text-2xs text-faint">
                API access is a Pro feature — create a key under API keys first.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Email fields card — same section/header shape as the Brand panel */}
      <section className="overflow-hidden rounded-lg border border-line bg-raised">
        <header className="flex items-center gap-1.5 border-b border-line px-3.5 py-2">
          <MailIcon className="size-4 text-faint" />
          <h2 className="text-sm font-medium text-ink">Email details</h2>
        </header>
        <div className="p-3.5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass} htmlFor="subject">Subject</Label>
            <input
              className={inputClass}
              id="subject"
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your email subject"
              value={subject}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass} htmlFor="fromName">From name</Label>
            <input
              className={inputClass}
              id="fromName"
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Your name or brand"
              value={fromName}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass} htmlFor="to">To</Label>
            <input
              className={inputClass}
              id="to"
              onChange={(e) => setTo(e.target.value)}
              placeholder="to@example.com"
              type="email"
              value={to}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass} htmlFor="replyTo">
              Reply To <span className="font-normal text-faint">(optional)</span>
            </Label>
            <input
              className={inputClass}
              id="replyTo"
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="replyto@example.com"
              type="email"
              value={replyTo}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="previewText">
            Preview Text
          </label>
          <input
            className={inputClass}
            id="previewText"
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Preview text shown in inbox..."
            value={previewText}
          />
        </div>
        </div>
      </section>

      <TemplateThemePanel theme={theme} onChange={setTheme} />

      {/* Editor — same section/header shape as Email details and Brand */}
      <section className="overflow-hidden rounded-lg border border-line bg-raised">
        <header className="flex items-center gap-1.5 border-b border-line px-3.5 py-2">
          <LayoutTemplateIcon className="size-4 text-faint" />
          <h2 className="text-sm font-medium text-ink">Content</h2>
        </header>
        <div style={canvasVars}>
          <EmailEditor
            allowedMimeTypes={UPLOAD_MIME_TYPES}
            autofocus={autofocus}
            defaultContent={editorContent}
            onImageUpload={imageUploader}
            setEditor={setEditor}
          />
        </div>
      </section>
    </div>
  );
}
