import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow } from './accessibility/assertions';
import { buildStockHull, reachShellAction } from './shell';

/**
 * Builds arriving from a Commander's own game journal.
 *
 * The journey the canvas draws: files in, a list of what they hold, and one
 * decision — one build opens in the workspace, several are saved and none does.
 * Everything here happens in the browser; nothing is sent anywhere.
 */

/**
 * The journals a Commander might hand over.
 *
 * Relative to the repository root, which is where the suite runs from — the
 * same convention the help journey reads its own source documents by.
 */
const FIXTURES = 'e2e/fixtures/journal/';

/** The one file bound, in bytes. Stated here so the journey names it. */
const FILE_LIMIT_BYTES = 25_000_000;

function layer(page: Page) {
  return page.getByRole('dialog', { name: /import build/i });
}

async function openImport(page: Page): Promise<void> {
  await reachShellAction(page, /^import build$/i);
  await expect(layer(page)).toBeVisible();
}

async function chooseFiles(page: Page, names: readonly string[]): Promise<void> {
  await layer(page)
    .locator('input[type="file"]')
    .setInputFiles(names.map((name) => `${FIXTURES}${name}`));
}

async function submit(page: Page, name: RegExp = /^load build$/i): Promise<void> {
  await layer(page).getByRole('button', { name }).click();
}

function picks(page: Page) {
  return layer(page).getByRole('checkbox');
}

test.describe('reading a journal', () => {
  test('lists what the chosen files hold, newest first, with the newest chosen', async ({
    page,
  }) => {
    await page.goto('/ships');
    await openImport(page);
    await chooseFiles(page, ['Journal.ship-multiple.log']);

    await expect(layer(page).getByText(/Journal\.ship-multiple\.log · 3 builds/)).toBeVisible();
    await expect(picks(page)).toHaveCount(3);
    await expect(layer(page).getByText(/3 builds found/)).toBeVisible();

    // Newest first, and the newest is the one already chosen.
    await expect(picks(page).first()).toBeChecked();
    await expect(
      layer(page)
        .getByText(/NIGHT WATCH|Night Watch/)
        .first(),
    ).toBeVisible();
  });

  test('lists a build two files both hold exactly once', async ({ page }) => {
    await page.goto('/ships');
    await openImport(page);
    await chooseFiles(page, ['Journal.ship-multiple.log', 'Journal.ship-overlap.log']);

    await expect(layer(page).getByText(/2 files · 4 builds/)).toBeVisible();
    await expect(picks(page)).toHaveCount(4);
  });

  test('names the files it read when none of them holds a build', async ({ page }) => {
    await page.goto('/ships');
    await openImport(page);
    await chooseFiles(page, ['Journal.no-loadout.log']);

    await expect(
      layer(page).getByText(/No loadout event was found in Journal\.no-loadout\.log/),
    ).toBeVisible();
    await expect(picks(page)).toHaveCount(0);
  });

  test('refuses a file over the stated bound, by name', async ({ page }) => {
    await page.goto('/ships');
    await openImport(page);
    await layer(page)
      .locator('input[type="file"]')
      .setInputFiles([
        {
          name: 'Journal.enormous.log',
          mimeType: 'text/plain',
          buffer: Buffer.alloc(FILE_LIMIT_BYTES + 1, 0x20),
        },
      ]);

    await expect(layer(page).getByText(/Journal\.enormous\.log is larger than/)).toBeVisible();
    await expect(picks(page)).toHaveCount(0);
  });
});

