'use client';

import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { BracesIcon, LinkIcon, TypeIcon, Link2OffIcon } from 'lucide-react';
import { useState } from 'react';
import { alignCommands, currentTextColor, PRIMARY_TEXT_COMMANDS, setTextColor, textCommands } from '~/core/editor/commands/text';
import type { EditorCommand } from '~/core/editor/commands/types';
import { LinkInputPopover } from '~/core/editor/components/ui/link-input-popover';
import { DEFAULT_VARIABLE_TRIGGER_CHAR } from '~/core/editor/nodes/variable/variable';
import { useVariableOptions } from '~/core/editor/utils/node-options';
import { useTextMenuState } from '~/core/editor/components/text-menu/use-text-menu-state';
import { pressable } from '~/components/ui/button';
import { cn } from '~/lib/classname';

const SWATCHES = [
  { hex: '#111827', name: 'Black' },
  { hex: '#374151', name: 'Slate' },
  { hex: '#4f46e5', name: 'Indigo' },
  { hex: '#dc2626', name: 'Red' },
  { hex: '#059669', name: 'Green' },
  { hex: '#d97706', name: 'Amber' },
  { hex: '#ffffff', name: 'White' },
];

// Same trick the desktop bubble menu uses: a mousedown on a button would
// otherwise steal focus from the ProseMirror before onClick runs. For Bold
// and its neighbours that just drops the caret and the keyboard; for Aa,
// Link and the header's Done (in mobile-layout.tsx) —
// which mean to blur, deliberately, from inside their own handler — an
// unprevented mousedown blurs a tick earlier than that, which flips
// bottomBarState off 'text' before the click fires and can make the tap
// land on nothing. Either way the fix is the same: keep focus here, and let
// the click handler be the only thing that ever moves it.
export const keepFocus = (e: React.SyntheticEvent) => e.preventDefault();

/** Stands in for a leaf node when all we are asking is whether the slot before
 *  the caret holds a space. U+FFFC, the object replacement character. */
const LEAF_PLACEHOLDER = '\uFFFC';

/**
 * What the `{}` key does: put the character the variable suggestion listens
 * for at the caret, so the list opens.
 *
 * The suggestion only opens at the start of a word, so a space goes in ahead
 * of the character when the caret is mid-sentence — exactly what typing it
 * would need. Reading what is already there needs the placeholder: textBetween
 * returns '' for a leaf unless it is told what a leaf should read as, and a
 * variable pill is a leaf, so without it a caret sitting right after a pill
 * looks like the start of a line and loses the space.
 *
 * A selected run is what the variable goes next to, not instead of, so with a
 * range selected the insert happens at the end of it.
 */
export function insertVariableTrigger(editor: Editor, char: string): void {
  const { $from, $to, empty } = editor.state.selection;
  const at = empty ? $from : $to;
  const before =
    at.parentOffset > 0
      ? at.parent.textBetween(at.parentOffset - 1, at.parentOffset, undefined, LEAF_PLACEHOLDER)
      : ' ';
  const prefix = before && before !== ' ' ? ' ' : '';
  editor.chain().focus().setTextSelection(at.pos).insertContent(`${prefix}${char}`).run();
}

function Toggle({ editor, command }: { editor: Editor; command: EditorCommand }) {
  const active = useEditorState({ editor, selector: ({ editor }) => (command.isActive ? command.isActive(editor) : false) });
  return (
    <button
      type="button"
      aria-label={command.label}
      aria-pressed={active}
      title={command.label}
      onMouseDown={keepFocus}
      onPointerDown={keepFocus}
      onClick={() => command.run(editor)}
      className={cn('flex h-11 min-w-11 flex-1 items-center justify-center rounded-md hover:bg-hover', active ? 'bg-accent-wash text-accent-ink' : 'text-ink', pressable)}
    >
      <command.icon className="size-5" />
    </button>
  );
}

/**
 * The row above the keyboard: the three the thumb reaches for, link, a
 * variable, and Aa. Aa swaps the keyboard for the panel below (the row
 * stays), which is where colour, size, alignment and lists live — they
 * need room a single row cannot give. Done is not here: the top bar owns
 * it, and a second copy both duplicated the action and cost this row the
 * ~62px it needs to fit a 375px phone.
 */
