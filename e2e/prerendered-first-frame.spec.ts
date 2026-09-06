import { expect, test, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { frames, openWithADelayedBundle, openWithoutTheBundle, recordFrames } from './first-frame';
import { PRODUCT_URL } from './servers';
import { waitForTakeover } from './shell';

/**
 * The frame a Commander is given before the application exists, and what the
 * takeover is allowed to do to it.
 *
 * `search-published.spec.ts` reads the documents the build wrote as files. This
 * journey opens them in a browser, which is the other half of the same promise:
 * a document that states everything and then gets blanked, moved or re-composed
 * a second later is a worse first frame than the empty shell this feature
 * replaced, and only a browser can catch that (FR-008 through FR-012, SC-003,
 * SC-004).
 *
 * It needs the production output for the same reason its sibling does — a
 * development server has no generated documents — so it runs under
 * `pnpm run e2e:offline`, across all ten projects (`playwright.config.ts`,
 * `NEVER_IN_A_DEVELOPMENT_RUN`).
 */

/** The three screens this feature renders, and the subject each address is about. */
const SCREENS = [
  // The start page's own line, not the shell's product name: the shell is on
  // every address, and a subject that appears on all three proves nothing about
  // any of them.
  { path: '/', subject: 'Tools for Commanders' },
  { path: '/ships', subject: 'Anaconda' },
  { path: '/ships/Anaconda', subject: 'Anaconda' },
] as const;

/**
 * The shape of the screen's content, ignoring every word in it, with the notes
 * a non-English reading adds taken back out.
 *
 * Element names in document order, inside `main` alone. The shell is left out
 * on purpose: the session layers it owns are drawn only where there is a
 * Commander to use them, so they legitimately appear at the takeover and would
 * read here as the page being rebuilt.
 *
 * The disclosures come out because of FR-011a, and taking them out is the only
 * way to compare two readings at all: a game name shown in its original
 * language is disclosed as such beside itself, and English has nothing to
 * disclose because English is the original. So the German page carries one extra
 * span inside every `ednb-game-text` and the English one carries none.
 */
function outlineWithoutDisclosures(page: Page): Promise<string> {
  return page.evaluate(() => {
    const disclosed = new Set(document.querySelectorAll('main .game-text__disclosure'));
    return [...(document.querySelector('main')?.querySelectorAll('*') ?? [])]
      .filter((element) => !disclosed.has(element))
      .map((element) => element.tagName.toLowerCase())
      .join(',');
  });
}

/** How many game names are disclosed as being in their original language. */
function disclosures(page: Page): Promise<number> {
  return page.evaluate(() => document.querySelectorAll('main .game-text__disclosure').length);
}

/**
 * The list, frame by frame, as the shape a Commander could describe.
 *
 * How many hulls are on screen and which one is at the top: between them they
 * name a filter and an order, which is the whole of what a stored catalogue
 * view can change (FR-009a). Recorded alongside whether the takeover has
 * finished, because the requirement is not merely that the stored view is
 * applied — it is that it is applied *in* the takeover frame rather than a
 * frame after it, and only the pair can tell those apart.
 */
interface ListFrame {
  readonly shape: string;
  readonly takenOver: boolean;
}

/**
 * Recorded only once the document has finished arriving.
 *
 * The catalogue document is a quarter of a megabyte and the browser paints it
 * while it is still reading it, so the list genuinely passes through 18 rows
 * and 30 rows on its way to the 48 the document states. Those are not shapes
 * the application composed; they are the document not being all there yet, and
 * counting them would make every run report a list that changed several times
 * before anything had run at all.
 */
async function recordList(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const list: unknown[] = [];
    (window as unknown as { __list: unknown[] }).__list = list;
    const record = () => {
      const rows = [...document.querySelectorAll('[data-hull-symbol]')].filter(
        (row) => (row as HTMLElement).offsetParent !== null,
      );
      if (rows.length > 0 && document.readyState !== 'loading') {
        list.push({
          shape: `${rows.length}:${rows[0].getAttribute('data-hull-symbol')}`,
          takenOver: document.querySelectorAll('[jsaction]').length === 0,
        });
      }
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
}

async function listFrames(page: Page): Promise<readonly ListFrame[]> {
  return page.evaluate(() => (window as unknown as { __list: ListFrame[] }).__list ?? []);
}

/** A stored catalogue view, written the way the application writes it. */
async function storeCatalogueView(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'ednb:catalogue',
      JSON.stringify({
        version: 2,
        filters: { query: '', sizes: ['large'] },
        sort: { field: 'name', direction: 'descending' },
        anchor: null,
      }),
    );
  });
}

