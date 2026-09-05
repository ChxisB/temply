import { describe, expect, it } from 'bun:test';
import '../test/dom';
import { makeEditor } from '../test/make-editor';
import { currentTextColor, setTextColor, textCommands } from './text';

describe('text commands', () => {
  it('toggles bold on the selection and reports it active', () => {
    const editor = makeEditor({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] });
    editor.commands.setTextSelection({ from: 1, to: 6 });
    expect(textCommands.bold.isActive!(editor)).toBe(false);
    textCommands.bold.run(editor);
    expect(textCommands.bold.isActive!(editor)).toBe(true);
    expect(editor.getHTML()).toContain('<strong>');
    editor.destroy();
  });

  it('sets and reads the text colour', () => {
    const editor = makeEditor({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] });
    editor.commands.setTextSelection({ from: 1, to: 6 });
    setTextColor(editor, '#dc2626');
    expect(currentTextColor(editor).toLowerCase()).toBe('#dc2626');
    editor.destroy();
  });
});
