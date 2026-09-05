import { describe, expect, it } from 'bun:test';
import '../../core/editor/test/dom';
import { makeEditor } from '../../core/editor/test/make-editor';
import { selectBlockAt } from '../../core/editor/commands/block';
import { bottomBarState } from './bottom-bar';

const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] };

describe('bottomBarState', () => {
  it('is idle with no editor', () => { expect(bottomBarState(null)).toBe('idle'); });
  it('is block for a node selection and text for a caret in text', () => {
    const editor = makeEditor(doc, { touch: true });
    selectBlockAt(editor, 0);
    expect(bottomBarState(editor)).toBe('block');
    editor.commands.setTextSelection(2);
    editor.view.focus();
    expect(bottomBarState(editor)).toBe('text');
    editor.destroy();
  });
});
