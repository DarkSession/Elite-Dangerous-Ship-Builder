import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * The on-foot outfitting bench.
 *
 * Feature 013's journeys: assembling a loadout and reading what it is worth
 * (US1), and fitting modifications and reading what they cost (US2).
 */

test.describe('the bench has an address of its own', () => {
  test('opens at /equipment without going through another screen', async ({ page }) => {
    // Directly, not by clicking through the ship tool: an address a Commander
    // can bookmark and return to (013/FR-027).
    await page.goto('/equipment');

    await expect(page.locator('main .bench')).toBeVisible();
  });

  test('names both tools in the shell, and marks the one that is open', async ({ page }) => {
    await page.goto('/equipment');

    const tools = page.locator('.frame__tools .frame__tool');
    await expect(tools).toHaveText(['Ship Builder', 'Equipment Builder']);
    await expect(page.locator('.frame__tool--current')).toHaveText('Equipment Builder');

    await page.goto('/ships');
    await expect(page.locator('.frame__tool--current')).toHaveText('Ship Builder');

    // How a Commander arrives from outside: a shared loadout is `/equipment#e.…`
    // and a shared build is `/outfitting#s.…`. The router reports the fragment as
    // part of the address, and matched whole it named no tool at all — which is
    // the one screen where a Commander most needs the bar to say where they are
    // (Commander request 2026-09-04).
    await page.goto('/equipment#e.notaloadout');
    await expect(page.locator('.frame__tool--current')).toHaveText('Equipment Builder');

    await page.goto('/outfitting#s.notabuild');
    await expect(page.locator('.frame__tool--current')).toHaveText('Ship Builder');
  });
});

/**
 * Assembling a loadout and reading what it is worth (US1).
 *
 * Written to be true at every width. Wide is artboard `1a` — three columns at
 * once — and compact is `1b`, where the item view replaces the ledger and the
 * stats are a tab; the helpers below say which of the two is in front of them
 * rather than pinning either.
 */

/**
 * The rows of whichever chooser is open.
 *
 * Both choosers draw the same row and a closed layer keeps its content in the
 * document, so an unscoped `.choice` resolves to the suit list whatever is in
 * front of a Commander.
 */
function choices(page: Page): Locator {
  return page.locator('.chooser__choices .choice');
}

/** Opens the bench and waits for it: it always opens on the gate (canvas 2a). */
async function openBench(page: Page): Promise<void> {
  await page.goto('/equipment');
  await expect(page.locator('.gate')).toBeVisible();
}

/**
 * Wears a suit: from the gate on an empty bench, or from the suit's own chooser.
 *
 * The gate's cards are the same rows the chooser draws, so the two paths differ
 * only in where the list stands.
 */
async function chooseSuit(page: Page, name: string): Promise<void> {
  const gate = page.locator('.gate__suits .choice');
  if ((await gate.count()) > 0) {
    await gate.filter({ hasText: name }).click();
    await expect(page.locator('.gate')).toHaveCount(0);
    return;
  }
  await openRow(page, 'suit');
  const list = swapList(page);
  await pickSwap(list.filter({ hasText: name }));
}

/**
 * The rows a Commander swaps from, wherever the composition draws them.
 *
 * Canvas 1a lists them inline under the modification slots, always on screen;
 * canvas 1b has no room beside the item and opens the same rows in a sheet, so
 * the control that opens it stands where the list would have been.
 */
function swapList(page: Page): Locator {
  return page.locator('.item__alternatives .choice');
}

/** Chooses one of them. */
async function pickSwap(row: Locator): Promise<void> {
  await row.click();
}

