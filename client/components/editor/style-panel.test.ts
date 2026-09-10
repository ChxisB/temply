import { describe, expect, it } from 'bun:test';
import '../../core/editor/test/dom';
import { makeEditor } from '../../core/editor/test/make-editor';
import { selectBlockAt, selectedBlock } from '../../core/editor/commands/block';
import { followPosition } from './style-panel';

const doc = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'first' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'second' }] },
  ],
};

/** The Style sheet follows a position inside its block, so it can tell a
 *  control that deleted the block from one that only moved it. */
function insideSecondParagraph(editor: ReturnType<typeof makeEditor>): number {
  editor.commands.setTextSelection(9);
  const block = selectedBlock(editor)!;
  return block.pos + 1;
}

describe('followPosition', () => {
  it('keeps the position when nothing about the document changed', () => {
    const editor = makeEditor(doc, { touch: true });
    const pos = insideSecondParagraph(editor);
    selectBlockAt(editor, 0);
    // A selection-only transaction: the sheet stays on its block.
    expect(followPosition(pos, editor.state.tr)).toBe(pos);
    editor.destroy();
  });

  it('keeps the position through an edit that only moves the block', () => {
    const editor = makeEditor(doc, { touch: true });
    const pos = insideSecondParagraph(editor);
    const transaction = editor.state.tr.insertText('more ', 1);
    editor.view.dispatch(transaction);
    const next = followPosition(pos, transaction);
    expect(next).not.toBeNull();
    expect(next).toBe(pos + 5);
    editor.destroy();
  });

  it('keeps the position when the block is wrapped in a list', () => {
    // What the Style sheet's own list buttons do: the paragraph is still
    // there, one level deeper, and the sheet is still about it.
    const editor = makeEditor(doc, { touch: true });
    const pos = insideSecondParagraph(editor);
    let seen: number | null = pos;
    editor.on('transaction', ({ transaction }) => {
      if (seen !== null) seen = followPosition(seen, transaction);
    });
    editor.commands.toggleBulletList();
    expect(seen).not.toBeNull();
    editor.destroy();
  });

  it('loses the position when the block is deleted', () => {
    // What Delete inside a Section or Columns sheet does — and the case the
    // selection cannot report, since it falls back to a neighbour.
    const editor = makeEditor(doc, { touch: true });
    const pos = insideSecondParagraph(editor);
    const block = selectedBlock(editor)!;
    const transaction = editor.state.tr.delete(block.pos, block.pos + block.node.nodeSize);
    editor.view.dispatch(transaction);
    expect(followPosition(pos, transaction)).toBeNull();
    editor.destroy();
  });
});
