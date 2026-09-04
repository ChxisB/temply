import { describe, expect, it } from 'bun:test';
import { checkFields, collectContentFindings, unresolvedVariables } from '@temply/shared/preflight';
import { collectDataKeys } from '@temply/shared/template-data';
import { personaliseStarter, SAMPLE_COMPANY, STARTER_TEMPLATES } from './starter-templates';

/**
 * A starter is the product's first impression. One that opens with a
 * preflight finding — a button with no destination, an empty subject — says
 * "rushed" before the user has typed a word.
 */
describe('personaliseStarter', () => {
  const welcome = STARTER_TEMPLATES.find((s) => s.id === 'welcome')!;

  it('puts the workspace name where the sample company was, everywhere text lives', () => {
    const mine = personaliseStarter(welcome, 'Acme Corp');
    expect(mine.subject).toBe('Welcome to Acme Corp');
    expect(JSON.stringify(mine.content)).not.toContain(SAMPLE_COMPANY);
    expect(JSON.stringify(mine.content)).toContain('Acme Corp');
    // The original is untouched.
    expect(welcome.subject).toBe(`Welcome to ${SAMPLE_COMPANY}`);
  });

  it('leaves the starter alone with no name to use', () => {
    expect(personaliseStarter(welcome, '')).toBe(welcome);
    expect(personaliseStarter(welcome, null)).toBe(welcome);
  });
});

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
