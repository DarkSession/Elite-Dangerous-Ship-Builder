import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow, expectSingleVisibleH1 } from './accessibility/assertions';

/**
 * Managing what this browser is holding.
 *
 * Every destructive step here is confirmed and names what it will remove, and
 * the concurrency journeys drive two real pages into a real conflict rather
 * than simulating one — because the thing being tested is that neither
 * Commander's version disappears.
 */

/** A record seeded directly, so a listing state can be reached without a journey. */
function seedRecord(
  id: string,
  overrides: Record<string, unknown> = {},
): { key: string; value: string } {
  return {
    key: `edsb:record:${id}`,
    value: JSON.stringify({
      format: 'edsb.local-record',
      version: 1,
      id,
      kind: 'named',
      revisionId: `revision-${id}`,
      createdAt: '2026-01-02T03:04:05.000Z',
      modifiedAt: '2026-01-02T03:04:05.000Z',
      name: `Build ${id}`,
      note: null,
      hullSymbol: 'Anaconda',
      validation: { valid: true, complete: true },
      build: {
        format: 'edsb.build',
        version: 1,
        shipSymbol: 'Anaconda',
        shipName: null,
        shipIdent: null,
        modules: [],
      },
      sourceNamed: null,
      ...overrides,
    }),
  };
}

/** Puts values into the store before the application boots. */
async function seed(page: Page, entries: readonly { key: string; value: string }[]): Promise<void> {
  await page.addInitScript((seeded) => {
    for (const { key, value } of seeded) {
      localStorage.setItem(key, value);
    }
  }, entries);
}

async function createBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await openWorkspaceWithBuild(page, hull);
  await expect(page.getByText('Saved in this browser')).toBeVisible();
}

/**
 * Creates a build and waits only for the workspace.
 *
 * Used where persistence is expected *not* to succeed — at the retention limit
 * the honest status is that nothing was written, so waiting for "saved" would
 * be waiting for the bug.
 */
async function openWorkspaceWithBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(page.getByRole('heading', { level: 1, name: 'Build' })).toBeVisible();
}

const library = (page: Page) => page.getByRole('heading', { level: 1, name: 'Saved builds' });

