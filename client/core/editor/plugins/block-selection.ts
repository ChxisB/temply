import { Extension, type Editor } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { clearBlockSelection, selectBlockAt, selectedBlock } from '../commands/block';

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
    if (!(this.editor.state.selection instanceof NodeSelection)) return;
    clearBlockSelection(this.editor);
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
            // A selectable inline atom — a variable pill — is its own target:
            // it has controls of its own, and the walk below would land on
            // the paragraph around it.
            if (node.isInline && node.isAtom && node.type.spec.selectable !== false) {
              if (current === nodePos) return true;
              view.dispatch(state.tr.setSelection(NodeSelection.create(state.doc, nodePos)));
              return true;
            }
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

/** Whether this editor runs the touch selection model — the one place a node
 *  view can ask, since the `touch` prop stops at the extension list. */
export function isTouchEditor(editor: Editor): boolean {
  return editor.extensionManager.extensions.some((extension) => extension.name === BlockSelection.name);
}

export { clearBlockSelection, selectBlockAt, selectedBlock };
