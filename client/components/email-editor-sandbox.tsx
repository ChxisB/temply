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
  RotateCcwIcon,
  SaveIcon,
  SendIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { httpDelete, httpPost } from '~/lib/http';
import { cn } from '~/lib/classname';
import {
  clearDraft,
  isNewerThan,
  readDraft,
  writeDraft,
  type Draft,
} from '~/lib/drafts';
import { createImageKitUploader, UPLOAD_MIME_TYPES } from '~/lib/imagekit-upload';
import type { Mail } from '~/db/schema';
import { Button } from './ui/button';
import { DeleteEmailDialog } from './delete-email-dialog';
import { EmailEditor } from './email-editor';
import { ContentModeSwitch, type ContentMode } from './content-mode-switch';
import { ContentPreview } from './content-preview';
import { ContentSource } from './content-source';
import { EditorCheatsheet } from './editor-cheatsheet';
import {
  initialPreviewData,
  PreviewDataPanel,
  toPayload,
  type PreviewData,
} from './preview-data-panel';
import { collectDataKeys, type TemplateDataKeys } from '@temply/shared/template-data';
import {
  assessSize,
  checkFields,
  collectContentFindings,
  unresolvedVariables,
  type PreflightIssue,
} from '@temply/shared/preflight';
import { PreflightPanel } from './preflight-panel';
import { themeIssues, worstPerSubject } from './theme-warnings';
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

/** "12 minutes ago" tells you whether the draft is worth having; a timestamp
 *  would make you do the subtraction. */