test.describe('the first frame of a generated document', () => {
  for (const { path, subject } of SCREENS) {
    test(`states ${path} to a reader that runs no script`, async ({ page }) => {
      // The claim this whole feature exists to make, in the form it is made to
      // a crawler: the served document, with nothing else, is about its address
      // (FR-008). Nothing here is timed, because nothing here is a race — this
      // is the page as a file.
      await openWithoutTheBundle(page, path);
      await expect(page.getByRole('main')).toBeVisible();

      const text = (await page.locator('body').innerText()).toLowerCase();

      expect(text, `${path} stated its subject`).toContain(subject.toLowerCase());
    });

    test(`states ${path} before the application exists`, async ({ page }) => {
      // SC-004's measurement, taken as a frame ordering rather than as a
      // duration: the subject is painted in a frame the application has not
      // reached yet. Before this feature the subject's first frame was the one
      // after the application had booted; now the order is the other way round,
      // and the order is the whole of what changed.
      //
      // The subject's frame is not asserted to be sample 0. A generated document
      // is up to a quarter of a megabyte and the browser paints while it is
      // still reading it, so the earliest samples can hold a banner and the
      // first few rows of a table. That is the document arriving, and it is
      // still the document rather than the application: a module script does not
      // run until the parse is done, so every partial frame is by construction a
      // frame the application has not touched.
      await recordFrames(page, subject);
      await openWithADelayedBundle(page, path);
      await waitForTakeover(page);

      const recorded = await frames(page);
      const stated = recorded.filter((frame) => frame.subject && !frame.takenOver);

      expect(recorded.length, 'frames recorded').toBeGreaterThan(0);
      expect(
        stated.length,
        `${path} never stated its subject in a frame the application had not reached`,
      ).toBeGreaterThan(0);
      expect(stated[0].length, `${path} text before the application existed`).toBeGreaterThan(0);
    });

    test(`keeps ${path} whole across the takeover`, async ({ page }) => {
      // FR-009 and the second half of SC-003. Nothing here is about how long
      // the takeover takes; it is about whether any frame in the middle of it
      // is worse than the frame before. A wipe-and-rebuild shows up as a
      // collapse in length and as the subject going false, and both are read
      // frame by frame rather than as a before-and-after pair, because a page
      // that blanks and comes back looks identical at the ends.
      await recordFrames(page, subject);
      await page.goto(`${PRODUCT_URL}${path}`);
      await waitForTakeover(page);

      // From the frame the document finished arriving in, for the reason
      // `Frame.parsed` gives: a page that is still being read is shorter than
      // the page being served, and that is the download rather than the
      // takeover.
      const recorded = (await frames(page)).filter((frame) => frame.parsed);
      const lost = recorded.findIndex((frame) => !frame.subject);

      expect(recorded.length, `${path} finished arriving`).toBeGreaterThan(0);
      expect(lost, `${path} left the screen at frame ${lost}`).toBe(-1);

      // Length is allowed to grow — a label the application resolves once it can
      // measure — and not to fall. Compared against the running maximum rather
      // than the neighbour, so a dip that recovers within one frame is still a
      // dip.
      let tallest = 0;
      recorded.forEach((frame, index) => {
        expect(frame.length, `${path} shrank at frame ${index}`).toBeGreaterThanOrEqual(tallest);
        tallest = Math.max(tallest, frame.length);
      });
    });

    test(`moves nothing on ${path} across the takeover`, async ({ page }) => {
      // SC-003's first half, measured as boxes rather than as a layout-shift
      // score: `layout-shift` entries are Chromium-only, and half the matrix is
      // Firefox. Four boxes, because they answer four different questions —
      // where the shell's bar sits, where the screen's content begins, where the
      // screen itself sits, and where the page ends (`MEASURED`). A composition
      // corrected after the fact moves at least one of them.
      await recordFrames(page, subject);
      await page.goto(`${PRODUCT_URL}${path}`);
      await waitForTakeover(page);

      // From the frame the document finished arriving in, not from the frame it
      // started in: a quarter-megabyte document paints while it is still being
      // read, so the earliest frames hold a page that is genuinely shorter than
      // the one being served. Growing as it downloads is what every document
      // does and is not what SC-003 is about — what SC-003 is about is the
      // application, once it exists, moving something a Commander is reading.
      const recorded = (await frames(page)).filter((frame) => frame.parsed);
      const first = recorded[0];

      expect(first, `${path} finished arriving`).toBeDefined();

      for (const frame of recorded) {
        expect(frame.boxes, `${path} boxes`).toEqual(first.boxes);
      }
    });
  }

  test('applies a stored catalogue view in the takeover frame, not a frame later', async ({
    page,
  }) => {
    // FR-009a, the one content change FR-009 permits besides the language. The
    // build knows no session, so it renders the catalogue in default order with
    // no filter; a Commander who left a filter behind gets it back when the
    // application arrives. What must not happen is a Commander watching the
    // full list arrive and then narrow, which is content changing under them.
    await storeCatalogueView(page);
    await recordList(page);
    await page.goto(`${PRODUCT_URL}/ships`);
    await waitForTakeover(page);
    await expect(page.getByRole('main')).toBeVisible();

    const recorded = await listFrames(page);
    const shapes = [...new Set(recorded.map((frame) => frame.shape))];

    // Two shapes and no more: the document's, then the Commander's. A third
    // would be the application composing the list twice.
    expect(shapes.length, `list shapes: ${shapes.join(' → ')}`).toBe(2);

    // And the second one is already there in the first frame the takeover has
    // finished in. A stored view applied a frame late shows the document's
    // shape here.
    const first = recorded.find((frame) => frame.takenOver);

    expect(first, 'a frame after the takeover').toBeDefined();
    expect(first?.shape, 'the stored view in the takeover frame').toBe(shapes[1]);
  });

  test('changes nothing at all for a Commander with no stored view', async ({ page }) => {
    // The common case, and the one FR-009 holds in full. The exception above
    // exists for a Commander who left a filter behind; everybody else must see
    // the list the document painted and go on seeing it.
    await recordList(page);
    await page.goto(`${PRODUCT_URL}/ships`);
    await waitForTakeover(page);
    await expect(page.getByRole('main')).toBeVisible();

    const shapes = [...new Set((await listFrames(page)).map((frame) => frame.shape))];

    expect(shapes, 'the list changed with no stored view to apply').toHaveLength(1);
  });

  test('leaves a readable page when the bundle never arrives', async ({ page }) => {
    // FR-012. The document is not a placeholder for the application: it is what
    // a Commander is left with when the application cannot load, so it has to
    // stand on its own.
    await openWithoutTheBundle(page, '/ships/Anaconda');

    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText('Anaconda');

    // Lower-cased and run together, because `innerText` reports what the screen
    // shows: this screen sets its figures in capitals, and it puts each value on
    // its own line from its unit. What is under test is that the hull's facts
    // are in the document, not how they are typeset.
    const text = (await page.locator('body').innerText()).toLowerCase().replace(/\s+/g, ' ');

    expect(text).toContain('faulcon delacy');
    expect(text).toContain('180 m/s');
    expect(text).toContain('350 mj');
  });

  for (const { path } of SCREENS) {
    test(`scans ${path}'s first frame for accessibility violations`, async ({ page }, testInfo) => {
      // FR-019 and SC-005. The generated frame is a frame a Commander sees, so
      // it carries the same obligation as every other one — WCAG 2.2 AA less
      // the eight criteria the constitution excludes, which is what
      // `expectNoAccessibilityViolations` scans everywhere else.
      //
      // What is new is *when*. Every other scan in this suite runs against the
      // settled page, which is a state the application composed. This one runs
      // against a state the build composed and the application has never
      // touched.
      await openWithoutTheBundle(page, path);
      await expect(page.getByRole('main')).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo, { label: `first frame of ${path}` });
    });
  }
});

