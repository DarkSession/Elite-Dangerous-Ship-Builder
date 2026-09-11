import { expect, test, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import { reachShellAction } from './shell';

/**
 * The announcement policy journey (US1).
 *
 * The contract is as much about silence as about speech. Announcing initial
 * content, an unaffected value or an outcome to a question the Commander has
 * withdrawn is not helpfulness — it is noise that a screen-reader user has to
 * sit through before they can reach what they were doing.
 *
 * Every one of those silences is the caller's. The policy itself announces
 * whatever it is given, and what is read here is the other half: the second of
 * two things reaches a reader as reliably as the first, even where the two are
 * spoken in one sentence (011/FR-009).
 */

/**
 * The payload whose partial engineering the package cannot complete.
 *
 * Transcribed from `src/app/domain/ships/outfitting/outfitting.fixtures.ts`,
 * where it is documented with the package behaviour it provokes: the frame
 * shift drive's engineering menu does not offer `Engine_Dirty`, so the package
 * can neither roll the recipe nor identify an article carrying it, and the
 * whole candidate is refused. Duplicated rather than imported because that
 * module reaches into the Almanac, which this suite's transpiler does not
 * resolve.
 */
const UNSUPPORTED_PARTIAL_QUALITY = {
  event: 'Loadout',
  Ship: 'Anaconda',
  Modules: [
    {
      Slot: 'FrameShiftDrive',
      Item: 'Int_Hyperdrive_Size6_Class5',
      Engineering: { BlueprintName: 'Engine_Dirty', Level: 5, Quality: 0.42 },
    },
  ],
};

/**
 * Every sentence one outlet has spoken since the watch was set.
 *
 * The node rather than the text, because the text is exactly what cannot be
 * trusted here: a live region announces a change to what it contains, and one
 * sentence written over itself is not a change. Two events spoken in identical
 * words are the case 011/FR-009 exists for, and the only thing that separates
 * them from silence is that the region held a new node for each.
 */
async function watchOutlet(page: Page, urgency: 'assertive' | 'polite'): Promise<void> {
  await page.evaluate((which) => {
    const region = document.querySelector(`[data-announcement-outlet="${which}"]`);
    if (region === null) {
      throw new Error(`There is no ${which} outlet to watch.`);
    }
    const spoken: string[] = [];
    (window as unknown as Record<string, unknown>)['__spoken'] = spoken;
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          const text = (node.textContent ?? '').trim();
          if (node.nodeType === Node.TEXT_NODE && text.length > 0) {
            spoken.push(text);
          }
        }
      }
    }).observe(region, { childList: true, subtree: true });
  }, urgency);
}

/** What the watched outlet has spoken so far. */
function spoken(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => (window as unknown as Record<string, string[]>)['__spoken'] ?? []);
}

/** Reads what each hidden outlet currently holds. */
async function outlets(page: Page): Promise<{ assertive: string; polite: string }> {
  return page.evaluate(() => ({
    assertive: document.querySelector('[data-announcement-outlet="assertive"]')?.textContent ?? '',
    polite: document.querySelector('[data-announcement-outlet="polite"]')?.textContent ?? '',
  }));
}