function formatDraftAge(savedAt: number): string {
  const minutes = Math.round((Date.now() - savedAt) / 60_000);
  if (minutes < 1) return 'a moment ago';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Which render a view needs. Preview and the two source views differ only in
 *  what they ask the renderer for. */
type RenderVariant = 'preview' | 'html' | 'text';

const variantFor = (mode: ContentMode): RenderVariant =>
  mode === 'html' ? 'html' : mode === 'text' ? 'text' : 'preview';

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
  // The text alternative — what a client that cannot show markup would print.
  const [textSource, setTextSource] = useState('');
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
  const textSignature = useRef('');
  const hasPreviewData =
    previewKeys.conditions.length > 0 || previewKeys.variables.length > 0;

  const { mutate: renderPreview, isPending: isPreviewPending } = useMutation({
    mutationFn: async ({ signature, payload, variant }: { signature: string; payload?: Record<string, unknown>; enter?: ContentMode; variant: RenderVariant }) => {
      const res = await httpPost<{ html: string }>('/api/v1/emails/preview', {
        content: JSON.stringify(editor?.getJSON()),
        previewText,
        theme,
        payload,
        // The three views are the same render asked for three ways.
        pretty: variant === 'html',
        plainText: variant === 'text',
      });
      return { output: res?.html ?? '', signature };
    },
    onSuccess: ({ output, signature }, variables) => {
      if (variables.variant === 'html') {
        setHtmlSource(output);
        sourceSignature.current = signature;
      } else if (variables.variant === 'text') {
        setTextSource(output);
        textSignature.current = signature;
      } else {
        setPreviewHtml(output);
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
    const variant = variantFor(next);
    const cached =
      variant === 'html'
        ? signature === sourceSignature.current && htmlSource
        : variant === 'text'
          ? signature === textSignature.current && textSource
          : signature === renderedSignature.current && previewHtml;
    if (cached) {
      showPane(next);
      return;
    }
    setPendingMode(next);
    renderPreview({ signature, payload, variant, enter: next });
  };

  // Re-render as the data panel is used, debounced so typing a variable value
  // does not fire a request per keystroke.
  useEffect(() => {
    if (mode === 'edit' || !hasPreviewData) return;
    const timer = setTimeout(() => {
      const payload = toPayload(previewData);
      const signature = previewSignature(payload);
      const variant = variantFor(mode);
      const current =
        variant === 'html'
          ? sourceSignature.current
          : variant === 'text'
            ? textSignature.current
            : renderedSignature.current;
      if (signature === current) return;
      renderPreview({ signature, payload, variant });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData, mode, hasPreviewData]);

  // --- Preflight ------------------------------------------------------------
  // The checks a send or export should survive, computed from editor state.
  // Findings and the measured byte size travel together: the size is only
  // meaningful for the document the findings describe.
  const [preflight, setPreflight] = useState<{ issues: PreflightIssue[]; bytes: number | null }>({
    issues: [],
    bytes: null,
  });
  const [preflightExpanded, setPreflightExpanded] = useState(false);
  // Two-step send: armedFor holds the serialized error set the first click
  // acknowledged. The second click only goes through while the errors still
  // match, so a confirmation never carries over to a different mistake.
  const [armedFor, setArmedFor] = useState<string | null>(null);
  const preflightSerialized = useRef('');

  const hasPreflightErrors = preflight.issues.some((issue) => issue.severity === 'error');
  const sendArmed = armedFor !== null && hasPreflightErrors;

  const errorKey = (issues: PreflightIssue[]) =>
    JSON.stringify(issues.filter((issue) => issue.severity === 'error'));

  /** Contrast findings folded to the worse of the light/forced-dark pair per
   *  subject, the way issuesForField presents them beside the colour fields. */
  const themeWarnings = (): PreflightIssue[] =>
    worstPerSubject(themeIssues(theme)).map((issue) => ({
      id: `contrast-${issue.subject}`,
      severity: 'warn' as const,
      message: `${issue.subject} may be hard to read: ${issue.ratio}:1 against the background${
        issue.where === 'forced dark' ? ' once a client forces dark mode' : ''
      } — aim for ${issue.required}:1.`,
    }));

  /** One pass over the live document. Both the debounced effect and Send call
   *  this — Send must not trust state that can be half a second stale. */
  const computePreflight = (): { issues: PreflightIssue[]; bytes: number | null } => {
    if (!editor) return { issues: [], bytes: null };
    const json = editor.getJSON();
    // Fresh keys, not the previewKeys state — that only updates on entering
    // a rendered view, and the document may have changed since.
    const keys = collectDataKeys(json);
    const issues: PreflightIssue[] = [
      ...checkFields(subject, previewText),
      ...collectContentFindings(json),
      ...unresolvedVariables(keys, previewData.variables).map((key) => ({
        id: `variable-${key}`,
        severity: 'warn' as const,
        message: `The variable {{${key}}} has no preview value — a send would show the literal placeholder.`,
      })),
      ...themeWarnings(),
    ];

    // Size is read off the as-sent preview render — never the pretty HTML
    // source, which indentation inflates — and only while that render still
    // matches the document; stale bytes would grade an old email.
    const payload = hasKeys(keys) ? toPayload(previewData) : undefined;
    const fresh = previewHtml && previewSignature(payload) === renderedSignature.current;
    const bytes = fresh ? new TextEncoder().encode(previewHtml).length : null;
    if (bytes != null) {
      const sizeIssue = assessSize(bytes);
      if (sizeIssue) issues.push(sizeIssue);
    }
    return { issues, bytes };
  };

  /** Store only when the findings changed, so keystrokes don't re-render the
   *  sandbox for identical results. */
  const publishPreflight = (next: { issues: PreflightIssue[]; bytes: number | null }) => {
    const serialized = JSON.stringify([next.issues, next.bytes]);
    if (serialized === preflightSerialized.current) return;
    preflightSerialized.current = serialized;
    setPreflight(next);
    // A confirmation only covers the error set it was given.
    setArmedFor((current) =>
      current !== null && current !== errorKey(next.issues) ? null : current,
    );
  };

  /** The as-sent render the size check measures. Fires a render only when the
   *  HTML on hand no longer matches the current document. */
  const ensureSizeMeasured = () => {
    if (!editor) return;
    const keys = collectDataKeys(editor.getJSON());
    const payload = hasKeys(keys) ? toPayload(previewData) : undefined;
    const signature = previewSignature(payload);
    if (signature === renderedSignature.current && previewHtml) return;
    // No `enter`: the HTML refreshes without switching panes.
    renderPreview({ signature, payload, variant: 'preview' });
  };

  useEffect(() => {
    if (!editor) return;

    const compute = () => {
      const next = computePreflight();
      // No current measurement means the size check cannot run — an oversized
      // email with nothing else wrong would sail through. Ask for the render;
      // the debounce bounds the cost and the fresh HTML re-runs this effect.
      if (next.bytes == null) ensureSizeMeasured();
      publishPreflight(next);
    };

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(compute, 500);
    };

    // Same shape as autosave below: typing is heard through the editor's own
    // event so a keystroke does not re-render the component to be noticed.
    editor.on('update', schedule);
    schedule();

    return () => {
      editor.off('update', schedule);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, previewText, theme, previewData, editor, previewHtml]);

  // --- Unsaved work ---------------------------------------------------------
  // Kept in the browser rather than on the row: the public render API serves
  // that row, so autosaving into it would ship a half-finished email to
  // whoever asked for one next.
  const [draftFound, setDraftFound] = useState<Draft | null>(null);
  const hasUnsavedWork = useRef(false);
  const lastWritten = useRef('');
  /** The state as last saved. Null until the editor exists to be read. */
  const savedFingerprint = useRef<string | null>(null);

  /**
   * Only what Save persists counts as work worth warning about. From name and
   * Reply To belong to a test send, not to the template — they ride along in
   * the draft so restoring feels complete, but a template is not "unsaved"
   * because you typed a sender address into it.
   */
  const persistedFingerprint = () =>
    JSON.stringify([subject, previewText, editor?.getJSON() ?? null, theme]);

  // The baseline: whatever the row held when this editor opened.
  useEffect(() => {
    if (!editor) return;
    savedFingerprint.current = persistedFingerprint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, template?.id]);

  // Offer a draft that holds work the saved row does not; clear one that was
  // already published, so it cannot resurface months later.
  useEffect(() => {
    if (!template?.id) return;
    const draft = readDraft(template.id);
    if (!draft) return;
    if (isNewerThan(draft, template.updated_at)) setDraftFound(draft);
    else clearDraft(template.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  const restoreDraft = () => {
    if (!draftFound) return;
    setSubject(draftFound.subject);
    setPreviewText(draftFound.previewText);
    setFromName(draftFound.fromName);
    setReplyTo(draftFound.replyTo);
    setTheme(draftFound.theme as RendererThemeOptions);
    editor?.commands.setContent(draftFound.content as any);
    setDraftFound(null);
  };

  const discardDraft = () => {
    if (template?.id) clearDraft(template.id);
    setDraftFound(null);
  };

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
    // The row is now the newest copy of this work, so the draft has nothing
    // left to protect.
    if (template?.id) {
      clearDraft(template.id);
      setDraftFound(null);
      hasUnsavedWork.current = false;
      lastWritten.current = '';
      // The row now holds what is on screen, so that becomes the baseline the
      // next edit is measured against.
      savedFingerprint.current = persistedFingerprint();
    }
  };

  // Autosave: debounced, local only, and silent. It writes when something
  // actually changed, so an idle tab does nothing, and it never snapshots a
  // version — the cap is ten, and autosaves would flush every real save point
  // out of history within minutes.
  useEffect(() => {
    const id = template?.id;
    if (!id || !editor) return;

    const capture = () => {
      const fingerprint = persistedFingerprint();

      // The saved state is the baseline, not an empty string: comparing
      // against nothing marked every template dirty the moment it opened, so
      // leaving one you had only read warned you about work you never did.
      // A warning that always fires is a warning nobody reads.
      if (fingerprint === savedFingerprint.current) {
        hasUnsavedWork.current = false;
        lastWritten.current = '';
        clearDraft(id);
        return;
      }

      if (fingerprint === lastWritten.current) return;

      lastWritten.current = fingerprint;
      hasUnsavedWork.current = true;
      writeDraft(id, {
        subject,
        previewText,
        fromName,
        replyTo,
        content: editor.getJSON(),
        theme,
        savedAt: Date.now(),
      });
    };

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(capture, 1000);
    };

    // Typing is heard through the editor's own event rather than React state:
    // a state bump per keystroke would re-render this whole component for
    // nothing. Field edits re-run the effect, which schedules the same write.
    editor.on('update', schedule);
    schedule();

    return () => {
      editor.off('update', schedule);
      clearTimeout(timer);
    };
  }, [subject, previewText, fromName, replyTo, theme, editor, template?.id]);

  // Closing the tab is the one exit the draft cannot cover on its own, since
  // there is no return trip. In-app navigation needs no guard: the draft
  // survives it and the banner offers it back.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedWork.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const handleSend = async () => {
    if (!to) {
      toast.error('Add a To address before sending.');
      return;
    }
    // The gate reads the document directly, not the debounced findings — a
    // URL cleared half a second before the click must still count.
    const current = computePreflight();
    publishPreflight(current);
    const errors = errorKey(current.issues);
    // Never hard-blocked: with error-level findings the first click opens the
    // preflight panel and relabels the button; the second click sends anyway.
    if (errors !== '[]' && armedFor !== errors) {
      setArmedFor(errors);
      setPreflightExpanded(true);
      ensureSizeMeasured();
      return;
    }
    const json = editor?.getJSON();
    const keys = json ? collectDataKeys(json) : { conditions: [], variables: [] };
    const content = JSON.stringify(json);
    try {
      await httpPost('/api/v1/emails/send', {
        theme,
        previewText,
        subject,
        fromName,
        replyTo,
        to,
        content,
        // The typed preview data rides along, so a test send resolves
        // variables the way a real render would instead of showing {{name}}.
        payload: hasKeys(keys) ? toPayload(previewData) : undefined,
      });
      toast.success('Email sent.');
      setArmedFor(null);
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
      {/* A banner rather than a modal: the question is about the work on the
          screen behind it, so covering that up would be the wrong move. */}
      {draftFound && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent bg-accent-wash px-3.5 py-2.5">
          <p className="text-sm text-ink">
            <span className="font-medium">Unsaved changes</span> from{' '}
            {formatDraftAge(draftFound.savedAt)}. You left this template without
            saving.
          </p>
          <div className="flex items-center gap-2">
            <Button onClick={restoreDraft}>
              <RotateCcwIcon />
              Restore
            </Button>
            <Button variant="ghost" onClick={discardDraft}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar — every control in it needs a save button or a saved
          template, so on the anonymous playground it would render as an
          empty box. */}
      {(showSaveButton || template?.id) && (
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
              {/* "Send anyway" must be readable to mean anything, so the
                  armed label stays visible even where "Send" would hide. */}
              <span className={sendArmed ? undefined : 'hidden sm:inline'}>
                {sendArmed ? 'Send anyway' : 'Send'}
              </span>
            </Button>
          )}
        </div>
      </div>
      )}

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
                ({mode === 'preview' ? 'Preview' : mode === 'html' ? 'HTML' : 'Text'})
              </span>
            )}
          </h2>

          <div className="flex items-center gap-2">
            <ContentModeSwitch
              mode={mode}
              pending={pendingMode}
            onModeChange={changeMode}
            viewControls={
              mode === 'html' || mode === 'text' ? (
                <CopyHtmlButton html={mode === 'html' ? htmlSource : textSource} />
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

            {/* Not floating in a corner: the bottom right already carries
                toasts and, in development, Clerk's own badge. */}
            <EditorCheatsheet />
          </div>
        </header>

        <PreflightPanel
          issues={preflight.issues}
          bytes={preflight.bytes}
          expanded={preflightExpanded}
          onToggle={() => setPreflightExpanded((current) => !current)}
        />

        {/* The editor is hidden rather than unmounted: it holds the caret,
            the selection and the undo history, and previewing is a glance. */}
        {/* In dark mode the canvas is dimmed a touch to take the glare off —
            comfort only, the theme's colours still hold: recipients get them
            at full brightness, and so does the preview. */}
        <div
          ref={editorPaneRef}
          className={cn(mode !== 'edit' ? 'hidden' : paneClass, 'dark:brightness-90')}
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
          <ContentSource className={paneClass} minHeight={paneHeight} source={htmlSource} />
        )}

        {mode === 'text' && (
          <ContentSource className={paneClass} minHeight={paneHeight} source={textSource} wrap />
        )}
      </section>
    </div>
  );
}
