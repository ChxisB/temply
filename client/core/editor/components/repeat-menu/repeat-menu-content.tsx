import { cn } from '@/editor/utils/classname';
import { Editor } from '@tiptap/core';
import { InfoIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ShowPopover } from '../show-popover';
import { Divider } from '../ui/divider';
import { InputAutocomplete } from '../ui/input-autocomplete';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { useRepeatState } from './use-repeat-state';
import { processVariables } from '@/editor/utils/variable';
import { useVariableOptions } from '@/editor/utils/node-options';

export function RepeatMenuContent({ editor }: { editor: Editor }) {
  const state = useRepeatState(editor);

  const opts = useVariableOptions(editor);
  const variables = opts?.variables;
  const renderVariable = opts?.renderVariable;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);

  const eachKey = state?.each || '';
  const autoCompleteOptions = useMemo(() => {
    return processVariables(variables, {
      query: eachKey || '',
      editor,
      from: 'repeat-variable',
    }).map((variable) => variable.name);
  }, [variables, eachKey, editor]);

  const isValidEachKey = eachKey;

  return (
    <>
      <div className="mly:flex mly:items-center mly:gap-1.5 mly:px-1.5 mly:text-sm mly:leading-none">
        Repeat
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon
              className={cn('mly:size-3 mly:stroke-[2.5] mly:text-gray-500')}
            />
          </TooltipTrigger>
          <TooltipContent
            sideOffset={14}
            className="mly:max-w-[260px]"
            align="start"
          >
            Ensure the selected variable is iterable, such as an array of
            objects.
          </TooltipContent>
        </Tooltip>
      </div>
      {!isUpdatingKey && (
        <button
          onClick={() => {
            setIsUpdatingKey(true);
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          }}
        >
          {renderVariable({
            variable: {
              name: state?.each,
              valid: isValidEachKey,
            },
            fallback: '',
            from: 'bubble-variable',
            editor,
          })}
        </button>
      )}
      {isUpdatingKey && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsUpdatingKey(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsUpdatingKey(false);
            }
          }}
        >
          <InputAutocomplete
            editor={editor}
            placeholder="ie. payload.items"
            value={state?.each || ''}
            onValueChange={(value) => {
              editor.commands.updateRepeat({
                each: value,
              });
            }}
            onOutsideClick={() => {
              setIsUpdatingKey(false);
            }}
            onSelectOption={(value) => {
              editor.commands.updateRepeat({
                each: value,
              });
              setIsUpdatingKey(false);
            }}
            autoCompleteOptions={autoCompleteOptions}
            ref={inputRef}
          />
        </form>
      )}

      <Divider />
      <ShowPopover
        showIfKey={state.currentShowIfKey}
        onShowIfKeyValueChange={(value) => {
          editor.commands.updateRepeat({
            showIfKey: value,
          });
        }}
        editor={editor}
      />
    </>
  );
}
