'use client';

import { CheckIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { InputDockSpec } from '~/core/editor/components/ui/input-dock';
import { Button, pressable } from '~/components/ui/button';
import { cn } from '~/lib/classname';

/**
 * The field a Link, Show-if or Alt-text control opens on the phone: one
 * input docked at the bottom of the frame, which the keyboard pushes up,
 * with the variable suggestions as chips above it. The sheet that held the
 * control has been closed by the shell so the keyboard has nothing to
 * cover; it comes back when this closes. Stays mounted and slides in and
 * out, keeping its last spec through the exit.
 */
export function InputDock({ spec, onClose }: { spec: InputDockSpec | null; onClose: () => void }) {
  const [shown, setShown] = useState<InputDockSpec | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!spec) return;
    setShown(spec);
    setDraft(spec.value);
    // After the sheet's close has let go of focus, and after this has
    // painted: focusing an input that is still translated off its place
    // makes iOS scroll to where it was.
    // Selected, not just focused: the seed is what is there now, and the
    // usual next move is to replace it.
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [spec]);

  const view = spec ?? shown;
  const open = !!spec;
  const commit = (raw: string) => {
    view?.onCommit(raw);
    onClose();
  };
  const trigger = view?.triggerChar ?? '';
  const chips = view?.options && (draft === '' || draft.startsWith(trigger)) ? view.options(draft).slice(0, 8) : [];

  return (
    <div
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
            commit(draft);
          }}
          className="px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="editor-input-dock" className="text-xs font-medium text-ink">
              {view.label}
            </label>
            {view.hint ? <span className="truncate text-2xs text-muted">{view.hint}</span> : null}
          </div>
          {/* A field that takes suggestions keeps the chip row's height even
              with none to show, so it does not hop when the first arrives;
              a plain field (alt text) has no row at all. */}
          {view.options ? (
          <div className="mt-1 flex h-9 items-center gap-1 overflow-x-auto">
            {chips.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => commit(`${trigger}${name}`)}
                className={cn('h-8 shrink-0 rounded-full border border-line bg-surface px-3 font-mono text-xs text-ink hover:bg-hover', pressable)}
              >
                {name}
              </button>
            ))}
          </div>
          ) : null}
          <div className="mt-1 flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0" aria-label="Cancel" onClick={onClose}>
              <XIcon />
            </Button>
            {/* 16px text: anything smaller makes iOS zoom the page on focus. */}
            <input
              id="editor-input-dock"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={view.placeholder}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              className="h-11 min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-lg text-ink placeholder:text-faint"
            />
            <Button type="submit" variant="primary" size="icon" className="size-11 shrink-0" aria-label="Done">
              <CheckIcon />
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
