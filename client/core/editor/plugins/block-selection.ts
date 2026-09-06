import { Extension, type Editor } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey, Selection, TextSelection } from '@tiptap/pm/state';
import { selectBlockAt, selectedBlock } from '../commands/block';

export const blockSelectionKey = new PluginKey('blockSelection');

/** The format bar shows for a caret or text range inside a textblock; the
 *  action bar shows for a selected node. */
export function isEditingText(editor: Editor): boolean {
  const { selection } = editor.state;
  return selection instanceof TextSelection && selection.$from.parent.isTextblock;
}

/**
 * Touch selection model. A finger has no hover and a tap that lands in text
 * would otherwise raise the keyboard every time someone only wanted to move
 * a block. So: the first tap on a block selects it as a node (the action bar
 * appears, the keyboard does not); a second tap on the same block falls
 * through to ProseMirror, which places the caret and starts editing. A tap
 * on a different block selects that one. Leaf blocks (image, divider,
 * spacer, button) have nothing to edit inline, so every tap selects.
 */
export const BlockSelection = Extension.create({
  name: 'blockSelection',

  // A document that opens with a leaf block — a logo, an image — starts on
  // `Selection.atStart`, which is a NodeSelection. On a phone that draws the
  // block's selected outline while the bar is still on its idle face, so the
  // canvas claims a selection nothing acts on. Nothing is selected until a
  // finger says so.
  onCreate() {
    const { state, view } = this.editor;
    if (!(state.selection instanceof NodeSelection)) return;
    // `findFrom` with textOnly gives a caret in the first textblock; a
    // document with nothing to type into keeps the selection it has.
    const caret = Selection.findFrom(state.doc.resolve(0), 1, true);
    if (!caret) return;
    view.dispatch(state.tr.setSelection(caret).setMeta('addToHistory', false));
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: blockSelectionKey,
        props: {
          handleClickOn(view, pos, node, nodePos, _event, direct) {
            if (!direct) return false;
            const state = view.state;
            const current = state.selection instanceof NodeSelection ? state.selection.from : null;
            const $pos = state.doc.resolve(pos);
            // The block to select is the innermost textblock or leaf at the tap,
            // never a wrapper like a column or section.
            let depth = $pos.depth;
            while (depth > 0 && !$pos.node(depth).isTextblock && !$pos.node(depth).isAtom) depth--;
            const targetPos = depth === 0 ? nodePos : $pos.before(depth);
            const target = state.doc.nodeAt(targetPos) ?? node;

            if (current === targetPos && target.isTextblock) return false; // second tap: edit
            const tr = state.tr.setSelection(NodeSelection.create(state.doc, targetPos));
            view.dispatch(tr);
            return true;
          },
        },
      }),
    ];
  },
});

export { selectBlockAt, selectedBlock };
