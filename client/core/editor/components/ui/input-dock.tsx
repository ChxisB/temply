import { createContext, useContext } from 'react';

/**
 * A single text field the shell docks above the keyboard, in place of the
 * popover a control would otherwise open. The phone provides it; the
 * desktop never does, and the controls keep their popovers there.
 */
export type InputDockSpec = {
  label: string;
  value: string;
  placeholder?: string;
  /** One short line under the label: what the value is for. */
  hint?: string;
  /** Suggestions for the draft as typed; shown as a row of chips. */
  options?: (draft: string) => string[];
  /** The character a draft starts with to mean a variable, when the field
   *  takes one — the chips are offered only for such a draft, or an empty
   *  one. Empty means every draft is a plain key and the chips always show. */
  triggerChar?: string;
  /** Done, Enter, or a chip: the raw draft, exactly as the popover's own
   *  submit would have received it. */
  onCommit: (raw: string) => void;
};

export type InputDock = { open: (spec: InputDockSpec) => void };

export const InputDockContext = createContext<InputDock | null>(null);

/** The dock when a shell provides one, else null — the cue to keep the popover. */
export function useInputDock(): InputDock | null {
  return useContext(InputDockContext);
}
