import type { Locator, Page } from '@playwright/test';
import { openEditor } from '../fixtures/canvas';
import { onPhone } from '../fixtures/project';
import { test, expect } from '../fixtures/test';

// Every tab strip, segmented control and nav list marks its choice with one
// indicator that slides to the chosen item, rather than each item painting
// its own. Read where a customer meets three of them: the sidebar's wash, the
// template tabs' underline and a segmented control's pill. Each is the strip's
// one aria-hidden span; its box is what moves, and it eases on duration-base.

/** The strip's one indicator: the span that is its direct child and hidden from assistive tech. */
const indicator = (strip: Locator) => strip.locator(':scope > span[aria-hidden]');

/** How long a move eases, one entry per transitioned property. */
const eased = async (mark: Locator) => {
  const duration = await mark.evaluate((el) => getComputedStyle(el).transitionDuration);
  return duration.split(',').map((part) => part.trim());
};

const box = async (mark: Locator) => (await mark.boundingBox())!;

/** The sidebar as a reader meets it: the drawer's copy on a phone, whose fixed one is display:none. */
async function openSidebar(page: Page): Promise<Locator> {
  if (onPhone()) await page.getByRole('button', { name: 'Open navigation' }).click();
  const sidebar = page.getByRole('complementary', { name: 'Workspace' });
  await expect(sidebar).toBeVisible();
  return sidebar;
}

