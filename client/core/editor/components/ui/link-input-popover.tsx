import { Link, LinkIcon, LucideIcon, Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { BaseButton } from '../base-button';
import { cn } from '@/editor/utils/classname';
import { useRef, useState, type ComponentPropsWithoutRef } from 'react';
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

  /** Opened from somewhere other than its own button — the phone's format bar
   *  has a Link key that has to land in this field. Left out, the button is
   *  the only way in and the popover keeps its own state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Spread onto the trigger button — the phone needs a 44px target and an
   *  accessible name on what is otherwise a bare icon. */
  triggerProps?: ComponentPropsWithoutRef<'button'>;
};

export function LinkInputPopover(props: LinkInputPopoverProps) {
  const {
    defaultValue = '',
    onValueChange,
    tooltip,
    icon: Icon = Link,
    editor,
    showImageStatus = false,
    open,
    onOpenChange,
    triggerProps,

    isVariable,
  } = props;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = open ?? uncontrolledOpen;
  const setIsOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const [isEditing, setIsEditing] = useState(!isVariable);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const { placeholderUrl = DEFAULT_PLACEHOLDER_URL } = useMailyContext();
  const options = useVariableOptions(editor);

  const renderVariable = options?.renderVariable;
  const variables = options?.variables;
  const variableTriggerCharacter =
    options?.suggestion?.char ?? DEFAULT_VARIABLE_TRIGGER_CHAR;

  // The field is a draft until it is committed — on Enter, on picking a
  // suggestion, or on the popover closing. Writing every keystroke into the
  // node turned a variable into a plain URL the moment its name was touched,
  // with no way back but retyping it. A variable is edited as "@name", so
  // the suggestions open and it stays recognisable as one.
  const seed = () =>
    isVariable ? `${variableTriggerCharacter}${defaultValue}` : defaultValue;
  const [draft, setDraft] = useState(seed);

  /** What a committed draft means: "@name" or a known name is a variable. */
  const interpret = (raw: string): { value: string; isVariable: boolean } => {
    const trimmed = raw.trim();
    if (trimmed.startsWith(variableTriggerCharacter)) {
      return {
        value: trimmed.slice(variableTriggerCharacter.length),
        isVariable: true,
      };
    }
    const known =
      Array.isArray(variables) && variables.some((v) => v.name === trimmed);
    return { value: trimmed, isVariable: known };
  };

  const commit = (raw: string) => {
    const next = interpret(raw);
    if (next.value === defaultValue && next.isVariable === !!isVariable) return;
    onValueChange?.(next.value, next.isVariable);
  };

  const imageStatus = useImageUrlStatus(
    showImageStatus ? interpret(draft).value : '',
    showImageStatus ? interpret(draft).isVariable : false,
  );
  const statusMessage = showImageStatus ? imageUrlMessage(imageStatus) : null;

  const autoCompleteOptions = useMemo(() => {
    const withoutTrigger = draft.replace(
      new RegExp(variableTriggerCharacter, 'g'),
      ''
    );
    return processVariables(variables, {
      query: withoutTrigger || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variables, variableTriggerCharacter, draft, editor]);

  const popoverButton = (
    <PopoverTrigger asChild>
      <BaseButton
        variant="ghost"
        size="sm"
        {...triggerProps}
        type="button"
        className={cn('mly:h-7! mly:w-7!', triggerProps?.className)}
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
          setDraft(seed());
          setIsEditing(!isVariable);
          setTimeout(() => {
            linkInputRef.current?.focus();
          }, 0);
        } else if (isEditing) {
          // Closing is a commit too: what was typed is what they meant.
          commit(draft);
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
            if (!isEditing) return;
            commit(draft);
            setIsEditing(!interpret(draft).isVariable);
            setIsOpen(false);
          }}
        >
          <div className="mly:isolate mly:flex mly:rounded-lg">
            {!isEditing && (
              <div className="mly:flex mly:h-8 mly:items-center mly:rounded-lg mly:border mly:border-gray-300 mly:bg-panel mly:px-0.5">
                {/* The pill is the way to a different destination — a URL
                    or another variable — so it has to read as a control:
                    a pointer, a name, and a pencil beside it. type=button
                    keeps a click from submitting the form around it. */}
                <button
                  type="button"
                  title="Change the destination"
                  aria-label="Change the destination"
                  className="mly:flex mly:cursor-pointer mly:items-center mly:gap-1.5 mly:rounded-md mly:pr-1.5 mly:transition-colors mly:hover:bg-soft-gray"
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
                  <Pencil className="mly:h-3 mly:w-3 mly:shrink-0 mly:stroke-[2.5] mly:text-midnight-gray" />
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
                  value={draft}
                  onValueChange={setDraft}
                  autoCompleteOptions={autoCompleteOptions}
                  ref={linkInputRef}
                  placeholder={placeholderUrl}
                  className="-mly:ms-px mly:block mly:h-8 mly:w-56 mly:rounded-lg mly:border mly:border-gray-300 mly:px-2 mly:py-1.5 mly:pl-6 mly:pr-6 mly:text-sm mly:shadow-sm mly:placeholder:text-gray-400"
                  triggerChar={variableTriggerCharacter}
                  onSelectOption={(value) => {
                    setDraft(`${variableTriggerCharacter}${value}`);
                    onValueChange?.(value, true);
                    setIsEditing(false);
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
