import type { Editor } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, Trash2Icon } from 'lucide-react';
import type { EditorCommand } from './types';

/**
 * The block the phone's action bar acts on: the innermost textblock or leaf
 * block containing the cursor. Inside a column or a section the inner block
 * is what the person tapped, never the wrapping column/section/columns/
 * repeat node, so the walk starts at the deepest resolved depth (which is
 * already the block that directly holds the cursor's inline content) and
 * only climbs past a node that is itself not block-level content. For a
 * NodeSelection the selected node is already the answer.
 */
export function selectedBlock(editor: Editor): { node: Node; pos: number; depth: number } | null {
  const { selection, doc } = editor.state;
  if (selection instanceof NodeSelection) {
    return { node: selection.node, pos: selection.from, depth: selection.$from.depth + 1 };
  }
  const $from = selection.$from;
  for (let depth = $from.depth; depth >= 1; depth--) {
    const node = $from.node(depth);
    if (node.isTextblock || node.isLeaf) return { node, pos: $from.before(depth), depth };
  }
  const first = doc.firstChild;
  return first ? { node: first, pos: 0, depth: 1 } : null;
}

export function selectBlockAt(editor: Editor, pos: number): void {
  const tr = editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos));
  editor.view.dispatch(tr);
}

/** Swaps the block with its sibling in the same parent. False at an edge — nothing dispatched. */
export function moveBlock(editor: Editor, direction: 'up' | 'down'): boolean {
  const block = selectedBlock(editor);
  if (!block) return false;
  const $pos = editor.state.doc.resolve(block.pos);
  const parent = $pos.parent;
  const index = $pos.index();
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= parent.childCount) return false;

  const sibling = parent.child(targetIndex);
  const tr = editor.state.tr;
  tr.delete(block.pos, block.pos + block.node.nodeSize);
  const insertPos = direction === 'up' ? block.pos - sibling.nodeSize : block.pos + sibling.nodeSize;
  tr.insert(insertPos, block.node);
  tr.setSelection(NodeSelection.create(tr.doc, insertPos));
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

export function duplicateBlock(editor: Editor): boolean {
  const block = selectedBlock(editor);
  if (!block) return false;
  const after = block.pos + block.node.nodeSize;
  const tr = editor.state.tr.insert(after, block.node.copy(block.node.content));
  tr.setSelection(NodeSelection.create(tr.doc, after));
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

export function deleteBlock(editor: Editor): boolean {
  const block = selectedBlock(editor);
  if (!block) return false;
  const tr = editor.state.tr.delete(block.pos, block.pos + block.node.nodeSize);
  // Something must stay selected — the action bar has nothing to act on
  // otherwise. Prefer the block that slid into the deleted one's place,
  // fall back to the block before it, and only fall back to a text cursor
  // when the document is now empty of blocks to select.
  const doc = tr.doc;
  const $at = doc.resolve(Math.min(block.pos, doc.content.size));
  const next = $at.nodeAfter;
  if (next && next.isBlock) {
    tr.setSelection(NodeSelection.create(doc, block.pos));
  } else {
    const before = $at.nodeBefore;
    if (before) tr.setSelection(NodeSelection.create(doc, block.pos - before.nodeSize));
    else tr.setSelection(TextSelection.atStart(doc));
  }
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

function siblingIndex(editor: Editor, pos: number): { index: number; count: number } | null {
  const $pos = editor.state.doc.resolve(pos);
  return { index: $pos.index(), count: $pos.parent.childCount };
}

export const blockCommands = {
  moveUp: {
    id: 'move-up',
    label: 'Move up',
    icon: ArrowUpIcon,
    isEnabled: (editor: Editor) => {
      const block = selectedBlock(editor);
      if (!block) return false;
      const sibling = siblingIndex(editor, block.pos);
      return !!sibling && sibling.index > 0;
    },
    run: (editor: Editor) => {
      moveBlock(editor, 'up');
    },
  },
  moveDown: {
    id: 'move-down',
    label: 'Move down',
    icon: ArrowDownIcon,
    isEnabled: (editor: Editor) => {
      const block = selectedBlock(editor);
      if (!block) return false;
      const sibling = siblingIndex(editor, block.pos);
      return !!sibling && sibling.index < sibling.count - 1;
    },
    run: (editor: Editor) => {
      moveBlock(editor, 'down');
    },
  },
  duplicate: {
    id: 'duplicate',
    label: 'Duplicate',
    icon: CopyIcon,
    run: (editor: Editor) => {
      duplicateBlock(editor);
    },
  },
  remove: {
    id: 'delete',
    label: 'Delete',
    icon: Trash2Icon,
    run: (editor: Editor) => {
      deleteBlock(editor);
    },
  },
} satisfies Record<string, EditorCommand>;
