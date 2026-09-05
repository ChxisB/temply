import { describe, expect, it } from 'bun:test';
import '../../core/editor/test/dom';
import { makeEditor } from '../../core/editor/test/make-editor';
import { selectBlockAt } from '../../core/editor/commands/block';
import { bottomBarState } from './bottom-bar';

const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] };

describe('bottomBarState', () => {
  it('is idle with no editor', () => { expect(bottomBarState(null, false)).toBe('idle'); });
  it('is block for a node selection and text for a caret in text', () => {
    const editor = makeEditor(doc, { touch: true });
    selectBlockAt(editor, 0);
    expect(bottomBarState(editor, false)).toBe('block');
    editor.commands.setTextSelection(2);
    editor.view.focus();
    expect(bottomBarState(editor, false)).toBe('text');
    editor.destroy();
  });
  it('stays text when the panel is open even though the editor is not focused', () => {
    // Aa opens by blurring the editor (the keyboard drops); the panel's own
    // commands still need the text face, which is what panelOpen keeps up.
    const editor = makeEditor(doc, { touch: true });
    editor.commands.setTextSelection(2);
    expect(editor.isFocused).toBe(false);
    expect(bottomBarState(editor, false)).toBe('idle');
    expect(bottomBarState(editor, true)).toBe('text');
    editor.destroy();
  });
});
