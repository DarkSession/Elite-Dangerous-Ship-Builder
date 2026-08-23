import { expect, test, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { commandBarActionState, openAllFamilies, openChooser } from './outfitting-surfaces';

/**
 * The chooser's families, end to end (US2, wave 10).
 *
 * The unit suites prove the seeding rules and the grouping against the package.
 * What only a browser can show is the rest: that a Commander opening a mount
 * lands on the family holding what is already fitted, that opening and closing
 * one costs nothing, that a search never leaves a match behind a closed
 * control, and that reading the screen in another language relabels the
 * families without moving a single choice between them.
 *
 * Nothing here writes down a family name. The Almanac's are the names on
 * screen, and a test that pinned one would fail on a package release that is
 * entirely correct — so what is pinned is the *relation*: which control a row
 * is under, and whether that control changed.
 */

/** A mount the Anaconda's stock build arrives with something fitted in. */
const FITTED_MOUNT = 'SmallHardpoint1';

/** A mount the stock build leaves empty, so no family holds a fitted choice. */
const EMPTY_MOUNT = 'HugeHardpoint1';

async function openStockBuild(
  page: Page,
  messages: Record<string, string> = englishMessages,
): Promise<void> {
  await page.goto('/ships/Anaconda');
  // Named from the catalogue this run is actually reading, because the German
  // context below reaches the same control through the German word for it.
  await page.getByRole('button', { name: messages['hullDetail.create'] }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
}

async function selectMount(page: Page, slotKey: string): Promise<void> {
  const row = page.locator(`[data-slot-key="${slotKey}"] button`).first();
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.replacement__title, .outfitting__bench-title').first()).toBeVisible();
}

/** The accessible name of every family control currently drawn, in order. */
async function familyNames(page: Page): Promise<readonly string[]> {
  // The package's string alone. Everything around it is ours and moves with the
  // reading language whether or not the Almanac translated a thing: the control
  // carries the count sentence, and the name cell carries the untranslated tag
  // and its disclosure. Read together, either would satisfy a comparison meant
  // to prove the *package* relabelled its families.
  return page
    .locator('.family .family__name .game-text__value')
    .evaluateAll((nodes) =>
      nodes.map((node) => (node.textContent ?? '').replace(/\s+/gu, ' ').trim()),
    );
}

/** Which families are open right now, by their index in the list. */
async function openIndices(page: Page): Promise<readonly number[]> {
  const states = await page
    .locator('.family')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-expanded')));
  return states.flatMap((state, index) => (state === 'true' ? [index] : []));
}

test.describe('module families', () => {
  test('opens the family holding the fitted module, and only that one', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, FITTED_MOUNT);
    await openChooser(page);

    const open = await openIndices(page);
    expect(open).toHaveLength(1);

    // It is the family the list itself marks as fitted, which is the whole
    // point: the row a Commander is looking for is on screen without them
    // opening anything (FR-021, SC-007). Scoped to the families' own rows,
    // because the compact composition pins the same row a second time in canvas
    // 1d's `FITTED HERE` block above them.
    const fitted = page.locator('.family__choices .candidate--fitted');
    await expect(fitted).toHaveCount(1);
    await expect(fitted).toBeVisible();

    // Every other family is drawn and closed, contributing its bar and no rows:
    // what is in the document is exactly the open family's own count.
    const total = await page.locator('.family').count();
    expect(total).toBeGreaterThan(1);

    const openCount = Number(
      (await page.locator('.family__count').nth(open[0]!).innerText()).replace(/\D+/gu, ''),
    );
    expect(openCount).toBeGreaterThan(0);
    expect(await page.locator('.family__choices .candidate').count()).toBe(openCount);
  });

  test('opens nothing when no available family holds the fitted choice', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, EMPTY_MOUNT);
    await openChooser(page);

    // An empty mount has no fitted choice, so there is no family to open and
    // the honest answer is all of them closed rather than an arbitrary first
    // one (FR-021, SC-007).
    await expect(page.locator('.family').first()).toBeVisible();
    expect(await openIndices(page)).toHaveLength(0);
    await expect(page.locator('.family__choices .candidate')).toHaveCount(0);
  });

  test('opens and closes on a tap, changing nothing about the build', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, FITTED_MOUNT);
    await openChooser(page);

    // Waited for rather than read straight away: the fragment is written from
    // the build a moment after the workspace arrives, and a hash captured
    // before that lands would be compared against one that was always going to
    // change for a reason that has nothing to do with a family.
    await expect(page).toHaveURL(/#b\./);
    const hash = new URL(page.url()).hash;
    const undo = commandBarActionState(page, /^undo$/i);
    const undoWasDisabled = await undo.isDisabled();

    // Pinned by its own id, not by "the first closed one": that locator
    // re-resolves after the press and would then be pointing at a different
    // family altogether.
    const id = await page.locator('.family[aria-expanded="false"]').first().getAttribute('id');
    const closed = page.locator(`#${id}`);
    const rows = page.locator('.family__choices .candidate');
    const rowsBefore = await rows.count();

    // A tap where the profile has touch and a click where it does not: the bar
    // is the control, and it has to answer to a thumb as well as a pointer
    // (FR-022). Both are exercised here — the second press is always a click.
    const touch = test.info().project.use.hasTouch === true;
    await (touch ? closed.tap() : closed.click());
    await expect(closed).toHaveAttribute('aria-expanded', 'true');
    expect(await rows.count()).toBeGreaterThan(rowsBefore);

    await closed.click();
    await expect(closed).toHaveAttribute('aria-expanded', 'false');
    expect(await rows.count()).toBe(rowsBefore);

    // Looking is free. No revision reached the link, and undo did not become
    // available because nothing was decided (FR-021, SC-006).
    expect(new URL(page.url()).hash).toBe(hash);
    expect(await undo.isDisabled()).toBe(undoWasDisabled);
  });

  test('opens every family a search matched, and restores the seed on clearing', async ({
    page,
  }) => {
    await openStockBuild(page);
    await selectMount(page, FITTED_MOUNT);
    await openChooser(page);

    const seeded = await openIndices(page);
    const total = await page.locator('.family').count();

    await page.locator('input[type="search"]').fill('laser');
    // Waited on the list actually narrowing rather than on it merely being
    // there: it was already there, so a visibility check proves nothing.
    await expect(page.locator('.family')).not.toHaveCount(total);

    const matched = await page.locator('.family').count();
    expect(matched).toBeGreaterThan(0);
    expect(matched).toBeLessThan(total);
    // Every family drawn is open, so no match is behind a closed control, and
    // every family drawn holds at least one match (FR-023, SC-008).
    expect(await openIndices(page)).toHaveLength(matched);
    await expect(page.locator('.family[aria-expanded="false"]')).toHaveCount(0);
    for (let index = 0; index < matched; index += 1) {
      await expect(
        page.locator('.family__choices').nth(index).locator('.candidate').first(),
      ).toBeVisible();
    }

    await page.locator('input[type="search"]').fill('');
    await expect(page.locator('.family')).toHaveCount(total);
    expect(await openIndices(page)).toEqual(seeded);
  });

  test('leaves every family closed when a search matched more than a screenful', async ({
    page,
  }) => {
    await openStockBuild(page);
    await selectMount(page, FITTED_MOUNT);
    await openChooser(page);

    const total = await page.locator('.family').count();

    // One letter matches most of the mount. A list of everything is not an
    // answer a Commander can read, so what stays on screen is the families and
    // their counts — and the rows nobody asked for are not built (FR-023).
    await page.locator('input[type="search"]').fill('a');
    await expect(page.locator('.family[aria-expanded="true"]')).toHaveCount(0);
    await expect(page.locator('.family__choices .candidate')).toHaveCount(0);

    const counted = await page
      .locator('.family__count')
      .evaluateAll((nodes) =>
        nodes.reduce(
          (running, node) => running + Number((node.textContent ?? '').replace(/\D+/gu, '')),
          0,
        ),
      );
    expect(counted).toBeGreaterThan(25);

    // Not one family holding a match went missing, and the surface's own count
    // still says how many there are: only the rows are withheld.
    expect(await page.locator('.family').count()).toBeGreaterThan(0);
    const published = Number(
      (
        await page
          .locator('.replacement__count, edsb-candidate-search [role="status"]')
          .first()
          .innerText()
      ).replace(/\D+/gu, ''),
    );
    expect(published).toBe(counted);

    await page.locator('input[type="search"]').fill('');
    await expect(page.locator('.family')).toHaveCount(total);
  });

  test('relabels every family in another language without moving a choice', async ({
    page,
    browser,
    baseURL,
  }) => {
    const english = await familyList(page);

    // German the only way a Commander can reach it: by asking for it with their
    // browser. There is no language control in the product (feature 011).
    const context = await browser.newContext({
      baseURL,
      locale: 'de-DE',
      viewport: test.info().project.use.viewport ?? null,
      hasTouch: test.info().project.use.hasTouch === true,
    });
    const german = await familyList(
      await context.newPage(),
      germanMessages as Record<string, string>,
    );
    await context.close();

    // The names change — that is the package's own German — and the nineteen
    // families it does not name outside English read as their English name with
    // the untranslated disclosure beside them, never as a blank or a raw id.
    expect(german.names).not.toEqual(english.names);
    expect(german.names.every((name) => name.length > 0)).toBe(true);

    // At least one family the package has named in German reads differently.
    // Which families a mount offers is the package's business, so whether any
    // of the nineteen it has not named outside English is among them is not
    // something this test can require; that fallback is proven directly, over
    // all 77 ids, in the presenter suite.
    const changed = german.names.filter((name, index) => name !== english.names[index]);
    expect(changed.length).toBeGreaterThan(0);

    // Membership is the package's `familyId` and nothing else, so not one
    // choice moved between families and no family gained or lost one, whatever
    // the locale's collator did to the names (FR-020, SC-009). Compared as a
    // set per family: the order *within* one is the locale's collation of the
    // module names, so German legitimately reorders rows it did not move.
    expect(german.membership).toEqual(english.membership);
  });
});

