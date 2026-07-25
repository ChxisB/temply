import { type JSX } from 'react';
import type { Editor, Range } from '@tiptap/core';

export interface CommandProps {
  editor: Editor;
  range: Range;
}

export type BlockItem = {
  title: string;
  description?: string;
  searchTerms: string[];
  icon?: JSX.Element;
  render?: (editor: Editor) => JSX.Element | null | true;
  preview?: string | ((editor: Editor) => JSX.Element | null);
} & (
  | {
      command: (options: CommandProps) => void;
      id?: never;
      commands?: never;
    }
  | {
      id: string;
      commands: BlockItem[];
      command?: never;
    }
);

export type BlockGroupItem = {
  title: string;
  commands: BlockItem[];
};
