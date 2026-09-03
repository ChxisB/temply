import { describe, expect, it } from 'bun:test';
import { checkFields, collectContentFindings } from '@temply/shared/preflight';
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
    });
  }
});
