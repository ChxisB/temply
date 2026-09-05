import { isTextSelected } from '@/editor/utils/is-text-selected';
import { BubbleMenu, findChildren } from '@tiptap/react';
import { useCallback } from 'react';
import { sticky } from 'tippy.js';
import { getRenderContainer } from '../../utils/get-render-container';
import { EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { TooltipProvider } from '../ui/tooltip';
import { getClosestNodeByName } from '@/editor/utils/columns';
import { RepeatMenuContent } from './repeat-menu-content';

export function RepeatBubbleMenu(props: EditorBubbleMenuProps) {
  const { appendTo, editor } = props;
  if (!editor) {
    return null;
  }

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor!, 'repeat');
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0);

    return rect;
  }, [editor]);

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      const activeForNode = getClosestNodeByName(editor, 'repeat');
      const sectionNodeChildren = activeForNode
        ? findChildren(activeForNode?.node, (node) => {
            return node.type.name === 'section';
          })?.[0]
        : null;
      const hasActiveSectionNodeChildren =
        sectionNodeChildren && editor.isActive('section');

      if (
        isTextSelected(editor) ||
        hasActiveSectionNodeChildren ||
        !editor.isEditable
      ) {
        return false;
      }

      return editor.isActive('repeat');
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
    pluginKey: 'repeatBubbleMenu',
  };

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="mly:flex mly:items-stretch mly:rounded-lg mly:border mly:border-gray-200 mly:bg-panel mly:p-0.5 mly:shadow-md"
    >
      <TooltipProvider>
        <RepeatMenuContent editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  );
}