test.describe('what a Commander chooses', () => {
  test('opens one chosen build in the workspace', async ({ page }) => {
    await page.goto('/ships');
    await openImport(page);
    await chooseFiles(page, ['Journal.ship-multiple.log']);
    await submit(page);

    await expect(page).toHaveURL(/\/outfitting($|[#?])/);
    // The build the newest event describes: the ship a Commander named, on the
    // hull that event named. The bar carries both.
    await expect(page.getByRole('banner')).toContainText(/night watch/i);
  });

  test('saves every chosen build, opens none, and shows the saved builds', async ({ page }) => {
    await page.goto('/ships/Anaconda');
    await buildStockHull(page, 'Build');
    await expect(page).toHaveURL(/\/outfitting/);

    await openImport(page);
    await chooseFiles(page, ['Journal.ship-multiple.log']);
    await expect(picks(page)).toHaveCount(3);
    // By index rather than by handle: choosing one redraws the list, so a
    // handle taken before the redraw names a row that is no longer there.
    for (let row = 0; row < 3; row += 1) {
      if (!(await picks(page).nth(row).isChecked())) {
        await picks(page).nth(row).click();
      }
    }
    await expect(layer(page).getByText(/3 selected/)).toBeVisible();
    await submit(page, /^load 3 builds$/i);

    // The records, not the workspace: nothing was opened, and the layer that
    // opens is where the Commander chooses what to open (016/FR-010).
    const library = page.getByRole('dialog', { name: /saved builds/i });
    await expect(library).toBeVisible();
    await expect(library.getByText(/3 builds imported/i)).toBeVisible();
    await expect(library.getByText(/Night Watch/)).toBeVisible();
    await expect(library.getByText(/NW-02/)).toBeVisible();
  });

  test('refuses to load with nothing chosen', async ({ page }) => {
    await page.goto('/ships');
    await openImport(page);
    await chooseFiles(page, ['Journal.ship-multiple.log']);
    await picks(page).first().click();

    await expect(layer(page).getByRole('button', { name: /^load build$/i })).toBeDisabled();
  });
});

test.describe('the panel', () => {
  test('is readable, scans clean and never scrolls the document sideways', async ({
    page,
  }, testInfo) => {
    await page.goto('/ships');
    await openImport(page);
    await chooseFiles(page, ['Journal.ship-multiple.log']);
    await expect(picks(page)).toHaveCount(3);

    await expectNoDocumentOverflow(page);
    await expectNoAccessibilityViolations(page, testInfo);
  });

  test('sends nothing anywhere while a journal is read', async ({ page }) => {
    await page.goto('/ships');
    const origin = new URL(page.url()).origin;
    const foreign: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) {
        foreign.push(request.url());
      }
    });

    await openImport(page);
    await chooseFiles(page, ['Journal.ship-multiple.log', 'Journal.ship-overlap.log']);
    await expect(picks(page)).toHaveCount(4);
    await submit(page);
    await expect(page).toHaveURL(/\/outfitting($|[#?])/);

    expect(foreign).toEqual([]);
  });
});

/**
 * The same journey on the bench.
 *
 * A suit loadout is read by the package from the same journal files, and the
 * one decision is the same one: one loadout opens on the bench, several are
 * saved and none does (016/FR-014, FR-017).
 */
test.describe('the equipment bench', () => {
  const benchLayer = (page: Page) => page.getByRole('dialog', { name: /import loadout/i });

  async function openBenchImport(page: Page): Promise<void> {
    await page.goto('/equipment');
    await page.getByRole('button', { name: /^import a journal event$/i }).click();
    await expect(benchLayer(page)).toBeVisible();
  }

  async function chooseBenchFiles(page: Page, names: readonly string[]): Promise<void> {
    await benchLayer(page)
      .locator('input[type="file"]')
      .setInputFiles(names.map((name) => `${FIXTURES}${name}`));
  }

  test('lists the loadouts a journal holds, newest first', async ({ page }, testInfo) => {
    await openBenchImport(page);
    await chooseBenchFiles(page, ['Journal.suit-multiple.log']);

    await expect(
      benchLayer(page).getByText(/Journal\.suit-multiple\.log · 3 loadouts/),
    ).toBeVisible();
    await expect(benchLayer(page).getByRole('checkbox')).toHaveCount(3);
    await expect(benchLayer(page).getByRole('checkbox').first()).toBeChecked();
    await expect(benchLayer(page).getByText(/Double Trouble/)).toBeVisible();

    await expectNoDocumentOverflow(page);
    await expectNoAccessibilityViolations(page, testInfo);
  });

  test('opens one chosen loadout on the bench', async ({ page }) => {
    await openBenchImport(page);
    await chooseBenchFiles(page, ['Journal.suit-multiple.log']);
    await benchLayer(page)
      .getByRole('button', { name: /^load loadout$/i })
      .click();

    // The bench, not the gate: a suit is worn, and it is the one the newest
    // event described.
    await expect(benchLayer(page)).toBeHidden();
    await expect(page.locator('.gate')).toHaveCount(0);
    await expect(page.getByRole('main')).toContainText(/G5/);
  });

  test('saves every chosen loadout and opens the saved builds', async ({ page }) => {
    await openBenchImport(page);
    await chooseBenchFiles(page, ['Journal.suit-multiple.log']);
    const rows = benchLayer(page).getByRole('checkbox');
    await expect(rows).toHaveCount(3);
    for (let row = 0; row < 3; row += 1) {
      if (!(await rows.nth(row).isChecked())) {
        await rows.nth(row).click();
      }
    }
    await benchLayer(page)
      .getByRole('button', { name: /^load 3 loadouts$/i })
      .click();

    const library = page.getByRole('dialog', { name: /saved builds/i });
    await expect(library).toBeVisible();
    // The library is one library, and it counts records in its own word.
    await expect(library.getByText(/3 builds imported/i)).toBeVisible();
    await expect(library.getByText(/Double Trouble/)).toBeVisible();
    await expect(library.getByText(/Quiet Approach/)).toBeVisible();
    // The bench is still empty: a batch opens nothing (016/FR-017).
    await library
      .getByRole('button', { name: /^close|^dismiss/i })
      .first()
      .click();
    await expect(page.locator('.gate')).toHaveCount(1);
  });

  test('names the files it read when none of them holds a loadout', async ({ page }) => {
    await openBenchImport(page);
    await chooseBenchFiles(page, ['Journal.ship-multiple.log']);

    await expect(
      benchLayer(page).getByText(/No suit loadout event was found in Journal\.ship-multiple\.log/),
    ).toBeVisible();
  });
});
