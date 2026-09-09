'use client';

import { CheckIcon, CircleXIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { InputDockSpec, InputField } from '~/core/editor/components/ui/input-dock';
import { Button, pressable } from '~/components/ui/button';
import { cn } from '~/lib/classname';
import { keepFocus } from './text-format-bar';

/**
 * The field(s) a Link, Show-if, Alt-text or Variable control opens on the
 * phone: one or more inputs docked at the bottom of the frame, which the
 * keyboard pushes up, with any variable suggestions as chips above each
 * input. The sheet that held the control has been closed by the shell so the
 * keyboard has nothing to cover; it comes back when this closes. Stays
 * mounted and slides in and out, keeping its last spec through the exit.
 */
export function InputDock({ spec, onClose }: { spec: InputDockSpec | null; onClose: () => void }) {
  const [shown, setShown] = useState<InputDockSpec | null>(null);
  const [drafts, setDrafts] = useState<string[]>([]);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!spec) return;
    setShown(spec);
    // Never null: a null value hands the input back to the DOM, which then
    // keeps whatever the last spec left in it and answers keystrokes twice.
    setDrafts(spec.fields.map((field) => field.value ?? ''));
    // After the sheet's close has let go of focus, and after this has painted:
    // focusing an input that is still translated off its place makes iOS
    // scroll to where it was.
    const id = requestAnimationFrame(() => {
      firstRef.current?.focus();
      firstRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [spec]);

  const view = spec ?? shown;
  const open = !!spec;
  const commit = () => {
    view?.onCommit(drafts);
    onClose();
  };
  const setDraft = (index: number, value: string) =>
    setDrafts((current) => current.map((draft, i) => (i === index ? value : draft)));

  return (
    <div
      data-editor-input-dock
      className={cn(
        'absolute inset-x-0 bottom-0 z-50 border-t border-line bg-raised shadow-lg transition-[opacity,transform] duration-base ease-out motion-reduce:transition-none',
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
      inert={!open}
    >
      {view ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            commit();
          }}
          className="px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          aria-label={view.title}
        >
          {view.fields.map((field, index) => (
            <FieldRow
              key={field.label}
              field={field}
              index={index}
              draft={drafts[index] ?? ''}
              onDraft={(value) => setDraft(index, value)}
              inputRef={index === 0 ? firstRef : undefined}
              last={index === view.fields.length - 1}
              onCancel={onClose}
            />
          ))}
        </form>
      ) : null}
    </div>
  );
}

/**
 * One labelled field. Chips sit under the label and above the input: what can
 * be picked is worth seeing before deciding whether to type. A field with
 * nothing to offer has no chip row at all — reserving the space for an empty
 * row makes a one-field surface as tall as a two-field one.
 *
 * A chip fills its own field and stops there. It used to commit the surface on
 * the spot, which cannot survive a second field, and one ✓ finishing the whole
 * edit is the rule the four controls now share.
 */
function FieldRow({
  field, index, draft, onDraft, inputRef, last, onCancel,
}: {
  field: InputField;
  index: number;
  draft: string;
  onDraft: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  last: boolean;
  onCancel: () => void;
}) {
  const id = `editor-input-dock-${index}`;
  const trigger = field.triggerChar ?? '';
  const chips = field.options && (draft === '' || draft.startsWith(trigger)) ? field.options(draft).slice(0, 8) : [];
  return (
    <div className={cn(index > 0 && 'mt-3')}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs font-medium text-ink">
          {field.label}
        </label>
        {field.hint ? <span className="truncate text-2xs text-muted">{field.hint}</span> : null}
      </div>
      {field.options ? (
        <div className="mt-1 flex h-9 items-center gap-1 overflow-x-auto">
          {chips.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={keepFocus}
              onPointerDown={keepFocus}
              onClick={() => onDraft(`${trigger}${name}`)}
              className={cn('h-8 shrink-0 rounded-full border border-line bg-surface px-3 font-mono text-xs text-ink hover:bg-hover', pressable)}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-1 flex items-center gap-2">
        {/* The gutter is held on every row so the inputs line up; only the
            first row fills it, and ✕ cancels the whole surface. */}
        <span className="size-11 shrink-0">
          {index === 0 ? (
            <Button type="button" variant="ghost" size="icon" className="size-11" aria-label="Cancel" onMouseDown={keepFocus} onPointerDown={keepFocus} onClick={onCancel}>
              <XIcon />
            </Button>
          ) : null}
        </span>
        <div className="relative min-w-0 flex-1">
          {/* 16px text: anything smaller makes iOS zoom the page on focus. */}
          <input
            id={id}
            ref={inputRef}
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            placeholder={field.placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint={last ? 'done' : 'next'}
            className="h-11 w-full rounded-md border border-line bg-surface pr-11 pl-3 text-lg text-ink placeholder:text-faint"
          />
          {/* Emptying the field is how a link, a condition or an alt text is
              removed: Done with nothing in it commits "none". The button fades
              rather than appears, so the field's edge is steady while typing. */}
          <button
            type="button"
            aria-label={`Clear ${field.label.toLowerCase()}`}
            onMouseDown={keepFocus}
            onPointerDown={keepFocus}
            onClick={() => onDraft('')}
            className={cn(
              'absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-opacity duration-fast ease-out hover:text-ink motion-reduce:transition-none',
              draft ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            inert={!draft}
          >
            <CircleXIcon className="size-5" />
          </button>
        </div>
        <span className="size-11 shrink-0">
          {index === 0 ? (
            <Button type="submit" variant="primary" size="icon" className="size-11" aria-label="Done" onMouseDown={keepFocus} onPointerDown={keepFocus}>
              <CheckIcon />
            </Button>
          ) : null}
        </span>
      </div>
    </div>
  );
}
