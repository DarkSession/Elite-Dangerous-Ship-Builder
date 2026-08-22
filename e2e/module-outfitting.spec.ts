import { expect, test, type Page } from '@playwright/test';
import { publishedSlotKeys, sweepOutfittingState } from './accessibility';
import {
  chooserOffered,
  editorOffered,
  fitCommitted,
  openChooser,
  openEditor,
  surfacesAreLayers,
} from './outfitting-surfaces';
import { savedToBrowser } from './shell';

/**
 * Fitting modules, end to end (US1).
 *
 * The claim being checked is parity: what the ledger shows is what
 * `loadout.slots()` says is there, key for key, including the mounts a
 * Commander cannot change. Everything else in this file follows from that — a
 * fit, a replacement, a removal and a refusal are all checked by looking at the
 * ledger afterwards, because the ledger is the build.
 */

/** Creates a stock build and lands in the workspace with the ledger rendered. */
async function openStockBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
}

/**
 * Selects one mount by its exact game slot key.
 *
 * Waits on the row's own pressed state rather than on the bench appearing. The
 * bench is already there when another mount is selected, so waiting for it
 * proves nothing and lets the next click land on a control that is still being
 * replaced.
 */
async function selectMount(page: Page, slotKey: string): Promise<void> {
  const row = page.locator(`[data-slot-key="${slotKey}"] button`).first();
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.replacement__title, .outfitting__bench-title').first()).toBeVisible();
}

/**
 * What the ledger currently says is fitted in one mount.
 *
 * The whole identity, name and code line together, because a module name is not
 * unique: a build can carry four pulse lasers that differ only in their class
 * and rating, and comparing names alone would call a replacement a no-op.
 */
async function fittedIdentityAt(page: Page, slotKey: string): Promise<string | null> {
  return page.locator(`[data-slot-key="${slotKey}"]`).evaluate((node) => {
    const identity = node.querySelector('.identity');
    if (identity === null) {
      return null;
    }
    // The name and the code, as the row draws them. The ledger and the manifest
    // arrange an identity differently — the ledger writes `1D` where the
    // manifest writes it in its own `CLASS` column — so what is compared is the
    // module, not the arrangement.
    const clone = identity.cloneNode(true) as HTMLElement;
    for (const hidden of clone.querySelectorAll('.visually-hidden')) {
      hidden.remove();
    }
    return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
  });
}

/**
 * Asserts one mount now carries the module a chooser row read as.
 *
 * Token by token rather than string against string: the ledger and the manifest
 * arrange an identity differently — the manifest gives the class its own column
 * and the ledger writes it into the row's code line — so what is compared is
 * the module, not the arrangement.
 */
async function expectLedgerCarries(page: Page, slotKey: string, identity: string): Promise<void> {
  const fitted = (await fittedIdentityAt(page, slotKey))?.toLowerCase() ?? '';
  for (const token of identity.split(/[·\s]+/).filter((part) => part.length > 1)) {
    expect(fitted, `${slotKey} does not read as ${identity}`).toContain(token.toLowerCase());
  }
}

/** The text a sighted Commander actually reads, with hidden text removed. */
async function renderedText(page: Page, selector: string): Promise<string> {
  return page.locator(selector).evaluate((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    for (const hidden of clone.querySelectorAll('.visually-hidden')) {
      hidden.remove();
    }
    return clone.textContent ?? '';
  });
}

/**
 * Opens the chooser for the selected mount, picks one row and confirms.
 *
 * Returns what the chosen row read as, so a caller can assert the ledger now
 * says the same thing. The mount stays selected afterwards, which is what the
 * bench does after a fit — so a second call replaces rather than re-selecting.
 */
