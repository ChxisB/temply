'use client';

import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { SlidersHorizontalIcon } from 'lucide-react';
import { blockCommands, selectedBlock } from '~/core/editor/commands/block';
import type { EditorCommand } from '~/core/editor/commands/types';
import { menuContentFor } from '~/core/editor/components/menu-content';
import { pressable } from '~/components/ui/button';
import { cn } from '~/lib/classname';

function BarButton({ editor, command }: { editor: Editor; command: EditorCommand }) {
  const enabled = command.isEnabled ? command.isEnabled(editor) : true;
  return (
    <button
      type="button"
      aria-label={command.label}
      title={command.label}
      disabled={!enabled}
      onClick={() => command.run(editor)}
      className={cn('flex h-11 min-w-11 flex-1 items-center justify-center rounded-md text-ink hover:bg-hover disabled:opacity-45', pressable)}
    >
      <command.icon className="size-5" />
    </button>
  );
}

/** Up, down, Style, duplicate, delete for the selected block. Style only
 *  shows for block types that have settings. */
export function BlockActionBar({ editor, onStyle }: { editor: Editor; onStyle: () => void }) {
  const typeName = useEditorState({ editor, selector: ({ editor }) => selectedBlock(editor)?.node.type.name ?? null });
  const hasStyle = typeName ? menuContentFor(typeName) !== null : false;
  return (
    <div className="flex h-14 items-center gap-1 px-2">
      <BarButton editor={editor} command={blockCommands.moveUp} />
      <BarButton editor={editor} command={blockCommands.moveDown} />
      {hasStyle ? (
        <button
          type="button"
          onClick={onStyle}
          className={cn('flex h-11 flex-[2] items-center justify-center gap-1.5 rounded-md text-sm font-medium text-ink hover:bg-hover', pressable)}
        >
          <SlidersHorizontalIcon className="size-5" />
          Style
        </button>
      ) : null}
      <BarButton editor={editor} command={blockCommands.duplicate} />
      <BarButton editor={editor} command={blockCommands.remove} />
    </div>
  );
}
