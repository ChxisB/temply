import { afterEach, describe, expect, it } from 'bun:test';
import type { Editor } from '@tiptap/core';
import '../../core/editor/test/dom';
import { makeEditor } from '../../core/editor/test/make-editor';
import { insertVariable } from './text-format-bar';

const CHAR = '@';

// Every editor a test builds, destroyed on the way out so nothing is left on
// the one happy-dom document the whole test process shares.
const editors: Editor[] = [];
const editorFor = (content: object) => {
  const editor = makeEditor(content as Parameters<typeof makeEditor>[0], { touch: true });
  editors.push(editor);
  return editor;
};
afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
});

/** The paragraph's content with the pill written out — textContent drops a
 *  leaf, which is exactly the character these tests are about. */
const spell = (editor: Editor) => {
  let out = '';
  editor.state.doc.child(0).forEach((node) => {
    out += node.type.name === 'variable' ? `{{${node.attrs.id}}}` : (node.text ?? '');
  });
  return out;
};

describe('insertVariable', () => {
  it('inserts the pill and leaves the caret after it, not inside it', () => {
    const editor = editorFor({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi ' }] }] });
    editor.commands.setTextSelection(4);

    expect(insertVariable(editor, 'first_name', '', CHAR)).toBe(true);

    expect(spell(editor)).toBe('Hi {{first_name}} ');
  });

  it('takes the name spelled the way the desktop list is typed', () => {
    const editor = editorFor({ type: 'doc', content: [{ type: 'paragraph' }] });

    insertVariable(editor, `  ${CHAR}company  `, '', CHAR);

    expect(spell(editor)).toBe('{{company}} ');
  });

  it('carries the placeholder onto the pill', () => {
    const editor = editorFor({ type: 'doc', content: [{ type: 'paragraph' }] });

    insertVariable(editor, 'first_name', 'there', CHAR);

    expect(editor.state.doc.child(0).child(0).attrs.fallback).toBe('there');
  });

  it('inserts nothing for a dismissed field', () => {
    const editor = editorFor({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }] });

    expect(insertVariable(editor, '   ', '', CHAR)).toBe(false);
    expect(insertVariable(editor, CHAR, '', CHAR)).toBe(false);

    expect(spell(editor)).toBe('Hi');
  });
});
