import { Link, LinkIcon, LucideIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { BaseButton } from '../base-button';
import { useRef, useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';
import { DEFAULT_PLACEHOLDER_URL, useMailyContext } from '@/editor/provider';
import { InputAutocomplete } from './input-autocomplete';
import { processVariables } from '@/editor/utils/variable';
import { useMemo } from 'react';
import { Editor } from '@tiptap/core';
import { useVariableOptions } from '@/editor/utils/node-options';
import { DEFAULT_VARIABLE_TRIGGER_CHAR } from '@/editor/nodes/variable/variable';
import {
  imageUrlMessage,
  useImageUrlStatus,
} from '@/editor/utils/use-image-url-status';

type LinkInputPopoverProps = {
  defaultValue?: string;
  isVariable?: boolean;
  onValueChange?: (value: string, isVariable?: boolean) => void;

  icon?: LucideIcon;
  tooltip?: string;
  /** When set, the popover reports whether the pasted URL is a reachable
   *  image. Used for the image source, not for arbitrary links. */
  showImageStatus?: boolean;

  editor: Editor;
};

export function LinkInputPopover(props: LinkInputPopoverProps) {
  const {
    defaultValue = '',
    onValueChange,
    tooltip,
    icon: Icon = Link,
    editor,
    showImageStatus = false,

    isVariable,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(!isVariable);
  // Track the live field value so validation reacts as they type, not only on
  // submit. Seeded from the saved value.
  const [draft, setDraft] = useState(defaultValue);

  const linkInputRef = useRef<HTMLInputElement>(null);

  const imageStatus = useImageUrlStatus(
    showImageStatus ? draft : '',
    showImageStatus ? !!isVariable : false,
  );
  const statusMessage = showImageStatus ? imageUrlMessage(imageStatus) : null;

  const { placeholderUrl = DEFAULT_PLACEHOLDER_URL } = useMailyContext();
  const options = useVariableOptions(editor);

  const renderVariable = options?.renderVariable;
  const variables = options?.variables;
  const variableTriggerCharacter =
    options?.suggestion?.char ?? DEFAULT_VARIABLE_TRIGGER_CHAR;

  const autoCompleteOptions = useMemo(() => {
    const withoutTrigger = defaultValue.replace(
      new RegExp(variableTriggerCharacter, 'g'),
      ''
    );

    return processVariables(variables, {
      query: withoutTrigger || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
  }, [variables, variableTriggerCharacter, defaultValue, editor]);

  const popoverButton = (
    <PopoverTrigger asChild>
      <BaseButton
        variant="ghost"
        size="sm"
        type="button"
        className="mly:h-7! mly:w-7!"
        data-state={!!defaultValue}
      >
        <Icon className="mly:h-3 mly:w-3 mly:shrink-0 mly:stroke-[2.5] mly:text-midnight-gray" />
      </BaseButton>
    </PopoverTrigger>
  );

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setTimeout(() => {
            linkInputRef.current?.focus();
          }, 0);
        }
      }}
    >
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{popoverButton}</TooltipTrigger>
          <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        popoverButton
      )}

      <PopoverContent
        align="end"
        side="top"
        className="mly:w-max mly:rounded-none mly:border-none mly:bg-transparent mly:p-0! mly:shadow-none"
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = linkInputRef.current;
            if (!input) {
              return;
            }

            onValueChange?.(input.value);
            setIsOpen(false);
          }}
        >
          <div className="mly:isolate mly:flex mly:rounded-lg">
            {!isEditing && (
              <div className="mly:flex mly:h-8 mly:items-center mly:rounded-lg mly:border mly:border-gray-300 mly:bg-panel mly:px-0.5">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setTimeout(() => {
                      linkInputRef.current?.focus();
                    }, 0);
                  }}
                >
                  {renderVariable({
                    variable: {
                      name: defaultValue,
                      valid: true,
                    },
                    fallback: '',
                    from: 'bubble-variable',
                    editor,
                  })}
                </button>
              </div>
            )}

            {isEditing && (
              <div className="mly:relative">
                <div className="mly:absolute mly:inset-y-0 mly:left-1.5 mly:z-10 mly:flex mly:items-center">
                  <LinkIcon className="mly:h-3 mly:w-3 mly:stroke-[2.5] mly:text-midnight-gray" />
                </div>

                <InputAutocomplete
                  editor={editor}
                  value={defaultValue}
                  onValueChange={(value) => {
                    setDraft(value);
                    onValueChange?.(value);
                  }}
                  autoCompleteOptions={autoCompleteOptions}
                  ref={linkInputRef}
                  placeholder={placeholderUrl}
                  className="-mly:ms-px mly:block mly:h-8 mly:w-56 mly:rounded-lg mly:border mly:border-gray-300 mly:px-2 mly:py-1.5 mly:pl-6 mly:pr-6 mly:text-sm mly:shadow-sm mly:placeholder:text-gray-400"
                  triggerChar={variableTriggerCharacter}
                  onSelectOption={(value) => {
                    const isVariable =
                      autoCompleteOptions.includes(value) ?? false;
                    if (isVariable) {
                      setIsEditing(false);
                    }

                    onValueChange?.(value, isVariable);
                    setIsOpen(false);
                  }}
                />
              </div>
            )}
          </div>

          {statusMessage && isEditing ? (
            // The popover itself is transparent — it was built to float a bare
            // input — so this message carries its own surface, or it would read
            // through onto whatever sits behind the popover.
            <p
              className={`mly:mt-1.5 mly:max-w-56 mly:rounded-lg mly:border mly:border-gray-200 mly:bg-panel mly:px-2 mly:py-1.5 mly:text-xs mly:shadow-sm ${
                statusMessage.tone === 'warn'
                  ? 'mly:text-rose-600'
                  : 'mly:text-gray-500'
              }`}
            >
              {statusMessage.text}
            </p>
          ) : null}
        </form>
      </PopoverContent>
    </Popover>
  );
}
