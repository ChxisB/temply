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
  MoonIcon,
  SaveIcon,
  SendIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { httpDelete, httpPost } from '~/lib/http';
import { cn } from '~/lib/classname';
import { createImageKitUploader, UPLOAD_MIME_TYPES } from '~/lib/imagekit-upload';
import type { Mail } from '~/db/schema';
import { Button } from './ui/button';
import { DeleteEmailDialog } from './delete-email-dialog';
import { EmailEditor } from './email-editor';
import { ContentModeSwitch, type ContentMode } from './content-mode-switch';
import { ContentPreview } from './content-preview';
import { ContentHtml } from './content-html';
import {
  initialPreviewData,
  PreviewDataPanel,
  toPayload,
  type PreviewData,
} from './preview-data-panel';
import { collectDataKeys, type TemplateDataKeys } from '@temply/shared/template-data';
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

const hasKeys = (keys: TemplateDataKeys) =>
  keys.conditions.length > 0 || keys.variables.length > 0;

/** Copies the HTML already on screen — no second render to fetch it. */
function CopyHtmlButton({ html }: { html: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : 'Copy HTML'}
      title={copied ? 'Copied' : 'Copy HTML'}
      onClick={async () => {
        await navigator.clipboard.writeText(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(
        'flex size-7 items-center justify-center rounded-sm transition-colors',
        copied ? 'text-accent-ink' : 'text-muted hover:bg-hover hover:text-ink'
      )}
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
    </button>
  );
}

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

  // --- Content section: edit / preview -------------------------------------
  const [mode, setMode] = useState<ContentMode>('edit');
  const [forceDark, setForceDark] = useState(false);
  const [previewKeys, setPreviewKeys] = useState<TemplateDataKeys>({
    conditions: [],
    variables: [],
  });
  const [previewData, setPreviewData] = useState<PreviewData>({
    conditions: {},
    variables: {},
  });
  const [previewHtml, setPreviewHtml] = useState('');
  // The source view gets its own, indented render; the email in the frame stays
  // byte-for-byte what would be sent.
  const [htmlSource, setHtmlSource] = useState('');
  // Drives the one-shot enter animation. The editor is hidden rather than
  // unmounted, so showing it again fires no transition of its own.
  const [switching, setSwitching] = useState(false);
  const paneClass = switching ? 'content-pane-in' : undefined;
  const editorPaneRef = useRef<HTMLDivElement>(null);
  const [paneHeight, setPaneHeight] = useState<number>();

  const [pendingMode, setPendingMode] = useState<ContentMode | null>(null);

  const showPane = (next: ContentMode) => {
    setPendingMode(null);
    setMode(next);
    setSwitching(true);
  };

  const changeMode = (next: ContentMode) => {
    if (next === 'edit') showPane('edit');
    else enterRendered(next);
  };

  useEffect(() => {
    if (!switching) return;
    const timer = setTimeout(() => setSwitching(false), 220);
    return () => clearTimeout(timer);
  }, [switching, mode]);
  // What the current HTML was rendered from. Re-entering preview without
  // touching anything should not cost a round trip.
  const renderedSignature = useRef('');
  const sourceSignature = useRef('');
  const hasPreviewData =
    previewKeys.conditions.length > 0 || previewKeys.variables.length > 0;

  const { mutate: renderPreview, isPending: isPreviewPending } = useMutation({
    mutationFn: async ({ signature, payload, pretty }: { signature: string; payload?: Record<string, unknown>; enter?: ContentMode; pretty?: boolean }) => {
      const html = await httpPost<{ html: string }>('/api/v1/emails/preview', {
        content: JSON.stringify(editor?.getJSON()),
        previewText,
        theme,
        payload,
        pretty,
      });
      return { html: html?.html ?? '', signature };
    },
    onSuccess: ({ html, signature }, variables) => {
      if (variables.pretty) {
        setHtmlSource(html);
        sourceSignature.current = signature;
      } else {
        setPreviewHtml(html);
        renderedSignature.current = signature;
      }
      // Swapping panes before the HTML exists shows an empty frame for as long
      // as the round trip takes, then pops the email in. Wait, then swap once.
      if (variables.enter) showPane(variables.enter);
    },
    onError: (error: any) => {
      setPendingMode(null);
      toast.error(error?.message || 'Failed to render the preview');
    },
  });

  /** Everything the rendered HTML depends on, so we can tell when it is stale. */
  const previewSignature = (payload?: Record<string, unknown>) =>
    JSON.stringify([editor?.getJSON(), theme, previewText, payload ?? null]);

  /** Preview and HTML both show the same render, so both go through here. */
  const enterRendered = (next: Exclude<ContentMode, 'edit'>) => {
    if (!editor) return;
    // Hold the section at the height it already has, so swapping panes does not
    // shove everything below it up or down.
    if (mode === 'edit') setPaneHeight(editorPaneRef.current?.offsetHeight);

    const keys = collectDataKeys(editor.getJSON());
    setPreviewKeys(keys);
    // Seed fresh each time: the document may have gained or lost keys.
    const data = initialPreviewData(keys);
    setPreviewData(data);

    const payload = hasKeys(keys) ? toPayload(data) : undefined;
    const signature = previewSignature(payload);
    const pretty = next === 'html';
    const cached = pretty
      ? signature === sourceSignature.current && htmlSource
      : signature === renderedSignature.current && previewHtml;
    if (cached) {
      showPane(next);
      return;
    }
    setPendingMode(next);
    renderPreview({ signature, payload, pretty, enter: next });
  };

  // Re-render as the data panel is used, debounced so typing a variable value
  // does not fire a request per keystroke.
  useEffect(() => {
    if (mode === 'edit' || !hasPreviewData) return;
    const timer = setTimeout(() => {
      const payload = toPayload(previewData);
      const signature = previewSignature(payload);
      const pretty = mode === 'html';
      const current = pretty ? sourceSignature.current : renderedSignature.current;
      if (signature === current) return;
      renderPreview({ signature, payload, pretty });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData, mode, hasPreviewData]);

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

  // The editor canvas only consumes --mly-* variables for buttons and links;
  // everything else (page background, card width, paddings, corners) is
  // painted by the renderer at send time and would otherwise never show here.
  // So the sandbox draws the page and the card itself from the live theme —
  // outer div = the email body, inner div = the container card — and hands
  // the button/link variables down. A brand or colour change is now visible
  // in the content the moment it happens.
  const { pageStyle, cardStyle } = useMemo(() => {
    const d = DEFAULT_RENDERER_THEME;
    const pick = <K extends 'body' | 'container' | 'button' | 'link'>(part: K) =>
      ({ ...(d[part] ?? {}), ...(theme[part] ?? {}) }) as NonNullable<RendererThemeOptions[K]>;

    const body = pick('body');
    const container = pick('container');
    const button = pick('button');
    const link = pick('link');

    const pageStyle: React.CSSProperties = {
      backgroundColor: body.backgroundColor,
      paddingTop: body.paddingTop ?? '0px',
      paddingRight: body.paddingRight ?? '16px',
      paddingBottom: body.paddingBottom ?? body.paddingTop ?? '0px',
      paddingLeft: body.paddingLeft ?? '16px',
      // Button and link colours are read inside the canvas via these vars.
      ['--mly-button-background-color' as string]: button.backgroundColor,
      ['--mly-button-text-color' as string]: button.color,
      ['--mly-button-border-radius' as string]: button.borderRadius,
      ['--mly-link-color' as string]: link.color,
    };

    const cardStyle: React.CSSProperties = {
      maxWidth: container.maxWidth ?? '600px',
      margin: '0 auto',
      backgroundColor: container.backgroundColor,
      borderRadius: container.borderRadius,
      borderStyle: container.borderWidth ? 'solid' : undefined,
      borderWidth: container.borderWidth,
      borderColor: container.borderColor,
      paddingTop: container.paddingTop,
      paddingRight: container.paddingRight,
      paddingBottom: container.paddingBottom,
      paddingLeft: container.paddingLeft,
    };

    return { pageStyle, cardStyle };
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

          {/* Preview lives in the Content header now, beside what it shows. */}
          {/* History and Delete act on a saved template; on the anonymous
              playground they would only ever render disabled. */}
          {template?.id && <VersionHistoryDialog templateId={template.id} />}
        </div>

        <div className="flex items-center gap-2">
          {/* Copying the HTML now lives in the Content section's HTML view,
              beside the source it copies — and it copies what is on screen
              instead of rendering the email a second time. */}
          {template?.id && <DeleteEmailDialog templateId={template.id} />}

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
                Render this template from your own code with an API key. Send the values
                your variables and conditions read, and you get back the finished HTML —
                always the current version, never a copy pasted into your app.
              </p>
              <pre className="mt-2.5 overflow-x-auto rounded-sm border border-line bg-surface p-2 font-mono text-2xs text-ink">
{`curl -X POST -H "Authorization: Bearer tply_..." \\
  -H "Content-Type: application/json" \\
  -d '{"data":{"firstName":"Ada","isMember":true}}' \\
  ${typeof window !== 'undefined' ? window.location.origin : ''}/api/public/v1/templates/${template.short_code}/render`}
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
        <header className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <LayoutTemplateIcon className="size-4 text-faint" />
            Content
            {mode !== 'edit' && (
              <span className="font-normal text-muted">
                ({mode === 'preview' ? 'Preview' : 'HTML'})
              </span>
            )}
          </h2>

          <ContentModeSwitch
            mode={mode}
            pending={pendingMode}
            onModeChange={changeMode}
            viewControls={
              mode === 'html' ? (
                <CopyHtmlButton html={htmlSource} />
              ) : mode === 'preview' ? (
              <>
                {hasPreviewData && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label="Preview data"
                        title="Preview data"
                        className="flex size-7 items-center justify-center rounded-sm text-muted transition-colors hover:bg-hover hover:text-ink"
                      >
                        <SlidersHorizontalIcon className="size-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-3">
                      <PreviewDataPanel
                        keys={previewKeys}
                        data={previewData}
                        onChange={setPreviewData}
                      />
                    </PopoverContent>
                  </Popover>
                )}
                <button
                  type="button"
                  aria-label="Preview as a client that forces dark mode"
                  aria-pressed={forceDark}
                  title="Forced dark"
                  onClick={() => setForceDark((current) => !current)}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-sm transition-colors',
                    forceDark
                      ? 'bg-accent-wash text-accent-ink'
                      : 'text-muted hover:bg-hover hover:text-ink'
                  )}
                >
                  <MoonIcon className="size-3.5" />
                </button>
              </>
              ) : null
            }
          />
        </header>

        {/* The editor is hidden rather than unmounted: it holds the caret,
            the selection and the undo history, and previewing is a glance. */}
        <div
          ref={editorPaneRef}
          className={cn(mode !== 'edit' ? 'hidden' : paneClass)}
          style={pageStyle}
        >
          <div style={cardStyle}>
            <EmailEditor
              allowedMimeTypes={UPLOAD_MIME_TYPES}
              autofocus={autofocus}
              defaultContent={editorContent}
              onImageUpload={imageUploader}
              setEditor={setEditor}
            />
          </div>
        </div>

        {mode === 'preview' && (
          <ContentPreview
            className={paneClass}
            minHeight={paneHeight}
            html={previewHtml}
            isPending={isPreviewPending}
            forceDark={forceDark}
            subject={subject}
            previewText={previewText}
            from={fromName}
          />
        )}

        {mode === 'html' && (
          <ContentHtml className={paneClass} minHeight={paneHeight} html={htmlSource} />
        )}
      </section>
    </div>
  );
}
