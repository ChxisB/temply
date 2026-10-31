'use client';

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

type Axis = 'x' | 'y';

/** Where the indicator sits along the axis, and how wide the strip was when it was measured. */
type Measure = { offset: number; size: number; track: number };

type State = { rect: Measure | null; ready: boolean; slide: boolean };

/**
 * The last place each remembered strip's indicator stood. A strip that is
 * rendered by every route it sits on (the template tabs) remounts on each
 * change of tab, so without this the mark would snap into place on every
 * page; with it the fresh strip starts where the old one left off and slides.
 * Written only from the layout effect, so the server never fills it and a
 * hydrating client finds it empty.
 */
const remembered = new Map<string, Measure>();

/** Measures `item` along the axis, relative to the container's padding edge. */
function measure(container: HTMLElement, item: HTMLElement, axis: Axis, inset: number): Measure {
  return axis === 'x'
    ? { offset: item.offsetLeft + inset, size: item.offsetWidth - inset * 2, track: container.offsetWidth }
    : { offset: item.offsetTop + inset, size: item.offsetHeight - inset * 2, track: container.offsetHeight };
}

/**
 * One indicator for a tab strip, a segmented control or a nav list that
 * slides to the chosen item instead of each item swapping its own classes.
 *
 * The container must be positioned (`relative`), so the items' offsets and
 * the indicator's `left-0 top-0` share an origin, and the chosen item carries
 * `data-active`. The hook measures it in a layout effect, re-measures when the
 * container or the item resizes and once fonts have loaded, and hands back the
 * indicator's inline style and a `ready` flag: the indicator is painted at
 * `opacity-0` until the first measurement, and the chosen item shows a static
 * fallback until then, so the server's HTML has an active state and nothing
 * flashes on hydration. The first position lands without a transition; moves
 * after it ease on the indicator's own `duration-base` classes, and a resize
 * snaps rather than slides, since the layout around it is moving as well.
 *
 * `inset` trims both ends of the measured item, for a bar that stops short of
 * its tab's padding. `memoryKey` names a strip that remounts between pages
 * (see `remembered`); the memory is ignored when the strip has changed width
 * since, as the rect would no longer mean the same spot.
 */
export function useActiveIndicator(
  container: RefObject<HTMLElement | null>,
  active: unknown,
  { axis = 'x', inset = 0, memoryKey }: { axis?: Axis; inset?: number; memoryKey?: string } = {},
): { ready: boolean; style: CSSProperties } {
  const [state, setState] = useState<State>(() => {
    const kept = memoryKey ? remembered.get(memoryKey) : undefined;
    return { rect: kept ?? null, ready: Boolean(kept), slide: false };
  });

  useLayoutEffect(() => {
    const node = container.current;
    if (!node) return;

    const update = (slide: boolean) => {
      const item = node.querySelector<HTMLElement>('[data-active]');
      if (!item) {
        setState((prev) => (prev.ready ? { ...prev, ready: false } : prev));
        return;
      }
      const next = measure(node, item, axis, inset);
      if (memoryKey) remembered.set(memoryKey, next);
      setState((prev) => {
        const same = prev.rect && prev.rect.offset === next.offset && prev.rect.size === next.size;
        if (same && prev.ready) return prev;
        // A rect kept from a strip of another width is a stale start, so the
        // mark lands rather than travels from it.
        const from = prev.ready && prev.rect && Math.abs(prev.rect.track - next.track) < 2;
        return { rect: next, ready: true, slide: slide && Boolean(from) };
      });
      return item;
    };

    const item = update(true);

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => update(false));
    observer.observe(node);
    if (item) observer.observe(item);
    // Fonts arriving after the first paint change every label's width.
    void document.fonts?.ready?.then(() => update(false));
    return () => observer.disconnect();
  }, [container, active, axis, inset, memoryKey]);

  const { rect, ready, slide } = state;
  const style: CSSProperties = rect
    ? axis === 'x'
      ? { transform: `translateX(${rect.offset}px)`, width: rect.size }
      : { transform: `translateY(${rect.offset}px)`, height: rect.size }
    : {};
  // Inline `none` is what keeps the first position, and a resize, from
  // travelling; once a move has eased the classes take over again.
  if (!slide) style.transition = 'none';
  return { ready, style };
}