/** Opens one ledger row in the item view, at either composition. */
async function openRow(page: Page, target: string): Promise<void> {
  // The bench has to be drawn before its arrangement can be read. A page still
  // booting has no region at all and `count()` answers 0 for every one of them,
  // so an unguarded read takes "no ledger" to mean "drilled in" and waits out
  // the test looking for a back control on a screen that is not there yet —
  // which is how a fresh load of a shared link timed out at 60s on the compact
  // projects (CI, 2026-09-04). The page's own host is what says it has booted:
  // no region is drawn in every arrangement, and the compact bench draws one
  // tab at a time.
  await expect(page.locator('ednb-equipment-bench-page')).toBeAttached();

  await showTab(page, 'Loadout');
  if ((await page.locator('.bench__region--loadout').count()) === 0) {
    await page.locator('.item__back').click();
  }
  await page.locator(`.ledger__row[data-target="${target}"]`).click();
  // Wide keeps the item column on screen while its contents change, so waiting
  // for the column says nothing. Wait for it to be about this row.
  await expect(page.locator(`.item[data-target="${target}"]`)).toBeVisible();
}

/** Selects a compact tab. The wide composition draws every region at once. */
async function showTab(page: Page, label: string): Promise<void> {
  const tab = page.getByRole('tab', { name: label });
  if ((await tab.count()) > 0) {
    await tab.click();
  }
}

async function ledgerRow(page: Page, target: string): Promise<Locator> {
  await showTab(page, 'Loadout');
  if ((await page.locator('.bench__region--loadout').count()) === 0) {
    await page.locator('.item__back').click();
  }
  return page.locator(`.ledger__row[data-target="${target}"]`);
}

test.describe('assembling a loadout', () => {
  test.beforeEach(async ({ page }) => {
    await openBench(page);
  });

  test('offers the mounts the chosen suit carries, and states its figures', async ({ page }) => {
    await chooseSuit(page, 'Dominator Suit');

    // The catalogue's three mounts, all of them offered by this suit.
    await expect(await ledgerRow(page, 'PrimaryWeapon1')).toBeEnabled();
    await expect(await ledgerRow(page, 'PrimaryWeapon2')).toBeEnabled();
    await expect(await ledgerRow(page, 'SecondaryWeapon')).toBeEnabled();

    await showTab(page, 'Stats');
    await expect(page.locator('.bench__region--stats .metric')).toHaveCount(2);
    // The canvas's `ARMOUR` block over `SHIELDS`, both drawn from the one
    // published set (FR-006).
    await expect(page.locator('.bench__region--stats ednb-resistance-bar')).toHaveCount(8);
  });

  test('fills every resistance bar from its midline, the way it reads', async ({ page }) => {
    // The 2026-09-04 canvas revision anchors a bar at the centre of its track:
    // a positive resistance runs to the trailing edge and a negative one to the
    // leading edge, so the two never draw alike (013 design/equipment-bench.md).
    await chooseSuit(page, 'Dominator Suit');
    await showTab(page, 'Stats');
    await expect(page.locator('.bench__region--stats ednb-resistance-bar').first()).toBeVisible();

    const bars = await page
      .locator('.bench__region--stats ednb-resistance-bar')
      .evaluateAll((elements) =>
        elements.map((bar) => {
          const track = bar.querySelector('.resistance__track')!.getBoundingClientRect();
          const fill = bar.querySelector('.resistance__fill')!.getBoundingClientRect();
          const figure = bar.querySelector('.resistance__value')!.textContent ?? '';
          const middle = (track.left + track.right) / 2;
          return {
            // A minus sign of either kind: the figure is formatted for the
            // locale, and `Intl` writes one of the two.
            negative: /^[-\u2212]/.test(figure.trim()),
            fromMiddle: Math.abs(
              (/^[-\u2212]/.test(figure.trim()) ? fill.right : fill.left) - middle,
            ),
            // Which side of the midline the fill actually runs.
            towardsLeading: fill.right <= middle + 1,
            towardsTrailing: fill.left >= middle - 1,
            // Half scale: a bar can reach one end of the track and no further.
            withinHalf: fill.width <= track.width / 2 + 1,
          };
        }),
      );

    expect(bars.length).toBe(8);
    for (const bar of bars) {
      expect(bar.fromMiddle).toBeLessThanOrEqual(1);
      expect(bar.withinHalf).toBe(true);
      expect(bar.negative ? bar.towardsLeading : bar.towardsTrailing).toBe(true);
    }
  });

  test('restates the shields when the suit’s grade is raised', async ({ page }) => {
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'suit');
    await page.locator('.grade').first().click();

    await showTab(page, 'Stats');
    const strength = page.locator('.bench__region--stats .metric__number').first();
    const atGradeOne = await strength.textContent();

    await openRow(page, 'suit');
    await page.locator('.grade').last().click();
    await showTab(page, 'Stats');

    await expect(strength).not.toHaveText(atGradeOne ?? '');
  });

  test('fits a weapon on a mount and counts it in the firepower', async ({ page }) => {
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'PrimaryWeapon1');
    const list = swapList(page);
    const chosen = (await list.first().locator('.choice__name').textContent())?.trim() ?? '';
    await pickSwap(list.first());

    await expect(await ledgerRow(page, 'PrimaryWeapon1')).toContainText(chosen);

    await showTab(page, 'Stats');
    // One row per catalogue mount, with a dash against the two carrying nothing:
    // which mounts answer a figure is itself something to read (FR-006).
    const firepower = page.locator('.bench__region--stats .stats__row');
    await expect(firepower).toHaveCount(3);
    await expect(firepower.first()).toContainText(chosen);
  });

  test('offers the Flight Suit one grade, and says it takes no modification', async ({ page }) => {
    await chooseSuit(page, 'Flight Suit');
    await openRow(page, 'suit');

    await expect(page.locator('.grade')).toHaveCount(1);
    await expect(page.locator('.item__notice')).toBeVisible();
  });
});

