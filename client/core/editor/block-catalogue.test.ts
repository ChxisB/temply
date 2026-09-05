import { describe, expect, it } from 'bun:test';
import { blockCatalogue, CATALOGUE_GROUPS } from './block-catalogue';

describe('blockCatalogue', () => {
  it('sorts every slash command into one of the groups', () => {
    const groups = blockCatalogue();
    expect(groups.map((g) => g.id)).toEqual(CATALOGUE_GROUPS.map((g) => g.id));
    const titles = groups.flatMap((g) => g.items.map((i) => i.title));
    expect(titles).toContain('Text');
    expect(titles).toContain('Image');
    expect(titles).toContain('Columns');
    expect(titles).toContain('Repeat');
    // nothing is dropped and nothing is doubled
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('puts layout blocks under layout and logic blocks under logic', () => {
    const byId = Object.fromEntries(blockCatalogue().map((g) => [g.id, g.items.map((i) => i.title)]));
    expect(byId.layout).toEqual(expect.arrayContaining(['Columns', 'Section', 'Divider', 'Spacer']));
    expect(byId.logic).toEqual(expect.arrayContaining(['Repeat']));
    expect(byId.components).toEqual(expect.arrayContaining(['Headers', 'Footers']));
  });
});
