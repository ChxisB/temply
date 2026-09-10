import { BaseButton } from '@/editor/components/base-button';
import { cn } from '@/editor/utils/classname';
import { BubbleMenuItem } from './text-menu/text-bubble-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function BubbleMenuButton(item: BubbleMenuItem) {
  const { tooltip } = item;

  const content = (
    <BaseButton
      variant="ghost"
      size="sm"
      // An icon alone names nothing. The tooltip is the label on a desktop and
      // there is no hover at all on a phone, where these same buttons are what
      // the Style sheet is made of.
      {...(item.icon && tooltip ? { 'aria-label': tooltip } : {})}
      {...(item.command ? { onClick: item.command } : {})}
      data-state={item?.isActive?.()}
      className={cn(
        'mly:size-7! mly:px-2.5 mly:disabled:cursor-not-allowed',
        item?.className
      )}
      type="button"
      disabled={item.disbabled}
    >
      {item.icon ? (
        <item.icon
          className={cn(
            'mly:h-3 mly:w-3 mly:shrink-0 mly:stroke-[2.5]',
            item?.iconClassName
          )}
        />
      ) : (
        <span
          className={cn(
            'mly:text-sm mly:font-medium mly:text-slate-600',
            item?.nameClassName
          )}
        >
          {item.name}
        </span>
      )}
    </BaseButton>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
