import { BubbleMenu } from '@tiptap/react';
import { useCallback } from 'react';
import { sticky } from 'tippy.js';
import { getRenderContainer } from '../../utils/get-render-container';
import { EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { TooltipProvider } from '../ui/tooltip';
import { HTMLMenuContent } from './html-menu-content';

export function HTMLBubbleMenu(props: EditorBubbleMenuProps) {
  const { appendTo, editor } = props;
  if (!editor) {
    return null;
  }

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor!, 'htmlCodeBlock');
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0);

    return rect;
  }, [editor]);

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      return editor.isActive('htmlCodeBlock');
    },
    tippyOptions: {
      offset: [0, 8],
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      getReferenceClientRect,
      appendTo: () => appendTo?.current,
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: 'auto',
    },
    pluginKey: 'htmlCodeBlockBubbleMenu',
  };

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="mly:flex mly:items-stretch mly:rounded-lg mly:border mly:border-gray-200 mly:bg-panel mly:p-0.5 mly:shadow-md"
    >
      <TooltipProvider>
        <HTMLMenuContent editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  );
}
