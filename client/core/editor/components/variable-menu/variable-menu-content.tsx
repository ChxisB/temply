import { Editor } from '@tiptap/core';
import { TextBubbleContent } from '../text-menu/text-bubble-content';

export function VariableMenuContent({ editor }: { editor: Editor }) {
  return <TextBubbleContent showListMenu={false} editor={editor} />;
}
