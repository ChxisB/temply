import { describe, expect, it } from 'bun:test';
import { seedDrafts } from './input-dock';

describe('seedDrafts', () => {
  it('coerces a null value to an empty draft', () => {
    expect(seedDrafts([{ label: 'Link', value: null as unknown as string }])).toEqual(['']);
  });

  it('coerces an undefined value to an empty draft', () => {
    expect(seedDrafts([{ label: 'Link', value: undefined as unknown as string }])).toEqual(['']);
  });

  it('seeds nothing for an empty field list', () => {
    expect(seedDrafts([])).toEqual([]);
  });

  it('seeds every field in a multi-field list, in order', () => {
    expect(
      seedDrafts([
        { label: 'Name', value: 'first_name' },
        { label: 'Placeholder', value: null as unknown as string },
      ]),
    ).toEqual(['first_name', '']);
  });
});