test('the sidebar has one wash that slides down to the section chosen', async ({ page }) => {
  await page.goto('/dashboard/templates');
  const nav = (await openSidebar(page)).getByRole('navigation', { name: 'Dashboard' });
  const wash = indicator(nav);
  await expect(wash).toHaveCount(1);
  await expect(wash).toBeVisible();
  const before = await box(wash);
  const templates = await box(nav.getByRole('link', { name: 'Templates', exact: true }));
  expect(Math.round(before.y)).toBe(Math.round(templates.y));

  // The same node after the move, not a wash the new page drew for itself.
  await wash.evaluate((el) => {
    (el as HTMLElement & { __wash?: boolean }).__wash = true;
  });
  await nav.getByRole('link', { name: 'Brands', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/brands$/);

  // The phone's drawer closes on a choice and is opened again to read it.
  const reopened = (await openSidebar(page)).getByRole('navigation', { name: 'Dashboard' });
  const after = indicator(reopened);
  await expect(after).toHaveCount(1);
  if (!onPhone()) {
    expect(await after.evaluate((el) => (el as HTMLElement & { __wash?: boolean }).__wash)).toBe(true);
    expect((await eased(after)).every((part) => part === '0.2s'), 'the wash eases on duration-base').toBe(true);
  }
  // Read the row and the wash in one go: the workspace switcher mounts above
  // the list a moment after the page lands and moves both down together.
  const brands = reopened.getByRole('link', { name: 'Brands', exact: true });
  await expect.poll(async () => Math.round((await box(after)).y) - Math.round((await box(brands)).y)).toBe(0);
  expect(Math.round((await box(after)).y)).not.toBe(Math.round(before.y));
});

// The app router moves the URL only once the server's first chunk lands, so
// a strip paints the clicked link as current from the click: the indicator
// leaves at once and the page follows. The payload is held back here so the
// click and the landing come apart far enough to read. `aria-current` stays
// with the URL throughout. The phone's drawer closes on the click, so the row
// is not there to read; the strip is the same component on both.

/** Holds a path's RSC payload back so a click's own motion can be read before the page lands. A production
 *  build prefetches a link in view and a prefetched page lands on the click, so the prefetch is held back
 *  twice as long; refusing it instead makes the router fall back to a full page load. */
const holdPage = (page: Page, pathname: string, ms: number) =>
  page.route(
    (url) => url.pathname === pathname && url.searchParams.has('_rsc'),
    async (route) => {
      const prefetch = Boolean(route.request().headers()['next-router-prefetch']);
      await new Promise((resolve) => setTimeout(resolve, prefetch ? ms * 2 : ms));
      await route.continue();
    },
  );

test('the sidebar wash leaves on the click, before the page lands', async ({ page }) => {
  test.skip(onPhone(), 'the drawer closes on the click');
  await holdPage(page, '/dashboard/brands', 1500);
  await page.goto('/dashboard/templates');
  const nav = page.getByRole('navigation', { name: 'Dashboard' });
  const templates = nav.getByRole('link', { name: 'Templates', exact: true });
  const brands = nav.getByRole('link', { name: 'Brands', exact: true });
  await expect(templates).toHaveAttribute('data-active', '');

  await brands.click();
  await expect(brands).toHaveAttribute('data-active', '');
  await expect(templates).not.toHaveAttribute('data-active', '');
  await expect(page, 'the page has not landed yet').toHaveURL(/\/dashboard\/templates$/);
  await expect(templates, 'aria-current waits for the URL').toHaveAttribute('aria-current', 'page');
  await expect.poll(async () => Math.round((await box(indicator(nav))).y) - Math.round((await box(brands)).y)).toBe(0);

  await expect(page).toHaveURL(/\/dashboard\/brands$/);
  await expect(brands).toHaveAttribute('aria-current', 'page');
  await expect(brands).toHaveAttribute('data-active', '');
});

test('a settings tab is current from the click, before its page lands', async ({ page }) => {
  test.skip(onPhone(), 'the strip is the same component as on the desktop');
  await holdPage(page, '/dashboard/settings/team', 1500);
  await page.goto('/dashboard/settings');
  const strip = page.getByRole('navigation', { name: 'Settings' });
  const account = strip.getByRole('link', { name: 'Account' });
  const team = strip.getByRole('link', { name: 'Team' });
  await expect(account).toHaveAttribute('data-active', '');

  await team.click();
  await expect(team).toHaveAttribute('data-active', '');
  await expect(account).not.toHaveAttribute('data-active', '');
  await expect(page, 'the page has not landed yet').toHaveURL(/\/dashboard\/settings$/);
  await expect(account, 'aria-current waits for the URL').toHaveAttribute('aria-current', 'page');

  await expect(page).toHaveURL(/\/dashboard\/settings\/team$/);
  await expect(team).toHaveAttribute('aria-current', 'page');
});

test('the template tabs have one underline that slides to the tab opened', async ({ page, api, name }) => {
  test.skip(onPhone(), 'the phone editor has a shell of its own, with no tab row');
  const t = await api.createTemplate({ title: name('tabs') });
  await openEditor(page, t.id);
  const tabs = page.getByRole('navigation', { name: 'Template' });
  const bar = indicator(tabs);
  await expect(bar).toHaveCount(1);
  await expect(bar).toBeVisible();
  const before = await box(bar);
  const edit = await box(tabs.getByRole('link', { name: 'Edit email', exact: true }));
  expect(before.x).toBeGreaterThan(edit.x);
  expect(before.x + before.width).toBeLessThan(edit.x + edit.width);

  await tabs.getByRole('link', { name: 'Variables', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/templates/${t.id}/variables$`));
  const variables = page.getByRole('navigation', { name: 'Template' }).getByRole('link', { name: 'Variables', exact: true });
  await expect(variables).toHaveAttribute('aria-current', 'page');
  // Every page in the frame renders its own tab row, so the bar is read
  // afresh; it settles under the tab and never at the row's start.
  const after = indicator(page.getByRole('navigation', { name: 'Template' }));
  await expect(after).toHaveCount(1);
  const target = await box(variables);
  await expect.poll(async () => Math.round((await box(after)).x)).toBe(Math.round(target.x) + 14);
  expect(Math.round((await box(after)).x)).not.toBe(Math.round(before.x));
  expect((await eased(after)).every((part) => part === '0.2s'), 'the bar eases on duration-base').toBe(true);
});

test('a segmented control has one pill that slides to the option chosen', async ({ page, api, name }) => {
  // A row of this test's own says the list has hydrated and a click will land.
  await api.createTemplate({ title: name('anchor') });
  await page.goto('/dashboard/templates');
  await expect(page.getByRole('listitem').filter({ hasText: name('anchor') }).locator('time')).toBeVisible();
  const filter = page.getByRole('radiogroup', { name: 'Filter templates' });
  const pill = indicator(filter);
  await expect(pill).toHaveCount(1);
  await expect(pill).toBeVisible();
  const before = await box(pill);
  const all = await box(filter.getByRole('radio', { name: /^All/ }));
  expect(Math.round(before.x)).toBe(Math.round(all.x));

  await filter.getByRole('radio', { name: /^Drafts/ }).click();
  await expect(filter.getByRole('radio', { name: /^Drafts/ })).toHaveAttribute('aria-checked', 'true');
  const drafts = await box(filter.getByRole('radio', { name: /^Drafts/ }));
  await expect.poll(async () => Math.round((await box(pill)).x)).toBe(Math.round(drafts.x));
  expect(Math.round((await box(pill)).x)).not.toBe(Math.round(before.x));
  // The phone project asks for reduced motion, under which the pill lands
  // rather than eases, so the duration is read on the desktop only.
  if (!onPhone()) {
    expect((await eased(pill)).every((part) => part === '0.2s'), 'the pill eases on duration-base').toBe(true);
  }
});
