'use client';

import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { CheckCircle2Icon, LayoutTemplateIcon, MailIcon, PaletteIcon, PlusIcon, SlidersHorizontalIcon } from 'lucide-react';
import { Button, pressable } from '~/components/ui/button';
import { useKeyboardInset } from '~/hooks/use-keyboard-inset';
import { isEditingText } from '~/core/editor/plugins/block-selection';
import { cn } from '~/lib/classname';
import { BlockActionBar } from './block-action-bar';
import { TextFormatBar } from './text-format-bar';

export type BottomBarState = 'idle' | 'block' | 'text';
export type IdleTab = 'details' | 'brand' | 'data' | 'checks';

// Focus, not just selection shape, decides the text face: a NodeSelection
// left over from a block tap should not flash 'text' before the keyboard
// has actually come up. Opening the Aa panel blurs the editor on purpose
// (the keyboard drops), so `panelOpen` keeps the text face up on its own —
// the panel's commands still apply to the selection the SelectionExtension
// keeps drawn.
export function bottomBarState(editor: Editor | null, panelOpen: boolean): BottomBarState {
  if (!editor) return 'idle';
  if (isEditingText(editor) && (editor.isFocused || panelOpen)) return 'text';
  if (editor.state.selection instanceof NodeSelection) return 'block';
  return 'idle';
}

const TABS: Array<{ id: IdleTab; label: string; icon: typeof MailIcon }> = [
  { id: 'details', label: 'Details', icon: MailIcon },
  { id: 'brand', label: 'Brand', icon: PaletteIcon },
  { id: 'data', label: 'Data', icon: SlidersHorizontalIcon },
  { id: 'checks', label: 'Checks', icon: CheckCircle2Icon },
];

/**
 * One bar, three faces. The faces swap by opacity inside a shared grid row
 * so switching between idle/block/closed-text never jumps the canvas above;
 * that row only grows when the Aa panel opens, and the keyboard moves the
 * whole bar besides. The + button rides above the bar in idle and block
 * states and hides while typing, where it would sit on the keys.
 */
export function EditorBottomBar({
  editor, state, checksCount, panelOpen, onTogglePanel, onOpenTab, onAdd, onStyle, onDone,
}: {
  editor: Editor | null;
  state: BottomBarState;
  checksCount: { errors: number; warnings: number };
  // Lifted to the layout: `bottomBarState` there needs to know the panel is
  // open before the header face (Done vs. Publish) can agree with the bar's.
  panelOpen: boolean;
  onTogglePanel: () => void;
  onOpenTab: (tab: IdleTab) => void;
  onAdd: () => void;
  onStyle: () => void;
  onDone: () => void;
}) {
  const inset = useKeyboardInset();
  const badge = checksCount.errors > 0 ? { n: checksCount.errors, tone: 'danger' as const } : checksCount.warnings > 0 ? { n: checksCount.warnings, tone: 'warn' as const } : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40" style={{ paddingBottom: inset }}>
      <div
        className={cn(
          'absolute right-4 transition-[opacity,transform] duration-base ease-out motion-reduce:transition-none',
          state === 'text' ? 'pointer-events-none translate-y-2 opacity-0' : 'pointer-events-auto opacity-100',
        )}
        style={{ bottom: `calc(100% + 0.75rem)` }}
      >
        <Button variant="primary" size="icon" aria-label="Add block" className="size-12 rounded-full shadow-lg" onClick={onAdd} tabIndex={state === 'text' ? -1 : 0}>
          <PlusIcon />
        </Button>
      </div>

      <div data-editor-bottom-bar className="pointer-events-auto border-t border-line bg-raised pb-[env(safe-area-inset-bottom)]">
        {/* A floor, not a fixed height: idle/block/text agree on 56px when
            the text face is just its top row, but the Aa panel grows that
            face taller, and the row this shares has to grow with it or the
            panel paints past the bar's own box. */}
        <div className="grid min-h-14 [&>*]:col-start-1 [&>*]:row-start-1">
          {/* idle */}
          <nav
            aria-label="Editor sections"
            className={cn('flex items-stretch justify-around transition-opacity duration-base ease-out motion-reduce:transition-none', state === 'idle' ? 'opacity-100' : 'pointer-events-none opacity-0')}
            aria-hidden={state !== 'idle'}
          >
            <span className="flex min-w-16 flex-col items-center justify-center gap-0.5 text-2xs font-medium text-accent-ink">
              <LayoutTemplateIcon className="size-5" />
              Content
            </span>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                // Without this the badge's bare number joins the label and
                // the tab is announced as "Checks1".
                aria-label={tab.id === 'checks' && badge ? `${tab.label}, ${badge.n} ${badge.tone === 'danger' ? (badge.n === 1 ? 'error' : 'errors') : badge.n === 1 ? 'warning' : 'warnings'}` : undefined}
                onClick={() => onOpenTab(tab.id)}
                className={cn('relative flex min-w-16 flex-col items-center justify-center gap-0.5 text-2xs text-muted hover:text-ink', pressable)}
                tabIndex={state === 'idle' ? 0 : -1}
              >
                <tab.icon className="size-5" />
                {tab.label}
                {tab.id === 'checks' && badge ? (
                  <span className={cn('absolute top-1.5 right-3 min-w-4 rounded-full px-1 text-center text-2xs font-semibold text-white', badge.tone === 'danger' ? 'bg-danger' : 'bg-warn')}>
                    {badge.n}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          {/* block */}
          <div
            className={cn('transition-opacity duration-base ease-out motion-reduce:transition-none', state === 'block' ? 'opacity-100' : 'pointer-events-none opacity-0')}
            aria-hidden={state !== 'block'}
          >
            {editor ? <BlockActionBar editor={editor} onStyle={onStyle} /> : null}
          </div>
          {/* text */}
          <div
            className={cn('transition-opacity duration-base ease-out motion-reduce:transition-none', state === 'text' ? 'opacity-100' : 'pointer-events-none opacity-0')}
            aria-hidden={state !== 'text'}
          >
            {editor ? <TextFormatBar editor={editor} panelOpen={panelOpen} onTogglePanel={onTogglePanel} onDone={onDone} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
