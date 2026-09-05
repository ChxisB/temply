'use client';

import { useEffect, useState } from 'react';

/** How many pixels of the layout viewport the keyboard covers. iOS scrolls
 *  the page under the keyboard rather than shrinking it, which is what
 *  offsetTop reports. */
export function keyboardInset(vv: { height: number; offsetTop: number }, layoutHeight: number): number {
  return Math.max(0, Math.round(layoutHeight - vv.height - vv.offsetTop));
}

/**
 * The on-screen keyboard's height, live. Anything docked to the bottom of
 * the screen offsets by this so it stays visible while typing. `100vh` and
 * `100dvh` both ignore the keyboard on iOS; the visual viewport does not.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setInset(keyboardInset(vv, window.innerHeight));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
}
