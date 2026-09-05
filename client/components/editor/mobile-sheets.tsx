'use client';

import { useMemo, useState } from 'react';
import { BracesIcon, ChevronLeftIcon } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { ContentPreview } from '~/components/content-preview';
import { ContentSource } from '~/components/content-source';
import { PreflightPanel } from '~/components/preflight-panel';
import { PreviewDataPanel } from '~/components/preview-data-panel';
import { TemplateThemePanel } from '~/components/template-theme-panel';
import { EmptyState, lift } from '~/components/ui/surfaces';
import { blockCatalogue, insertBlock } from '~/core/editor/block-catalogue';
import type { BlockItem } from '@/blocks/types';
import { cn } from '~/lib/classname';
import { CopyHtmlButton, DownloadButton, fileSlug } from '../email-editor-sandbox';
import { BottomSheet } from './bottom-sheet';
import type { TemplateEditorModel } from './use-template-editor';

export type SheetId = 'details' | 'brand' | 'data' | 'checks' | 'eye' | 'add' | null;

const inputClass =
  'h-11 w-full rounded-md border border-line bg-raised px-3 text-base text-ink placeholder:text-faint';

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type={type}
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** A catalogue entry: icon over label, a thumb-sized target that lifts on
 *  touch the way every other tile in the app does — a tint here would say
 *  "row", not "tile". */
function CatalogueTile({ item, onPick }: { item: BlockItem; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-md border border-line bg-raised px-1 text-center text-xs text-ink',
        lift,
      )}
    >
      <span className="[&_svg]:size-5">{item.icon}</span>
      {item.title}
    </button>
  );
}

/**
 * The six bottom sheets that hold everything a phone editor cannot fit
 * beside the canvas. Each one is a thin shell around a panel the desktop
 * layout already owns — the phone changes where a control lives, never what
 * it does.
 */
