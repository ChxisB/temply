import { describe, expect, it } from 'bun:test';
import '../test/dom';
import { makeEditor } from '../test/make-editor';
import { knownVariableNames } from './variable';

const withVariables = (...names: string[]) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: names.map((id) => ({ type: 'variable', attrs: { id } })) }],
});

describe('knownVariableNames', () => {
  it('offers the names the template already uses', () => {
    const editor = makeEditor(withVariables('first_name', 'company'), { touch: true });
    expect(knownVariableNames(editor, [], '', 'content-variable')).toEqual(['first_name', 'company']);
    editor.destroy();
  });

  it('narrows to what has been typed, anywhere in the name', () => {
    const editor = makeEditor(withVariables('first_name', 'company'), { touch: true });
    expect(knownVariableNames(editor, [], 'name', 'content-variable')).toContain('first_name');
    expect(knownVariableNames(editor, [], 'name', 'content-variable')).not.toContain('company');
    editor.destroy();
  });

  it('offers nothing from an empty template rather than throwing', () => {
    const editor = makeEditor({ type: 'doc', content: [{ type: 'paragraph' }] }, { touch: true });
    expect(knownVariableNames(editor, undefined, '', 'content-variable')).toEqual([]);
    editor.destroy();
  });

  it('lists a name once when the app offers it too', () => {
    const editor = makeEditor(withVariables('first_name'), { touch: true });
    const names = knownVariableNames(editor, [{ name: 'first_name' }], '', 'content-variable');
    expect(names.filter((n) => n === 'first_name')).toHaveLength(1);
    editor.destroy();
  });
});