async function fitFromChooser(
  page: Page,
  pick: (identities: readonly string[]) => number,
): Promise<string> {
  await openChooser(page);
  const rows = page.locator('.candidate');
  await expect(rows.first()).toBeVisible();

  // The same reading the ledger gives: the module's name and mount, with the
  // class column folded in the way the ledger's own code line writes it.
  const identities = await rows.evaluateAll((nodes) =>
    nodes.map((node) => {
      const drawn = (element: Element | null): string => {
        if (element === null) {
          return '';
        }
        // What a sighted Commander reads. The class cell also spells its code
        // out for anyone who cannot see it, and the ledger has no such line.
        const clone = element.cloneNode(true) as HTMLElement;
        for (const hidden of clone.querySelectorAll('.visually-hidden')) {
          hidden.remove();
        }
        return clone.textContent ?? '';
      };
      return `${drawn(node.querySelector('.candidate__name'))} ${drawn(
        node.querySelector('.candidate__class'),
      )}`
        .replace(/\s+/g, ' ')
        .trim();
    }),
  );
  const index = pick(identities);
  expect(index, 'no choice matched what the test asked for').toBeGreaterThan(-1);

  // The row is the control. Its radio is a 1px box underneath the label's own
  // content, so a pointer — a Commander's or this one's — lands on the label
  // and the label activates the radio, which is the whole reason the row is a
  // label. Reaching past it to click the input asserts an interaction nobody
  // performs, and Firefox refuses it outright.
  //
  // The module's name itself, not the row and not the identity block. A row's
  // centre falls in the gap between the identity and the figures, and the
  // identity block's own centre falls between its name and its code line once
  // the panel is narrow enough to wrap them; Firefox does not activate a label
  // from a click that lands on no content. The name is the one box in the row
  // that is always text.
  const row = rows.nth(index);
  await row.locator('.candidate__name').click();
  await expect(row.locator('input[type="radio"]')).toBeChecked();
  // Canvas 1c draws no confirm control: inline, taking the row is the fit.
  // Canvas 1d's chooser is a screen of its own, so leaving it is a decision.
  if (await surfacesAreLayers(page)) {
    await page.getByRole('button', { name: /fit module/i }).click();
  }
  // Waiting for the decision to have actually been taken, which each width
  // shows differently: a layer closes, an inline panel clears the pick.
  await fitCommitted(page);

  return identities[index] ?? '';
}

