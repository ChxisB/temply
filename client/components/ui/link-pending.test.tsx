import { afterAll, afterEach, describe, expect, it, mock } from 'bun:test';
import '../../core/editor/test/dom';
import { cleanup, render } from '@testing-library/react';

// Next's link status comes from the router, which is not here; see
// nav-items.test.tsx for why the real module is captured and put back.
let pending = false;
const realLink = { ...(await import('next/link')) };
mock.module('next/link', () => ({ ...realLink, useLinkStatus: () => ({ pending }) }));
afterAll(() => {
  mock.module('next/link', () => realLink);
});
const { LinkPending } = await import('./link-pending');

afterEach(cleanup);

describe('LinkPending', () => {
  it('names its href while the link is pending, and takes it back once the page has landed', () => {
    const seen: Array<string | null> = [];
    pending = false;
    const view = render(<LinkPending href="/dashboard/brands" onChange={(href) => seen.push(href)} />);
    expect(seen).toEqual([]);

    pending = true;
    view.rerender(<LinkPending href="/dashboard/brands" onChange={(href) => seen.push(href)} />);
    expect(seen).toEqual(['/dashboard/brands']);

    pending = false;
    view.rerender(<LinkPending href="/dashboard/brands" onChange={(href) => seen.push(href)} />);
    expect(seen).toEqual(['/dashboard/brands', null]);
  });

  it('renders nothing of its own', () => {
    pending = false;
    const view = render(<LinkPending href="/dashboard" onChange={() => {}} />);
    expect(view.container.innerHTML).toBe('');
  });
});
