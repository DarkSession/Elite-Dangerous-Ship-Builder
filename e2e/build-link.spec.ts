import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow } from './accessibility/assertions';

/**
 * A build, passed to someone else.
 *
 * The link is the one thing this application produces that leaves the browser,
 * so the properties asserted here are the ones that make that safe: the payload
 * lives entirely in the fragment, it stays inside a published bound, it never
 * reaches a server, and anything unreadable is refused without touching the
 * build the Commander is already working on.
 */

/** The published bound, including the `b.` prefix and excluding the `#`. */
const MAX_LENGTH = 500;

/** Creates a stock build and waits for its link to be published. */
async function buildWithLink(page: Page, hull = 'Anaconda'): Promise<string> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build#b\./);
  return new URL(page.url()).hash.slice(1);
}

/** Opens the share layer on the workspace. */
async function openShare(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Share this build' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test.describe('publishing a build link', () => {
  test('puts the whole payload in the fragment, within the published bound', async ({ page }) => {
    const fragment = await buildWithLink(page);
    const url = new URL(page.url());

    expect(fragment.startsWith('b.')).toBe(true);
    expect(fragment.length).toBeLessThanOrEqual(MAX_LENGTH);
    // Path and query carry no build data: the fragment is the only place it is,
    // and the fragment is the one part a browser never transmits.
    expect(url.pathname).toBe('/build');
    expect(url.search).toBe('');
  });

  test('shows the canonical address as text a Commander can select', async ({ page }) => {
    const fragment = await buildWithLink(page);
    await openShare(page);

    const value = page.getByRole('dialog').locator('.share-link__value');
    await expect(value).toBeVisible();
    expect(await value.textContent()).toContain(`#${fragment}`);
  });

  test('replaces the fragment rather than growing history', async ({ page }) => {
    await page.goto('/ships/Anaconda');
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page).toHaveURL(/\/build#b\./);

    await page.goBack();

    // One entry back is the hull the build was created from. If publication
    // pushed instead of replacing, this would be `/build` with no fragment.
    await expect(page).toHaveURL(/\/ships\/Anaconda$/);
  });

  test('is reachable and readable with no accessibility violations', async ({ page }, testInfo) => {
    await buildWithLink(page);
    await openShare(page);

    await expectNoAccessibilityViolations(page, testInfo, { label: 'share-link' });
    await expectNoDocumentOverflow(page);
  });
});

test.describe('restoring a build from a link', () => {
  test('opens as a working build from a link, with nothing saved by name', async ({ page }) => {
    const fragment = await buildWithLink(page);

    const incoming = await page.context().newPage();
    await incoming.goto(`/build#${fragment}`);

    await expect(incoming.getByRole('heading', { level: 1, name: 'Build' })).toBeVisible();
    await expect(incoming.getByText('Opened from a build link')).toBeVisible();

    // A link is not a save. The named group exists as a heading either way; what
    // matters is that opening a link put nothing in it.
    await incoming.goto('/builds');
    const named = incoming.locator('[data-record-group="named"]');
    await expect(named.locator('edsb-saved-build-card')).toHaveCount(0);
    await incoming.close();
  });

  test('restores the fixed mounts a link never enumerates', async ({ page }) => {
    const fragment = await buildWithLink(page);

    const incoming = await page.context().newPage();
    await incoming.goto(`/build#${fragment}`);
    await expect(incoming.getByText('Opened from a build link')).toBeVisible();

    // The package pins fixed modules, so the payload omits them and the
    // package's own construction puts them back. Nothing here repaired
    // anything, so nothing here reports having done so.
    await expect(incoming.getByText(/defaulted|repaired|restored automatically/i)).toHaveCount(0);
    expect(new URL(incoming.url()).hash.slice(1)).toBe(fragment);
    await incoming.close();
  });

  test('re-encodes to the same canonical value it arrived as', async ({ page }) => {
    const fragment = await buildWithLink(page);

    const incoming = await page.context().newPage();
    await incoming.goto(`/build#${fragment}`);
    await expect(incoming.getByText('Opened from a build link')).toBeVisible();
    await incoming.waitForFunction(
      (expected) => window.location.hash === `#${expected}`,
      fragment,
      { timeout: 5_000 },
    );
    await incoming.close();
  });
});

test.describe('a link that cannot be read', () => {
  /** Every shape of unreadable payload a browser can actually deliver. */
  const refusals = [
    { name: 'malformed', fragment: 'b.not-a-payload' },
    { name: 'truncated', fragment: 'b.A' },
    { name: 'over-limit', fragment: `b.${'A'.repeat(MAX_LENGTH)}` },
    { name: 'unsupported version', fragment: 'b.zzzzzzzzzzzzzzzz' },
  ];

  for (const refusal of refusals) {
    test(`leaves the active build untouched: ${refusal.name}`, async ({ page }) => {
      await buildWithLink(page);
      await expect(page.getByText('Unsaved changes')).toBeVisible();

      await page.evaluate((fragment) => {
        window.location.hash = fragment;
      }, refusal.fragment);

      // The build a Commander is working on is not something a bad link may
      // cost them, whatever the link turns out to be.
      await expect(page.getByRole('heading', { level: 1, name: 'Build' })).toBeVisible();
      await expect(page.getByText('Anaconda').first()).toBeVisible();
      await expect(page.getByText('Unsaved changes')).toBeVisible();
    });
  }

  test('says why, in the application’s own words', async ({ page }) => {
    await buildWithLink(page);

    await page.evaluate(() => {
      window.location.hash = 'b.not-a-payload';
    });

    const notice = page.getByText(/^This build link|^This is not a build link/);
    await expect(notice.first()).toBeVisible();
    // Never an internal exception: those name table versions and bit widths,
    // and they are not translated.
    expect(await notice.first().textContent()).not.toMatch(/codec table|bit width|envelope/i);
  });

  test('leaves a fragment that is not a build link alone', async ({ page }) => {
    await page.goto('/ships/Anaconda');
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page).toHaveURL(/\/build#b\./);

    await page.evaluate(() => {
      window.location.hash = 'some-anchor';
    });

    // Not interpreted, not refused, not cleared: the fragment belongs to
    // something else and this application has no business touching it.
    await expect(page.getByText(/^This build link|^This is not a build link/)).toHaveCount(0);
    expect(new URL(page.url()).hash).toBe('#some-anchor');
  });
});

test.describe('what a link never sends', () => {
  test('transmits no build data and reaches no other origin', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    await page.goto('/ships');
    // Any hull will do — this journey is about what leaves the browser, not
    // about which ship. Whichever the manifest lists first is reachable at every
    // layout profile without opening a filter panel.
    await page
      .locator('[data-hull-symbol]:visible')
      .first()
      .getByRole('button', { name: /View / })
      .click();
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page).toHaveURL(/\/build#b\./);
    await openShare(page);
    await page.goto('/builds');

    const origin = new URL(page.url()).origin;
    for (const request of requests) {
      // A fragment is never transmitted by a browser. This asserts nothing in
      // the application puts one somewhere that would be.
      expect(request, request).not.toContain('#b.');
      expect(request.replace(/^data:.*/, ''), request).not.toMatch(/[?&][^=]*=b\./);
      expect(request.startsWith(origin) || request.startsWith('data:'), request).toBe(true);
    }
  });
});