test.describe('the slot ledger', () => {
  test('renders every package mount, by exact key, including the cargo hatch', async ({ page }) => {
    await openStockBuild(page);

    const keys = await publishedSlotKeys(page);

    // The Anaconda's own layout, in the package's outfitting order. Asserted
    // against the game's spellings rather than against a count, because a count
    // would still pass if a mount were rendered under the wrong key.
    expect(keys).toContain('HugeHardpoint1');
    expect(keys).toContain('Armour');
    expect(keys).toContain('PowerPlant');
    expect(keys).toContain('CargoHatch');
    expect(keys).toContain('PlanetaryApproachSuite');
    // Every key is unique: two rows sharing one identity would be two views of
    // one mount, and an edit to either would be an edit to both.
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('never renders a game slot key as visible text', async ({ page }) => {
    await openStockBuild(page);

    const visible = await renderedText(page, '.outfitting__ledger');

    // The canvas draws `SIZE · NODE NO.`, not `Slot01_Size7`. The key stays the
    // identity and the assistive-technology text, and nothing else.
    expect(visible).not.toContain('Slot01_Size7');
    expect(visible).not.toContain('HugeHardpoint1');
    expect(visible).not.toContain('CargoHatch');
  });

  test('keeps empty removable mounts visible and selectable', async ({ page }) => {
    await openStockBuild(page);

    const empty = page.locator('[data-slot-key="MediumHardpoint1"]');
    await expect(empty).toContainText(/empty/i);
    await selectMount(page, 'MediumHardpoint1');

    expect(await chooserOffered(page)).toBe(true);
  });

  test('fits, replaces and removes a module, one decision at a time', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');

    // Fit.
    const first = await fitFromChooser(page, () => 0);
    await expect(page.locator('[data-slot-key="MediumHardpoint1"]')).not.toContainText(/empty/i);
    await expectLedgerCarries(page, 'MediumHardpoint1', first);

    // Replace. The choice is picked by what it reads as rather than by its
    // position, so the assertion cannot pass on two rows that happen to match.
    const second = await fitFromChooser(page, (identities) =>
      identities.findIndex((identity) => identity !== first),
    );
    expect(second).not.toBe(first);
    await expectLedgerCarries(page, 'MediumHardpoint1', second);

    // Remove. The mount empties and stays in the ledger to be fitted again.
    // The control is in the chooser's header, which is where canvas 1c draws
    // it — emptying a mount is part of choosing what goes in it.
    await openChooser(page);
    await page.getByRole('button', { name: /remove module/i }).click();
    await expect(page.locator('[data-slot-key="MediumHardpoint1"]')).toContainText(/empty/i);
  });

  test('offers no removal on a required mount, and says why', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'PowerPlant');

    // A missing action with no reason reads as a defect. The Almanac's reason
    // is what makes it read as a rule of the game instead.
    await expect(page.locator('.outfitting__bench-reason')).toContainText(/required/i);
    // It stays replaceable, which is a different thing from removable — and the
    // chooser it stays replaceable through is where removal would have been.
    expect(await chooserOffered(page)).toBe(true);
    await openChooser(page);
    await expect(page.getByRole('button', { name: /remove module/i })).toHaveCount(0);
  });

  test('gives the cargo hatch its facts and no replacement or search', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'CargoHatch');

    expect(await chooserOffered(page)).toBe(false);
    await expect(page.getByRole('button', { name: /remove module/i })).toHaveCount(0);
    await expect(page.locator('.outfitting__bench-reason')).toContainText(/built in/i);
    // The hatch itself is still listed with its module, not hidden away.
    await expect(page.locator('[data-slot-key="CargoHatch"]')).toContainText(/cargo hatch/i);

    // The engineering panel is drawn and says the Almanac offers none, rather
    // than being left out of the bench (wave 9). Opened the way this width
    // offers it: inline it is already there, and at compact width it is a
    // screen reached from the action bar.
    expect(await editorOffered(page)).toBe(true);
    await openEditor(page);
    await expect(page.locator('.engineering__state')).toContainText(/no engineering/i);
  });

  test('stays editable while the build is incomplete', async ({ page }) => {
    await openStockBuild(page);

    // Emptying a mount leaves a build the Almanac calls incomplete. Every other
    // mount still offers everything it offered before.
    await selectMount(page, 'Slot03_Size6');
    await openChooser(page);
    await page.getByRole('button', { name: /remove module/i }).click();

    await selectMount(page, 'Slot02_Size6');
    expect(await chooserOffered(page)).toBe(true);
  });

  test('publishes only the exact game slot key as shared identity', async ({ page }) => {
    await openStockBuild(page);

    const keys = await publishedSlotKeys(page);

    // No positional index ever becomes an identity. The node number the canvas
    // draws is a label; nothing is selected or edited by it, which is why no
    // published identity is a bare ordinal (FR-002).
    for (const key of keys) {
      expect(key, 'a published identity is a bare position').not.toMatch(/^\d+$/);
    }

    // And the exact key is the *only* identity published. Feature 010's anatomy
    // exchanges mounts with this ledger, and the two have to agree on one
    // identity: a second attribute would be a second thing to disagree about.
    const identityAttributes = await page.locator('[data-slot-key]').evaluateAll((nodes) =>
      nodes.flatMap((node) =>
        [...node.attributes]
          .map((attribute) => attribute.name)
          // `data-selected` is drawn state, not identity: it says which row is
          // marked, and it names nothing.
          .filter(
            (name) =>
              name.startsWith('data-') && !['data-slot-key', 'data-selected'].includes(name),
          ),
      ),
    );
    expect([...new Set(identityAttributes)]).toEqual([]);

    // The node number the canvas draws is text on the row, never an identity.
    const nodes = await page
      .locator('.slot__node')
      .evaluateAll((elements) => elements.map((element) => element.textContent?.trim() ?? ''));
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.every((node) => /^\d+$/.test(node))).toBe(true);
  });

  test('marks an empty mount as selected the same way it marks a fitted one', async ({ page }) => {
    // The canvas paints the node from its kind — dashed and withdrawn for
    // `empty`, amber for a fitted mount — but checks the selected branch first
    // and takes every kind: `color = on ? '#0b0b0c' : (util ? … : empty ? … )`.
    // Our empty rule matched at the same specificity and sat after the selected
    // one, so it won, and the one row a Commander is most often looking for was
    // the one row whose marker never said it was selected (wave 9).
    await openStockBuild(page);

    const ink = (key: string) =>
      page.locator(`[data-slot-key="${key}"] .slot__node`).evaluate((element) => {
        const style = getComputedStyle(element);
        return `${style.color} on ${style.backgroundColor}`;
      });

    // Only a hardpoint carries a node number, so both mounts are read off the
    // rows that actually draw one.
    const keyed = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate(
          (element) => element.closest('[data-slot-key]')?.getAttribute('data-slot-key') ?? '',
        );
    const empty = await keyed('.slot:has(.slot__node):has(.slot__empty)');
    const filled = await keyed('.slot:has(.slot__node):not(:has(.slot__empty))');
    expect(empty).not.toBe('');
    expect(filled).not.toBe('');

    await selectMount(page, filled);
    const marked = await ink(filled);
    expect(await ink(empty)).not.toBe(marked);

    await selectMount(page, empty);
    expect(await ink(empty)).toBe(marked);
  });

  test('is accessible in every rendered ledger state', async ({ page }, testInfo) => {
    await openStockBuild(page);
    await sweepOutfittingState(page, testInfo, 'ledger');

    await selectMount(page, 'CargoHatch');
    await sweepOutfittingState(page, testInfo, 'ledger/cargo-hatch selected');

    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);
    await expect(page.getByRole('radio').first()).toBeVisible();
    await sweepOutfittingState(page, testInfo, 'ledger/chooser open');
  });
});

