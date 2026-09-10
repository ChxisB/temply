import { describe, expect, it } from 'bun:test';
import { seedDrafts } from './input-dock';

describe('seedDrafts', () => {
  it('coerces a null value to an empty draft', () => {
    expect(seedDrafts([{ key: 'url', label: 'Link', value: null as unknown as string }])).toEqual({ url: '' });
  });

  it('coerces an undefined value to an empty draft', () => {
    expect(seedDrafts([{ key: 'url', label: 'Link', value: undefined as unknown as string }])).toEqual({ url: '' });
  });

  it('seeds nothing for an empty field list', () => {
    expect(seedDrafts([])).toEqual({});
  });

  it('seeds every field in a multi-field list, under its own key', () => {
    expect(
      seedDrafts([
        { key: 'name', label: 'Name', value: 'first_name' },
        { key: 'placeholder', label: 'Placeholder', value: null as unknown as string },
      ]),
    ).toEqual({ name: 'first_name', placeholder: '' });
  });

  it('leaves out a field the spec did not ask for, so a commit can tell it from an empty one', () => {
    expect(seedDrafts([{ key: 'name', label: 'Name', value: 'first_name' }])).not.toHaveProperty('placeholder');
  });
});
