import { openEditor } from '../fixtures/canvas';
import { test, expect } from '../fixtures/test';

// One finding, so the preflight panel has a row to open and a size bar to
// draw. The shape is the checks spec's, as `shared/preflight.test.ts` pins it.
const DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'button', attrs: { text: 'Click', url: '', isUrlVariable: false } }],
});

/**
 * The editor shell's state changes move on the motion tokens rather than
 * snapping. Each case reads the computed style the token lands as, so a
 * class that stops applying fails here before a customer sees the pop.
 */
test.describe('the editor shell moves on the tokens', () => {
  // Decided per project at collection time, where no test is running yet.
  test.skip(({ isMobile }) => isMobile, 'the view switch and the preflight banner are the desktop shell’s; the phone has sheets');

  test('switching views plays the old pane out as the new one plays in', async ({ page, api, name }) => {
    const t = await api.createTemplate({ title: name('pane switch') });
    await openEditor(page, t.id);
    // Animations are recorded as they start, so neither has to be caught
    // mid-flight: the out animation is over in 150ms.
    await page.evaluate(() => {
      const root = document.documentElement;
      root.dataset.animations = '';
      document.addEventListener(
        'animationstart',
        (event) => {
          root.dataset.animations = `${root.dataset.animations},${(event as AnimationEvent).animationName}`;
        },
        true,
      );
    });
    await page.getByRole('group', { name: 'Content view' }).getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.getByTitle('Email preview')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.animations?.split(',') ?? []))
      .toEqual(expect.arrayContaining(['content-pane-out', 'content-pane-in']));
  });

  test('the save status eases its colour along with its word', async ({ page, api, name }) => {
    const t = await api.createTemplate({ title: name('save status') });
    await openEditor(page, t.id);
    // The visible word is the aria-hidden half beside the live region; before
    // anything is typed it already reads "Saved", faded out.
    const word = page.getByText('Saved', { exact: true }).first();
    await expect(word).toHaveCSS('transition-duration', '0.2s');
    expect(await word.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain('color');
  });

  test('the preflight banner slides open and its size bar eases to its width', async ({ page, api, name }) => {
    const t = await api.createTemplate({ title: name('preflight motion'), content: DOC });
    await openEditor(page, t.id);
    const header = page.getByRole('button', { name: /^Preflight/ });
    await header.click();
    await expect(page.getByText('A button has no URL yet.')).toBeVisible();

    // The row that opens is the nearest thing above the header that eases its
    // grid rows: found by what it does, since it carries no role of its own.
    const row = await header.evaluate((el) => {
      let node: Element | null = el;
      while (node && !getComputedStyle(node).transitionProperty.includes('grid-template-rows')) node = node.parentElement;
      return node ? getComputedStyle(node).transitionDuration : null;
    });
    expect(row, 'a grid-rows transition wraps the banner').toBe('0.2s');

    // The size line's bar is the fill inside the track under "Email size".
    const bar = page.getByText('Email size').locator('xpath=../following-sibling::div/div');
    await expect(bar).toBeVisible();
    expect(await bar.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain('width');
  });
});