test.describe('a mount the worn suit does not carry', () => {
  test('draws no row for it, and gives the weapon back with the suit', async ({ page }) => {
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');

    // The Dominator's second primary, filled.
    await openRow(page, 'PrimaryWeapon2');
    const list = swapList(page);
    const held = (await list.first().locator('.choice__name').textContent())?.trim() ?? '';
    await pickSwap(list.first());

    // The Maverick carries one primary, so the second stops being drawn: the
    // bench lists the mounts the worn suit carries rather than the catalogue's
    // (Commander request 2026-09-04). The weapon is not lost (FR-007).
    await chooseSuit(page, 'Maverick Suit');
    await expect(page.locator('.ledger__row[data-target="PrimaryWeapon2"]')).toHaveCount(0);

    // And it comes back intact on a suit that carries the mount again.
    await chooseSuit(page, 'Dominator Suit');
    const returned = await ledgerRow(page, 'PrimaryWeapon2');
    await expect(returned).not.toHaveAttribute('aria-disabled', 'true');
    await expect(returned).toContainText(held);
  });
});

/**
 * Fitting modifications and reading what they cost (US2).
 *
 * The claim is the same one the ship tool's cost rail makes: the shopping list
 * is the sum of what is fitted and unlocked, and it moves as choices are made.
 * A modification in a locked slot is held, counted nowhere, and returns intact
 * when the grade that opened its slot comes back (FR-011, FR-014).
 */

/**
 * Sets the open item's grade, and waits for the ladder to say it took.
 *
 * The cells re-render on every choice, so a read taken straight after the click
 * can be a read of the grade before it — which is a total that is right for a
 * loadout the bench is no longer showing.
 */
async function setGrade(page: Page, position: number): Promise<void> {
  const cell = position < 0 ? page.locator('.grade').last() : page.locator('.grade').nth(position);
  await cell.click();
  await expect(cell).toHaveAttribute('data-selected', 'true');
}

/** Opens one of the selected item's four modification slots. */
async function openSlot(page: Page, slot: number): Promise<void> {
  await page.locator(`.slots__slot[data-slot="${slot}"]`).click();
  await expect(page.locator('.chooser__clear')).toBeVisible();
}

/** What the materials region lists, at either composition. */
async function materials(page: Page): Promise<Locator> {
  await showTab(page, 'Materials');
  return page.locator('.bench__region--materials');
}

/** The total under the list, which is what changes as a loadout changes. */
async function materialTotal(page: Page): Promise<string> {
  const region = await materials(page);
  const summary = region.locator('.materials__summary');
  await expect(summary).toBeVisible();
  return ((await summary.textContent()) ?? '').trim();
}

