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

/**
 * A figure the manifest spoke, as a number.
 *
 * The count is formatted for the reading locale, so it can carry a grouping
 * separator. Only the digits say which way the count moved.
 */
function figure(spelled: string): number {
  return Number(spelled.replace(/\D/g, ''));
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

  test('publishes one assertive summary for a blocking condition', async ({ page }) => {
    // An address that resolves to no hull. The screen has nothing to show and
    // nothing the Commander can read their way out of, which is what makes it
    // assertive rather than polite — and the polite outlet stays empty, because
    // one event is announced in one place.
    await page.goto('/ships/Nonexistent_Hull');
    await expect(
      page.getByRole('heading', { name: englishMessages['hullDetail.unknown.title'] }),
    ).toBeVisible();

    await expect
      .poll(async () => (await outlets(page)).assertive.trim())
      .toBe(englishMessages['hullDetail.unknown.title']);
    expect((await outlets(page)).polite.trim()).toBe('');
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
 * Two halves of 011/FR-009, one journey each.
 *
 * The first is the silence this change removes. The policy dropped a request
 * whose number did not exceed the highest that kind had reached, the manifest
 * supplied its own count as that number, and a Commander who narrowed twice
 * heard the first narrowing and nothing after it. So the sizes below are
 * chosen to make the count fall at every step: a sequence that rose would have
 * been published by the old policy too and would report nothing.
 *
 * The second is what carries an event when the words cannot. Two refusals are
 * one sentence, a live region that holds the same text is a region that did
 * not change, and only a new node tells a reader the second one happened. That
 * held before this change and has to keep holding after it, because what the
 * outlet draws on is no longer a number the caller chose.
 */
test.describe('the second time something happens', () => {
  test('states each narrowing of the manifest, and the widening after them', async ({ page }) => {
    await page.goto('/ships');
    await expect(page.getByRole('heading', { level: 1, name: /ship builder/i })).toBeVisible();
    await watchOutlet(page, 'polite');

    // Medium, then small, then large. Each shows fewer hulls than the one
    // before it, so each step is a narrowing rather than a move in some
    // direction the Almanac happens to decide.
    await page.getByRole('radio', { name: 'Medium' }).check();
    await expect.poll(async () => (await spoken(page)).length).toBe(1);

    // Narrowed again, without anything else on the screen being touched.
    await page.getByRole('radio', { name: 'Small' }).check();
    await expect.poll(async () => (await spoken(page)).length).toBe(2);

    await page.getByRole('radio', { name: 'Large' }).check();
    await expect.poll(async () => (await spoken(page)).length).toBe(3);

    // And widened back, which is a move in the other direction and equally
    // worth hearing.
    await page.getByRole('radio', { name: 'All', exact: true }).check();
    await expect.poll(async () => (await spoken(page)).length).toBe(4);

    // Each sentence is the manifest's own count message, and every one of them
    // names the same manifest: what moved is the count, which is the event.
    // Built from the message rather than from a transcribed number, so a hull
    // added to the Almanac does not fail this journey.
    const digits = String.raw`[\d\u00a0\u202f.,]+`;
    const shape = new RegExp(
      `^${englishMessages['catalogue.match-count']
        .replace('{{count}}', `(${digits})`)
        .replace('{{total}}', `(${digits})`)}$`,
    );

    const heard = await spoken(page);
    const read = heard.map((sentence) => {
      expect(sentence, 'a sentence the outlet took was not the match count').toMatch(shape);
      const parsed = shape.exec(sentence);
      return { count: figure(parsed?.[1] ?? ''), total: parsed?.[2] };
    });

    expect(new Set(read.map((one) => one.total)).size, 'the manifest itself changed').toBe(1);

    // The three narrowings, in order, then the widening. Read as figures
    // because the point is the direction each step moved in, and a step that
    // did not narrow would have been heard under the policy this replaced.
    const [first, second, third, widened] = read.map((one) => one.count);
    expect(second, 'the second step did not narrow').toBeLessThan(first as number);
    expect(third, 'the third step did not narrow').toBeLessThan(second as number);
    expect(widened, 'the last step did not widen').toBeGreaterThan(first as number);
  });

  test('takes a new node for each refusal, in the same words', async ({ page }) => {
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
    //
    // What is read here is the region taking a node for each, which is what
    // separates a second event from silence. This press was published before
    // this change as well, because the number it happened to supply was a
    // request token that rises on every submit; what it guards is that the
    // sequence now minted in the policy keeps the two events apart where the
    // words cannot.
    //
    // Whether a reader hears it through the open layer is a separate question
    // and not one a scan can answer: the layer is modal and the outlet is
    // mounted in the shell outside it. See design.md, "An announcement made
    // under a layer".
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
