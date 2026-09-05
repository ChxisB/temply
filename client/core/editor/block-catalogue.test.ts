import { describe, expect, it } from 'bun:test';
import { blockCatalogue, CATALOGUE_GROUPS } from './block-catalogue';
import { DEFAULT_SLASH_COMMANDS } from './extensions/slash-command/default-slash-commands';

describe('blockCatalogue', () => {
  it('groups every slash command into exactly one group with exact title matching', () => {
    const groups = blockCatalogue();

    // Each group's items must exactly match its titles array (not just contain)
    for (const group of groups) {
      const catalogueGroup = CATALOGUE_GROUPS.find(g => g.id === group.id);
      const groupTitles = group.items.map(i => i.title);
      expect(groupTitles).toEqual(catalogueGroup?.titles ?? []);
    }
  });

  it('accounts for every slash command without duplication or silent fallback', () => {
    const groups = blockCatalogue();
    const allRealTitles = DEFAULT_SLASH_COMMANDS.flatMap(g => g.commands).map(item => item.title);
    const cataloguedTitles = groups.flatMap(g => g.items.map(i => i.title));

    // Every real command is catalogued, sorted to verify exact match
    expect(cataloguedTitles.sort()).toEqual(allRealTitles.sort());

    // No duplicates
    expect(cataloguedTitles.length).toBe(new Set(cataloguedTitles).size);
  });

  it('prevents title duplication across group definitions', () => {
    // No title should appear in more than one group's titles array
    const allTitles = CATALOGUE_GROUPS.flatMap(g => g.titles);
    expect(allTitles.length).toBe(new Set(allTitles).size);
  });

  it('puts layout blocks under layout and logic blocks under logic', () => {
    const byId = Object.fromEntries(blockCatalogue().map((g) => [g.id, g.items.map((i) => i.title)]));
    expect(byId.layout).toEqual(expect.arrayContaining(['Columns', 'Section', 'Divider', 'Spacer']));
    expect(byId.logic).toEqual(expect.arrayContaining(['Repeat']));
    expect(byId.components).toEqual(expect.arrayContaining(['Headers', 'Footers']));
  });
});
