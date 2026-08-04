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
const pillBtn =
  'inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-4 py-2 text-sm font-medium text-muted transition-all hover:border-line-strong hover:bg-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50';

const primaryBtn =
  'inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50';

const inputClass =
  'w-full rounded-xl border border-line bg-raised/80 px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none transition-colors';

const labelClass = 'mb-1.5 block text-sm font-medium text-ink';

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

  const [showReplyTo, setShowReplyTo] = useState(false);
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

  const copyShortCode = async () => {
    if (!template?.short_code) return;
    await navigator.clipboard.writeText(template.short_code);
    setShortCodeCopied(true);
    setTimeout(() => setShortCodeCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-raised p-3">
        <div className="flex flex-wrap items-center gap-2">
          {showSaveButton && (
            <button
              className={primaryBtn}
              disabled={saveBtnPending}
              onClick={handleSave}
            >
              {saveBtnPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
              {template?.id ? 'Save' : 'Save New'}
            </button>
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

          <button className={pillBtn} onClick={handleSend}>
            <SendIcon className="size-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

      {/* Template ID */}
      {template?.short_code && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-raised p-3">
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
            <div className="flex items-center justify-between">
              <Label className={labelClass} htmlFor="replyTo">Reply To</Label>
              <button
                className="text-xs font-medium text-faint transition-colors hover:text-muted"
                onClick={() => setShowReplyTo(!showReplyTo)}
              >
                {showReplyTo ? '— Remove' : '+ Add'}
              </button>
            </div>
            {showReplyTo && (
              <input
                className={inputClass}
                id="replyTo"
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="replyto@example.com"
                type="email"
                value={replyTo}
              />
            )}
          </div>
        </div>

        <div className="mt-4">
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
        <EmailEditor
          allowedMimeTypes={UPLOAD_MIME_TYPES}
          autofocus={autofocus}
          defaultContent={editorContent}
          onImageUpload={imageUploader}
          setEditor={setEditor}
        />
      </section>
    </div>
  );
}
