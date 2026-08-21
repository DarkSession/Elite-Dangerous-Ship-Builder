import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow, expectSingleVisibleH1 } from './accessibility/assertions';

/**
 * Work that survives — and work that is never silently lost.
 *
 * The journeys here are the ones a Commander only notices when they go wrong:
 * a reload that keeps the build, two windows that do not fight over one
 * autosave, and a browser that refuses to store anything without taking the
 * build down with it.
 */

/** Creates a stock build and lands in the workspace. */
async function createBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Create a stock build' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
}

/** The owned keys currently in this browser. */
function storedKeys(page: Page) {
  return page.evaluate(() => ({
    records: Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')),
    tab: sessionStorage.getItem('edsb:tab'),
  }));
}

test.describe('the tab’s working build', () => {
  test('is saved to one owned record and restored after a reload', async ({ page }) => {
    await createBuild(page);
    await expect(page.getByText('Saved in this browser')).toBeVisible();

    const before = await storedKeys(page);
    expect(before.records).toHaveLength(1);
    expect(before.tab).not.toBeNull();

    await page.reload();

    await expect(page.getByRole('heading', { level: 1, name: 'Build' })).toBeVisible();
    await expect(page.getByText('Anaconda')).toBeVisible();
    // The same record, not a second one.
    expect((await storedKeys(page)).records).toEqual(before.records);
  });

  test('writes nothing outside the keys this application owns', async ({ page }) => {
    await createBuild(page);
    await expect(page.getByText('Saved in this browser')).toBeVisible();

    const keys = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));

    expect(keys.local.every((key) => key.startsWith('edsb:record:'))).toBe(true);
    expect(keys.session).toContain('edsb:tab');
    // Session state is this tab's browsing position and its own identity, and
    // nothing else claims a key here.
    expect(keys.session.every((key) => ['edsb:catalogue', 'edsb:tab'].includes(key))).toBe(true);
  });

  test('stores no calculated value, price or catalogue fact', async ({ page }) => {
    await createBuild(page);
    await expect(page.getByText('Saved in this browser')).toBeVisible();

    const stored = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((candidate) =>
        candidate.startsWith('edsb:record:'),
      )!;
      return localStorage.getItem(key) ?? '';
    });

    for (const forbidden of ['HullValue', 'Rebuy', 'MaxJumpRange', 'retailCost', 'manufacturer']) {
      expect(stored, forbidden).not.toContain(forbidden);
    }
    // The modelled build, and the envelope around it. Nothing else.
    expect(stored).toContain('"format":"edsb.local-record"');
    expect(stored).toContain('"format":"edsb.build"');
  });

  test('gives two independent pages two working records', async ({ browser }) => {
    const context = await browser.newContext();
    const first = await context.newPage();
    const second = await context.newPage();

    await createBuild(first, 'Anaconda');
    await expect(first.getByText('Saved in this browser')).toBeVisible();
    await createBuild(second, 'SideWinder');
    await expect(second.getByText('Saved in this browser')).toBeVisible();

    const records = await first.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')),
    );

    // Neither page has overwritten the other's autosave.
    expect(records).toHaveLength(2);
    await expect(first.getByText('Anaconda')).toBeVisible();
    await expect(second.getByText('Sidewinder')).toBeVisible();

    await context.close();
  });

  test('forks a duplicated tab rather than sharing one working record', async ({ browser }) => {
    const context = await browser.newContext();
    const original = await context.newPage();
    await createBuild(original, 'Anaconda');
    await expect(original.getByText('Saved in this browser')).toBeVisible();

    // A duplicated tab inherits the session, and so believes it owns the same
    // working record until the claim is negotiated.
    const tabState = await original.evaluate(() => sessionStorage.getItem('edsb:tab'));
    const duplicate = await context.newPage();
    await duplicate.goto('/build');
    await duplicate.evaluate((state) => sessionStorage.setItem('edsb:tab', state!), tabState);
    await duplicate.reload();
    await expect(duplicate.getByRole('heading', { level: 1, name: 'Build' })).toBeVisible();
    await duplicate.getByRole('navigation').getByRole('link', { name: 'Shipyard' }).click();
    await duplicate.goto('/ships/SideWinder');
    await duplicate.getByRole('button', { name: 'Create a stock build' }).click();
    await expect(duplicate.getByText('Saved in this browser')).toBeVisible();

    const records = await original.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')),
    );
    expect(records.length).toBeGreaterThan(1);

    await context.close();
  });

  test('keeps editing available when the browser refuses to store anything', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Every storage access throws, which is what a browser with site data
    // blocked actually does.
    await page.addInitScript(() => {
      const blocked = {
        get length(): number {
          throw new DOMException('denied', 'SecurityError');
        },
        key: () => {
          throw new DOMException('denied', 'SecurityError');
        },
        getItem: () => {
          throw new DOMException('denied', 'SecurityError');
        },
        setItem: () => {
          throw new DOMException('denied', 'SecurityError');
        },
        removeItem: () => {
          throw new DOMException('denied', 'SecurityError');
        },
        clear: () => {
          throw new DOMException('denied', 'SecurityError');
        },
      };
      Object.defineProperty(window, 'localStorage', { get: () => blocked });
    });

    await createBuild(page);

    await expect(page.getByText(/not allowing the application to store/i)).toBeVisible();
    // The build is still there and the screen still works.
    await expect(page.getByText('Anaconda')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Build' })).toBeVisible();

    await context.close();
  });

  test('keeps editing available when the store is full', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key: string, value: string) {
        if (key.startsWith('edsb:record:')) {
          throw new DOMException('exceeded', 'QuotaExceededError');
        }
        return original.call(this, key, value);
      };
    });

    await createBuild(page);

    await expect(page.getByText(/storage is full/i)).toBeVisible();
    await expect(page.getByText('Anaconda')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose builds to discard' })).toBeVisible();

    await context.close();
  });

  test('is structurally sound and free of accessibility violations', async ({ page }, testInfo) => {
    await createBuild(page);
    await expect(page.getByText('Saved in this browser')).toBeVisible();

    await expectSingleVisibleH1(page);
    await expectNoDocumentOverflow(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'workspace-working-build' });
  });
});
