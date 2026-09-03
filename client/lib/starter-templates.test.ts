import { describe, expect, it } from 'bun:test';
import { checkFields, collectContentFindings, unresolvedVariables } from '@temply/shared/preflight';
import { collectDataKeys } from '@temply/shared/template-data';
import { STARTER_TEMPLATES } from './starter-templates';

/**
 * A starter is the product's first impression. One that opens with a
 * preflight finding — a button with no destination, an empty subject — says
 * "rushed" before the user has typed a word.
 */
describe('starter templates', () => {
  it('have unique ids', () => {
    const ids = STARTER_TEMPLATES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const starter of STARTER_TEMPLATES) {
    it(`${starter.name} opens clean`, () => {
      const findings = [
        ...checkFields(starter.subject, starter.previewText),
        ...collectContentFindings(starter.content),
      ].map((f) => f.message);
      expect(findings).toEqual([]);
      // Every pill carries a fallback, so the only "no preview value"
      // findings an untouched starter can raise are its button destinations
      // — a button has nowhere to hold a fallback, and a test send with no
      // URL typed is worth a word.
      const keys = collectDataKeys(starter.content);
      const buttonUrls = new Set<string>();
      const walk = (node: any) => {
        if (node?.type === 'button' && node.attrs?.isUrlVariable) buttonUrls.add(node.attrs.url);
        for (const child of node?.content ?? []) walk(child);
      };
      walk(starter.content);
      for (const key of unresolvedVariables(keys, {})) expect(buttonUrls.has(key)).toBe(true);
    });
  }
});
