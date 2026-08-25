import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow, expectSingleVisibleH1 } from './accessibility/assertions';
import { savedToBrowser, reachShellLink } from './shell';

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

/**
 * Fills this origin's local storage, so the next record write has nowhere to go.
 *
 * Under a key this application does not own, and added after the records a test
 * seeds, so what runs out is the browser's room rather than anything the
 * application decided. The quota is the only bound left on records since the
 * twenty-record limit was withdrawn on 2026-08-25 (FR-013).
 */
async function fillStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Coarse first, then finer, so what is left over is smaller than anything
    // the application would write. A megabyte of headroom would leave the store
    // full in name only.
    for (const size of [64 * 1024, 1024, 64, 1]) {
      const chunk = 'x'.repeat(size);
      for (let index = 0; ; index += 1) {
        try {
          localStorage.setItem(`filler:${size}:${index}`, chunk);
        } catch {
          break;
        }
      }
    }
  });
}

/** How many records this browser is holding, whatever their kind. */
async function recordCount(page: Page): Promise<number> {
  return page.evaluate(
    () => Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')).length,
  );
}

async function createBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await openWorkspaceWithBuild(page, hull);
  await savedToBrowser(page);
}

/**
 * Creates a build and waits only for the workspace.
 *
 * Used where persistence is expected *not* to succeed — at the retention limit
 * the honest status is that nothing was written, so waiting for "saved" would
 * be waiting for the bug.
 */
/**
 * Chooses a row, which is what the footer's actions act on.
 *
 * The reference draws dense rows and commits from a footer, so acting on a
 * record is two presses: choose it, then commit (build-library design,
 * "Reference composition").
 */