/**
 * The frozen bar overhangs its scroller, and still draws its own rule.
 *
 * A hairline of nothing was not enough. The scroller's top edge is placed by
 * flex at a fractional device pixel while the browser snaps the bar to a whole
 * one, and at scale factors 1.5 and 2.5 the two miss each other: one device row
 * of the row *behind* the bar prints above it, which is the sliver a Commander
 * sees as a gap over the family's name. Only the box overhanging that edge
 * closes it — a shadow reaching above the edge is clipped away with everything
 * else up there, which is why the same technique works for the hull manifest's
 * frozen head, under the document, and not here.
 *
 * The overhang costs the bar whatever is drawn in its first two pixels, and a
 * `border-block-start` is exactly that: the rule above the family name went
 * with the clip every time the bar froze, and the band it vacated is where the
 * same Commander then watched the list scroll past. The rule is drawn inside
 * the box, set in by the overhang, so the clip lands on ground rather than on
 * it.
 *
 * Both halves are asserted, and as mechanism rather than as pixels. A pixel
 * comparison would only fail on the one scale factor the runner happens to be
 * at, and passing at that scale factor is what let this through twice already.
 */
test('freezes the family bar above the edge of its scroller, and still rules it', async ({
  page,
}) => {
  await openStockBuild(page);
  await selectMount(page, FITTED_MOUNT);
  await openChooser(page);

  const bar = page.locator('.family[aria-expanded="true"]').first();
  await expect(bar).toBeVisible();

  const frozen = await page.evaluate(() => {
    const control = document.querySelector('.family[aria-expanded="true"]') as HTMLElement;
    const style = getComputedStyle(control);
    const rule = getComputedStyle(control, '::before');
    return {
      position: style.position,
      start: Number.parseFloat(style.insetBlockStart),
      ground: style.backgroundColor,
      rule: {
        start: Number.parseFloat(rule.insetBlockStart),
        size: Number.parseFloat(rule.blockSize),
        colour: rule.backgroundColor,
      },
    };
  });

  // The composition that scrolls its bars away with their own rows has no edge
  // for one to be frozen against and no seam to cover. Stated as an assertion
  // rather than passed over, because the day this becomes sticky is the day the
  // branch below has to hold for it too.
  if (frozen.position !== 'sticky') {
    expect(frozen.position).toBe('static');
    return;
  }

  // Negative because the bar is pulled above the edge it freezes against, and
  // the scroller clips what hangs over. Anything shallower than two CSS pixels
  // is the leak — a hairline was what a Commander kept seeing through.
  expect(frozen.start).toBeLessThanOrEqual(-2);
  // Both measured bounds, not just the one that was leaking. Four CSS pixels of
  // overhang leaks too, at scale factor 1.25, because a bar that far above the
  // edge clears its own family before the family's rows are done.
  expect(frozen.start).toBeGreaterThan(-4);

  // And the ground the clip lands on is opaque, or the overhang is a window
  // rather than a cover.
  expect(frozen.ground).not.toMatch(/transparent|rgba\([^)]*,\s*0(\.0+)?\)/);

  // The rule survives that clip because it is set in by the overhang rather
  // than drawn on the box's own top edge. Set in by less and the clip takes it;
  // this is the assertion that fails if it ever goes back to being a border.
  expect(frozen.rule.size).toBeGreaterThan(0);
  expect(frozen.rule.start).toBeGreaterThanOrEqual(-frozen.start);
  expect(frozen.rule.colour).not.toMatch(/transparent|rgba\([^)]*,\s*0(\.0+)?\)/);
});

/**
 * Every family on the fitted mount, with the choices each one holds.
 *
 * Read with every family open, because a closed one holds no rows to compare.
 * Choices are compared by their view key, which is built from the package's own
 * identity rather than from any text — so the comparison survives the whole
 * screen being relabelled.
 */
async function familyList(
  page: Page,
  messages: Record<string, string> = englishMessages,
): Promise<{ names: readonly string[]; membership: readonly (readonly string[])[] }> {
  await openStockBuild(page, messages);
  await selectMount(page, FITTED_MOUNT);
  // The compact composition reaches the chooser through a control named in the
  // language being read, so the German run asks for it by its German name.
  await openChooser(page, messages['outfitting.capability.replace']);
  await openAllFamilies(page);

  const names = await familyNames(page);
  const membership = await page.locator('.family__choices').evaluateAll((regions) =>
    regions.map((region) =>
      Array.from(region.querySelectorAll('input[type="radio"]'))
        .map((radio) => (radio as HTMLInputElement).value)
        .sort(),
    ),
  );

  expect(membership.flat().length).toBeGreaterThan(0);
  return { names, membership };
}
