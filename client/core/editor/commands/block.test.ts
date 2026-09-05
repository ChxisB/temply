import { describe, expect, it } from 'bun:test';
import '../test/dom';
import { makeEditor } from '../test/make-editor';
import { deleteBlock, duplicateBlock, moveBlock, selectBlockAt, selectedBlock } from './block';

const para = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const doc = { type: 'doc', content: [para('one'), para('two'), para('three')] };
const texts = (editor: ReturnType<typeof makeEditor>) => editor.getJSON().content!.map((n) => n.content?.[0]?.text ?? '');

describe('block commands', () => {
  it('finds the top-level block around the cursor', () => {
    const editor = makeEditor(doc);
    editor.commands.setTextSelection(8); // inside "two"
    const block = selectedBlock(editor)!;
    expect(block.node.textContent).toBe('two');
    expect(block.depth).toBe(1);
    editor.destroy();
  });

  it('moves a block up and down and keeps it selected', () => {
    const editor = makeEditor(doc);
    editor.commands.setTextSelection(8);
    expect(moveBlock(editor, 'up')).toBe(true);
    expect(texts(editor)).toEqual(['two', 'one', 'three']);
    expect(selectedBlock(editor)!.node.textContent).toBe('two');
    expect(moveBlock(editor, 'down')).toBe(true);
    expect(moveBlock(editor, 'down')).toBe(true);
    expect(texts(editor)).toEqual(['one', 'three', 'two']);
    expect(moveBlock(editor, 'down')).toBe(false); // already last
    editor.destroy();
  });

  it('duplicates below and selects the copy', () => {
    const editor = makeEditor(doc);
    editor.commands.setTextSelection(8);
    expect(duplicateBlock(editor)).toBe(true);
    expect(texts(editor)).toEqual(['one', 'two', 'two', 'three']);
    expect(selectedBlock(editor)!.pos).toBeGreaterThan(5);
    editor.destroy();
  });

  it('deletes the block and selects its neighbour', () => {
    const editor = makeEditor(doc);
    editor.commands.setTextSelection(8);
    expect(deleteBlock(editor)).toBe(true);
    expect(texts(editor)).toEqual(['one', 'three']);
    expect(selectedBlock(editor)!.node.textContent).toBe('three');
    editor.destroy();
  });

  it('selects a block as a node selection by position', () => {
    const editor = makeEditor(doc);
    selectBlockAt(editor, 0);
    expect(editor.state.selection.constructor.name).toBe('NodeSelection');
    expect(selectedBlock(editor)!.node.textContent).toBe('one');
    editor.destroy();
  });
});
