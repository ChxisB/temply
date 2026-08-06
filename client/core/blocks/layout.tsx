import type { BlockItem } from './types';
import { DEFAULT_SPACER_HEIGHT } from '@/editor/nodes/spacer';
import {
  ColumnsIcon,
  Repeat2,
  MoveVertical,
  RectangleHorizontal,
  Minus,
} from 'lucide-react';

export const columns: BlockItem = {
  title: 'Columns',
  description: 'Add columns to email.',
  searchTerms: ['layout', 'columns'],
  icon: <ColumnsIcon className="mly:h-4 mly:w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor
      .chain()
      .focus()
      .deleteRange(range)
      // @ts-ignore
      .setColumns()
      .focus(editor.state.selection.head - 2)
      .run();
  },
};

export const section: BlockItem = {
  title: 'Section',
  description: 'Add a section to email.',
  searchTerms: ['layout', 'section'],
  icon: <RectangleHorizontal className="mly:h-4 mly:w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setSection().run();
  },
};

export const repeat: BlockItem = {
  title: 'Repeat',
  description: 'Loop over an array of items.',
  searchTerms: ['repeat', 'for', 'loop'],
  icon: <Repeat2 className="mly:h-4 mly:w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setRepeat().run();
  },
};

export const spacer: BlockItem = {
  title: 'Spacer',
  description: 'Add space between blocks.',
  searchTerms: ['space', 'gap', 'divider'],
  icon: <MoveVertical className="mly:h-4 mly:w-4" />,
  command: ({ editor, range }) => {
    // The attribute is a pixel count, not the toolbar's size name: passing
    // 'sm' put `height: smpx` in the stylesheet and collapsed the spacer.
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setSpacer({ height: DEFAULT_SPACER_HEIGHT })
      .run();
  },
};

export const divider: BlockItem = {
  title: 'Divider',
  description: 'Add a horizontal divider.',
  searchTerms: ['divider', 'line'],
  icon: <Minus className="mly:h-4 mly:w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setHorizontalRule().run();
  },
};
