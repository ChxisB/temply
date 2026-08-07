import { beforeEach, describe, expect, test } from 'bun:test';
import { clearDraft, isNewerThan, readDraft, writeDraft, type Draft } from './drafts';

const store = new Map<string, string>();

// bun's test environment has no DOM. The store only needs the three methods
// the module calls, so a Map stands in for it.
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

const draft = (savedAt: number): Draft => ({
  subject: 'Welcome',
  previewText: 'Glad you are here',
  fromName: 'Acme',
  replyTo: '',
  content: { type: 'doc', content: [] },
  theme: { button: { backgroundColor: '#4F46E5' } },
  savedAt,
});

beforeEach(() => store.clear());

describe('draft storage', () => {
  test('round-trips a draft', () => {
    writeDraft('tpl_1', draft(1000));
    expect(readDraft('tpl_1')).toEqual(draft(1000));
  });

  test('returns null when nothing was written', () => {
    expect(readDraft('tpl_missing')).toBeNull();
  });

  test('keeps drafts of different templates apart', () => {
    writeDraft('tpl_1', draft(1000));
    writeDraft('tpl_2', { ...draft(2000), subject: 'Receipt' });
    expect(readDraft('tpl_1')?.subject).toBe('Welcome');
    expect(readDraft('tpl_2')?.subject).toBe('Receipt');
  });

  test('clearing removes only that template', () => {
    writeDraft('tpl_1', draft(1000));
    writeDraft('tpl_2', draft(1000));
    clearDraft('tpl_1');
    expect(readDraft('tpl_1')).toBeNull();
    expect(readDraft('tpl_2')).not.toBeNull();
  });

  test('treats malformed storage as no draft', () => {
    store.set('temply:draft:tpl_1', '{ not json');
    expect(readDraft('tpl_1')).toBeNull();
  });

  test('rejects an entry without a timestamp', () => {
    store.set('temply:draft:tpl_1', JSON.stringify({ subject: 'x' }));
    expect(readDraft('tpl_1')).toBeNull();
  });

  test('a write that throws leaves the caller unharmed', () => {
    const original = (globalThis as any).window.localStorage.setItem;
    (globalThis as any).window.localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() => writeDraft('tpl_1', draft(1000))).not.toThrow();
    (globalThis as any).window.localStorage.setItem = original;
  });
});

describe('isNewerThan', () => {
  const saved = '2026-08-06T12:00:00.000Z';
  const savedMs = new Date(saved).getTime();

  test('a draft written after the last save has unpublished work', () => {
    expect(isNewerThan(draft(savedMs + 60_000), saved)).toBe(true);
  });

  test('a draft written before the last save is stale', () => {
    expect(isNewerThan(draft(savedMs - 60_000), saved)).toBe(false);
  });

  test('a template that has never been saved keeps its draft', () => {
    expect(isNewerThan(draft(savedMs), null)).toBe(true);
  });

  test('an unparseable timestamp keeps the draft rather than dropping work', () => {
    expect(isNewerThan(draft(savedMs), 'not a date')).toBe(true);
  });
});
