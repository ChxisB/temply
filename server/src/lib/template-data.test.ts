import { describe, expect, test } from 'bun:test';
import { collectDataKeys } from '@temply/shared/template-data';

describe('collectDataKeys locations', () => {
  test('names the block a pill sits in and quotes its words', () => {
    const keys = collectDataKeys({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Hi ' }, { type: 'variable', attrs: { id: 'firstName' } }] },
        { type: 'button', attrs: { text: 'Accept invite', url: 'inviteUrl', isUrlVariable: true } },
      ],
    });
    expect(keys.where.firstName).toEqual({ kind: 'heading', text: 'Hi {{firstName}}' });
    expect(keys.where.inviteUrl).toEqual({ kind: 'button', text: 'Accept invite' });
    expect(keys.urlVariables).toEqual(['inviteUrl']);
  });
});

describe('collectDataKeys', () => {
  test('finds show-if keys at any depth', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'section', attrs: { showIfKey: 'isEU' }, content: [
          { type: 'paragraph', attrs: { showIfKey: 'hasDiscount' } },
        ] },
      ],
    };
    expect(collectDataKeys(doc).conditions).toEqual(['isEU', 'hasDiscount']);
  });

  test('lists each key once, in first-seen order', () => {
    const doc = {
      content: [
        { attrs: { showIfKey: 'b' } },
        { attrs: { showIfKey: 'a' } },
        { attrs: { showIfKey: 'b' } },
      ],
    };
    expect(collectDataKeys(doc).conditions).toEqual(['b', 'a']);
  });

  test('ignores unset, blank, and non-string keys', () => {
    const doc = {
      content: [
        { attrs: { showIfKey: null } },
        { attrs: { showIfKey: '   ' } },
        { attrs: { showIfKey: 42 } },
        { attrs: {} },
      ],
    };
    expect(collectDataKeys(doc).conditions).toEqual([]);
  });

  test('collects variable pills and variable-backed button fields', () => {
    const doc = {
      content: [
        { type: 'paragraph', content: [{ type: 'variable', attrs: { id: 'firstName' } }] },
        { type: 'button', attrs: { isTextVariable: true, text: 'ctaLabel', isUrlVariable: true, url: 'ctaUrl' } },
      ],
    };
    expect(collectDataKeys(doc).variables).toEqual(['firstName', 'ctaLabel', 'ctaUrl']);
  });

  test('a plain button contributes no variables', () => {
    const doc = { content: [{ type: 'button', attrs: { text: 'Get Started', url: 'https://x.dev' } }] };
    expect(collectDataKeys(doc).variables).toEqual([]);
  });

  test('a document with neither yields empty lists', () => {
    expect(collectDataKeys({ type: 'doc', content: [{ type: 'paragraph' }] })).toEqual({ conditions: [], variables: [], placeholders: {}, where: {}, urlVariables: [] });
  });

  test('survives malformed input', () => {
    expect(collectDataKeys(null)).toEqual({ conditions: [], variables: [], placeholders: {}, where: {}, urlVariables: [] });
    expect(collectDataKeys('nonsense')).toEqual({ conditions: [], variables: [], placeholders: {}, where: {}, urlVariables: [] });
  });
});