test.describe('package-populated fixed mounts', () => {
  test('arrive fitted before any calculation is read, with no repair state', async ({ page }) => {
    await openStockBuild(page);

    // Every fixed mount carries a module. The application ran no repair pass —
    // this is what the package's own construction returned (FR-010).
    for (const key of ['Armour', 'PowerPlant', 'MainEngines', 'FrameShiftDrive', 'CargoHatch']) {
      await expect(page.locator(`[data-slot-key="${key}"]`), key).not.toContainText(/empty/i);
    }

    // The validation verdict is already published, which means the calculation
    // read happened after construction rather than before it. It is read as
    // state rather than as a banner: the canvas reports a problem and is silent
    // otherwise, so a healthy build draws nothing to look for.
    await expect(page.locator('edsb-build-workspace-page')).toHaveAttribute(
      'data-validation',
      /valid|incomplete|invalid/,
    );
  });

  test('carry no repair provenance into anything the build is saved or shared as', async ({
    page,
  }) => {
    await openStockBuild(page);
    await savedToBrowser(page);

    const stored = await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith('edsb:record:'))
        .map((key) => localStorage.getItem(key) ?? '')
        .join('\n'),
    );

    expect(stored.length).toBeGreaterThan(0);
    // A defaulted mount is ordinary build state. Nothing records that it was
    // defaulted, because there is nothing for a Commander to decide about it.
    expect(stored).not.toContain('defaulted');
    expect(stored).not.toContain('repair');
    expect(stored).not.toContain('sourceSymbol');
    expect(page.url()).not.toContain('defaulted');
  });
});

/**
 * Finding a replacement, end to end (US2).
 *
 * The chooser's order and its four-field search are proved against the package
 * in `candidate-query.spec.ts`. What is checked here is that a Commander
 * actually gets them: that the sections are announced, that a term with the
 * wrong case still finds the module, that nothing matched is a sentence rather
 * than a blank region, and that the list is read again after a fit instead of
 * being remembered.
 */

/** The number the surface draws beside the search — canvas 1d's `24 FIT`. */
async function drawnCount(page: Page): Promise<number> {
  // Canvas 1d draws the count in its screen's header; canvas 1c draws none at
  // all, and the figure is spoken instead. Either way it is one figure, read
  // from wherever this width keeps it (wave 4).
  const text = await page
    .locator('.replacement__count, edsb-candidate-search [role="status"]')
    .first()
    .innerText();
  return Number(text.replace(/\D+/gu, ''));
}

async function search(page: Page, query: string): Promise<void> {
  await page.locator('input[type="search"]').fill(query);
}

