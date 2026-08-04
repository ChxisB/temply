import { describe, expect, it } from 'bun:test';
import { applyKnobs, bestTextOn, knobsFromTheme } from '@temply/shared/brand-knobs';
import { BRAND_PRESETS } from '@temply/shared/brand-presets';

const classic = BRAND_PRESETS[0].theme;

describe('bestTextOn', () => {
  it('picks white on a dark accent, black on a light one', () => {
    expect(bestTextOn('#18181B')).toBe('#FFFFFF');
    expect(bestTextOn('#FFE44D')).toBe('#111111');
  });
});

describe('applyKnobs', () => {
  it('sets accent on button + link with a contrasting button text', () => {
    const t = applyKnobs(classic, { accent: '#0F766E', corner: 'round', density: 'compact' });
    expect(t.button?.backgroundColor).toBe('#0F766E');
    expect(t.link?.color).toBe('#0F766E');
    expect(t.button?.color).toBe('#FFFFFF');
    expect(t.container?.borderRadius).toBe('12px');
    expect(t.button?.borderRadius).toBe('12px');
    expect(t.container?.paddingTop).toBe('28px');
    expect(t.body?.paddingTop).toBe('32px');
  });
});

describe('knobsFromTheme', () => {
  it('reads accent/corner/density back from a theme', () => {
    const k = knobsFromTheme(classic);
    expect(k.accent).toBe('#18181B');
    expect(k.corner).toBe('soft'); // radius 6
    expect(k.density).toBe('comfortable'); // pad 40
  });
});
