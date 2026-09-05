'use client';

import { useMediaQuery } from './use-media-query';

/** A finger rather than a mouse: no hover, bigger targets, no bubble menus.
 *  Independent of width, so an iPad gets the desktop layout with touch controls. */
export function useCoarsePointer(): boolean {
  return useMediaQuery('(pointer: coarse)');
}