/**
 * A Commander whose browser asks for German (FR-011, FR-011a).
 *
 * The document is bundled English, and always will be: this feature publishes
 * one document per address, not one per language, and language follows the
 * browser setting rather than the address (011/FR-017). So a German Commander
 * reads complete English while their catalogue loads and then reads German —
 * which is the behaviour the application already had. What this feature changes
 * is only which frame the English arrives in.
 *
 * The exception is named and bounded: the words may change, plus one note per
 * game name that is not published in German, and nothing else.
 */
test.describe('a document read by a Commander whose browser asks for German', () => {
  test.use({ locale: 'de-DE' });

  test('replaces the words, adds only the notes English does not need', async ({ page }) => {
    // The English shape is read from the document as it is served rather than
    // from the page before the takeover. It is the same shape either way — the
    // takeover adopts these nodes, it does not build new ones — but a page has
    // only a few hundred milliseconds of being English and a test that races
    // that window reports the language rather than the layout.
    const served = await (await page.request.get(`${PRODUCT_URL}/ships`)).text();
    const servedShape = await page.evaluate((source) => {
      const parsed = new DOMParser().parseFromString(source, 'text/html');
      const main = parsed.querySelector('main');
      return {
        outline: [...(main?.querySelectorAll('*') ?? [])]
          .map((element) => element.tagName.toLowerCase())
          .join(','),
        disclosures: main?.querySelectorAll('.game-text__disclosure').length ?? 0,
      };
    }, served);
    const before = servedShape.outline;

    expect(before, 'the served document stated a catalogue').toContain('ednb-game-text');
    expect(served, 'the served document was English').toContain(
      englishMessages['catalogue.search.label'],
    );
    expect(servedShape.disclosures, 'the served English disclosed its own nouns').toBe(0);

    await page.goto(`${PRODUCT_URL}/ships`);
    await expect(page.getByRole('main')).toBeVisible();

    await waitForTakeover(page);
    await expect(page.getByText(germanMessages['catalogue.search.label'])).toBeVisible();

    // Nothing removed, nothing reordered. Reflow is permitted and is not
    // measured here — "Schiffe oder Hersteller suchen" is not the length of
    // "Search ships or manufacturers" and cannot be made to be.
    expect(
      await outlineWithoutDisclosures(page),
      'the page was rebuilt rather than translated',
    ).toBe(before);

    // And the one thing that was added is the disclosure itself, on a page whose
    // every row names a hull the game publishes in English only. Asserted as a
    // count greater than zero rather than as a number, because the number is the
    // package's hull count and this test is not about how many hulls there are.
    expect(
      await disclosures(page),
      'German said nothing about the untranslated names',
    ).toBeGreaterThan(0);
  });
});
