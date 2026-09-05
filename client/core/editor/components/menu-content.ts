import type { Editor } from '@tiptap/core';
import type { ComponentType } from 'react';
import { TextBubbleContent } from './text-menu/text-bubble-content';
import { ImageMenuContent } from './image-menu/image-menu-content';
import { SpacerMenuContent } from './spacer-menu/spacer-menu-content';
import { SectionMenuContent } from './section-menu/section-menu-content';
import { ColumnsMenuContent } from './column-menu/columns-menu-content';
import { VariableMenuContent } from './variable-menu/variable-menu-content';
import { RepeatMenuContent } from './repeat-menu/repeat-menu-content';
import { HTMLMenuContent } from './html-menu/html-menu-content';
import { InlineImageMenuContent } from './inline-image-menu/inline-image-menu-content';

/** Which controls a block type has. The Style panel looks up the selected
 *  node's type here; the desktop bubble menus keep their own show/hide logic.
 *
 *  Button has no entry: its URL/style controls live in a Popover owned by
 *  ButtonView's node view (button-view.tsx), bound to that node instance's
 *  own `updateAttributes`/`getPos` rather than the editor-wide pattern every
 *  other menu here follows, so it cannot be lifted to a `{ editor }`-only
 *  component without also reworking the node view. Left for whoever wires
 *  the Style sheet to buttons. */
export const MENU_CONTENT: Record<string, ComponentType<{ editor: Editor }>> = {
  image: ImageMenuContent,
  logo: ImageMenuContent,
  spacer: SpacerMenuContent,
  section: SectionMenuContent,
  columns: ColumnsMenuContent,
  column: ColumnsMenuContent,
  variable: VariableMenuContent,
  repeat: RepeatMenuContent,
  htmlCodeBlock: HTMLMenuContent,
  inlineImage: InlineImageMenuContent,
  paragraph: TextBubbleContent,
  heading: TextBubbleContent,
  footer: TextBubbleContent,
};

export function menuContentFor(
  typeName: string
): ComponentType<{ editor: Editor }> | null {
  return MENU_CONTENT[typeName] ?? null;
}
