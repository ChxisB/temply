import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import '../core/editor/test/dom';
import { cleanup, render } from '@testing-library/react';
import { useRef } from 'react';
import { renderToString } from 'react-dom/server';
import { useActiveIndicator } from './use-active-indicator';

// Queries come off `render`, not the global `screen`; see button.test.tsx.
afterEach(cleanup);

// happy-dom lays nothing out, so an element's offsets are read from the
// attributes a test gives it; the hook only ever reads these four.
const laidOut = { offsetLeft: 'data-x', offsetWidth: 'data-w', offsetTop: 'data-y', offsetHeight: 'data-h' } as const;
const original = new Map(Object.keys(laidOut).map((key) => [key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key)]));
beforeAll(() => {
  for (const [key, attribute] of Object.entries(laidOut)) {
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get(this: HTMLElement) {
        return Number(this.getAttribute(attribute) ?? 0);
      },
    });
  }
});
afterAll(() => {
  for (const [key, descriptor] of original) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
});

const ITEMS = [
  { key: 'a', x: 10 },
  { key: 'b', x: 110 },
];

function Strip({ active, memoryKey, track = 300 }: { active: string; memoryKey?: string; track?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, style } = useActiveIndicator(ref, active, { inset: 2, memoryKey });
  return (
    <div ref={ref} data-w={track}>
      <span data-testid="bar" data-ready={ready} style={style} />
      {ITEMS.map((item) => (
        <button key={item.key} type="button" data-active={item.key === active ? '' : undefined} data-x={item.x} data-w={90}>
          {item.key}
        </button>
      ))}
    </div>
  );
}

const bar = (view: ReturnType<typeof render>) => view.getByTestId('bar');

describe('useActiveIndicator', () => {
  it('is not ready in the markup the server sends, and reads nothing from the window to get there', () => {
    const html = renderToString(<Strip active="a" />);
    expect(html).toContain('data-ready="false"');
    expect(html).not.toContain('translateX');
  });

  it('lands on the chosen item, trimmed by the inset, without a transition', () => {
    const view = render(<Strip active="a" />);
    expect(bar(view).getAttribute('data-ready')).toBe('true');
    expect(bar(view).style.transform).toBe('translateX(12px)');
    expect(bar(view).style.width).toBe('86px');
    expect(bar(view).style.transition).toBe('none');
  });

  it('slides to the next choice, on the classes rather than an inline override', () => {
    const view = render(<Strip active="a" />);
    view.rerender(<Strip active="b" />);
    expect(bar(view).style.transform).toBe('translateX(112px)');
    expect(bar(view).style.transition).toBe('');
  });

  it('hides when no item is chosen, and lands again without sliding when one is', () => {
    const view = render(<Strip active="a" />);
    view.rerender(<Strip active="none" />);
    expect(bar(view).getAttribute('data-ready')).toBe('false');
    view.rerender(<Strip active="b" />);
    expect(bar(view).getAttribute('data-ready')).toBe('true');
    expect(bar(view).style.transition).toBe('none');
  });

  it('remembers where a keyed strip stood, so a remount slides from there instead of landing', () => {
    render(<Strip active="a" memoryKey="test:remount" />).unmount();
    const view = render(<Strip active="b" memoryKey="test:remount" />);
    expect(bar(view).style.transform).toBe('translateX(112px)');
    expect(bar(view).style.transition).toBe('');
  });

  it('forgets a remembered spot once the strip is another width', () => {
    render(<Strip active="a" memoryKey="test:resized" />).unmount();
    const view = render(<Strip active="b" memoryKey="test:resized" track={600} />);
    expect(bar(view).style.transform).toBe('translateX(112px)');
    expect(bar(view).style.transition).toBe('none');
  });

  it('keeps unkeyed strips apart: a remount without a key lands', () => {
    render(<Strip active="a" />).unmount();
    const view = render(<Strip active="b" />);
    expect(bar(view).style.transition).toBe('none');
  });
});
