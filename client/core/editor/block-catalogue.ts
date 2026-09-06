import type { Editor } from '@tiptap/core';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import type { BlockItem } from '@/blocks/types';
import { DEFAULT_SLASH_COMMANDS } from './extensions/slash-command/default-slash-commands';

export type CatalogueGroup = {
  id: 'content' | 'layout' | 'logic' | 'components';
  title: string;
  items: BlockItem[];
};

/** The phone's grouping of the same blocks the slash menu offers. Titles
 *  are matched, not ids, because BlockItem has no stable id for leaves. */
export const CATALOGUE_GROUPS: Array<{ id: CatalogueGroup['id']; title: string; titles: string[] }> = [
  { id: 'content', title: 'Content', titles: ['Text', 'Heading 1', 'Heading 2', 'Heading 3', 'Bullet List', 'Numbered List', 'Image', 'Logo', 'Inline Image', 'Button', 'Link Card', 'Hard Break', 'Blockquote', 'Footer', 'Clear Line'] },
  { id: 'layout', title: 'Layout', titles: ['Columns', 'Section', 'Divider', 'Spacer'] },
  { id: 'logic', title: 'Logic', titles: ['Repeat', 'Custom HTML'] },
  { id: 'components', title: 'Components', titles: ['Headers', 'Footers'] },
];

export function blockCatalogue(): CatalogueGroup[] {
  const all = DEFAULT_SLASH_COMMANDS.flatMap((group) => group.commands);
  const seen = new Set<string>();
  const groups = CATALOGUE_GROUPS.map((group) => {
    const items = all.filter((item) => group.titles.includes(item.title) && !seen.has(item.title));
    for (const item of items) seen.add(item.title);
    return { id: group.id, title: group.title, items };
  });
  // Anything the lists above do not name still has to be reachable.
  const rest = all.filter((item) => !seen.has(item.title));
  if (rest.length > 0) groups[0].items.push(...rest);
  return groups;
}

/**
 * Runs a block's slash command at the current selection. The slash menu
 * passes the range of the typed "/query"; here there is none, so the range
 * is the empty range at the cursor and the command inserts in place.
 *
 * A selected block is an anchor, not a target: the `+` sheet is reached with
 * a block selected, and a command run at a NodeSelection would replace it.
 * An empty paragraph opened below the block gives the command a caret to
 * insert at, which is what every slash command expects.
 */
export function insertBlock(editor: Editor, item: BlockItem): void {
  if (!item.command) return;
  if (editor.state.selection instanceof NodeSelection) {
    const end = editor.state.selection.to;
    const tr = editor.state.tr.insert(end, editor.state.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, end + 1));
    editor.view.dispatch(tr);
  }
  const { from } = editor.state.selection;
  item.command({ editor, range: { from, to: from } });
}
