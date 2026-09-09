import { describe, expect, it } from 'bun:test';
import '../../test/dom';
import { makeEditor } from '../../test/make-editor';
import { getVariableSuggestions } from './variable-suggestions';

const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }] };

describe('variable suggestions', () => {
  it('offers the list to a mouse editor and never to a touch one', () => {
    const { allow } = getVariableSuggestions();
    const mouse = makeEditor(doc);
    const touch = makeEditor(doc, { touch: true });

    const range = { from: 1, to: 2 };
    expect(allow!({ editor: mouse, state: mouse.state, range })).toBe(true);
    expect(allow!({ editor: touch, state: touch.state, range })).toBe(false);

    mouse.destroy();
    touch.destroy();
  });
});