/**
 * Waits for the total to be, or to stop being, one reading.
 *
 * A retrying assertion rather than a read: the list is already drawn before and
 * after a choice, so nothing else in the region changes state to wait on, and a
 * bare read can be taken before the frame that answers the click.
 */
async function expectTotal(page: Page, total: string, changed = false): Promise<void> {
  const summary = (await materials(page)).locator('.materials__summary');
  if (changed) {
    await expect(summary).not.toHaveText(total);
    return;
  }
  await expect(summary).toHaveText(total);
}

test.describe('fitting modifications', () => {
  test('says there is nothing to gather for a loadout that asks for nothing', async ({ page }) => {
    // A suit arrives at its lowest grade with nothing fitted, so there is no
    // climb and no application to pay for. The words are drawn rather than an
    // empty list (FR-013).
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');

    await expect((await materials(page)).locator('.materials__empty')).toBeVisible();
  });

  test.beforeEach(async ({ page }) => {
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'suit');
    await setGrade(page, -1);
  });

  test('fits a modification, counts its materials, and gives them back on removal', async ({
    page,
  }) => {
    // The suit is at grade 5, so the list already carries the climb to it: the
    // requirement covers what a loadout costs to reach, not the modifications
    // alone (FR-014).
    const climb = await materialTotal(page);
    expect(climb).not.toBe('');

    await openRow(page, 'suit');
    await openSlot(page, 0);
    const fitted =
      (await choices(page).first().locator('.choice__name').textContent())?.trim() ?? '';
    await choices(page).first().click();

    await openRow(page, 'suit');
    await expect(page.locator('.slots__slot[data-slot="0"]')).toContainText(fitted);
    const listed = await materials(page);
    await expect(listed.locator('.materials__row').first()).toBeVisible();
    await expectTotal(page, climb, true);

    // Cleared from the chooser rather than from a control that appears on hover.
    await openRow(page, 'suit');
    await openSlot(page, 0);
    await page.locator('.chooser__clear').click();

    await expectTotal(page, climb);
  });

  test('does not offer a recipe another slot already holds (FR-009)', async ({ page }) => {
    await openRow(page, 'suit');
    await openSlot(page, 0);
    const taken =
      (await choices(page).first().locator('.choice__name').textContent())?.trim() ?? '';
    await choices(page).first().click();

    await openRow(page, 'suit');
    await openSlot(page, 1);

    // The 2026-09-04 canvas revision filters it out rather than drawing it
    // refused: the slot it is already in is where a Commander finds it, and the
    // list holds nothing that cannot be chosen.
    await expect(choices(page).filter({ hasText: taken })).toHaveCount(0);
    await expect(choices(page).first()).toBeVisible();
  });
});

test.describe('a slot the grade no longer opens', () => {
  test('holds what is in it, counts nothing for it, and gives it back (FR-011)', async ({
    page,
  }) => {
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');

    // The climb to grade 2 with nothing fitted, which is what the total should
    // come back to once the fourth slot is locked again.
    await openRow(page, 'suit');
    await setGrade(page, 1);
    const grade2 = await materialTotal(page);

    await openRow(page, 'suit');
    await setGrade(page, -1);
    const grade5 = await materialTotal(page);

    await openRow(page, 'suit');
    await openSlot(page, 3);
    const held = (await choices(page).first().locator('.choice__name').textContent())?.trim() ?? '';
    await choices(page).first().click();

    await expectTotal(page, grade5, true);
    const fitted = await materialTotal(page);

    // Grade 2 closes the fourth slot.
    await openRow(page, 'suit');
    await setGrade(page, 1);

    const slot = page.locator('.slots__slot[data-slot="3"]');
    await expect(slot).toHaveAttribute('aria-disabled', 'true');
    await expect(slot).toContainText(held);
    await expectTotal(page, grade2);

    // And back at grade 5 it is fitted again, uncleared.
    await openRow(page, 'suit');
    await setGrade(page, -1);

    await expect(page.locator('.slots__slot[data-slot="3"]')).toContainText(held);
    await expectTotal(page, fitted);
  });
});
