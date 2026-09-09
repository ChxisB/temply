'use client';

import type { FocusPosition } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  GlobeIcon,
  HistoryIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilLineIcon,
  SendIcon,
  Undo2Icon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import Link from 'next/link';
import { AssetPickerDialog } from '~/components/assets/asset-picker-dialog';
import { DeleteEmailDialog } from '~/components/delete-email-dialog';
import { EmailEditor } from '~/components/email-editor';
import { ShareLinkPopover } from '~/components/share-link-popover';
import { Badge } from '~/components/ui/surfaces';
import { Button, pressable } from '~/components/ui/button';
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
import { InputDockContext, type InputDock as InputDockApi, type InputDockSpec } from '~/core/editor/components/ui/input-dock';
import { EMAIL_TRANSFORM, isLibraryUrl, UPLOAD_MIME_TYPES, withTransform } from '~/lib/assets';
import { cn } from '~/lib/classname';
import { useVisualViewport } from '~/hooks/use-visual-viewport';
import { formatDraftAge, SaveStatus } from '../email-editor-sandbox';
import { bottomBarState, EditorBottomBar, type BottomBarState, type IdleTab } from './bottom-bar';
import { MobileSheets, type SheetId } from './mobile-sheets';
import { ShellFrameContext } from './shell-context';
import { StylePanel } from './style-panel';
import { keepFocus } from './text-format-bar';
import type { TemplateEditorModel } from './use-template-editor';

/** The bars are thumb country: every control in them is a 44px target, which
 *  is taller than the desktop Button sizes go. */
const touchTarget = 'h-11 min-w-11';

