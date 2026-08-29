import { expect, test, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow } from './accessibility/assertions';
import { revealStatusRail } from './outfitting-surfaces';
import { buildStockHull, openRecordFromLibrary } from './shell';

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
const issues = (page: Page) => page.locator('edsb-build-status .issue:not(.issue--valid)');
const allClear = (page: Page) => page.locator('edsb-build-status .issue--valid');

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

/**
 * A stored build whose thrusters carry the fit and its fuel, but not a full hold.
 *
 * The one severity a Commander can reach without an impossible module in the
 * build: the package rates the fitted thrusters below the laden mass, reports
 * `thrusterMassExceeded` as a `warning`, and still calls the build valid and
 * complete. Seeded rather than journeyed to only to keep the test short — every
 * module in it is one the chooser offers.
 */
function seedOverloadedRecord(id: string) {
  const cargo = [
    ['Slot01_Size7', 'Int_CargoRack_Size7_Class1'],
    ['Slot02_Size6', 'Int_CargoRack_Size6_Class1'],
    ['Slot03_Size6', 'Int_CargoRack_Size6_Class1'],
    ['Slot04_Size6', 'Int_CargoRack_Size6_Class1'],
    ['Slot05_Size5', 'Int_CargoRack_Size5_Class1'],
    ['Slot06_Size5', 'Int_CargoRack_Size5_Class1'],
    ['Slot07_Size5', 'Int_CargoRack_Size5_Class1'],
    ['Slot08_Size4', 'Int_CargoRack_Size4_Class1'],
    ['Slot09_Size4', 'Int_CargoRack_Size4_Class1'],
    ['Slot10_Size4', 'Int_CargoRack_Size4_Class1'],
  ] as const;

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
      validation: { valid: true, complete: true },
      build: {
        format: 'edsb.build',
        version: 1,
        shipSymbol: HULL,
        shipName: null,
        shipIdent: null,
        modules: [['MainEngines', 'Int_Engine_Size6_Class1'], ...cargo].map(([slot, symbol]) => ({
          slot,
          symbol,
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
  await buildStockHull(page, 'Build');
  await expect(page).toHaveURL(/\/build(#|$)/);
  // Canvas 1d keeps the rail behind its `STATUS` segment rather than in the
  // flow, so a compact run opens it and a wide one finds it already there.
  await revealStatusRail(page);
  await expect(rail(page)).toBeVisible();
}

/** Opens a seeded record and lands in the workspace with the rail rendered. */
async function openSeededBuild(page: Page, id: string): Promise<void> {
  await page.goto('/builds');
  await openRecordFromLibrary(page, `Build ${id}`);
  await revealStatusRail(page);
  await expect(rail(page)).toBeVisible();
}

test.describe('the BUILD STATUS block', () => {
  test('opens on the same seam every other segment opens on', async ({ page }) => {
    await openStockBuild(page);
    const region = page.locator('.outfitting').first();
    if ((await region.getAttribute('data-composition')) !== 'compact') {
      // The wide composition draws the rail as the third track of canvas 1c's
      // grid, on screen whatever the strip has open, so there is no segment for
      // it and no seam under one.
      await expect(rail(page)).toBeVisible();
      await expect(
        page.locator('.anatomy__modes').getByRole('button', { name: /^status$/i }),
      ).toHaveCount(0);
      return;
    }

    // The panel behind `STATUS` belongs to another region, so the anatomy drew
    // its strip and stopped — keeping the inset under a panel that is not there
    // while the workspace put its band gap after it. Between them they opened a
    // band of empty ground above `BUILD STATUS` that no other segment has
    // (Commander request 2026-08-28).
    const seam = async (panel: string): Promise<number> => {
      const strip = await page.locator('.anatomy__modes').boundingBox();
      const next = await page.locator(panel).first().boundingBox();
      return (next?.y ?? 0) - ((strip?.y ?? 0) + (strip?.height ?? 0));
    };

    const status = await seam('.outfitting__status-rail');

    await page
      .locator('.anatomy__modes')
      .getByRole('button', { name: /^power$/i })
      .click();
    await expect(page.locator('.anatomy__dashboard').first()).toBeVisible();
    const power = await seam('.anatomy__dashboard');

    expect(power).toBeGreaterThan(0);
    expect(Math.abs(status - power)).toBeLessThanOrEqual(1);
  });

  test('opens the rail with the heading the canvas draws', async ({ page }) => {
    await openStockBuild(page);

    // The canvas draws this heading; the region is named by it rather than by
    // an invisible label, which is why it is asserted as visible text.
    await expect(
      rail(page).getByText(englishMessages['outfitting.status-rail.label'], { exact: true }),
    ).toBeVisible();
  });

  test('confirms a build the package raises no issue about', async ({ page }) => {
    await openStockBuild(page);

    // The verdict, either way, and nothing beyond it: no count, no
    // structural-facts list, no completeness claim. Silence here read as a rail
    // that had not loaded (Commander request 2026-08-27, revising FR-015).
    await expect(issues(page)).toHaveCount(0);
    await expect(allClear(page)).toHaveText(englishMessages['build-status.valid']);
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

  test('draws a package warning in its own tier, on a build it still calls valid', async ({
    page,
  }) => {
    await seed(page, [seedOverloadedRecord('w')]);
    await openSeededBuild(page, 'w');

    // The block draws the severity the package states rather than one read off
    // `valid`, so the amber middle tier is reachable on a build with nothing
    // else wrong with it (`design/status-rail.md`).
    await expect(issues(page)).toHaveCount(1);
    await expect(issues(page).nth(0)).toContainText(
      englishMessages['build-status.severity.warning'],
    );
    await expect(issues(page).nth(0)).toHaveClass(/issue--warning/);
    // And the verdict stands above it: the package calls this build valid, and
    // the line is that answer rather than a reading of the issue count.
    await expect(allClear(page)).toHaveText(englishMessages['build-status.valid']);
  });

  test('reads a warning block with no violation either', async ({ page }, testInfo) => {
    await seed(page, [seedOverloadedRecord('w')]);
    await openSeededBuild(page, 'w');

    await expect(issues(page)).toHaveCount(1);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'build-status-warning' });
    await expectNoDocumentOverflow(page);
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