test.describe('the build library', () => {
  test('says so when nothing is stored', async ({ page }) => {
    await page.goto('/builds');

    await expect(library(page)).toBeVisible();
    await expect(page.getByText('Nothing is stored yet')).toBeVisible();
  });

  test('lists a working build with its hull, time and recorded state', async ({ page }) => {
    await createBuild(page);
    await page.getByRole('navigation').getByRole('link', { name: 'Open saved build' }).click();

    await expect(library(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Working builds' })).toBeVisible();
    await expect(page.getByText('Working build', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Anaconda').first()).toBeVisible();
    await expect(page.getByText('Valid').first()).toBeVisible();
  });

  test('names a working build, keeping the working record as well', async ({ page }) => {
    await createBuild(page);
    await page.getByRole('navigation').getByRole('link', { name: 'Open saved build' }).click();

    await page.getByRole('button', { name: /^Save Working build under a name$/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Anaconda explorer');
    await dialog.getByRole('button', { name: 'Save as a new build' }).click();

    await expect(page.getByRole('heading', { name: 'Named builds' })).toBeVisible();
    await expect(page.getByText('Anaconda explorer').first()).toBeVisible();
    // The tab is still working on its own record.
    await expect(page.getByText('Working build', { exact: true }).first()).toBeVisible();
  });

  test('warns about a duplicate name and still saves a separate build', async ({ page }) => {
    await seed(page, [seedRecord('a', { name: 'Anaconda explorer' })]);
    await createBuild(page);
    await page.getByRole('navigation').getByRole('link', { name: 'Open saved build' }).click();

    await page.getByRole('button', { name: /^Save Working build under a name$/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Anaconda explorer');

    await expect(dialog.getByText(/already use this name/i)).toBeVisible();
    await dialog.getByRole('button', { name: 'Save as a new build' }).click();

    const stored = await page.evaluate(
      () => Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')).length,
    );
    // The existing build, this tab's working record, and the new named copy.
    expect(stored).toBe(3);
  });

  test('duplicates a build under a new identity', async ({ page }) => {
    await seed(page, [seedRecord('a')]);
    await page.goto('/builds');

    await page.getByRole('button', { name: 'Duplicate Build a' }).click();

    const stored = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')),
    );
    expect(stored).toHaveLength(2);
    expect(stored).toContain('edsb:record:a');
  });

  test('confirms a deletion, names the record, and cancelling keeps it', async ({ page }) => {
    await seed(page, [seedRecord('a')]);
    await page.goto('/builds');

    await page.getByRole('button', { name: 'Delete Build a' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Build a/)).toBeVisible();
    await expect(dialog.getByText(/cannot be undone/i)).toBeVisible();

    await dialog.getByRole('button', { name: 'Keep this build' }).click();
    expect(await page.evaluate(() => localStorage.getItem('edsb:record:a'))).not.toBeNull();

    await page.getByRole('button', { name: 'Delete Build a' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete this build' }).click();

    expect(await page.evaluate(() => localStorage.getItem('edsb:record:a'))).toBeNull();
  });

  test('deletes only the record that was confirmed', async ({ page }) => {
    await seed(page, [seedRecord('a'), seedRecord('b')]);
    await page.goto('/builds');

    await page.getByRole('button', { name: 'Delete Build a' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete this build' }).click();

    const stored = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')),
    );
    expect(stored).toEqual(['edsb:record:b']);
  });

  test('opens a stored build into the workspace', async ({ page }) => {
    await seed(page, [seedRecord('a')]);
    await page.goto('/builds');

    await page.getByRole('button', { name: 'Open Build a' }).click();

    await expect(page).toHaveURL(/\/build(#|$)/);
    await expect(page.getByText('Anaconda').first()).toBeVisible();
  });

  test('lists an unsupported or unreadable record without opening or removing it', async ({
    page,
  }) => {
    await seed(page, [
      {
        key: 'edsb:record:newer',
        value: JSON.stringify({
          format: 'edsb.local-record',
          version: 99,
          id: 'newer',
          name: 'From the future',
          hullSymbol: 'Anaconda',
        }),
      },
      { key: 'edsb:record:broken', value: '{"format":"edsb.local-record","version":1,"id":' },
    ]);
    await page.goto('/builds');

    await expect(page.getByText(/newer version of the application/i)).toBeVisible();
    await expect(page.getByText(/could not be read/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Open/ })).toHaveCount(0);

    const stored = await page.evaluate(() => ({
      newer: localStorage.getItem('edsb:record:newer'),
      broken: localStorage.getItem('edsb:record:broken'),
    }));
    expect(stored.newer).not.toBeNull();
    expect(stored.broken).not.toBeNull();
  });

  test('offers explicit discard when twenty working records already exist', async ({ page }) => {
    await seed(
      page,
      Array.from({ length: 20 }, (_, index) =>
        seedRecord(`w${index}`, { kind: 'working', name: null }),
      ),
    );
    await openWorkspaceWithBuild(page);

    await expect(page.getByText(/recoverable working builds/i)).toBeVisible();
    await page.getByRole('navigation').getByRole('link', { name: 'Open saved build' }).click();
    await expect(page.getByRole('heading', { name: 'Choose builds to discard' })).toBeVisible();

    // Nothing was removed to make room.
    const stored = await page.evaluate(
      () => Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')).length,
    );
    expect(stored).toBe(20);
  });

  test('discards only the records explicitly selected', async ({ page }) => {
    await seed(
      page,
      Array.from({ length: 20 }, (_, index) =>
        seedRecord(`w${index}`, { kind: 'working', name: null }),
      ),
    );
    await openWorkspaceWithBuild(page);
    await page.getByRole('navigation').getByRole('link', { name: 'Open saved build' }).click();

    const manager = page.getByRole('group', { name: 'Choose builds to discard' });
    await manager.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Delete this build' }).click();

    const stored = await page.evaluate(
      () => Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')).length,
    );
    expect(stored).toBe(19);
  });

  test('offers overwrite, keep both and cancel when two pages save one build', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const first = await context.newPage();
    const second = await context.newPage();

    // Waiting for the save is the precondition, not a convenience: the library
    // lists what is stored, and autosave coalesces before it writes.
    await createBuild(first);
    await first.getByRole('navigation').getByRole('link', { name: 'Open saved build' }).click();
    await first.getByRole('button', { name: /^Save Working build under a name$/ }).click();
    await first.getByRole('dialog').getByRole('textbox', { name: 'Name' }).fill('Shared build');
    await first.getByRole('dialog').getByRole('button', { name: 'Save as a new build' }).click();
    await expect(first.getByText('Shared build').first()).toBeVisible();

    // The other page opens the same named record, so both hold the same baseline.
    await second.goto('/builds');
    await second.getByRole('button', { name: 'Open Shared build' }).click();
    await expect(second).toHaveURL(/\/build(#|$)/);

    await first.goto('/builds');
    await first.getByRole('button', { name: 'Open Shared build' }).click();
    await expect(first).toHaveURL(/\/build(#|$)/);

    // One page saves; the other's baseline is now stale.
    await second.getByRole('navigation').getByRole('link', { name: 'Open saved build' }).click();
    await second.getByRole('button', { name: 'Rename Shared build' }).click();
    await second
      .getByRole('dialog')
      .getByRole('textbox', { name: 'Name' })
      .fill('From the other page');
    await second
      .getByRole('dialog')
      .getByRole('button', { name: 'Replace the build I opened' })
      .click();

    await first.getByRole('navigation').getByRole('link', { name: 'Open saved build' }).click();
    // By the time this page looks, the listing has already re-read storage and
    // shows the other page's name — which is the point: the *record* is the
    // same one, and this page's baseline is the stale part.
    await first
      .getByRole('button', { name: /^Rename / })
      .first()
      .click();
    await first.getByRole('dialog').getByRole('textbox', { name: 'Name' }).fill('From this page');
    await first
      .getByRole('dialog')
      .getByRole('button', { name: 'Replace the build I opened' })
      .click();

    const conflict = first.getByRole('dialog', { name: /changed in another tab/i });
    await expect(conflict).toBeVisible();
    await expect(conflict.getByText(/your version is kept/i)).toBeVisible();
    await expect(conflict.getByText(/both versions are kept/i)).toBeVisible();
    await expect(conflict.getByText(/nothing is saved/i)).toBeVisible();

    await conflict.getByRole('button', { name: 'Keep both versions' }).click();

    const names = await first.evaluate(() =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith('edsb:record:'))
        .map((key) => (JSON.parse(localStorage.getItem(key)!) as { name: string | null }).name)
        .filter((name): name is string => name !== null),
    );
    // Neither version disappeared.
    expect(names).toContain('From the other page');
    expect(names).toContain('From this page');

    await context.close();
  });

  test('is structurally sound and free of accessibility violations', async ({ page }, testInfo) => {
    await seed(page, [
      seedRecord('a'),
      seedRecord('b', { validation: { valid: false, complete: false } }),
    ]);
    await page.goto('/builds');
    await expect(library(page)).toBeVisible();

    await expectSingleVisibleH1(page);
    await expectNoDocumentOverflow(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'library-populated' });

    await page.getByRole('button', { name: 'Delete Build a' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoAccessibilityViolations(page, testInfo, { label: 'library-delete-confirmation' });
  });
});
