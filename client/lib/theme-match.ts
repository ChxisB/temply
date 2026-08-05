import type { RendererThemeOptions } from '@temply/shared/theme';
import { DEFAULT_RENDERER_THEME } from '@temply/shared/theme';
import { BRAND_PRESETS } from '@temply/shared/brand-presets';

type Theme = RendererThemeOptions;

/** Structural equality, order-insensitive — themes pass through JSON and
 *  object spreads, so key order cannot be trusted. */
export function sameTheme(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== 'object') return a === b;
  const ka = Object.keys(a as object).filter((k) => (a as any)[k] !== undefined);
  const kb = Object.keys(b as object).filter((k) => (b as any)[k] !== undefined);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => sameTheme((a as any)[k], (b as any)[k]));
}

/** Which preset or saved brand this theme IS, or 'custom' when it matches none. */
export function matchThemeToBrand(
  theme: Theme,
  brands: { id: string; theme: string }[] = [],
): string {
  for (const p of BRAND_PRESETS) {
    if (sameTheme(p.theme, theme)) return p.id;
  }
  for (const b of brands) {
    try {
      if (sameTheme(JSON.parse(b.theme), theme)) return b.id;
    } catch {
      // A malformed stored theme can never match.
    }
  }
  return 'custom';
}

export function isFreshTheme(theme: Theme): boolean {
  return sameTheme(theme, DEFAULT_RENDERER_THEME);
}
