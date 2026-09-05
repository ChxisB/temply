import { BubbleMenu } from '@tiptap/react';
import { sticky } from 'tippy.js';
import { EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { TooltipProvider } from '../ui/tooltip';
import { VariableMenuContent } from './variable-menu-content';

export function VariableBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo } = props;
  if (!editor) {
    return null;
  }

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    pluginKey: 'variable-menu',
    shouldShow: ({ editor }) => {
      return editor.isActive('variable') && !editor.storage.variable?.popover;
    },
    tippyOptions: {
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: '100%',
      appendTo: () => appendTo?.current || 'parent',
      placement: 'top-start',
    },
  };

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="mly:flex mly:gap-0.5 mly:rounded-lg mly:border mly:border-slate-200 mly:bg-panel mly:p-0.5 mly:shadow-md"
    >
      <TooltipProvider>
        <VariableMenuContent editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  );
}
