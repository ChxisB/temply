import { findParentNode, type Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';

/**
 * Deletes the nearest `nodeType` the selection belongs to. `findParentNode`
 * only ever looks at ancestors, which is all a caret can be inside — but touch
 * selects a wrapper outright rather than putting a caret in it, and a node is
 * not its own parent. So the selection itself is tried first: without that,
 * Delete Columns from the phone found nothing and dispatched nothing.
 */
export function deleteNode(editor: Editor, nodeType: string) {
  const { state } = editor.view;
  const { selection } = state;
  const selected = selection instanceof NodeSelection && selection.node.type.name === nodeType ? selection.node : null;
  const target = selected
    ? { pos: selection.from, node: selected }
    : findParentNode((node) => node.type.name === nodeType)(selection);

  if (!target) {
    return;
  }

  const from = target.pos;
  const to = from + target.node.nodeSize;

  const { tr } = state;
  const transaction = tr.delete(from, to);
  editor.view.dispatch(transaction);
}
