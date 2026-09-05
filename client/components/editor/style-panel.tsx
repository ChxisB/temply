'use client';

import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { selectedBlock } from '~/core/editor/commands/block';
import { menuContentFor } from '~/core/editor/components/menu-content';
import { TooltipProvider } from '~/core/editor/components/ui/tooltip';
import { BottomSheet } from './bottom-sheet';

const LABELS: Record<string, string> = {
  image: 'Image',
  logo: 'Logo',
  spacer: 'Spacer',
  section: 'Section',
  columns: 'Columns',
  column: 'Column',
  variable: 'Variable',
  repeat: 'Repeat',
  htmlCodeBlock: 'HTML',
  inlineImage: 'Inline image',
  paragraph: 'Text',
  heading: 'Heading',
  footer: 'Footer',
  button: 'Button',
};

/** The selected block's controls — the same components the desktop bubble
 *  menu draws — in a sheet, with the canvas still visible above. */
export function StylePanel({ editor, open, onOpenChange }: { editor: Editor | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  // `editor` can still be null while the lazy editor is mounting; the hook
  // itself must run unconditionally, so the null case is threaded through
  // the selector rather than skipping the call.
  const typeName = useEditorState({
    editor,
    selector: ({ editor }) => (editor ? (selectedBlock(editor)?.node.type.name ?? null) : null),
  });
  const Content = typeName ? menuContentFor(typeName) : null;
  return (
    <BottomSheet open={open && !!Content} onOpenChange={onOpenChange} title={typeName ? (LABELS[typeName] ?? typeName) : 'Style'}>
      {/* The menu components use Radix Tooltip and normally get their provider
          from the desktop bubble-menu wrapper; the sheet is their only
          ancestor here, so it supplies one. */}
      <TooltipProvider>
        {/* The menu components carry the editor's own `mly:` styles and
            were laid out for a horizontal strip; the wrapper lets them wrap. */}
        <div className="mly-editor flex flex-wrap items-center gap-2 py-1 [&_button]:min-h-11">
          {Content && editor ? <Content editor={editor} /> : null}
        </div>
      </TooltipProvider>
    </BottomSheet>
  );
}
