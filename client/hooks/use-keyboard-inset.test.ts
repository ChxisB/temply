import { describe, expect, it } from 'bun:test';
import { keyboardInset } from './use-keyboard-inset';

describe('keyboardInset', () => {
  it('is zero when the visual viewport fills the layout viewport', () => {
    expect(keyboardInset({ height: 844, offsetTop: 0 }, 844)).toBe(0);
  });
  it('is the covered height when the keyboard is up', () => {
    expect(keyboardInset({ height: 500, offsetTop: 0 }, 844)).toBe(344);
  });
  it('accounts for the page having scrolled under the keyboard (iOS)', () => {
    expect(keyboardInset({ height: 500, offsetTop: 100 }, 844)).toBe(244);
  });
  it('never goes negative', () => {
    expect(keyboardInset({ height: 900, offsetTop: 0 }, 844)).toBe(0);
  });
});
