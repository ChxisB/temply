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
      // Every pill carries a placeholder and every destination is stood in
      // for, so an untouched starter raises no "no preview value" finding.
      expect(unresolvedVariables(collectDataKeys(starter.content), {})).toEqual([]);
    });
  }
});
