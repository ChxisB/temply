'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { Editor, FocusPosition } from '@tiptap/core';
import {
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  SaveIcon,
  SendIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { httpDelete, httpPost } from '~/lib/http';
import type { Mail } from '~/db/schema';
import { CopyEmailHtml } from './copy-email-html';
import { DeleteEmailDialog } from './delete-email-dialog';
import { EmailEditor } from './email-editor';
import { PreviewEmailDialog } from './preview-email-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import defaultEmailJSON from '~/lib/default-editor-json.json';
import {
  ApiKeyConfigDialog,
  apiKeyQueryOptions,
} from './api-key-config-dialog';
import { VersionHistoryDialog } from './version-history-dialog';
const pillBtn =
  'inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700';

const primaryBtn =
  'inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200';

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 focus:outline-none transition-all dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-zinc-300';

type UpdateTemplateData = {
  title: string;
  previewText: string;
  content: string;
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
  const { data: apiKeyConfig } = useQuery(apiKeyQueryOptions());

  const [subject, setSubject] = useState(template?.title || '');
  const [previewText, setPreviewText] = useState(template?.preview_text || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [showReplyTo, setShowReplyTo] = useState(false);
  const [replyTo, setReplyTo] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);

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
    if (template?.id) {
      await updateTemplate({ title: subject, previewText, content });
    } else {
      await createTemplate({ title: subject, previewText, content });
    }
  };

  const handleSend = async () => {
    if (!from || !to) {
      toast.error('Please fill in the required fields.');
      return;
    }
    const content = JSON.stringify(editor?.getJSON());
    try {
      await httpPost('/api/v1/emails/send', {
        previewText, subject, from, replyTo, to, content,
      });
      toast.success('Email sent successfully.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send email.');
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
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

          <PreviewEmailDialog editor={editor} previewText={previewText} />
          <VersionHistoryDialog templateId={template?.id} />
          <ApiKeyConfigDialog />
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

      {/* Short code */}
      {template?.short_code && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-400 dark:text-zinc-500">Short Code</span>
            <code className="rounded-md bg-gray-100 px-2 py-1 text-sm font-mono text-gray-800 dark:bg-zinc-800 dark:text-zinc-200">
              {template.short_code}
            </code>
          </div>
          <button
            onClick={copyShortCode}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            {shortCodeCopied ? (
              <><CheckIcon className="h-3.5 w-3.5" /> Copied</>
            ) : (
              <><CopyIcon className="h-3.5 w-3.5" /> Copy</>
            )}
          </button>
          <a
            href={`/api/public/v1/templates/${template.short_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            API URL
          </a>
        </div>
      )}

      {/* Email fields card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
          Email Details
        </h2>
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
            <Label className={labelClass} htmlFor="from">From</Label>
            <input
              className={inputClass}
              id="from"
              onChange={(e) => setFrom(e.target.value)}
              placeholder="from@example.com"
              type="email"
              value={from}
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
                className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
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
          <label className={`mb-1.5 block ${labelClass}`}>Preview Text</label>
          <input
            className={inputClass}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Preview text shown in inbox..."
            value={previewText}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <EmailEditor
          autofocus={autofocus}
          defaultContent={editorContent}
          setEditor={setEditor}
        />
      </div>
    </div>
  );
}