async function chooseRecord(page: Page, title: string): Promise<void> {
  // A row is named by its own words, so it is found by its title — anchored,
  // because "Anaconda" would otherwise also match "Anaconda explorer".
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = page.getByRole('button', { name: new RegExp(`^${escaped}\\b`, 'i') });
  // Retried, because the listing re-reads storage after a write and the row a
  // press was aimed at can be replaced a frame later: the click then resolves
  // against a detached node and its handler never runs.
  await expect(async () => {
    await row.click({ timeout: 2_000 });
    await expect(row).toHaveAttribute('aria-pressed', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

/** Chooses the first row of the unnamed group, whatever it is titled. */
async function chooseFirstUnnamed(page: Page): Promise<void> {
  const row = page.locator('[data-record-group="working"] .record').first();
  await expect(async () => {
    await row.click({ timeout: 2_000 });
    await expect(row).toHaveAttribute('aria-pressed', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

/**
 * Opens a stored build from the library and waits for the workspace.
 *
 * The listing is built from storage after the page is up, so a press can land
 * on the row the framework is about to replace: the click resolves against a
 * node that is detached a frame later, its handler never runs, and the page
 * simply stays on the library with nothing to say it did not work. The press is
 * retried until the workspace is reached rather than made once and asserted
 * after.
 */
async function openRecord(page: Page, title: string): Promise<void> {
  await expect(async () => {
    await chooseRecord(page, title);
    await page.getByRole('button', { name: `Open ${title}` }).click();
    await expect(page).toHaveURL(/\/build(#|$)/, { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

async function openWorkspaceWithBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  // The command bar titles an unnamed build by what the build calls itself,
  // which for a stock hull is the hull (FR-010, ruled 2026-08-25).
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(hull, 'i') })).toBeVisible();
}

const library = (page: Page) => page.getByRole('heading', { level: 1, name: 'Saved builds' });

test.describe('the build library', () => {
  test('says so when nothing is stored', async ({ page }) => {
    await page.goto('/builds');

    await expect(library(page)).toBeVisible();
    await expect(page.getByText('Nothing is stored yet')).toBeVisible();
  });

  test('lists an unnamed build with its hull, time and recorded state', async ({ page }) => {
    await createBuild(page);
    await reachShellLink(page, 'Open saved build');

    await expect(library(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Unnamed builds' })).toBeVisible();
    // Titled by what the build calls itself — here the hull, since a stock
    // build has neither a ship name nor an ident yet (FR-010).
    await expect(page.getByText('Anaconda').first()).toBeVisible();
    await expect(page.getByText('Valid').first()).toBeVisible();
    await expect(page.getByText(/Current build/).first()).toBeVisible();
  });

  test('names the record the build is already in, leaving nothing behind', async ({ page }) => {
    // Revised 2026-08-25: a manual save consumes the unnamed record these edits
    // were autosaved into, rather than copying the build beside it. A Commander
    // who saves their work finds one entry, not the same build twice (FR-008).
    await createBuild(page);
    await reachShellLink(page, 'Open saved build');

    await chooseRecord(page, 'Anaconda');
    await page.getByRole('button', { name: 'Save Anaconda under a name' }).click();
    const dialog = page.getByRole('dialog', { name: 'Save this build' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Anaconda explorer');
    await dialog.getByRole('button', { name: 'Save as a new build' }).click();

    await expect(page.getByRole('heading', { name: 'Named builds', exact: true })).toBeVisible();
    await expect(page.getByText('Anaconda explorer').first()).toBeVisible();
    expect(await recordCount(page)).toBe(1);
  });

  test('warns about a duplicate name and still saves a separate build', async ({ page }) => {
    await seed(page, [seedRecord('a', { name: 'Anaconda explorer' })]);
    await createBuild(page);
    await reachShellLink(page, 'Open saved build');

    // The seeded save is also titled "Anaconda …", so the row is taken from the
    // unnamed group rather than by a title both rows start with.
    await chooseFirstUnnamed(page);
    await page.getByRole('button', { name: 'Save Anaconda under a name' }).click();
    const dialog = page.getByRole('dialog', { name: 'Save this build' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Anaconda explorer');

    await expect(dialog.getByText(/already use this name/i)).toBeVisible();
    await dialog.getByRole('button', { name: 'Save as a new build' }).click();

    // The build that was already stored, and the record this build was in,
    // which the save named rather than duplicated.
    expect(await recordCount(page)).toBe(2);
  });

  test('duplicates a build under a new identity', async ({ page }) => {
    await seed(page, [seedRecord('a')]);
    await page.goto('/builds');

    await chooseRecord(page, 'Build a');
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

    await chooseRecord(page, 'Build a');
    await page.getByRole('button', { name: 'Delete Build a' }).click();
    const dialog = page.getByRole('dialog', { name: /Build a/ });
    await expect(dialog.getByText(/cannot be undone/i)).toBeVisible();

    await dialog.getByRole('button', { name: 'Keep this build' }).click();
    expect(await page.evaluate(() => localStorage.getItem('edsb:record:a'))).not.toBeNull();

    await page.getByRole('button', { name: 'Delete Build a' }).click();
    await page
      .getByRole('dialog', { name: /Build a/ })
      .getByRole('button', { name: 'Delete this build' })
      .click();

    expect(await page.evaluate(() => localStorage.getItem('edsb:record:a'))).toBeNull();
  });

  test('deletes only the record that was confirmed', async ({ page }) => {
    await seed(page, [seedRecord('a'), seedRecord('b')]);
    await page.goto('/builds');

    await chooseRecord(page, 'Build a');
    await page.getByRole('button', { name: 'Delete Build a' }).click();
    await page
      .getByRole('dialog', { name: /Build a/ })
      .getByRole('button', { name: 'Delete this build' })
      .click();

    const stored = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')),
    );
    expect(stored).toEqual(['edsb:record:b']);
  });

  test('opens a stored build into the workspace', async ({ page }) => {
    await seed(page, [seedRecord('a')]);
    await page.goto('/builds');

    await openRecord(page, 'Build a');

    await expect(page.getByText('Anaconda').first()).toBeVisible();
  });

  test('narrows the list to what was searched for, and says how many are shown', async ({
    page,
  }) => {
    await seed(page, [
      seedRecord('a', { name: 'Anaconda explorer' }),
      seedRecord('b', {
        name: 'Python trader',
        hullSymbol: 'Python',
        build: {
          format: 'edsb.build',
          version: 1,
          shipSymbol: 'Python',
          shipName: null,
          shipIdent: null,
          modules: [],
        },
      }),
    ]);
    await page.goto('/builds');
    await expect(page.getByText('2 builds stored')).toBeVisible();

    await page.getByRole('textbox', { name: 'Search these builds' }).fill('python');

    await expect
      .poll(() => page.locator('.library__count').innerText(), { timeout: 5_000 })
      .toBe('1 of 2 builds shown');
    await expect(page.locator('[data-record-id="b"]')).toBeVisible();
    await expect(page.locator('[data-record-id="a"]')).toHaveCount(0);
    // Narrowing changes no record and removes nothing.
    expect(await recordCount(page)).toBe(2);
  });

  test('says nothing matched, and leaves every control reachable', async ({ page }) => {
    await seed(page, [seedRecord('a', { name: 'Anaconda explorer' })]);
    await page.goto('/builds');

    const search = page.getByRole('textbox', { name: 'Search these builds' });
    await search.fill('nothing like this');

    await expect(page.getByText(/Nothing here matches/)).toBeVisible();
    // Widening the search needs no separate action: the field is still there,
    // with what was typed still in it.
    await expect(search).toHaveValue('nothing like this');
    await search.fill('anaconda');
    await expect(page.locator('[data-record-id="a"]')).toBeVisible();
  });

  test('counts the issues a record was saved with, in words as well as a number', async ({
    page,
  }) => {
    await seed(page, [
      seedRecord('a', { name: 'Broken build', validation: { valid: false, complete: false } }),
    ]);
    await page.goto('/builds');

    const row = page.locator('[data-record-id="a"] button');
    await expect(row).toContainText('Invalid');
    // The plate carries the number; the words are in the row's own text, so the
    // plate is never the only carrier.
    await expect(row.locator('.record__issues')).toHaveText('2');
    await expect(row.locator('.record__issues')).toHaveAttribute('aria-hidden', 'true');
    await expect(row).toContainText('issues recorded');
  });

  test('states how long an unnamed record has left, and drops one that ran out', async ({
    page,
  }) => {
    // Ages are seeded through the store rather than waited for: seven days is
    // not a thing to sit through, and the sweep reads `modifiedAt` (FR-013).
    const days = (count: number) =>
      new Date(Date.now() - count * 24 * 60 * 60 * 1000).toISOString();
    await seed(page, [
      seedRecord('fresh', { kind: 'working', name: null, modifiedAt: days(6) }),
      seedRecord('stale', { kind: 'working', name: null, modifiedAt: days(8) }),
    ]);
    await page.goto('/builds');

    // The one with a day left says so; the one that ran out is simply not
    // there, swept before the listing was drawn and announced by nothing.
    await expect(page.locator('[data-record-id="fresh"]')).toContainText(/Deleted in/);
    await expect(page.locator('[data-record-id="stale"]')).toHaveCount(0);
    expect(await recordCount(page)).toBe(1);
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

  test('offers explicit discard when the browser store is full', async ({ page }) => {
    await seed(
      page,
      Array.from({ length: 20 }, (_, index) =>
        // Edited just now: an unnamed record has seven days, and a record
        // stamped with the fixture's own instant would be swept before this
        // journey reached the library (FR-013).
        seedRecord(`w${index}`, {
          kind: 'working',
          name: null,
          modifiedAt: new Date().toISOString(),
        }),
      ),
    );
    await fillStorage(page);
    await openWorkspaceWithBuild(page);

    await expect(page.locator('edsb-build-workspace-page')).toHaveAttribute(
      'data-persistence',
      'quota-full',
    );
    await expect(page.getByText(/storage is full/i)).toBeVisible();
    await reachShellLink(page, 'Open saved build');
    await expect(page.getByRole('heading', { name: 'Choose builds to discard' })).toBeVisible();

    // Nothing was removed to make room, and expiry is never offered as a way
    // out of a full store.
    expect(await recordCount(page)).toBe(20);
  });

  test('discards only the records explicitly selected', async ({ page }) => {
    await seed(
      page,
      Array.from({ length: 20 }, (_, index) =>
        // Edited just now: an unnamed record has seven days, and a record
        // stamped with the fixture's own instant would be swept before this
        // journey reached the library (FR-013).
        seedRecord(`w${index}`, {
          kind: 'working',
          name: null,
          modifiedAt: new Date().toISOString(),
        }),
      ),
    );
    await fillStorage(page);
    await openWorkspaceWithBuild(page);
    await reachShellLink(page, 'Open saved build');

    const manager = page.getByRole('group', { name: 'Choose builds to discard' });
    await manager.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Delete this build' }).click();

    expect(await recordCount(page)).toBe(19);
  });

  test('offers overwrite, keep both and cancel when two pages save one build', async ({
    browser,
  }) => {
    // Two pages, four navigations, an autosave and a named save each: this is
    // the longest journey in the suite, and on a loaded machine it runs past the
    // default budget without anything being wrong with it.
    test.slow();
    const context = await browser.newContext();
    const first = await context.newPage();
    const second = await context.newPage();

    // Waiting for the save is the precondition, not a convenience: the library
    // lists what is stored, and autosave coalesces before it writes.
    await createBuild(first);
    await reachShellLink(first, 'Open saved build');
    await chooseRecord(first, 'Anaconda');
    await first.getByRole('button', { name: 'Save Anaconda under a name' }).click();
    const saveDialog = first.getByRole('dialog', { name: 'Save this build' });
    await saveDialog.getByRole('textbox', { name: 'Name' }).fill('Shared build');
    await saveDialog.getByRole('button', { name: 'Save as a new build' }).click();
    await expect(first.getByText('Shared build').first()).toBeVisible();

    // The other page opens the same named record, so both hold the same baseline.
    await second.goto('/builds');
    await openRecord(second, 'Shared build');

    await first.goto('/builds');
    await openRecord(first, 'Shared build');

    // One page saves; the other's baseline is now stale.
    await reachShellLink(second, 'Open saved build');
    await chooseRecord(second, 'Shared build');
    await second.getByRole('button', { name: 'Rename Shared build' }).click();
    const otherDialog = second.getByRole('dialog', { name: 'Save this build' });
    await otherDialog.getByRole('textbox', { name: 'Name' }).fill('From the other page');
    await otherDialog.getByRole('button', { name: 'Replace the build I opened' }).click();

    await reachShellLink(first, 'Open saved build');
    // By the time this page looks, the listing has already re-read storage and
    // shows the other page's name — which is the point: the *record* is the
    // same one, and this page's baseline is the stale part.
    await chooseRecord(first, 'From the other page');
    await first
      .getByRole('button', { name: /^Rename / })
      .first()
      .click();
    const mineDialog = first.getByRole('dialog', { name: 'Save this build' });
    await mineDialog.getByRole('textbox', { name: 'Name' }).fill('From this page');
    await mineDialog.getByRole('button', { name: 'Replace the build I opened' }).click();

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

    await chooseRecord(page, 'Build a');
    await page.getByRole('button', { name: 'Delete Build a' }).click();
    await expect(page.getByRole('dialog', { name: /Build a/ })).toBeVisible();
    await expectNoAccessibilityViolations(page, testInfo, { label: 'library-delete-confirmation' });
  });
});
