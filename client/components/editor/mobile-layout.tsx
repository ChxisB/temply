'use client';

import type { FocusPosition } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  GlobeIcon,
  HistoryIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  SendIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import Link from 'next/link';
import { AssetPickerDialog } from '~/components/assets/asset-picker-dialog';
import { DeleteEmailDialog } from '~/components/delete-email-dialog';
import { EmailEditor } from '~/components/email-editor';
import { ShareLinkPopover } from '~/components/share-link-popover';
import { Badge } from '~/components/ui/surfaces';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { VersionHistoryDialog } from '~/components/version-history-dialog';
import { clearBlockSelection, selectBlockAt, selectedBlock } from '~/core/editor/commands/block';
import { EMAIL_TRANSFORM, isLibraryUrl, UPLOAD_MIME_TYPES, withTransform } from '~/lib/assets';
import { cn } from '~/lib/classname';
import { formatDraftAge, SaveStatus } from '../email-editor-sandbox';
import { bottomBarState, EditorBottomBar, type IdleTab } from './bottom-bar';
import { MobileSheets, type SheetId } from './mobile-sheets';
import { StylePanel } from './style-panel';
import { keepFocus } from './text-format-bar';
import type { TemplateEditorModel } from './use-template-editor';

/** The bars are thumb country: every control in them is a 44px target, which
 *  is taller than the desktop Button sizes go. */
const touchTarget = 'h-11 min-w-11';

/** Whatever actually scrolls around an element. The playground lets the window
 *  scroll, but `/templates/[id]` pins the page to the viewport and gives the
 *  scrolling to a div inside it — so asking the window to scroll there moves
 *  nothing at all. Falls back to the window, which is the scroller when no
 *  ancestor claims it. */
