import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow, expectSingleVisibleH1 } from './accessibility/assertions';
import { savedToBrowser, reachShellLink } from './shell';

/**
 * Work that survives — and work that is never silently lost.
 *
 * The journeys here are the ones a Commander only notices when they go wrong:
 * a reload that keeps the build, two windows that do not fight over one
 * autosave, and a browser that refuses to store anything without taking the
 * build down with it.
 *
 * **Rewritten 2026-08-25.** Every build has a record of its own from the moment
 * it exists, so nothing is asked before one build replaces another, and the one
 * a Commander leaves behind is still on the library's list. What is asserted
 * here is that arithmetic: four builds leave four records, opening a save writes
 * nothing to it, the first edit forks, and naming or overwriting returns the
 * count to where it belongs (FR-008, FR-009).
 */

/** Creates a stock build and lands in the workspace. */
async function createBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
}

/** Renames the ship, which is a modelled edit and therefore forks a record. */
async function renameShip(page: Page, name: string): Promise<void> {
  // The title is the field, and leaving it is confirming it — the canvas draws
  // no control beside it (feature 002, "click to rename").
  await page.getByRole('button', { name: /Rename the ship/ }).click();
  const field = page.locator('.identity-fields__input');
  await field.fill(name);
  await field.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

/** How many records this browser is holding, whatever their kind. */
async function recordCount(page: Page): Promise<number> {
  return page.evaluate(
    () => Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')).length,
  );
}

/**
 * Waits until this browser holds exactly this many records.
 *
 * Polled rather than read once: autosave coalesces its writes, and the status
 * line still reads "saved" from the previous build while the next one's write
 * is still owed.
 */
async function expectRecords(page: Page, count: number): Promise<void> {
  await expect.poll(() => recordCount(page), { timeout: 5_000 }).toBe(count);
}

/** The exact bytes one record is stored as, so "untouched" can be checked. */
async function recordBytes(page: Page, id: string): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), `edsb:record:${id}`);
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
    await savedToBrowser(page);

    const before = await storedKeys(page);
    expect(before.records).toHaveLength(1);
    expect(before.tab).not.toBeNull();

    await page.reload();

    await expect(page.getByRole('heading', { level: 1, name: /anaconda/i })).toBeVisible();
    await expect(page.getByRole('banner').getByText('Anaconda').first()).toBeVisible();
    // The same record, not a second one.
    expect((await storedKeys(page)).records).toEqual(before.records);
  });

  test('writes nothing outside the keys this application owns', async ({ page }) => {
    await createBuild(page);
    await savedToBrowser(page);

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
    await savedToBrowser(page);

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
    await savedToBrowser(first);
    await createBuild(second, 'SideWinder');
    await savedToBrowser(second);

    const records = await first.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')),
    );

    // Neither page has overwritten the other's autosave.
    expect(records).toHaveLength(2);
    await expect(first.getByRole('banner').getByText('Anaconda').first()).toBeVisible();
    await expect(second.getByRole('banner').getByText('Sidewinder').first()).toBeVisible();

    await context.close();
  });

  test('forks a duplicated tab rather than sharing one working record', async ({ browser }) => {
    const context = await browser.newContext();
    const original = await context.newPage();
    await createBuild(original, 'Anaconda');
    await savedToBrowser(original);

    // A duplicated tab inherits the session, and so believes it owns the same
    // working record until the claim is negotiated.
    const tabState = await original.evaluate(() => sessionStorage.getItem('edsb:tab'));
    const duplicate = await context.newPage();
    await duplicate.goto('/build');
    await duplicate.evaluate((state) => sessionStorage.setItem('edsb:tab', state!), tabState);
    await duplicate.reload();
    await expect(duplicate.getByRole('heading', { level: 1, name: /anaconda/i })).toBeVisible();
    await reachShellLink(duplicate, 'Shipyard');
    await duplicate.goto('/ships/SideWinder');
    await duplicate.getByRole('button', { name: 'Build stock hull' }).click();
    await savedToBrowser(duplicate);

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
    // The build is still there and the screen still works. The hull is on the
    // command bar's identity line, where canvas 1c puts it.
    await expect(page.getByRole('banner').getByText('Anaconda').first()).toBeVisible();
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /anaconda/i })).toBeVisible();

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
    await expect(page.getByRole('banner').getByText('Anaconda').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose builds to discard' })).toBeVisible();

    await context.close();
  });

  test('leaves four builds in a row as four records, asking nothing', async ({ page }) => {
    // The withdrawn replacement question in one assertion: each build replaces
    // the last on screen and none of them is lost, because each has a record
    // (FR-008, FR-009, ruled 2026-08-25).
    let expected = 0;
    for (const hull of ['Anaconda', 'SideWinder', 'Eagle', 'Python']) {
      await createBuild(page, hull);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expected += 1;
      await expectRecords(page, expected);
    }
  });

  test('writes nothing to a saved build when it is opened', async ({ page }) => {
    await createBuild(page);
    await savedToBrowser(page);
    await reachShellLink(page, 'Open saved build');
    await page.getByRole('button', { name: /^Choose Anaconda/ }).click();
    await page.getByRole('button', { name: 'Save Anaconda under a name' }).click();
    const dialog = page.getByRole('dialog', { name: 'Save this build' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Explorer');
    await dialog.getByRole('button', { name: 'Save as a new build' }).click();
    await expect(page.getByText('Explorer').first()).toBeVisible();

    const id = await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith('edsb:record:'))[0]!
        .replace('edsb:record:', ''),
    );
    const saved = await recordBytes(page, id);

    // Opening it again writes nothing at all: the build is already recoverable
    // from what was opened.
    await page.getByRole('button', { name: /^Choose Explorer/ }).click();
    await page.getByRole('button', { name: 'Open Explorer' }).click();
    await expect(page).toHaveURL(/\/build(#|$)/);

    expect(await recordBytes(page, id)).toBe(saved);
    expect(await recordCount(page)).toBe(1);
  });

  test('forks an unnamed record at the first edit, leaving the save untouched', async ({
    page,
  }) => {
    test.slow();
    await createBuild(page);
    await savedToBrowser(page);
    await reachShellLink(page, 'Open saved build');
    await page.getByRole('button', { name: /^Choose Anaconda/ }).click();
    await page.getByRole('button', { name: 'Save Anaconda under a name' }).click();
    const dialog = page.getByRole('dialog', { name: 'Save this build' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Explorer');
    await dialog.getByRole('button', { name: 'Save as a new build' }).click();
    await expect(page.getByText('Explorer').first()).toBeVisible();

    const id = await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith('edsb:record:'))[0]!
        .replace('edsb:record:', ''),
    );
    const saved = await recordBytes(page, id);

    await page.getByRole('button', { name: /^Choose Explorer/ }).click();
    await page.getByRole('button', { name: 'Open Explorer' }).click();
    await expect(page).toHaveURL(/\/build(#|$)/);
    await renameShip(page, 'Vindicator');

    // A second record now holds the edits, and the save is byte-identical.
    await expectRecords(page, 2);
    expect(await recordBytes(page, id)).toBe(saved);
  });

  test('returns the count to where it was when the save is replaced', async ({ page }) => {
    test.slow();
    await createBuild(page);
    await savedToBrowser(page);
    await reachShellLink(page, 'Open saved build');
    await page.getByRole('button', { name: /^Choose Anaconda/ }).click();
    await page.getByRole('button', { name: 'Save Anaconda under a name' }).click();
    const dialog = page.getByRole('dialog', { name: 'Save this build' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Explorer');
    await dialog.getByRole('button', { name: 'Save as a new build' }).click();
    // Naming consumes the record the build was already in: one record, not two.
    await expectRecords(page, 1);

    await page.getByRole('button', { name: /^Choose Explorer/ }).click();
    await page.getByRole('button', { name: 'Open Explorer' }).click();
    await expect(page).toHaveURL(/\/build(#|$)/);
    await renameShip(page, 'Vindicator');
    await expectRecords(page, 2);

    await reachShellLink(page, 'Open saved build');
    await page.getByRole('button', { name: /^Choose Vindicator/ }).click();
    await page.getByRole('button', { name: 'Save Vindicator under a name' }).click();
    const replace = page.getByRole('dialog', { name: 'Save this build' });
    await replace.getByRole('textbox', { name: 'Name' }).fill('Explorer');
    await replace.getByRole('button', { name: 'Replace the build I opened' }).click();

    // The unsaved entry these edits were in is consumed by the save that
    // replaced the build they came from.
    await expectRecords(page, 1);
  });

  test('is structurally sound and free of accessibility violations', async ({ page }, testInfo) => {
    await createBuild(page);
    await savedToBrowser(page);

    await expectSingleVisibleH1(page);
    await expectNoDocumentOverflow(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'workspace-working-build' });
  });
});
