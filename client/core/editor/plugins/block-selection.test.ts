import { describe, expect, it } from 'bun:test';
import '../test/dom';
import { makeEditor } from '../test/make-editor';
import { selectedBlock } from '../commands/block';
import { isEditingText } from './block-selection';

const doc = { type: 'doc', content: [
  { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
  { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
] };

/** Drives the plugin the way the view would: handleClickOn with the clicked node. */
function tap(editor: ReturnType<typeof makeEditor>, pos: number) {
  const { view } = editor;
  const $pos = view.state.doc.resolve(pos);
  const node = $pos.parent;
  const nodePos = $pos.before($pos.depth);
  return view.someProp('handleClickOn', (f) => f(view, pos, node, nodePos, new MouseEvent('click'), true));
}

describe('BlockSelection (touch)', () => {
  it('first tap selects the block, second tap on the same block enters text editing', () => {
    const editor = makeEditor(doc, { touch: true });
    expect(tap(editor, 7)).toBe(true);             // inside "two"
    expect(isEditingText(editor)).toBe(false);
    expect(selectedBlock(editor)!.node.textContent).toBe('two');
    // someProp never returns the literal `false` a plugin handler returns —
    // it only surfaces a truthy value or falls through to undefined — so
    // "not handled" reads as falsy here, same as the no-touch-extension case.
    expect(tap(editor, 7)).toBeFalsy();            // let ProseMirror place the caret
    editor.commands.setTextSelection(7);           // what the default handler does
    expect(isEditingText(editor)).toBe(true);
    editor.destroy();
  });

  it('a tap on a different block selects that block instead of editing', () => {
    const editor = makeEditor(doc, { touch: true });
    tap(editor, 7);
    expect(tap(editor, 2)).toBe(true);
    expect(selectedBlock(editor)!.node.textContent).toBe('one');
    expect(isEditingText(editor)).toBe(false);
    editor.destroy();
  });

  it('does nothing without the touch extension', () => {
    const editor = makeEditor(doc);
    expect(tap(editor, 7)).toBeFalsy();
    editor.destroy();
  });
});
