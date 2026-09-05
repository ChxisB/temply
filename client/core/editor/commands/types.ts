import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';

export type EditorCommand = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Shown as pressed. */
  isActive?: (editor: Editor) => boolean;
  /** Greyed out; the bar still shows it so the row does not jump. */
  isEnabled?: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};
