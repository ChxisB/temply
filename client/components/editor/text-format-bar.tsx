'use client';

import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { BracesIcon, LinkIcon, TypeIcon } from 'lucide-react';
import { alignCommands, currentTextColor, PRIMARY_TEXT_COMMANDS, setTextColor, textCommands } from '~/core/editor/commands/text';
import type { EditorCommand } from '~/core/editor/commands/types';
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

function Toggle({ editor, command }: { editor: Editor; command: EditorCommand }) {
  const active = useEditorState({ editor, selector: ({ editor }) => (command.isActive ? command.isActive(editor) : false) });
  return (
    <button
      type="button"
      aria-label={command.label}
      aria-pressed={active}
      title={command.label}
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
 * need room a single row cannot give.
 */
export function TextFormatBar({
  editor,
  panelOpen,
  onTogglePanel,
  onDone,
}: {
  editor: Editor;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onDone: () => void;
}) {
  const color = useEditorState({ editor, selector: ({ editor }) => currentTextColor(editor) });
  const insertVariable = () => {
    editor.chain().focus().insertContent('{{').run(); // the variable suggestion opens on "{{"
  };
  const setLink = () => {
    const href = window.prompt('Link address'); // replaced by LinkInputPopover in Task 13; the row keeps a one-tap path
    if (href) editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div>
      <div className="flex h-14 items-center gap-1 px-2">
        {PRIMARY_TEXT_COMMANDS.map((c) => (
          <Toggle key={c.id} editor={editor} command={c} />
        ))}
        <button type="button" aria-label="Link" onClick={setLink} className={cn('flex h-11 min-w-11 flex-1 items-center justify-center rounded-md text-ink hover:bg-hover', pressable)}>
          <LinkIcon className="size-5" />
        </button>
        <button type="button" aria-label="Insert variable" onClick={insertVariable} className={cn('flex h-11 min-w-11 flex-1 items-center justify-center rounded-md text-ink hover:bg-hover', pressable)}>
          <BracesIcon className="size-5" />
        </button>
        <button
          type="button"
          aria-label="More formatting"
          aria-expanded={panelOpen}
          onClick={onTogglePanel}
          className={cn('flex h-11 min-w-14 items-center justify-center gap-1 rounded-md border border-line text-sm font-medium', panelOpen ? 'bg-accent-wash text-accent-ink' : 'text-ink', pressable)}
        >
          <TypeIcon className="size-4" />
          Aa
        </button>
        <button type="button" onClick={onDone} className={cn('h-11 rounded-md px-3 text-sm font-medium text-accent-ink', pressable)}>
          Done
        </button>
      </div>
      {/* The panel replaces the keyboard: the editor is blurred when it opens,
          so the keyboard goes and this takes the space. */}
      <div className={cn('grid transition-[grid-template-rows] duration-base ease-out motion-reduce:transition-none', panelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')} aria-hidden={!panelOpen}>
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-line px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="w-16 text-xs text-muted">Colour</span>
              <div className="flex flex-1 gap-1">
                {SWATCHES.map(({ hex, name }) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={name}
                    aria-pressed={color.toLowerCase() === hex}
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
