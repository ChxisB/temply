import { test, expect } from '../fixtures/test';
import { bubbleMenu, hoverControl, openEditor } from '../fixtures/canvas';

// The editor's floating surfaces arrive and leave on the app's motion tokens
// (globals.css: 200ms in, 150ms out) rather than appearing. What is read here
// is computed style, which is deterministic where a screenshot of a frame
// mid-fade is not: a transition's property list and duration say whether the
// box will move at all, and the style the box has at the moment its exit
// transition ends says where it went. None of these cases emulate reduced
// motion — under it every duration is 0.01ms and there would be nothing to
// read. `.tippy-box` is the one hook outside a role: tippy re-parents every
// bubble menu into one, and it is that box, not the toolbar, that carries
// the transition (e2e/README.md).

/** What the text toolbar's box looked like as its fade-out finished. */
type Exit = { state: string | null; opacity: string; duration: string };

test.describe('editor motion', () => {
  test('the text toolbar fades in on base and out on fast', async ({ page, api, name }) => {
    const t = await api.createTemplate({ title: name('toolbar motion') });
    const pm = await openEditor(page, t.id);
    await pm.getByText('Hello from e2e').click({ clickCount: 3 });

    const menu = bubbleMenu(page, 'Text formatting');
    await expect(menu).toBeVisible();
    // Tippy writes the duration inline a frame after it mounts the box, so
    // the first read can land on the 0 it starts from.
    await expect.poll(() => menu.evaluate((box) => getComputedStyle(box).transitionDuration),
      { message: 'the toolbar arrives over the base duration' }).toBe('0.2s');
    const properties = await menu.evaluate((box) => getComputedStyle(box).transitionProperty);
    expect(properties.split(',').map((p) => p.trim()), 'the toolbar fades').toContain('opacity');

    // The exit is read as it ends: tippy removes the box on the same
    // transitionend, so the box's last computed style is read from a capture
    // listener on the document, which runs before tippy's own on the box, and
    // a poll from outside would race the removal.
    await menu.evaluate((box) => {
      box.dataset.probe = '';
      document.addEventListener(
        'transitionend',
        (event) => {
          const target = event.target as HTMLElement;
          if (!target.matches?.('.tippy-box[data-probe]') || (event as TransitionEvent).propertyName !== 'opacity') return;
          const style = getComputedStyle(target);
          (window as unknown as { __exit?: Exit }).__exit = {
            state: target.getAttribute('data-state'),
            opacity: style.opacity,
            duration: style.transitionDuration,
          };
        },
        true,
      );
    });
    // Collapsing the selection is what puts the text toolbar down.
    await page.keyboard.press('ArrowRight');
    await expect(menu, 'the toolbar leaves').toBeHidden();
    // Hidden to a reader before the fade has run its course: the record lands
    // when the transition ends, 150ms on.
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __exit?: Exit }).__exit), {
        message: 'the toolbar faded out over the fast duration before it was removed',
      })
      .toEqual({ state: 'hidden', opacity: '0', duration: '0.15s' });
  });

  test('the Text colour popover pops in as an anchored panel', async ({ page, api, name }) => {
    const t = await api.createTemplate({ title: name('popover motion') });
    const pm = await openEditor(page, t.id);
    await pm.getByText('Hello from e2e').click({ clickCount: 3 });

    const menu = bubbleMenu(page, 'Text formatting');
    await menu.getByRole('button', { name: 'Text colour', exact: true }).click();
    const picker = menu.getByRole('dialog', { name: 'Text colour' });
    await expect(picker).toBeVisible();
    await expect(picker).toHaveAttribute('data-state', 'open');
    expect(await picker.evaluate((panel) => getComputedStyle(panel).animationName),
      'the popover runs the panel entrance').toBe('panel-in');
  });

  test('a toolbar tooltip fades in', async ({ page, api, name }) => {
    const t = await api.createTemplate({ title: name('tooltip motion') });
    const pm = await openEditor(page, t.id);
    await pm.getByText('Hello from e2e').click({ clickCount: 3 });

    const menu = bubbleMenu(page, 'Text formatting');
    await hoverControl(page, menu.getByRole('button', { name: 'Bold', exact: true }));
    // Radix names the hint through a visually hidden `role="tooltip"` inside
    // the surface it animates, so the surface is that element's parent.
    const hint = page.getByRole('tooltip', { name: 'Bold', exact: true });
    await expect(hint).toBeVisible();
    expect(await hint.locator('..').evaluate((surface) => getComputedStyle(surface).animationName),
      'the tooltip runs the overlay fade').toBe('overlay-in');
  });
});
