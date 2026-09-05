import type { Editor } from '@tiptap/core';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, CodeIcon, ItalicIcon, ListIcon, ListOrderedIcon, RemoveFormattingIcon, StrikethroughIcon, UnderlineIcon } from 'lucide-react';
import { DEFAULT_TEXT_COLOR } from '../components/text-menu/use-text-menu-state';
import type { EditorCommand } from './types';

const mark = (id: string, label: string, icon: EditorCommand['icon'], name: string, toggle: (e: Editor) => boolean): EditorCommand => ({
  id, label, icon,
  isActive: (e) => e.isActive(name),
  run: (e) => { toggle(e); },
});

export const textCommands = {
  bold: mark('bold', 'Bold', BoldIcon, 'bold', (e) => e.chain().focus().toggleBold().run()),
  italic: mark('italic', 'Italic', ItalicIcon, 'italic', (e) => e.chain().focus().toggleItalic().run()),
  underline: mark('underline', 'Underline', UnderlineIcon, 'underline', (e) => e.chain().focus().toggleUnderline().run()),
  strike: mark('strike', 'Strikethrough', StrikethroughIcon, 'strike', (e) => e.chain().focus().toggleStrike().run()),
  code: mark('code', 'Code', CodeIcon, 'code', (e) => e.chain().focus().toggleCode().run()),
  bulletList: mark('bullet-list', 'Bullet list', ListIcon, 'bulletList', (e) => e.chain().focus().toggleBulletList().run()),
  orderedList: mark('ordered-list', 'Numbered list', ListOrderedIcon, 'orderedList', (e) => e.chain().focus().toggleOrderedList().run()),
  clearFormatting: { id: 'clear', label: 'Clear formatting', icon: RemoveFormattingIcon, run: (e) => { e.chain().focus().unsetAllMarks().clearNodes().run(); } },
} satisfies Record<string, EditorCommand>;

export const alignCommands: EditorCommand[] = (['left', 'center', 'right'] as const).map((side) => ({
  id: `align-${side}`,
  label: side === 'left' ? 'Align left' : side === 'center' ? 'Align centre' : 'Align right',
  icon: side === 'left' ? AlignLeftIcon : side === 'center' ? AlignCenterIcon : AlignRightIcon,
  isActive: (e) => e.isActive({ textAlign: side }),
  run: (e) => { e.chain().focus().setTextAlign(side).run(); },
}));

/** The three the format bar shows without opening the panel. */
export const PRIMARY_TEXT_COMMANDS: EditorCommand[] = [textCommands.bold, textCommands.italic, textCommands.underline];

export function currentTextColor(editor: Editor): string {
  return editor.getAttributes('textStyle').color || DEFAULT_TEXT_COLOR;
}

export function setTextColor(editor: Editor, hex: string): void {
  editor.chain().focus().setColor(hex).run();
}
