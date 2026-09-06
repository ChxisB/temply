import { afterEach, describe, expect, it } from 'bun:test';
import type { Editor } from '@tiptap/core';
import '../../core/editor/test/dom';
import { makeEditor } from '../../core/editor/test/make-editor';
import { insertVariableTrigger } from './text-format-bar';

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

describe('insertVariableTrigger', () => {
  it('puts a space before the trigger when the caret sits right after a variable pill', () => {
    const editor = editorFor({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'variable', attrs: { id: 'firstName', label: null } }] }],
    });
    // Immediately after the pill, nothing in between: the slot a leaf's empty
    // textBetween used to report as the start of a line.
    editor.commands.setTextSelection(editor.state.doc.child(0).nodeSize - 1);

    insertVariableTrigger(editor, CHAR);

    expect(spell(editor)).toBe(`{{firstName}} ${CHAR}`);
  });

  it('puts a space before the trigger when the caret is mid-word', () => {
    const editor = editorFor({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }] });
    editor.commands.setTextSelection(3); // after "Hi"

    insertVariableTrigger(editor, CHAR);

    expect(spell(editor)).toBe(`Hi ${CHAR}`);
  });

  it('adds no space at the start of a paragraph', () => {
    const editor = editorFor({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }] });
    editor.commands.setTextSelection(1); // before "Hi"

    insertVariableTrigger(editor, CHAR);

    expect(spell(editor)).toBe(`${CHAR}Hi`);
  });

  it('leaves a selected run in place and puts the trigger after it', () => {
    const editor = editorFor({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Try editing this' }] }],
    });
    editor.commands.setTextSelection({ from: 5, to: 12 }); // "editing"

    insertVariableTrigger(editor, CHAR);

    expect(spell(editor)).toBe(`Try editing ${CHAR} this`);
  });
});