/** Whatever actually scrolls around an element — the shell's canvas, here,
 *  but found rather than assumed so the effect below survives a change of
 *  frame. Falls back to the window, the scroller when no ancestor claims it. */
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
  const frame = useVisualViewport();
  // The frame element itself, as state so the sheets (rendered into it) see
  // it once it exists rather than the null a ref holds on first render.
  const [frameEl, setFrameEl] = useState<HTMLElement | null>(null);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [styleOpen, setStyleOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // The input dock: a Link, Show-if or Alt-text control in a sheet hands its
  // field here, the sheet closes so the keyboard has nothing to cover, and
  // whichever sheet was open comes back when the field is done with.
  const [dock, setDock] = useState<InputDockSpec | null>(null);
  const resumeAfterDock = useRef<{ sheet: SheetId; styleOpen: boolean } | null>(null);
  const inputDock = useMemo<InputDockApi>(
    () => ({
      open: (spec) => {
        resumeAfterDock.current = { sheet, styleOpen };
        setSheet(null);
        setStyleOpen(false);
        setDock(spec);
      },
    }),
    [sheet, styleOpen],
  );
  const closeDock = () => {
    setDock(null);
    const resume = resumeAfterDock.current;
    resumeAfterDock.current = null;
    if (resume) {
      setSheet(resume.sheet);
      setStyleOpen(resume.styleOpen);
    }
  };

  // The bar's face follows the selection; useEditorState re-renders on every
  // transaction, which is exactly when the face can change. panelOpen lives
  // here, not inside the bar, because the header's own Done/Publish switch
  // reads `selectionState` too — both faces have to agree the Aa panel is
  // still "text". The field face is derived outside the selector: opening
  // the dock dispatches nothing to the editor, so a `dock` read inside
  // useEditorState would never fire a re-render. `state` folds the field
  // face in on top of `selectionState` and is what the bar itself renders;
  // everything that instead cares about the underlying selection — the
  // header, the keep-visible effect — reads `selectionState` directly, since
  // a field surface covering the bar does not change what is selected.
  const selectionState = useEditorState({ editor, selector: ({ editor }) => bottomBarState(editor, panelOpen) }) ?? 'idle';
  const state: BottomBarState = dock ? 'field' : selectionState;
  const canUndo = useEditorState({ editor, selector: ({ editor }) => editor?.can().undo() ?? false }) ?? false;

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
  // while the text face is up, so anything that leaves 'text' clears it —
  // reading the selection, not the bar's face, so opening a field surface
  // over a live text selection (the Link row does exactly this) does not
  // itself clear a panel the field surface is about to sit on top of.
  useEffect(() => {
    if (selectionState !== 'text') setPanelOpen(false);
  }, [selectionState]);

  // Whatever is selected stays in view. Several things cover the bottom of
  // the canvas — the keyboard (which shrinks the frame), the Aa panel, the
  // dock (a face of the bar, so the bar's own height already covers it),
  // the Style sheet — and each arrives after the selection was made, so the
  // canvas scrolls to keep the selected block (or the caret, while typing)
  // above whichever of them is lowest on screen. The sheet is read at its
  // laid-out position, not its mid-slide one. Runs a beat late so the
  // keyboard, the sheet and the panel's transition have settled; the frame
  // height is in the deps because that is what the keyboard changes.
  useEffect(() => {
    if (!editor) return;
    if (selectionState === 'idle' && !styleOpen && !dock) return;
    const keepVisible = () => {
      const scroller = scrollParent(editor.view.dom);
      if (!(scroller instanceof HTMLElement)) return;
      const frameRect = frameEl?.getBoundingClientRect();
      const inFrame = (el: HTMLElement | null) => (el && frameRect ? frameRect.top + el.offsetTop : null);
      const sheetEl = styleOpen ? frameEl?.querySelector<HTMLElement>('[role="dialog"]') ?? null : null;
      const bar = document.querySelector<HTMLElement>('[data-editor-bottom-bar]');
      const limit = inFrame(sheetEl) ?? (bar ? bar.getBoundingClientRect().top : window.innerHeight);
      const target = (() => {
        if (selectionState === 'text') {
          const coords = editor.view.coordsAtPos(editor.state.selection.from);
          return { top: coords.top, bottom: coords.bottom };
        }
        const block = selectedBlock(editor);
        const dom = block ? editor.view.nodeDOM(block.pos) : null;
        return dom instanceof HTMLElement ? dom.getBoundingClientRect() : null;
      })();
      if (!target) return;
      const margin = 16;
      const top = scroller.getBoundingClientRect().top + margin;
      const bottom = limit - margin;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const behavior = reduceMotion ? 'auto' : 'smooth';
      // Too tall for the room left: its top edge is what to show.
      if (target.top < top || target.bottom - target.top > bottom - top) {
        scroller.scrollBy({ top: target.top - top, behavior });
      } else if (target.bottom > bottom) {
        scroller.scrollBy({ top: target.bottom - bottom, behavior });
      }
    };
    // Twice: once after the keyboard and the slide have settled, and again
    // after a sheet whose controls wrap has finished growing into its rows.
    const ids = [250, 700].map((delay) => window.setTimeout(keepVisible, delay));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [selectionState, panelOpen, styleOpen, dock, frame?.height, editor, frameEl]);

  // Arming is the whole explanation on desktop, where it expands the
  // preflight panel beside the button. Nothing on the phone reads
  // `preflightExpanded`, so the first Publish tap only relabelled a button
  // under the thumb and the first "Send test" tap closed the ⋯ menu and said
  // nothing at all. The sheet is the feedback — its badge already carries the
  // count, so no toast repeats it.
  useEffect(() => {
    if (model.publishArmed || model.sendArmed) setSheet('checks');
  }, [model.publishArmed, model.sendArmed]);

  // Read-only under a sheet. Every menu control the Style sheet reuses ends
  // its command with focus(), which the desktop needs to keep its caret and
  // which here would raise the keyboard under the sheet; ProseMirror only
  // gives DOM focus to an editable view, so the flag is what stops it. The
  // commands themselves still dispatch.
  useEffect(() => {
    editor?.setEditable(!(sheet || styleOpen));
  }, [editor, sheet, styleOpen]);

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
   *  so the block is re-selected. The order reads backwards but is not:
   *  tiptap defers its blur to a rAF, so the NodeSelection dispatched on the
   *  next line lands first and the blur then arrives on top of it. */
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
  /** Half the screen: enough that the last block can sit above a sheet, the
   *  dock or the Aa panel, none of which the canvas can measure in advance. */
  const scrollTail = Math.max(96, Math.round((frame?.height ?? 0) * 0.55));
  const errors = model.preflight.issues.filter((issue) => issue.severity === 'error').length;
  const warnings = model.preflight.issues.length - errors;

  // Phone autofocus would raise the keyboard on arrival; the canvas is the
  // first thing to see, not the first thing to type into.
  void autofocus;

  return (
    <InputDockContext.Provider value={inputDock}>
    <ShellFrameContext.Provider value={frameEl}>
    {/* An app frame, not a page: the shell is fixed to the visual viewport —
    // the part of the screen the keyboard has not taken — and only the canvas
    // inside it scrolls. The bars are ordinary children, so there is nothing
    // to reposition when the keyboard opens or the page is scrolled under it;
    // a fixed bar that chased the keyboard with a measured inset painted in
    // one place and answered taps in another mid-scroll. Until the viewport
    // is measured the frame is the dynamic viewport height. `overflow-clip`,
    // not hidden: a hidden overflow can still be scrolled by script, and
    // ProseMirror scrolls every ancestor to keep the caret in view — which
    // walked the frame up by the keyboard's height a few pixels at a time,
    // with the bars bouncing on it and a bare strip left under them. */}
    <div
      ref={setFrameEl}
      className={cn('fixed inset-x-0 z-30 flex flex-col overflow-clip bg-surface', frame ? '' : 'top-0 h-dvh')}
      style={frame ? { top: frame.top, height: frame.height } : undefined}
    >
      <header className="z-40 flex h-14 shrink-0 items-center gap-1 border-b border-line bg-raised px-2">
        {/* The playground has no template to go back to, and its visitor may
            not even be signed in — the link only belongs on a saved one. */}
        {template?.id ? (
          <Button variant="ghost" size="icon" asChild className={touchTarget} aria-label="Back to templates">
            <Link href="/dashboard/templates">
              <ArrowLeftIcon />
            </Link>
          </Button>
        ) : null}
        {/* The subject is the way into the details sheet, and a pencil says
            so: a bare title reads as a label, not a control. */}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={sheet === 'details'}
          aria-label={`Edit details: ${model.subject || 'Untitled'}`}
          onClick={() => setSheet('details')}
          className={cn('flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 text-left text-sm font-medium text-ink hover:bg-hover', pressable)}
        >
          <span className="truncate">{model.subject || 'Untitled'}</span>
          <PencilLineIcon className="size-3.5 shrink-0 text-muted" aria-hidden />
        </button>
        {/* Undo without focusing: while typing the keyboard stays where it
            is (keepFocus), and from a block selection it must not come up. */}
        <Button
          variant="ghost"
          size="icon"
          className={touchTarget}
          aria-label="Undo"
          disabled={!canUndo}
          onMouseDown={keepFocus}
          onPointerDown={keepFocus}
          onClick={() => editor?.commands.undo()}
        >
          <Undo2Icon />
        </Button>
        {selectionState === 'text' ? (
          // Same race the bar's own Aa and Link buttons guard against: an
          // unprevented mousedown here would focus this button and blur the
          // ProseMirror before onClick runs, dropping `selectionState` out of
          // 'text' (and this button with it) a beat before the click fires.
          <Button variant="primary" className="h-11 px-3" onMouseDown={keepFocus} onPointerDown={keepFocus} onClick={done}>
            Done
          </Button>
        ) : (
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
              {template?.id && (model.unpublished || model.saveStatus !== 'idle') ? (
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
              <DropdownMenuItem className={touchTarget} onSelect={() => setSheet('eye')}>
                <EyeIcon />
                Preview
              </DropdownMenuItem>
              {template?.id ? (
                <>
                  <DropdownMenuItem
                    className={touchTarget}
                    disabled={model.isPublishing || (!model.unpublished && model.publishedAt !== null && !model.publishArmed)}
                    onSelect={model.handlePublish}
                  >
                    {model.isPublishing ? <Loader2Icon className="animate-spin" /> : <GlobeIcon />}
                    {model.publishArmed ? 'Publish anyway' : 'Publish'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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

      {/* The canvas: the frame's one scroller. `isolate` keeps the document's
          own stacking (a spacer is z-50 in the editor's CSS) inside it, so no
          block can sit over the bars and take their taps. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        ref={model.editorPaneRef}
        onClick={clearOnCanvasTap}
        className={cn('isolate min-h-0 flex-1 overflow-y-auto overscroll-contain', model.mode !== 'edit' && 'hidden')}
        style={model.pageStyle}
      >
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
        {/* Room to scroll the last block clear of whatever opens over it — a
            half sheet's worth. It is an element and not padding on the
            scroller because padding is a floor the box cannot shrink past:
            as a padding it stopped the canvas giving up its height when the
            Aa panel grew the bar, and the panel's last rows were then cut
            off by the frame's `overflow-clip`. Inside the scroller the same
            space costs the layout nothing. */}
        <div aria-hidden style={{ height: scrollTail }} />
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
        dock={dock}
        onCloseDock={closeDock}
      />
      <StylePanel editor={editor} open={styleOpen} onOpenChange={setStyleOpen} returnFocus={!dock} />
      <MobileSheets
        model={model}
        open={sheet}
        onClose={closeSheet}
        returnFocus={!dock}
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
    </ShellFrameContext.Provider>
    </InputDockContext.Provider>
  );
}
