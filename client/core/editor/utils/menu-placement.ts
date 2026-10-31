import type { Props } from 'tippy.js';

type Modifiers = NonNullable<NonNullable<Props['popperOptions']>['modifiers']>;

/**
 * How every block menu is positioned.
 *
 * Which side a menu sits on is chosen rather than negotiated: a Section whose
 * Repeat holds the caret moves to the section's bottom edge so the two menus
 * do not ask for the same spot, and a Spacer's drops onto the block it
 * measures. So flip stays off — a menu that changed sides on its own would
 * land on the other one.
 *
 * What that left out is the pane. The canvas scrolls inside a box that starts
 * under the app header, and a menu placed above a block resting at that edge
 * was drawn above the box and clipped away: the block on screen, and the only
 * way to act on it gone. preventOverflow slides the menu along its own block
 * until it is back inside, which costs the top line of the block and keeps
 * the side the menu was given. `tether` holds it to the block, so a block
 * scrolled out of the pane still takes its menu with it.
 */
export const PLACED_INSIDE_THE_PANE: Modifiers = [
  { name: 'flip', enabled: false },
  { name: 'preventOverflow', options: { altAxis: true, padding: 8 } },
];

/**
 * How every tippy surface arrives and leaves — the bubble menus, the drag
 * handle, the block and variable menus. The fade and the 4px rise are the
 * `.tippy-box` rule in core/styles/_editor.css; what tippy needs from here
 * is how long each takes, because it writes the duration inline and waits
 * on `transitionend` before it unmounts, so a surface given no duration is
 * removed on the same frame it is asked to leave. Tippy takes milliseconds
 * as a number, so the two values are --ds-motion-base and --ds-motion-fast
 * from app/globals.css written out; keep them in step.
 */
export const TIPPY_MOTION = { duration: [200, 150] as [number, number] };