export function TextFormatBar({
  editor,
  panelOpen,
  onTogglePanel,
}: {
  editor: Editor;
  panelOpen: boolean;
  onTogglePanel: () => void;
}) {
  const color = useEditorState({ editor, selector: ({ editor }) => currentTextColor(editor) });
  const { linkUrl, isUrlVariable } = useTextMenuState(editor);
  const [linkOpen, setLinkOpen] = useState(false);
  const variableChar = useVariableOptions(editor)?.suggestion?.char ?? DEFAULT_VARIABLE_TRIGGER_CHAR;
  const insertVariable = () => insertVariableTrigger(editor, variableChar);

  /** The same set the desktop bubble menu applies, minus the focus call: the
   *  destination is typed in the panel, and pulling focus back to the canvas
   *  there would throw the keyboard up over the answer. */
  const applyLink = (value: string, isVariable?: boolean) => {
    if (!value) {
      editor.chain().extendMarkRange('link').unsetLink().unsetUnderline().run();
      return;
    }
    editor
      .chain()
      .extendMarkRange('link')
      .setLink({ href: value })
      .setIsUrlVariable(isVariable ?? false)
      .setUnderline()
      .run();
  };

  // The link key is a shortcut to the panel's Link row: the row is where the
  // address is typed, and there is only one of it.
  const openLink = () => {
    if (!panelOpen) onTogglePanel();
    setLinkOpen(true);
  };

  return (
    <div>
      <div className="flex h-14 items-center gap-1 px-2">
        {PRIMARY_TEXT_COMMANDS.map((c) => (
          <Toggle key={c.id} editor={editor} command={c} />
        ))}
        <button
          type="button"
          aria-label="Link"
          aria-haspopup="dialog"
          aria-expanded={linkOpen}
          onMouseDown={keepFocus}
          onPointerDown={keepFocus}
          onClick={openLink}
          className={cn('flex h-11 min-w-11 flex-1 items-center justify-center rounded-md hover:bg-hover', linkUrl ? 'bg-accent-wash text-accent-ink' : 'text-ink', pressable)}
        >
          <LinkIcon className="size-5" />
        </button>
        <button type="button" aria-label="Insert variable" onMouseDown={keepFocus} onPointerDown={keepFocus} onClick={insertVariable} className={cn('flex h-11 min-w-11 flex-1 items-center justify-center rounded-md text-ink hover:bg-hover', pressable)}>
          <BracesIcon className="size-5" />
        </button>
        <button
          type="button"
          aria-label="More formatting"
          aria-expanded={panelOpen}
          // The panel opens by blurring the editor deliberately (see
          // onTogglePanel) — but that has to be the ONLY blur in play.
          // Without this, the browser's own mousedown default focuses this
          // button first, blurring the editor a tick before onClick runs;
          // bottomBarState then drops to 'idle' between the two, the text
          // face (this button included) goes pointer-events-none, and the
          // tap's click can land on nothing. Keeping focus here just defers
          // the blur to togglePanel's own call, in the same turn as
          // `panelOpen` flips.
          onMouseDown={keepFocus}
          onPointerDown={keepFocus}
          onClick={onTogglePanel}
          className={cn('flex h-11 min-w-14 items-center justify-center gap-1 rounded-md border border-line text-sm font-medium', panelOpen ? 'bg-accent-wash text-accent-ink' : 'text-ink', pressable)}
        >
          <TypeIcon className="size-4" />
          Aa
        </button>
      </div>
      {/* The panel replaces the keyboard: the editor is blurred when it opens,
          so the keyboard goes and this takes the space. */}
      <div className={cn('grid transition-[grid-template-rows] duration-base ease-out motion-reduce:transition-none', panelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')} inert={!panelOpen}>
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-line px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-muted">Colour</span>
              {/* Seven 44px targets and their gaps need 332px; the row has 294
                  at 390px, and less on a smaller phone. Wrapping keeps every
                  swatch at a thumb's size rather than clipping the last one. */}
              <div className="flex flex-1 flex-wrap gap-1">
                {SWATCHES.map(({ hex, name }) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={name}
                    aria-pressed={color.toLowerCase() === hex}
                    onMouseDown={keepFocus}
                    onPointerDown={keepFocus}
                    onClick={() => setTextColor(editor, hex)}
                    className={cn('flex h-11 min-w-11 flex-1 items-center justify-center rounded-md hover:bg-hover', pressable)}
                  >
                    <span
                      aria-hidden
                      className={cn('size-8 rounded-full border border-line', color.toLowerCase() === hex && 'ring-[3px] ring-accent/40')}
                      style={{ background: hex }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-muted">Link</span>
              {/* The editor's own link popover, so the destination can be a
                  {{variable}} here exactly as it can in the desktop bubble
                  menu — one field, one set of rules. */}
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <LinkInputPopover
                  editor={editor}
                  defaultValue={linkUrl ?? ''}
                  isVariable={isUrlVariable}
                  open={linkOpen}
                  onOpenChange={setLinkOpen}
                  onValueChange={applyLink}
                  triggerProps={{ 'aria-label': 'Link address', className: 'mly:h-11! mly:w-11!' }}
                />
                <span className={cn('min-w-0 flex-1 truncate text-xs', linkUrl ? 'text-ink' : 'text-faint')}>
                  {linkUrl ? (isUrlVariable ? `{{${linkUrl}}}` : linkUrl) : 'No link'}
                </span>
                {linkUrl ? (
                  <button
                    type="button"
                    aria-label="Remove link"
                    onClick={() => applyLink('')}
                    className={cn('flex h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink', pressable)}
                  >
                    <Link2OffIcon className="size-5" />
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-xs text-muted">Align</span>
              <div className="flex flex-1 gap-1">
                {alignCommands.map((c) => (
                  <Toggle key={c.id} editor={editor} command={c} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-xs text-muted">More</span>
              <div className="flex flex-1 gap-1">
                <Toggle editor={editor} command={textCommands.strike} />
                <Toggle editor={editor} command={textCommands.code} />
                <Toggle editor={editor} command={textCommands.bulletList} />
                <Toggle editor={editor} command={textCommands.orderedList} />
                <Toggle editor={editor} command={textCommands.clearFormatting} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