test.describe('finding a replacement', () => {
  test('offers every choice the Almanac has for the mount, and says how many', async ({ page }) => {
    await openStockBuild(page);
    // A small hardpoint's whole list is short enough to be built in one page, so
    // the drawn count and the rendered rows are the same number here.
    await selectMount(page, 'SmallHardpoint1');
    await openChooser(page);

    const drawn = await drawnCount(page);
    const rendered = await page.locator('.candidate').count();

    // The count is the list, not a separate claim about it.
    expect(drawn).toBe(rendered);
    expect(drawn).toBeGreaterThan(1);

    // The expansion is stock records *plus* their pre-engineered variants, so a
    // list that offered only stock rows would be missing a whole kind of choice.
    await expect(page.getByText('Pre-engineered', { exact: true }).first()).toBeVisible();
  });

  test('renders the whole expansion, so the scroller knows how tall it is', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);

    const drawn = await drawnCount(page);
    // Every choice, in the document, from the first frame. A list that grew as
    // it was reached could not tell the browser how tall it was, so its bar
    // shrank under the Commander every time it grew (wave 4).
    await expect(page.locator('.candidate')).toHaveCount(drawn);

    // The manifest's own scroller, under the column head rather than around it.
    const scroller = page.locator('.candidates__body');
    // Read once the fonts and the row images have settled. What this test is
    // about is the scroller's height not moving *as the list is reached* — a
    // figure read while a webfont is still swapping in moves for a reason that
    // has nothing to do with how the manifest is rendered.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter((image) => !image.complete)
          .map(
            (image) =>
              new Promise((resolve) => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', resolve, { once: true });
              }),
          ),
      );
    });
    const before = await scroller.evaluate((node) => node.scrollHeight);
    await scroller.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await expect(page.locator('.candidate')).toHaveCount(drawn);
    expect(await scroller.evaluate((node) => node.scrollHeight)).toBe(before);
  });

  test('names its sections and puts the unique rewards last', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'SmallHardpoint1');
    await openChooser(page);

    const headings = await page
      .locator('.candidates__section > h3')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));

    // Neither canvas draws these; they are the structure, named for a reader.
    expect(headings[0]).toMatch(/standard/i);
    expect(headings.at(-1)).toMatch(/unique reward/i);

    const rewardRow = page.locator('.candidates__section').last().locator('.candidate').first();
    await expect(rewardRow).toContainText(/reward only/i);
  });

  test('matches every term, whatever case or accents it is typed in', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);

    // Two terms across two different indexed fields: the module's name and its
    // mount type. Both have to match, and neither is typed the way it is drawn.
    await search(page, 'MULTI-CANNON gimballed');
    await expect(page.locator('.candidate').first()).toBeVisible();

    const identities = await page
      .locator('.candidate .candidate__identity')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ''));

    expect(identities.length).toBeGreaterThan(0);
    for (const identity of identities) {
      expect(identity.toLowerCase()).toContain('multi-cannon');
      expect(identity.toLowerCase()).toContain('gimballed');
    }
  });

  test('never matches a package symbol, however exactly it is typed', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);

    await search(page, 'Hpt_MultiCannon_Gimbal_Medium');

    // The symbol is the identity a fit is carried out with; it is not something
    // a Commander searches by, and a search that quietly matched it would find
    // rows whose visible text does not contain the query.
    await expect(page.locator('.replacement__no-matches')).toBeVisible();
  });

  test('explains a search that found nothing, and clears back to the whole list', async ({
    page,
  }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);

    const all = await drawnCount(page);

    await search(page, 'zzzz nothing');
    await expect(page.locator('.replacement__no-matches')).toContainText(/zzzz nothing/);
    await expect(page.locator('.candidate')).toHaveCount(0);

    await page.locator('.replacement__clear').click();
    await expect(page.locator('.candidate').first()).toBeVisible();
    expect(await drawnCount(page)).toBe(all);
  });

  test('reads the list again after a fit rather than remembering it', async ({ page }) => {
    await openStockBuild(page);

    // A docking computer is one of the Almanac's exclusive families: fitting one
    // takes the rest of that family out of every other optional mount.
    await selectMount(page, 'Slot02_Size6');
    await openChooser(page);
    await search(page, 'docking computer');
    const before = await page.locator('.candidate').count();
    expect(before).toBeGreaterThan(0);
    if (await surfacesAreLayers(page)) {
      await page.getByRole('button', { name: /cancel/i }).click();
    }

    await selectMount(page, 'Slot01_Size7');
    await fitFromChooser(page, (identities) =>
      identities.findIndex((identity) => /docking computer/i.test(identity)),
    );

    await selectMount(page, 'Slot02_Size6');
    await openChooser(page);
    await search(page, 'docking computer');

    // Fewer, because the Almanac now says so. Nothing here knows what an
    // exclusive family is; it asked again and rendered the answer.
    expect(await page.locator('.candidate').count()).toBeLessThan(before);
  });

  test('is accessible in every chooser state', async ({ page }, testInfo) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);
    await sweepOutfittingState(page, testInfo, 'chooser/full');

    await search(page, 'multi');
    await expect(page.locator('.candidate').first()).toBeVisible();
    await sweepOutfittingState(page, testInfo, 'chooser/searched');

    await search(page, 'zzzz nothing');
    await expect(page.locator('.replacement__no-matches')).toBeVisible();
    await sweepOutfittingState(page, testInfo, 'chooser/no matches');

    if (await surfacesAreLayers(page)) {
      await page.getByRole('button', { name: /cancel/i }).click();
    }
    await selectMount(page, 'CargoHatch');
    await sweepOutfittingState(page, testInfo, 'chooser/mount takes nothing');
  });
});

