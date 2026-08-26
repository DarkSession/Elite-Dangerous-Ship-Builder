import { expect, test, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow } from './accessibility/assertions';
import { openRecordFromLibrary } from './shell';

/**
 * The `BUILD STATUS` block, end to end.
 *
 * What is checked here is mostly that this block says exactly what canvases 1c
 * and 1d draw and nothing more. Three spec-versus-canvas collisions were ruled
 * in the design's favour in wave 11, so the assertions that matter most are the
 * ones that fail if the withdrawn surface — counts, a structural-facts list, an
 * all-clear line, a per-issue slot action, a wide Status tab — comes back
 * (`specs/003-ship-statistics/design/reference-review.md`, rulings A–C).
 */

const HULL = 'Anaconda';

const rail = (page: Page) => page.locator('.outfitting__status-rail');
const issues = (page: Page) => page.locator('edsb-build-status .issue');

/**
 * A stored build naming mounts the hull does not have.
 *
 * Seeded rather than journeyed to, because the product offers no way to fit an
 * impossible module: the chooser lists only what the package accepts. A build
 * carrying one arrives from somewhere else — another tool's export, an older
 * game version, a hand-edited record — and this is that build, reaching the
 * workspace through the one ingress pipeline every path shares. There is no
 * repair step in it, so the package's own verdict is what the rail draws.
 */
function seedInvalidRecord(id: string, slots: readonly string[]) {
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
      hullSymbol: HULL,
      validation: { valid: false, complete: false },
      build: {
        format: 'edsb.build',
        version: 1,
        shipSymbol: HULL,
        shipName: null,
        shipIdent: null,
        modules: slots.map((slot) => ({
          slot,
          symbol: 'Int_CargoRack_Size5_Class1',
          enabled: null,
          priority: null,
          preEngineered: null,
          engineering: null,
        })),
      },
      sourceNamed: null,
    }),
  };
}

async function seed(page: Page, entries: readonly { key: string; value: string }[]): Promise<void> {
  await page.addInitScript((seeded) => {
    for (const { key, value } of seeded) {
      localStorage.setItem(key, value);
    }
  }, entries);
}

/** Creates a stock build and lands in the workspace with the rail rendered. */
async function openStockBuild(page: Page): Promise<void> {
  await page.goto(`/ships/${HULL}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(rail(page)).toBeVisible();
}

/** Opens a seeded record and lands in the workspace with the rail rendered. */
async function openSeededBuild(page: Page, id: string): Promise<void> {
  await page.goto('/builds');
  await openRecordFromLibrary(page, `Build ${id}`);
  await expect(rail(page)).toBeVisible();
}

test.describe('the BUILD STATUS block', () => {
  test('opens the rail with the heading the canvas draws', async ({ page }) => {
    await openStockBuild(page);

    // The canvas draws this heading; the region is named by it rather than by
    // an invisible label, which is why it is asserted as visible text.
    await expect(
      rail(page).getByText(englishMessages['outfitting.status-rail.label'], { exact: true }),
    ).toBeVisible();
  });

  test('draws nothing for a build the package raises no issue about', async ({ page }) => {
    await openStockBuild(page);

    // Ruling A. No all-clear line, no zero count, no structural-facts list —
    // the region simply has nothing to say, exactly as the canvas draws it.
    await expect(issues(page)).toHaveCount(0);
    await expect(rail(page).getByText(/valid/i)).toHaveCount(0);
    await expect(rail(page).getByText(/complete/i)).toHaveCount(0);
  });

  test('draws one block per package issue, naming its severity', async ({ page }) => {
    await seed(page, [seedInvalidRecord('a', ['NoSuchSlotA', 'NoSuchSlotB'])]);
    await openSeededBuild(page, 'a');

    await expect(issues(page)).toHaveCount(2);
    // Both mounts are named, each in its own block, once.
    await expect(issues(page).nth(0)).toContainText('NoSuchSlotA');
    await expect(issues(page).nth(1)).toContainText('NoSuchSlotB');
    // FR-022: the severity is a word, not just a coloured marker.
    await expect(issues(page).nth(0)).toContainText(englishMessages['build-status.severity.error']);
  });

  test('offers no action on an issue', async ({ page }) => {
    await seed(page, [seedInvalidRecord('a', ['NoSuchSlotA'])]);
    await openSeededBuild(page, 'a');

    // Ruling A. Nothing in the canvas's block is interactive, and the ledger a
    // per-issue slot action would reach is on the same screen.
    await expect(issues(page).locator('button, a, [role="button"]')).toHaveCount(0);
  });

  test('keeps the withdrawn Status capability withdrawn', async ({ page }) => {
    await openStockBuild(page);

    // Ruling B. Canvas 1c draws five capability tabs and no Status mode, so
    // there is no control anywhere that opens one.
    await expect(page.getByRole('button', { name: /open .*status/i })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /status/i })).toHaveCount(0);
  });

  test('carries none of the viewing conditions ruling C withdrew', async ({ page }) => {
    await openStockBuild(page);

    // Ruling C. Feature 003 builds no condition control and owns no condition
    // state. What it withdrew is the draft this feature would have carried —
    // three pip fields, a running total and an Apply/Reset pair — together with
    // the load and hardpoint controls: the canvas draws no load control
    // anywhere, and its `DEPLOYED` / `RETRACTED` toggle is inside the Power
    // capability rather than in this rail.
    await expect(rail(page).getByRole('button', { name: /apply|reset/i })).toHaveCount(0);
    await expect(rail(page).getByRole('spinbutton')).toHaveCount(0);
    await expect(rail(page).getByText(/laden|deployed|retracted/i)).toHaveCount(0);

    // The pips are deliberately not asserted absent. They are feature 005's one
    // viewing condition, and canvas 1c has drawn that control in this rail since
    // its 2026-08-25 revision — so a rail without them is that feature's open
    // task, not this feature's guarantee, and asserting their absence here would
    // make feature 003 the thing that fails when 005 draws what the canvas draws
    // (`design/status-rail.md`, item 4; `specs/005-power-and-heat/tasks.md`,
    // T074).
  });

  test('reads with no violation, and without widening the document', async ({ page }, testInfo) => {
    await seed(page, [seedInvalidRecord('a', ['NoSuchSlotA', 'NoSuchSlotB'])]);
    await openSeededBuild(page, 'a');

    await expect(issues(page)).toHaveCount(2);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'build-status' });
    await expectNoDocumentOverflow(page);
  });
});
