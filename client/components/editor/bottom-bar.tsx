'use client';

import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { CheckCircle2Icon, LayoutTemplateIcon, MailIcon, PaletteIcon, PlusIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useState } from 'react';
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
// has actually come up. Task 14 owns the finer nuance (a `panelOpen` param
// keeps this face up while the Aa panel has taken the keyboard's place).
export function bottomBarState(editor: Editor | null): BottomBarState {
  if (!editor) return 'idle';
  if (isEditingText(editor) && editor.isFocused) return 'text';
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
 * One bar, three faces. The faces swap by opacity inside a fixed-height
 * row so the canvas above never jumps; only the keyboard moves the bar,
 * and it moves with it. The + button rides above the bar in idle and
 * block states and hides while typing, where it would sit on the keys.
 */
export function EditorBottomBar({
  editor, state, checksCount, onOpenTab, onAdd, onStyle, onDone,
}: {
  editor: Editor | null;
  state: BottomBarState;
  checksCount: { errors: number; warnings: number };
  onOpenTab: (tab: IdleTab) => void;
  onAdd: () => void;
  onStyle: () => void;
  onDone: () => void;
}) {
  const inset = useKeyboardInset();
  const [panelOpen, setPanelOpen] = useState(false);
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

      <div className="pointer-events-auto border-t border-line bg-raised pb-[env(safe-area-inset-bottom)]">
        <div className="grid h-14 [&>*]:col-start-1 [&>*]:row-start-1">
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
            {editor ? <TextFormatBar editor={editor} panelOpen={panelOpen} onTogglePanel={() => setPanelOpen((v) => !v)} onDone={onDone} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
