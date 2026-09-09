import { Editor } from '@tiptap/core';
import { Eye, InfoIcon } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { collectDataKeys } from '@temply/shared/template-data';
import { cn } from '../utils/classname';
import { highlightShowIfKey } from '../utils/highlight-show-if';
import { useVariableOptions } from '../utils/node-options';
import { processVariables } from '../utils/variable';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { InputAutocomplete } from './ui/input-autocomplete';
import { useInputDock } from './ui/input-dock';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

type ShowPopoverProps = {
  showIfKey?: string;
  onShowIfKeyValueChange?: (when: string) => void;

  editor: Editor;
};

function _ShowPopover(props: ShowPopoverProps) {
  const { showIfKey = '', onShowIfKeyValueChange, editor } = props;

  const opts = useVariableOptions(editor);
  const variables = opts?.variables;
  const inputRef = useRef<HTMLInputElement>(null);

  // Keys already used elsewhere in this email. Nothing records them, so the
  // document is the list — and reusing one key across blocks is the normal
  // case (a section, its spacer, and its button all hang off `isMember`).
  // Read on open: the document is not reactive.
  const [keysInUse, setKeysInUse] = useState<string[]>([]);
  // Controlled so picking a suggestion can dismiss the panel: the choice is
  // made, leaving it open just hides the block it applies to.
  const [open, setOpen] = useState(false);

  const knownVariables = useMemo(() => {
    const fromDocument = keysInUse.map((name) => ({ name }));
    if (!Array.isArray(variables)) return fromDocument;
    return [
      ...fromDocument,
      ...variables.filter((variable) => !keysInUse.includes(variable.name)),
    ];
  }, [keysInUse, variables]);

  const autoCompleteOptions = useMemo(() => {
    return processVariables(knownVariables, {
      query: showIfKey || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
  }, [knownVariables, showIfKey, editor]);

  // A highlight must not outlive the popover that painted it.
  useEffect(() => () => highlightShowIfKey(editor, null), [editor]);

  // On the phone the key is typed in the shell's dock, above the keyboard,
  // with the keys already in use offered as chips.
  const dock = useInputDock();
  if (dock) {
    return (
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label="Show block conditionally"
          className={cn(
            'mly:flex mly:size-7 mly:items-center mly:justify-center mly:gap-1 mly:rounded-md mly:px-1.5 mly:text-sm mly:transition-colors mly:hover:bg-soft-gray',
            showIfKey && 'mly:bg-accent-wash mly:text-accent-ink mly:hover:bg-accent-wash'
          )}
          onClick={() => {
            const inUse = collectDataKeys(editor.getJSON()).conditions;
            const known = [
              ...inUse.map((name) => ({ name })),
              ...(Array.isArray(variables) ? variables.filter((variable) => !inUse.includes(variable.name)) : []),
            ];
            dock.open({
              title: 'Show if',
              fields: [
                {
                  label: 'Show if',
                  value: showIfKey,
                  placeholder: 'e.g. isMember',
                  hint: 'Shown only when this is true in the data you send',
                  options: (draft) =>
                    processVariables(known, { query: draft, from: 'bubble-variable', editor }).map((variable) => variable.name),
                },
              ],
              onCommit: ([raw]) => onShowIfKeyValueChange?.(raw.trim()),
            });
          }}
        >
          <Eye className="mly:h-3 mly:w-3 mly:stroke-[2.5]" />
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Show block conditionally</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setKeysInUse(collectDataKeys(editor.getJSON()).conditions);
        else highlightShowIfKey(editor, null);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            className={cn(
              'mly:flex mly:size-7 mly:items-center mly:justify-center mly:gap-1 mly:rounded-md mly:px-1.5 mly:text-sm mly:data-[state=open]:bg-soft-gray mly:transition-colors mly:hover:bg-soft-gray mly:focus-visible:relative mly:focus-visible:z-10 ',
              // A configured condition is a normal state, not a problem: it
                // used to light up in the danger colour.
                showIfKey &&
                'mly:bg-accent-wash mly:text-accent-ink mly:data-[state=open]:bg-accent-wash mly:hover:bg-accent-wash'
            )}
          >
            <Eye className="mly:h-3 mly:w-3 mly:stroke-[2.5]" />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Show block conditionally</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="mly:flex mly:w-max mly:rounded-lg mly:p-0.5!"
        side="top"
        sideOffset={8}
        align="end"
        onOpenAutoFocus={(e) => {
          // Put the caret in the key field rather than on the panel, so the
          // popover opens ready to type.
          e.preventDefault();
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <div className="mly:flex mly:items-center mly:gap-1.5 mly:px-1.5 mly:text-sm mly:leading-none">
          Show if
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon
                className={cn('mly:size-3 mly:stroke-[2.5] mly:text-gray-500')}
              />
            </TooltipTrigger>
            <TooltipContent
              sideOffset={14}
              className="mly:max-w-[285px]"
              align="start"
            >
              Show this block only when the named value is true in the data you
              send. Leave it empty and the block always shows.
            </TooltipContent>
          </Tooltip>
        </div>

        {/* The field is always mounted. It used to be a pill that swapped
            itself for an input on click — but unmounting the very element
            being clicked leaves Radix comparing against a detached node, which
            reads as a click outside, so the whole popover closed and the input
            could never be reached. */}
        <form onSubmit={(e) => e.preventDefault()}>
          <InputAutocomplete
            editor={editor}
            value={showIfKey || ''}
            onValueChange={(value) => onShowIfKeyValueChange?.(value)}
            onSelectOption={(value) => {
              highlightShowIfKey(editor, null);
              onShowIfKeyValueChange?.(value);
              setOpen(false);
            }}
            onHoverOption={(key) => highlightShowIfKey(editor, key)}
            autoCompleteOptions={autoCompleteOptions}
            placeholder="e.g. isMember"
            ref={inputRef}
          />
        </form>
      </PopoverContent>
    </Popover>
  );
}

export const ShowPopover = memo(_ShowPopover);