test.describe('announcement policy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('provides exactly one assertive and one polite outlet', async ({ page }) => {
    await expect(page.locator('[data-announcement-outlet="assertive"]')).toHaveCount(1);
    await expect(page.locator('[data-announcement-outlet="polite"]')).toHaveCount(1);
  });

  test('declares the outlets with the correct urgency', async ({ page }) => {
    await expect(page.locator('[data-announcement-outlet="assertive"]')).toHaveAttribute(
      'aria-live',
      'assertive',
    );
    await expect(page.locator('[data-announcement-outlet="polite"]')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  test('keeps the outlets out of the visible layout', async ({ page }) => {
    const box = await page.locator('[data-announcement-outlet="polite"]').boundingBox();

    // Visually hidden, but present in the accessibility tree — an outlet that
    // is `display: none` announces nothing at all.
    expect(box === null || box.width <= 1 || box.height <= 1).toBe(true);
    await expect(page.locator('[data-announcement-outlet="polite"]')).toBeAttached();
  });

  test('says nothing about initial content', async ({ page }) => {
    const initial = await outlets(page);

    expect(initial.assertive.trim()).toBe('');
    expect(initial.polite.trim()).toBe('');
  });

  test('never makes a whole region live', async ({ page }) => {
    // Only the two dedicated outlets are live. Marking a metrics panel live
    // would re-announce every unaffected value on every change.
    const live = await page.locator('[aria-live]').count();

    expect(live).toBe(2);
  });
});

/**
 * The same thing happening twice.
 *
 * Both journeys are a Commander doing one thing, then doing another thing that
 * a screen answers in the same words. Neither used to reach a reader: the
 * policy compared a number the caller supplied, and a second narrowing spends
 * no revision and a second refusal spends no build. The failure that produced
 * was silence, which reports nothing (011/FR-009).
 */
test.describe('the second time something happens', () => {
  test('states each narrowing of the manifest, and the widening after them', async ({ page }) => {
    await page.goto('/ships');
    await expect(page.getByRole('heading', { level: 1, name: /ship builder/i })).toBeVisible();
    await watchOutlet(page, 'polite');

    await page.getByRole('radio', { name: 'Large' }).check();
    await expect.poll(async () => (await spoken(page)).length).toBe(1);

    // Narrowed again, without anything else on the screen being touched.
    await page.getByRole('radio', { name: 'Medium' }).check();
    await expect.poll(async () => (await spoken(page)).length).toBe(2);

    // And widened back, which is a move in the other direction and equally
    // worth hearing.
    await page.getByRole('radio', { name: 'All', exact: true }).check();
    await expect.poll(async () => (await spoken(page)).length).toBe(3);

    // Each sentence is the manifest's own count message, and every one of them
    // names the same manifest: what moved is the count, which is the event.
    // Built from the message rather than from a transcribed number, so a hull
    // added to the Almanac does not fail this journey.
    const digits = String.raw`[\d\u00a0\u202f.,]+`;
    const shape = new RegExp(
      `^${englishMessages['catalogue.match-count']
        .replace('{{count}}', digits)
        .replace('{{total}}', `(${digits})`)}$`,
    );

    const heard = await spoken(page);
    const totals = heard.map((sentence) => {
      expect(sentence, 'a sentence the outlet took was not the match count').toMatch(shape);
      return shape.exec(sentence)?.[1];
    });
    expect(new Set(totals).size, 'the manifest itself changed between narrowings').toBe(1);
  });

  test('states a refusal each time, even in the same words', async ({ page }) => {
    await page.goto('/outfitting');
    await expect(page.getByRole('main')).toBeVisible();
    await watchOutlet(page, 'polite');

    await reachShellAction(page, /^import build$/i);
    const layer = page.getByRole('dialog', { name: /import build/i });
    await layer.getByLabel(/slef payload/i).fill(JSON.stringify(UNSUPPORTED_PARTIAL_QUALITY));

    const load = layer.getByRole('button', { name: /^load build$/i });
    const refused = englishMessages['slef.import.failure.normalizationUnsupported']
      .replace('{{count}}', '1')
      .trim();

    await load.click();
    await expect(layer).toContainText(refused);
    await expect.poll(async () => (await spoken(page)).length).toBe(1);

    // Pressed again, because a Commander who was not looking at the screen has
    // no way of knowing the first press did anything. Nothing about the build
    // moved between the two — that is the point: they are owed an answer both
    // times, and the answer is the same sentence.
    await load.click();
    await expect(layer).toContainText(refused);
    await expect.poll(async () => (await spoken(page)).length).toBe(2);

    const heard = await spoken(page);
    expect(heard).toEqual([
      englishMessages['slef.import.announce.failed'],
      englishMessages['slef.import.announce.failed'],
    ]);
  });
});