function scrollParent(el: HTMLElement | null): HTMLElement | Window {
  for (let node = el?.parentElement ?? null; node; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return window;
}

/**
 * The phone shell: the email fills the screen, everything else rises from
 * the bottom. Three fixed layers — top bar, canvas, bottom bar — and the
 * bottom bar changes face with the selection.
 */
export function MobileEditorLayout({
  model,
  autofocus,
  imageUploads,
}: {
  model: TemplateEditorModel;
  autofocus?: FocusPosition;
  imageUploads: boolean;
}) {
  const { editor, template } = model;
  const [sheet, setSheet] = useState<SheetId>(null);
  const [styleOpen, setStyleOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // The bar's face follows the selection; useEditorState re-renders on every
  // transaction, which is exactly when the face can change. panelOpen lives
  // here, not inside the bar, because the header's own Done/Publish switch
  // reads `state` too — both faces have to agree the Aa panel is still "text".
  const state = useEditorState({ editor, selector: ({ editor }) => bottomBarState(editor, panelOpen) }) ?? 'idle';

  // Aa takes the keyboard's place: opening it blurs the editor so the
  // keyboard drops, closing it gives focus back. The SelectionExtension
  // keeps the selection drawn while unfocused, so the panel's own commands
  // (colour, align, the link row) still land on it. Read `panelOpen` from
  // the render closure rather than a state updater — same rule as
  // `closeSheet` below: blur()/focus() dispatch a transaction, which
  // notifies useEditorState's subscribers synchronously, and React can run
  // an updater during another component's render.
  const togglePanel = () => {
    if (panelOpen) editor?.commands.focus();
    else editor?.commands.blur();
    setPanelOpen(!panelOpen);
  };

  // A stale panelOpen would reopen the panel the next time text is entered
  // for an unrelated reason (a fresh tap, Done). It only means anything
  // while the text face is up, so anything that leaves 'text' clears it.
  useEffect(() => {
    if (state !== 'text') setPanelOpen(false);
  }, [state]);

  // The keyboard (or the Aa panel opening, which grows the bar) can cover
  // the block being edited; once the text face is up — or the panel toggles
  // while it already is — bring the caret back above the bar. `panelOpen` is
  // in the deps because `state` alone stays 'text' across that toggle, but
  // the bar's height (and so its top edge) still changes underneath it.
  useEffect(() => {
    if (state !== 'text' || !editor) return;
    const id = window.setTimeout(() => {
      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      const bar = document.querySelector<HTMLElement>('[data-editor-bottom-bar]');
      const barTop = bar ? bar.getBoundingClientRect().top : window.innerHeight;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (coords.bottom > barTop - 24) {
        scrollParent(editor.view.dom).scrollBy({
          top: coords.bottom - (barTop - 24),
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      }
    }, 250); // after the keyboard (or the panel's own grid transition) has settled
    return () => window.clearTimeout(id);
  }, [state, panelOpen, editor]);

  // Arming is the whole explanation on desktop, where it expands the
  // preflight panel beside the button. Nothing on the phone reads
  // `preflightExpanded`, so the first Publish tap only relabelled a button
  // under the thumb and the first "Send test" tap closed the ⋯ menu and said
  // nothing at all. The sheet is the feedback — its badge already carries the
  // count, so no toast repeats it.
  useEffect(() => {
    if (model.publishArmed || model.sendArmed) setSheet('checks');
  }, [model.publishArmed, model.sendArmed]);

  const closeSheet = () => {
    // The eye sheet drives the model's mode; closing it has to put the
    // canvas back or the screen behind the sheet stays hidden. Read from
    // the render closure rather than a state updater: the updater is not
    // the place to change another component's state.
    if (sheet === 'eye') model.changeMode('edit');
    setSheet(null);
  };

  /** Done ends typing, not the selection: the bar drops back to the block
   *  face. A bare blur would leave a text selection behind and land on idle,
   *  so the block is re-selected after — after, because a NodeSelection
   *  dispatched while the editor still has focus would put the caret (and
   *  the keyboard) straight back. */
  const done = () => {
    if (!editor) return;
    const block = selectedBlock(editor);
    editor.commands.blur();
    if (block) selectBlockAt(editor, block.pos);
  };
  /** A tap on the canvas but outside the document means "nothing selected":
   *  the bar goes back to its tabs, which are otherwise unreachable once a
   *  block has been touched. ProseMirror never sees these taps — they land on
   *  the page margin around the card — so the shell answers them. */
  const clearOnCanvasTap = (event: React.MouseEvent) => {
    if (!editor || (event.target as HTMLElement).closest('.ProseMirror')) return;
    editor.commands.blur();
    clearBlockSelection(editor);
  };

  const openTab = (tab: IdleTab) => {
    // The keys are collected on the way into a rendered view, and the Data
    // sheet is not one — so they are re-read here, in the same event that
    // opens it. An effect inside the sheet is a render late, which flashed
    // "No variables yet" on a template that has them.
    if (tab === 'data') model.refreshPreviewKeys();
    setSheet(tab);
  };
  // Which of the bar's four tabs has its own sheet up — the other two sheet
  // ids ('eye', 'add') belong to triggers elsewhere and expand none of them.
  const idleTabOpen: IdleTab | null =
    sheet === 'details' || sheet === 'brand' || sheet === 'data' || sheet === 'checks' ? sheet : null;
  const errors = model.preflight.issues.filter((issue) => issue.severity === 'error').length;
  const warnings = model.preflight.issues.length - errors;

  // Phone autofocus would raise the keyboard on arrival; the canvas is the
  // first thing to see, not the first thing to type into.
  void autofocus;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-1 border-b border-line bg-raised px-2">
        {/* The playground has no template to go back to, and its visitor may
            not even be signed in — the link only belongs on a saved one. */}
        {template?.id ? (
          <Button variant="ghost" size="icon" asChild className={touchTarget} aria-label="Back to templates">
            <Link href="/dashboard/templates">
              <ArrowLeftIcon />
            </Link>
          </Button>
        ) : null}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={sheet === 'details'}
          onClick={() => setSheet('details')}
          className="min-w-0 flex-1 truncate px-1 text-left text-sm font-medium text-ink"
        >
          {model.subject || 'Untitled'}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className={touchTarget}
          aria-label="Preview"
          aria-haspopup="dialog"
          aria-expanded={sheet === 'eye'}
          onClick={() => setSheet('eye')}
        >
          <EyeIcon />
        </Button>
        {state === 'text' ? (
          // Same race the bar's own Aa/Link/Done buttons guard against: an
          // unprevented mousedown here would focus this button and blur the
          // ProseMirror before onClick runs, dropping `state` out of 'text'
          // (and this button with it) a beat before the click fires.
          <Button variant="primary" className="h-11 px-3" onMouseDown={keepFocus} onPointerDown={keepFocus} onClick={done}>
            Done
          </Button>
        ) : template?.id ? (
          <Button
            variant="primary"
            className="h-11 px-3"
            disabled={model.isPublishing || (!model.unpublished && model.publishedAt !== null && !model.publishArmed)}
            onClick={model.handlePublish}
          >
            {model.isPublishing ? <Loader2Icon className="animate-spin" /> : <GlobeIcon />}
            {model.publishArmed ? 'Publish anyway' : 'Publish'}
          </Button>
        ) : null}
        {template?.id ? (
          // Not modal: Share, History and Delete open their own layer from
          // inside this menu, and a modal menu would leave those layers
          // unclickable behind its pointer-event guard.
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={touchTarget} aria-label="More">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* The save status fades rather than unmounts, so with nothing
                  to report the row would open as an empty line above a rule. */}
              {model.unpublished || model.saveStatus !== 'idle' ? (
                <>
                  <DropdownMenuLabel>
                    <span className="flex items-center justify-between gap-2">
                      <SaveStatus status={model.saveStatus} onRetry={() => void model.autosave?.flush()} />
                      {model.unpublished ? <Badge tone="warn">Unpublished changes</Badge> : null}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              {template.short_code ? (
                <DropdownMenuItem
                  className={touchTarget}
                  onSelect={(event) => {
                    // The menu stays open so the tick that replaces the copy
                    // icon is seen; copying is not leaving the menu.
                    event.preventDefault();
                    void model.copyShortCode();
                  }}
                >
                  {model.shortCodeCopied ? <CheckIcon /> : <CopyIcon />}
                  <span className="font-mono text-xs">{template.short_code}</span>
                </DropdownMenuItem>
              ) : null}
              <ShareLinkPopover
                templateId={template.id}
                initialToken={template.share_token ?? null}
                trigger={
                  <DropdownMenuItem className={touchTarget} onSelect={(event) => event.preventDefault()}>
                    <Share2Icon />
                    Share link
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem className={touchTarget} onSelect={() => void model.handleSend()}>
                <SendIcon />
                {model.sendArmed ? 'Send anyway' : 'Send test'}
              </DropdownMenuItem>
              <VersionHistoryDialog
                templateId={template.id}
                hasUnpublishedChanges={model.unpublished}
                onDiscarded={model.handleDiscarded}
                trigger={
                  <DropdownMenuItem className={touchTarget} onSelect={(event) => event.preventDefault()}>
                    <HistoryIcon />
                    History
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuSeparator />
              <DeleteEmailDialog
                templateId={template.id}
                trigger={
                  <DropdownMenuItem
                    className={cn(touchTarget, 'text-danger-ink [&_svg]:text-danger-ink')}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      {model.draftFound ? (
        <div className="flex items-center justify-between gap-2 border-b border-accent bg-accent-wash px-3 py-2 text-sm text-ink">
          <span className="min-w-0">Unsaved changes from {formatDraftAge(model.draftFound.savedAt)}.</span>
          <span className="flex shrink-0 gap-1">
            <Button className="h-11 px-3" onClick={model.restoreDraft}>
              Restore
            </Button>
            <Button variant="ghost" className="h-11 px-3" onClick={model.discardDraft}>
              Discard
            </Button>
          </span>
        </div>
      ) : null}

      {/* The canvas. Padding at the bottom keeps the last block clear of the bar. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div ref={model.editorPaneRef} onClick={clearOnCanvasTap} className={cn('flex-1 pb-28', model.mode !== 'edit' && 'hidden')} style={model.pageStyle}>
        <div style={model.cardStyle}>
          <EmailEditor
            allowedMimeTypes={UPLOAD_MIME_TYPES}
            autofocus={false}
            defaultContent={model.editorContent}
            onImageUpload={imageUploads ? model.imageUploader : undefined}
            onPickImage={imageUploads ? model.pickFromLibrary : undefined}
            isLibraryImage={isLibraryUrl}
            setEditor={model.setEditor}
            touch
          />
        </div>
      </div>

      <EditorBottomBar
        editor={editor}
        state={state}
        checksCount={{ errors, warnings }}
        panelOpen={panelOpen}
        onTogglePanel={togglePanel}
        openTab={idleTabOpen}
        onOpenTab={openTab}
        addOpen={sheet === 'add'}
        onAdd={() => setSheet('add')}
        styleOpen={styleOpen}
        onStyle={() => setStyleOpen(true)}
      />
      <StylePanel editor={editor} open={styleOpen} onOpenChange={setStyleOpen} />
      <MobileSheets
        model={model}
        open={sheet}
        onClose={closeSheet}
        onSelectBlockAt={(pos) => {
          if (!editor) return;
          selectBlockAt(editor, pos);
          // The finding named a block the canvas may have scrolled past; the
          // selection outline is no answer if it is off screen.
          editor.commands.scrollIntoView();
        }}
      />

      {imageUploads && (
        <AssetPickerDialog
          open={model.pickerOpen}
          onOpenChange={(open) => {
            if (!open) model.settlePick(null);
          }}
          onPick={(asset) => model.settlePick(withTransform(asset.url, EMAIL_TRANSFORM))}
        />
      )}
    </div>
  );
}