export function MobileSheets({
  model,
  open,
  onClose,
  onSelectBlockAt,
}: {
  model: TemplateEditorModel;
  open: SheetId;
  onClose: () => void;
  onSelectBlockAt: (pos: number) => void;
}) {
  const [eyeTab, setEyeTab] = useState<'preview' | 'html' | 'text'>('preview');
  // Headers/Footers are a group, not a block: tapping one opens its own
  // commands in this same grid instead of inserting anything. Cleared
  // whenever the sheet closes so it always reopens at the top.
  const [sub, setSub] = useState<BlockItem | null>(null);
  // blockCatalogue() rescans the slash-command registry on every call.
  const groups = useMemo(() => blockCatalogue(), []);
  const close = (o: boolean) => {
    if (!o) onClose();
  };

  const pick = (item: BlockItem) => {
    if (item.commands) {
      setSub(item);
      return;
    }
    if (model.editor) insertBlock(model.editor, item);
    setSub(null);
    onClose();
  };

  return (
    <>
      <BottomSheet open={open === 'details'} onOpenChange={close} title="Email details">
        <div className="space-y-4 py-1">
          <Field id="m-subject" label="Subject" value={model.subject} onChange={model.setSubject} placeholder="Your email subject" />
          <Field id="m-from" label="From name" value={model.fromName} onChange={model.setFromName} placeholder="Your name or brand" />
          <Field id="m-to" label="To" value={model.to} onChange={model.setTo} placeholder="to@example.com" type="email" />
          <Field id="m-reply" label="Reply to" value={model.replyTo} onChange={model.setReplyTo} placeholder="replyto@example.com" type="email" />
          <Field id="m-preview" label="Preview text" value={model.previewText} onChange={model.setPreviewText} placeholder="Preview text shown in inbox…" />
        </div>
      </BottomSheet>

      <BottomSheet open={open === 'brand'} onOpenChange={close} title="Brand" height="full">
        <TemplateThemePanel theme={model.theme} onChange={model.setTheme} className="border-0 bg-transparent shadow-none" />
      </BottomSheet>

      <BottomSheet open={open === 'data'} onOpenChange={close} title="Sample data">
        {model.hasPreviewData ? (
          <PreviewDataPanel keys={model.previewKeys} data={model.previewData} onChange={model.setPreviewData} />
        ) : (
          <EmptyState
            icon={BracesIcon}
            title="No variables yet"
            description="Add a {{variable}} or a show-if condition to the email and its sample values appear here."
          />
        )}
      </BottomSheet>

      <BottomSheet open={open === 'checks'} onOpenChange={close} title="Checks">
        {model.preflight.issues.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Nothing to fix
            {model.preflight.bytes !== null
              ? ` — ~${Math.round(model.preflight.bytes / 1024)} KB of 102 KB.`
              : '.'}
          </p>
        ) : (
          <PreflightPanel
            issues={model.preflight.issues}
            bytes={model.preflight.bytes}
            expanded
            onToggle={() => {}}
            onSelect={(pos) => {
              onSelectBlockAt(pos);
              onClose();
            }}
          />
        )}
      </BottomSheet>

      <BottomSheet open={open === 'eye'} onOpenChange={close} title="Preview" showTitle={false} height="full">
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-2 border-b border-line bg-raised px-4 pb-2">
          <div role="tablist" aria-label="View" className="flex gap-1">
            {(['preview', 'html', 'text'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={eyeTab === tab}
                onClick={() => {
                  setEyeTab(tab);
                  model.changeMode(tab);
                }}
                className={cn(
                  'h-11 rounded-md px-3 text-sm font-medium transition-colors duration-fast ease-out motion-reduce:transition-none',
                  eyeTab === tab ? 'bg-accent-wash text-accent-ink' : 'text-muted hover:bg-hover hover:text-ink',
                )}
              >
                {tab === 'preview' ? 'Preview' : tab === 'html' ? 'HTML' : 'Text'}
              </button>
            ))}
          </div>
          {eyeTab !== 'preview' ? (
            <div className="flex items-center gap-1">
              <CopyHtmlButton html={eyeTab === 'html' ? model.htmlSource : model.textSource} />
              <DownloadButton
                content={eyeTab === 'html' ? model.htmlSource : model.textSource}
                filename={`${fileSlug(model.subject)}.${eyeTab === 'html' ? 'html' : 'txt'}`}
                mimeType={eyeTab === 'html' ? 'text/html' : 'text/plain'}
                label={eyeTab === 'html' ? 'Download HTML' : 'Download text'}
              />
            </div>
          ) : (
            <Button variant="ghost" size="sm" aria-pressed={model.forceDark} onClick={() => model.setForceDark((v) => !v)}>
              Forced dark
            </Button>
          )}
        </div>
        <div className="-mx-4">
          {eyeTab === 'preview' ? (
            <ContentPreview
              className="min-h-[60dvh]"
              html={model.previewHtml}
              isPending={model.isPreviewPending}
              forceDark={model.forceDark}
              subject={model.subject}
              previewText={model.previewText}
              from={model.fromName}
            />
          ) : (
            <ContentSource
              className="min-h-[60dvh]"
              source={eyeTab === 'html' ? model.htmlSource : model.textSource}
              wrap={eyeTab === 'text'}
            />
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        open={open === 'add'}
        onOpenChange={(o) => {
          if (!o) setSub(null);
          close(o);
        }}
        title={sub ? sub.title : 'Add a block'}
        height="full"
      >
        {sub ? (
          <div className="space-y-3 py-1">
            <button
              type="button"
              onClick={() => setSub(null)}
              className="-mx-1 flex min-h-11 items-center gap-1 px-1 text-sm font-medium text-muted transition-colors duration-fast ease-out hover:text-ink motion-reduce:transition-none"
            >
              <ChevronLeftIcon className="size-4" />
              Add a block
            </button>
            <div className="grid grid-cols-4 gap-2">
              {sub.commands?.map((item) => (
                <CatalogueTile key={item.title} item={item} onPick={() => pick(item)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-1">
            {groups.map((group) => (
              <section key={group.id}>
                <h3 className="mb-2 text-xs font-medium text-muted">{group.title}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {group.items.map((item) => (
                    <CatalogueTile key={item.title} item={item} onPick={() => pick(item)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