test.describe('power and the cargo hatch', () => {
  test('offers power on the cargo hatch and nothing else, with the reason', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'CargoHatch');

    const hatch = page.locator('[data-slot-key="CargoHatch"]');
    await expect(hatch.locator('.power__toggle')).toHaveCount(1);
    await expect(hatch.locator('.power__priority')).toHaveCount(1);

    // Replace, search and remove are all absent — and the Almanac's reason for
    // that is published on the bench, because an action missing without a
    // reason reads as a defect (FR-009). Engineering is the one region that
    // stays: it is drawn and says the Almanac offers none (wave 9).
    expect(await chooserOffered(page)).toBe(false);
    await expect(page.getByRole('button', { name: /remove module/i })).toHaveCount(0);
    await expect(page.locator('.outfitting__bench-reason')).toContainText(/built in/i);

    await openEditor(page);
    await expect(page.locator('.engineering__state')).toContainText(/no engineering/i);
  });

  test('presents the package’s five groups one-based, as the game does', async ({ page }) => {
    await openStockBuild(page);

    const options = page.locator('[data-slot-key="FrameShiftDrive"] .power__priority option');

    // Six, not five: a stock build states no group at all, so the control holds
    // a place for that rather than writing group 1 into it — and that entry
    // cannot be chosen back, because no package operation unsets a group. The
    // canvas draws one digit in this chip, so the absence is a mark here and a
    // sentence in the control's own name (wave 4).
    await expect(options).toHaveCount(6);
    await expect(options.first()).toHaveText('—');
    await expect(options.first()).toBeDisabled();
    await expect(
      page.locator('[data-slot-key="FrameShiftDrive"] .power__priority'),
    ).toHaveAccessibleName(/no group published/i);

    // The five the package publishes, as bare numbers: the reference draws a
    // number in the chip and no word beside it.
    const groups = options.filter({ hasNotText: '—' });
    await expect(groups).toHaveCount(5);
    await expect(groups.first()).toHaveText('1');
    await expect(groups.first()).toHaveAttribute('value', '0');
    await expect(groups.last()).toHaveText('5');
    await expect(groups.last()).toHaveAttribute('value', '4');
  });

  test('leaves a module fitted when its power changes', async ({ page }) => {
    await openStockBuild(page);
    const before = await fittedIdentityAt(page, 'FrameShiftDrive');

    // By value, explicitly. Every option's label is now a number too, and a
    // bare string matches whichever comes first — which is the option one group
    // below the one this test means.
    await page
      .locator('[data-slot-key="FrameShiftDrive"] .power__priority')
      .selectOption({ value: '2' });

    // Still fitted, so its mass and its catalogue cost are still in the build
    // (contract, "Power and recalculation").
    expect(await fittedIdentityAt(page, 'FrameShiftDrive')).toBe(before);
    await expect(page.locator('[data-slot-key="FrameShiftDrive"] .power__priority')).toHaveValue(
      '2',
    );
  });

  test('switches a module off without unfitting it', async ({ page }) => {
    await openStockBuild(page);
    const before = await fittedIdentityAt(page, 'SmallHardpoint1');
    const mount = page.locator('[data-slot-key="SmallHardpoint1"]');
    const toggle = mount.locator('.power__toggle');

    // An absent power field reads as on, which is how the package treats it.
    await expect(toggle).toBeChecked();
    // The label is the control. Its checkbox is a hidden box under the drawn
    // track, so a pointer — a Commander's or this one's — lands on the label,
    // which is the whole reason the switch is one.
    await mount.locator('.power__switch').click();

    await expect(toggle).not.toBeChecked();
    expect(await fittedIdentityAt(page, 'SmallHardpoint1')).toBe(before);
  });

  test('names both power controls by module and mount', async ({ page }) => {
    await openStockBuild(page);

    // Forty rows of the same two controls: "powered" on its own says nothing
    // about which module a reader is on.
    const toggle = page.locator('[data-slot-key="FrameShiftDrive"] .power__toggle');
    await expect(toggle).toHaveAttribute('aria-label', /frame shift drive/i);
    await expect(toggle).toHaveAttribute('aria-label', /core internals/i);
  });

  test('draws no power group on a module the Almanac prices at no power', async ({ page }) => {
    await openStockBuild(page);

    // Armour draws nothing and the power plant is what everything else draws
    // from. Neither has power to group, and the canvas draws no chip on one
    // (wave 4).
    await expect(page.locator('[data-slot-key="Armour"] edsb-power-controls')).toHaveCount(0);
    await expect(page.locator('[data-slot-key="PowerPlant"] edsb-power-controls')).toHaveCount(0);
    await expect(page.locator('[data-slot-key="FrameShiftDrive"] edsb-power-controls')).toHaveCount(
      1,
    );
  });
});
