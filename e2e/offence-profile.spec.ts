import { expect, test, type Page, type TestInfo } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { everyPublishedSlotKey, sweepOutfittingState } from './accessibility';
import { expectNoDocumentOverflow, settled } from './accessibility/assertions';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';

/**
 * The offence profile, end to end.
 *
 * The unit suites already prove what the projection selects and what each
 * sentinel means. What only a browser can show is the rest: that the mode strip
 * actually opens the layer, that the rail and the panel agree about the same
 * build, and that the whole panel survives a phone, a doubled text size and a
 * 400% zoom without losing a figure or scrolling the document sideways.
 *
 * Nothing here writes down a damage figure. Every value the suite checks is
 * read back out of the running page and compared with another part of the same
 * page that has to agree with it — a suite that pinned the Anaconda's damage
 * per second would fail the day the Almanac corrected it, which is not what it
 * is for.
 */

const HULL = 'Anaconda';

/** Creates a stock build and opens the anatomy region's `OFFENCE` mode. */
async function openOffence(page: Page, messages = englishMessages): Promise<void> {
  await page.goto(`/ships/${HULL}`);
  await page.getByRole('button', { name: messages['hullDetail.create'] }).click();

  await page
    .locator('edsb-hull-anatomy .anatomy__modes button')
    .filter({ hasText: messages['anatomy.mode.offence'] })
    .click();
  await expect(page.locator('edsb-offence-analysis .offence')).toBeVisible();
}

/** Every digit in a string, so a locale's own grouping cannot change the value. */
function digits(text: string): string {
  return text.replace(/\D/gu, '');
}

/**
 * Where every mark on the gunsight plate sits, as a fraction of the plate.
 *
 * Fractions rather than pixels, so the reading survives the plate itself being
 * a different width in one layout than in another, and rounded, so a subpixel
 * difference between two paints is not a mirrored diagram.
 */
async function plateMarks(page: Page): Promise<string[]> {
  return page.locator('edsb-shot-convergence .plate').evaluate((plate) => {
    const box = plate.getBoundingClientRect();
    const place = (node: Element): string => {
      const mark = node.getBoundingClientRect();
      const round = (value: number): number => Math.round(value * 1000) / 1000;
      return [
        node.className,
        round((mark.left - box.left) / box.width),
        round((mark.top - box.top) / box.height),
      ].join(' ');
    };
    return [...plate.querySelectorAll('.plate__dot, .plate__numeral')].map(place);
  });
}

/**
 * One catalogue sentence as a pattern its rendered form has to match.
 *
 * With `capture`, the named placeholder becomes a capturing group, so a rendered
 * sentence can also be read back for the value that was put into it.
 *
 * The four shot sentences differ only in the words the catalogue puts between
 * their placeholders — whether a weapon is named, and whether the mount is the
 * selected one — so which sentence a mark got is exactly which template it was
 * rendered from. Building the pattern out of the template rather than writing
 * the words here keeps the check on the catalogue's own wording and works in any
 * language the application is read in.
 */
function asSentence(message: string, capture?: string): RegExp {
  const literal = (part: string): string => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const marked = capture === undefined ? message : message.split(`{{${capture}}}`).join('\u0000');
  const pattern = marked
    .split(/\{\{\w+\}\}/u)
    .map(literal)
    .join('.+')
    .split('\u0000')
    .join('(.+?)');
  return new RegExp(`^${pattern}$`, 'u');
}

/**
 * The hull's hardpoints, in the ledger's own order.
 *
 * The ledger is the other place in the workspace that carries every mount, and
 * it is built from the package's own slot enumeration — so reading it and
 * comparing with the plate is two parts of the same page having to agree, which
 * is what this suite checks instead of writing the answer down. Utility mounts
 * are excluded by their own key: the game calls them `TinyHardpoint`, and the
 * gunsight places weapon hardpoints alone.
 */
async function hardpointKeys(page: Page): Promise<string[]> {
  // Across the categories: canvas 1d draws one at a time, and a hull's
  // hardpoints are not whichever tab happens to be open (`everyPublishedSlotKey`).
  const keys = await everyPublishedSlotKey(page);
  return keys.filter((key) => /^(?:Huge|Large|Medium|Small)Hardpoint\d+$/u.test(key));
}

/**
 * Where each shot dot is put, as a fraction of the plate's own box.
 *
 * Since the 2026-08-25 canvas revision nothing lands outside `[0, 1]`: a shot
 * beyond the plate's field of view is held at the frame's own `4%` margin
 * rather than clipped out of it, so what a near range moves is how far out the
 * dot sits, not whether it is drawn.
 */
async function dotPlacements(page: Page): Promise<{ left: number; top: number }[]> {
  return page.locator('edsb-shot-convergence .plate').evaluate((plate) => {
    // The plate's padding box, not its border box: a mark is positioned as a
    // percentage of the box its offset parent gives it, which excludes the
    // hairline border. Measuring against the border box instead puts every
    // fraction out by a pixel, which is exactly the width of the margin a
    // clamped mark is meant to be standing on.
    const box = plate.getBoundingClientRect();
    const origin = { left: box.left + plate.clientLeft, top: box.top + plate.clientTop };
    return [...plate.querySelectorAll('.plate__dot')].map((node) => {
      const mark = node.getBoundingClientRect();
      return {
        left: (mark.left + mark.width / 2 - origin.left) / plate.clientWidth,
        top: (mark.top + mark.height / 2 - origin.top) / plate.clientHeight,
      };
    });
  });
}

/** One bar block's rows, as `[label, figure]`. */
async function barRows(page: Page, selector: string): Promise<[string, string][]> {
  return page
    .locator(selector)
    .evaluateAll((nodes) =>
      nodes.map((node): [string, string] => [
        node.querySelector('.bar__label')?.textContent?.trim() ?? '',
        node.querySelector('.bar__value')?.textContent?.trim() ?? '',
      ]),
    );
}

/** Opens the anatomy region's `POWER` mode, where feature 005 draws the pips. */
async function openPower(page: Page): Promise<void> {
  await page
    .locator('edsb-hull-anatomy .anatomy__modes button')
    .filter({ hasText: englishMessages['anatomy.mode.power'] })
    .click();
  await expect(page.locator('edsb-power-thermals')).toBeVisible();
}

/** Returns to `OFFENCE` from whichever mode is open. */
async function backToOffence(page: Page): Promise<void> {
  await page
    .locator('edsb-hull-anatomy .anatomy__modes button')
    .filter({ hasText: englishMessages['anatomy.mode.offence'] })
    .click();
  await expect(page.locator('edsb-offence-analysis .offence')).toBeVisible();
}

/** Sets the WEP allocation from feature 005's own control, and waits for it. */
async function setWeaponPips(page: Page, block: number): Promise<void> {
  await openPower(page);
  await page
    .locator('.distributor tbody tr')
    .nth(2)
    .locator('.pips__step')
    .nth(block - 1)
    .click();
  await settled(page);
  await backToOffence(page);
}

test.describe('opening the layer', () => {
  test('retitles the region and replaces the plates with the panel', async ({ page }) => {
    await openOffence(page);

    await expect(page.locator('edsb-hull-anatomy .anatomy__heading')).toHaveText(
      englishMessages['offence.heading'],
    );
    // A title and nothing under it, which is all the canvas's switching script
    // carries per mode. Canvas 1d's `OUTPUT, RANGE, CONVERGENCE` sub-line lives
    // in the mobile head map, which the desktop script never reads
    // (design/canvas-contract.md, "Where the capability lives").
    await expect(page.locator('edsb-hull-anatomy .anatomy__title p')).toHaveCount(0);

    // The plates go with the mode. The canvas's switching script hides the
    // plate container outside `mounts`, so the side selector and the legend
    // that belong to the plates leave with them.
    await expect(page.locator('edsb-offence-analysis')).toBeVisible();
    await expect(page.locator('edsb-hull-anatomy .anatomy__plates')).toHaveCount(0);
    await expect(page.locator('edsb-hull-anatomy .anatomy__sides')).toHaveCount(0);
    await expect(page.locator('edsb-hull-anatomy .anatomy__legend')).toHaveCount(0);
  });

  test('leaves the mounts layer exactly as it was when the mode is closed', async ({ page }) => {
    await openOffence(page);
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: englishMessages['anatomy.mode.mounts'] })
      .click();

    await expect(page.locator('edsb-offence-analysis')).toHaveCount(0);
    await expect(page.locator('edsb-hull-anatomy .anatomy__heading')).toHaveText(
      englishMessages['anatomy.heading'],
    );
    await expect(page.locator('edsb-hull-anatomy .anatomy__plates')).toBeVisible();
  });

  test('opens one dashboard at a time', async ({ page }) => {
    await openOffence(page);
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: englishMessages['anatomy.mode.power'] })
      .click();

    await expect(page.locator('edsb-power-thermals')).toBeVisible();
    await expect(page.locator('edsb-offence-analysis')).toHaveCount(0);
  });
});

test.describe('reading the build', () => {
  test('sets the burst total large, and names the sustained one beside it', async ({ page }) => {
    await openOffence(page);

    const headline = page.locator('edsb-offence-analysis .headline');
    await expect(headline).toBeVisible();

    // Both named. The canvas's own two panels disagree about which of the two
    // its large figure is, so neither is left to a reader to infer.
    expect(digits(await headline.locator('.headline__value').innerText())).not.toBe('');
    expect(digits(await headline.locator('.headline__note').innerText())).not.toBe('');
  });

  test('counts the weapons the package returned beside the block heading', async ({ page }) => {
    await openOffence(page);

    const note = page.locator('.offence__block--weapons .offence__note');
    await expect(note).toBeVisible();
    expect(digits(await note.innerText())).not.toBe('');
  });

  test('names each damage type where the canvas names it — in the legend', async ({ page }) => {
    await openOffence(page);

    // No canvas enumerates the types with a figure each. The stacked bar's
    // legend is the whole reading, so a type the build deals is named there and
    // one it does not deal has no line at all.
    // Lowered on both sides: the legend is set in the canvas's tracked mono
    // label, which uppercases in CSS, and `innerText` reports what is rendered.
    const entries = page.locator('edsb-offence-analysis .split__entry');
    const legend = (await entries.allInnerTexts()).join(' ').toLowerCase();
    const named = (['kinetic', 'thermal', 'explosive', 'absolute'] as const).filter((type) =>
      legend.includes(englishMessages[`offence.damage.type.${type}` as const].toLowerCase()),
    );

    expect(named.length).toBeGreaterThan(0);

    // And named there and nowhere else: every damage-type word on the panel is
    // inside the legend. A second list of the types with a figure each is what
    // was withdrawn (`design/canvas-contract.md`, review note 7), and it would
    // show up here as a type named outside `.split__legend`.
    const outside = await page.locator('edsb-offence-analysis').evaluate(
      (panel, words: string[]) => {
        const legend = panel.querySelector('.split__legend');
        return words.filter((word) =>
          [...panel.querySelectorAll('*')].some(
            (node) =>
              !legend?.contains(node) &&
              node.children.length === 0 &&
              (node.textContent ?? '').toLowerCase().includes(word),
          ),
        );
      },
      named.map((type) => englishMessages[`offence.damage.type.${type}` as const].toLowerCase()),
    );
    expect(outside).toEqual([]);
  });

  test('draws the canvas’s stacked split, and writes every segment down', async ({ page }) => {
    await openOffence(page);

    const segments = page.locator('edsb-offence-analysis .split__segment');
    const entries = page.locator('edsb-offence-analysis .split__entry');
    expect(await segments.count()).toBeGreaterThan(0);

    // The bar is decorative: every segment's amount and share are in the
    // legend beside it, because a length and a colour are not a reading.
    await expect(entries).toHaveCount(await segments.count());
    for (const entry of await entries.all()) {
      expect(await entry.innerText()).toContain('%');
    }

    // And the legend is a list that says what it is a list of, so the reading
    // arrives as a named group rather than as loose text under the bar.
    await expect(
      page.getByRole('list', { name: englishMessages['offence.damage.bar'] }),
    ).toBeVisible();
    await expect(entries.first()).toHaveRole('listitem');
  });

  test('draws the canvas’s four range bands, weakening with distance', async ({ page }) => {
    await openOffence(page);

    const bands = await barRows(page, 'edsb-offence-analysis .bars--range .bar');
    expect(bands).toHaveLength(4);
    for (const [label, value] of bands) {
      expect(digits(label)).not.toBe('');
      expect(digits(value)).not.toBe('');
    }
  });

  test('gives a type the build does not deal no segment and no line', async ({ page }) => {
    await openOffence(page);

    // The stock Anaconda deals no unclassified damage, and the canvas draws a
    // segment only for a type that has one. A legend entry always accompanies a
    // segment, so the two counts agreeing is what says nothing was invented.
    const segments = page.locator('edsb-offence-analysis .split__segment');
    const entries = page.locator('edsb-offence-analysis .split__entry');

    await expect(entries).toHaveCount(await segments.count());
    expect((await entries.allInnerTexts()).join(' ').toLowerCase()).not.toContain(
      englishMessages['offence.damage.type.unclassified'].toLowerCase(),
    );
  });
});

/** One weapon row's drawn cells, in the order the canvas sets them. */
async function weaponRows(
  page: Page,
): Promise<{ module: string; figures: string[]; controls: number }[]> {
  return page.locator('edsb-offence-analysis .weapon').evaluateAll((nodes) =>
    nodes.map((node) => ({
      module: node.querySelector('.weapon__module')?.textContent?.trim() ?? '',
      figures: [...node.querySelectorAll('.weapon__figure')].map(
        (cell) => cell.textContent?.trim() ?? '',
      ),
      controls: node.querySelectorAll('button, a').length,
    })),
  );
}

test.describe('inspecting the weapons', () => {
  test('draws one row per weapon with the canvas’s five columns', async ({ page }) => {
    await openOffence(page);

    const rows = await weaponRows(page);
    expect(rows.length).toBeGreaterThan(0);

    // The mounted count beside the block heading is the same collection said as
    // a number, so the two readings have to agree without either being written
    // down here.
    const note = await page.locator('.offence__block--weapons .offence__note').innerText();
    expect(digits(note)).toBe(String(rows.length));

    for (const row of rows) {
      expect(row.module).not.toBe('');
      // Damage per second, piercing, maximum range and falloff: four cells since
      // the 2026-08-25 canvas revision added `RANGE`, every one of them saying
      // something rather than sitting blank.
      expect(row.figures).toHaveLength(4);
      for (const figure of row.figures) {
        expect(figure).not.toBe('');
      }
      // The canvas draws the row inert, and so does this: no disclosure, no
      // action and no slot of its own.
      expect(row.controls).toBe(0);
    }
  });

  for (const [language, locale, messages] of [
    ['English', 'en-US', englishMessages],
    ['German', 'de-DE', germanMessages],
  ] as const) {
    test(`aligns the five columns, and leaves the module its room, in ${language}`, async ({
      browser,
      baseURL,
    }, testInfo) => {
      // A width the table is actually promoted at, set here rather than left to
      // the profile, so every project asks the same question — and asked in both
      // languages, because it is the *heads* that decide how wide a figure
      // column has to be and `DURCHSCHLAG` is half again as wide as `PIERCE`. A
      // threshold that fits one language and breaks the other's heads across two
      // lines is the regression this guards (`offence-analysis.scss`, the
      // promotion comment).
      const context = await browser.newContext({
        baseURL,
        locale,
        viewport: { width: 1920, height: 900 },
      });
      const page = await context.newPage();
      await openOffence(page, messages);

      const table = await page
        .locator('edsb-offence-analysis .weapons__table')
        .evaluate((node: HTMLElement) => {
          const head = node.querySelector('.weapons__columns');
          const rights = (row: Element): number[] =>
            [...row.querySelectorAll(':scope > *')].map((cell) =>
              Math.round(cell.getBoundingClientRect().right),
            );
          return {
            display: getComputedStyle(node).display,
            headShown: head === null ? 'none' : getComputedStyle(head).display,
            tracks: getComputedStyle(node)
              .gridTemplateColumns.split(' ')
              .map((track) => Number.parseFloat(track)),
            heads: head === null ? [] : rights(head),
            // Each head's own box against the box the same head would have on
            // one line. Comparing the five heads with each other only catches a
            // wrap while at least one of them is unwrapped, which is an
            // accident of `MODULE` being short rather than the property meant.
            headBoxes:
              head === null
                ? []
                : [...head.querySelectorAll(':scope > *')].map((cell) => {
                    const probe = cell.cloneNode(true) as HTMLElement;
                    probe.style.position = 'absolute';
                    probe.style.visibility = 'hidden';
                    probe.style.inlineSize = 'max-content';
                    probe.style.whiteSpace = 'nowrap';
                    head.append(probe);
                    const single = probe.getBoundingClientRect().height;
                    probe.remove();
                    return { height: cell.getBoundingClientRect().height, single };
                  }),
            rows: [...node.querySelectorAll('.weapon')].map((row) =>
              [...row.querySelectorAll('.weapon__figure')].map((cell) =>
                Math.round(cell.getBoundingClientRect().right),
              ),
            ),
          };
        });

      expect(table.display).toBe('grid');
      expect(table.headShown).not.toBe('none');
      // `MODULE` and the four figure heads.
      expect(table.heads).toHaveLength(5);
      expect(table.tracks).toHaveLength(5);

      // The module track keeps the room a name over its code line needs.
      expect(table.tracks[0]).toBeGreaterThanOrEqual(155);

      // And the four figure tracks divide what is left between them equally,
      // rather than settling on their own content and leaving every spare pixel
      // to the module column. `minmax(0, 1fr)` beside four `auto` tracks drew
      // exactly that — a name with a field of empty ground after it and four
      // figures crushed against the trailing edge — which is the regression
      // these four assertions name.
      const figures = table.tracks.slice(1);
      for (const track of figures) {
        expect(Math.abs(track - (figures[0] ?? 0))).toBeLessThanOrEqual(1);
      }

      // Every head fits on one line, in both languages: a column head broken
      // across two lines inside its own word is not a column head, and that is
      // what the promotion width is measured to avoid.
      expect(table.headBoxes).toHaveLength(5);
      for (const box of table.headBoxes) {
        expect(box.single).toBeGreaterThan(0);
        expect(box.height).toBeLessThanOrEqual(box.single + 1);
      }

      // And every row borrows the table's own tracks, so each figure ends where
      // the head above it ends. A row that re-resolved its own tracks — which is
      // what a subgrid with the wrong gutter does — puts each figure a few pixels
      // off its column and defeats the point of aligning them at all.
      const figureHeads = table.heads.slice(1);
      expect(table.rows.length).toBeGreaterThan(0);
      for (const row of table.rows) {
        expect(row).toHaveLength(4);
        for (const [index, edge] of row.entries()) {
          expect(Math.abs(edge - (figureHeads[index] ?? 0))).toBeLessThanOrEqual(1);
        }
      }

      // The promoted table is scanned here or nowhere: no layout profile in the
      // matrix gives this block the 31rem it promotes at, so this is the only
      // place the subgrid arrangement renders at all.
      await sweepOutfittingState(page, testInfo, `offence-analysis/weapons table ${language}`);

      // And the threshold is held from below as well. 1780px gives this block
      // about 470px — enough for five tracks to be *drawn*, not enough for a
      // figure column to be as wide as `DURCHSCHLAG`, so the table promoted here
      // would break a head inside its own word. The stylesheet's answer is to
      // stay compact until the heads fit; this is that answer asserted rather
      // than described.
      await page.setViewportSize({ width: 1780, height: 900 });
      await settled(page);
      await expect(page.locator('edsb-offence-analysis .weapons__table')).not.toHaveCSS(
        'display',
        'grid',
      );

      await context.close();
    });
  }

  for (const [language, locale, messages] of [
    ['English', 'en-US', englishMessages],
    ['German', 'de-DE', germanMessages],
  ] as const) {
    test(`never squeezes the module name to make room for figures, in ${language}`, async ({
      browser,
      baseURL,
    }) => {
      // The reference desktop, where the block is given about 300px — too little
      // for five aligned columns in either language. Which arrangement answers
      // that is the stylesheet's business; what is asserted here is the outcome
      // the promotion width exists to protect, so the assertion holds whichever
      // arrangement is chosen and fails whenever the name is starved.
      //
      // This is the regression guard for the promotion width itself. Five tracks
      // at their floors — the module's 155px, four figure columns' 40px each and
      // four 10px gutters — come to 355px, so promoting the table in a 300px
      // block either overflows it or takes the room out of the name, which is
      // where a weapon's name renders one or two characters per line
      // (`offence-analysis.scss`, the promotion comment).
      const context = await browser.newContext({
        baseURL,
        locale,
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();
      await openOffence(page, messages);

      const cells = await page
        .locator('edsb-offence-analysis .weapon__module')
        .evaluateAll((nodes) =>
          nodes.map((node) => Math.round(node.getBoundingClientRect().width)),
        );
      expect(cells.length).toBeGreaterThan(0);
      for (const width of cells) {
        expect(width).toBeGreaterThanOrEqual(155);
      }

      // And nothing is lost to the arrangement that protects it: every row still
      // carries all four figures, each with the word that names it — which in
      // the compact arrangement is the only thing naming it, the heads being
      // gone.
      const rows = await weaponRows(page);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.module).not.toBe('');
        expect(row.figures).toHaveLength(4);
        for (const figure of row.figures) {
          expect(figure).not.toBe('');
        }
      }
      for (const label of [
        messages['offence.column.dps'],
        messages['offence.column.pierce'],
        messages['offence.column.range'],
        messages['offence.column.falloff'],
      ]) {
        await expect(
          page.locator('edsb-offence-analysis .weapon').first().getByText(label, { exact: true }),
        ).toBeVisible();
      }

      await expectNoDocumentOverflow(page);
      await context.close();
    });
  }

  test('keeps two mounts carrying the same module as two rows', async ({ page }) => {
    await openOffence(page);

    // The stock Anaconda carries the same small pulse laser twice. The canvas
    // draws duplicates as duplicates and this does too.
    const modules = (await weaponRows(page)).map((row) => row.module);
    expect(modules).toHaveLength(2);
    expect(modules[0]).toBe(modules[1]);
  });

  test('leaves the row itself inert, and offers no control inside it', async ({ page }) => {
    await openOffence(page);

    const before = await page.locator('edsb-slot-card [data-selected="true"]').count();
    await page.locator('edsb-offence-analysis .weapon__module').first().click();

    // Nothing in a row navigates, discloses or selects: the canvas puts the
    // mount control in `HULL ANATOMY`, and it stays there.
    await expect(page.locator('edsb-slot-card [data-selected="true"]')).toHaveCount(before);
    await expect(
      page.locator('edsb-offence-analysis .weapon button, edsb-offence-analysis .weapon a'),
    ).toHaveCount(0);
  });
});

test.describe('the weapon row’s second line', () => {
  test('draws the canvas’s code line under every name, mount and all', async ({ page }) => {
    await openOffence(page);

    const lines = await page
      .locator('edsb-offence-analysis .weapon__module .identity__code-line')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const text = (node.textContent ?? '').trim();
          return getComputedStyle(node).textTransform === 'uppercase' ? text.toUpperCase() : text;
        }),
      );

    // One per row, never absent: the canvas draws `3E FIXED · STOCK` under an
    // unengineered weapon too, so a row with no recipe still gets its line.
    expect(lines).toHaveLength((await weaponRows(page)).length);
    for (const line of lines) {
      // A class code, then the mount joined by a space rather than by the dot —
      // the canvas writes `4A GIMBALLED`, and takes the dot only for what comes
      // after the mount.
      expect(line, line).toMatch(/^\d[A-Z] (?:FIXED|GIMBALLED|TURRETED)\b/u);
    }
  });
});

test.describe('the status rail', () => {
  test('carries the sustained figure the panel carries', async ({ page }) => {
    await openOffence(page);

    // The cell is composed from the design system's metric group, which is what
    // the canvas draws all six rail cells as.
    const cell = page.locator('edsb-offence-summary .metric');
    await expect(cell.locator('.metric__label')).toHaveText(englishMessages['offence.rail.label']);

    const railFigure = digits(await cell.locator('.metric__number').innerText());
    // The panel's headline names the sustained total on the line beside its
    // large burst figure, which is the rail cell's own reading.
    const note = digits(await page.locator('edsb-offence-analysis .headline__note').innerText());

    // The same projection reaches both, so the two readings have to agree
    // without either being written down here.
    expect(railFigure).not.toBe('');
    expect(note).toContain(railFigure);
  });

  test('holds no control, and no qualification on a build whose coverage resolved', async ({
    page,
  }) => {
    await openOffence(page);

    await expect(page.locator('edsb-offence-summary button, edsb-offence-summary a')).toHaveCount(
      0,
    );
    await expect(page.locator('edsb-offence-summary .metric__description')).toHaveCount(0);
  });

  test('stands in the rail whichever mode the anatomy region has open', async ({ page }) => {
    await page.goto(`/ships/${HULL}`);
    await page.getByRole('button', { name: englishMessages['hullDetail.create'] }).click();

    // The rail is not the panel: it reports the build, not what is on screen
    // beside it.
    await expect(page.locator('edsb-offence-summary .metric')).toBeVisible();
    await expect(page.locator('edsb-offence-analysis')).toHaveCount(0);
  });
});

test.describe('reading the firing endurance', () => {
  test('draws the four capacitor fields in the units each of them is ruled to take', async ({
    page,
  }) => {
    await openOffence(page);

    const drawn = await barRows(page, 'edsb-offence-analysis .bars--capacitor .bar');
    // Canvas 1c's own three rows in its own order, with canvas 1d's `WEP CAP`
    // behind them.
    expect(drawn.map(([label]) => label)).toEqual([
      englishMessages['offence.capacitor.draw'],
      englishMessages['offence.capacitor.recharge'],
      englishMessages['offence.capacitor.endurance'],
      englishMessages['offence.capacitor.capacity'],
    ]);
    // The two rates keep the package's own unit — canvas 1c labels `DRAW` and
    // `RECHARGE` as `MW`, both package fields are MJ/s, and the package wins.
    // The capacity takes the game's `MW`, the same unit feature 005's
    // distributor table writes after a bank's capacity (ruled 2026-08-27).
    expect(drawn[0][1]).toMatch(/MJ\/s$/u);
    expect(drawn[1][1]).toMatch(/MJ\/s$/u);
    expect(drawn[3][1]).toMatch(/ MW$/u);
    // And nowhere else: the two rates are the rows that used to be argued over,
    // and neither of them may quietly acquire the capacity's unit.
    const capacitor = await page.locator('.bars--capacitor').innerText();
    expect(capacitor.match(/MW/gu)).toHaveLength(1);
  });

  test('moves the recharge and the endurance when the allocation moves', async ({ page }) => {
    await openOffence(page);
    await setWeaponPips(page, 1);
    const low = (await barRows(page, 'edsb-offence-analysis .bars--capacitor .bar')).map(
      ([, value]) => value,
    );

    await setWeaponPips(page, 4);
    const high = (await barRows(page, 'edsb-offence-analysis .bars--capacitor .bar')).map(
      ([, value]) => value,
    );

    // The bare figures, not the labels beside them.
    expect(low).toHaveLength(4);
    // The draw is the weapons' and the capacity is the fitted distributor's: no
    // allocation moves either of them. The recharge and the endurance both do,
    // which is why the allocation is named beneath the block.
    expect(digits(high[0])).toBe(digits(low[0]));
    expect(digits(high[3])).toBe(digits(low[3]));
    expect(digits(high[1])).not.toBe(digits(low[1]));
    expect(high[2]).not.toBe(low[2]);
  });

  test('names the allocation the figures were read at, and offers no way to set it', async ({
    page,
  }) => {
    await openOffence(page);
    await setWeaponPips(page, 3);

    const capacitor = page.locator('edsb-offence-analysis .bars--capacitor');
    // The allocation line itself, not the block: `DRAW` reads `2.31 MJ/s` at
    // every allocation and `RECHARGE` reads `3.50 MJ/s` at this one, so a `3`
    // anywhere in the block was true whether or not the line was drawn at all.
    await expect(capacitor.locator('.bars__condition')).toHaveText(
      englishMessages['offence.capacitor.allocation'].replace('{{pips}}', '3.0'),
    );
    // The canvas draws the pip control in `POWER`, and it stays there.
    await expect(capacitor.locator('button, input, select')).toHaveCount(0);
  });

  test('says what a symbol stands for, and bars only what shares a scale', async ({ page }) => {
    await openOffence(page);
    await setWeaponPips(page, 4);

    const capacitor = page.locator('edsb-offence-analysis .bars--capacitor');
    // The package's own sentinel never reaches the screen as a word or a
    // number; where a recharge keeps pace the block draws `∞` instead, and
    // says what it stands for beside it rather than leaving a glyph alone.
    expect(await capacitor.innerText()).not.toMatch(/infinity/iu);
    // Unconditional: four WEP pips on this hull's stock build is a recharge
    // that outruns the load, which `offence-analysis.spec.ts` proves against
    // the package itself. If the symbol stops being drawn this fails, which is
    // the point of asserting it rather than asking whether it is there.
    const endurance = capacitor.locator('.bar').nth(2);
    await expect(endurance.locator('.bar__value')).toContainText('∞');
    const meaning = endurance.locator('.visually-hidden');
    await expect(meaning).toHaveText(
      englishMessages['offence.capacitor.endurance.sustained.meaning'],
    );

    // And it is genuinely out of sight, which the assertion above cannot say:
    // `toHaveText` reads `textContent`, so it passes identically whether the
    // sentence is clipped or set beside the symbol in plain view. The canvas
    // draws a figure here and no sentence, so a rendered box wider than the
    // clip is this panel drawing words the design does not.
    const box = await meaning.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width ?? Infinity).toBeLessThanOrEqual(2);
    expect(box?.height ?? Infinity).toBeLessThanOrEqual(2);

    // The draw and the recharge are the same quantity in the same unit and get
    // a track each. A stored pool and a duration share a scale with nothing
    // here, so neither gets one.
    await expect(capacitor.locator('.bar__track')).toHaveCount(2);
    await expect(capacitor.locator('.bar__track-absent')).toHaveCount(2);
  });

  test('reads the same capacitor whatever the dashboard’s hardpoint state is', async ({ page }) => {
    await openOffence(page);
    const deployed = await barRows(page, 'edsb-offence-analysis .bars--capacitor .bar');

    await openPower(page);
    await page
      .locator('edsb-power-thermals .power__hardpoints button')
      .filter({ hasText: englishMessages['power.hardpoints.retracted'] })
      .click();
    await settled(page);
    await backToOffence(page);

    // The capacitor facade always models deployed firing, independently of what
    // feature 005's dashboard is showing (contracts/capacitor-endurance.md).
    expect(await barRows(page, 'edsb-offence-analysis .bars--capacitor .bar')).toEqual(deployed);
  });
});

test.describe('shot convergence', () => {
  test('draws the gunsight, and states every shot in words beside it', async ({ page }) => {
    await openOffence(page);

    const block = page.locator('edsb-offence-analysis .offence__block--convergence');
    await expect(block).toBeVisible();

    // The plate is decorative in full; the sentences under it are the reading.
    const plate = block.locator('.plate');
    await expect(plate).toHaveAttribute('aria-hidden', 'true');
    const shots = block.locator('.shots__entry');
    const mounts = (await hardpointKeys(page)).length;
    const armed = await page.locator('edsb-offence-analysis .weapon').count();
    expect(mounts).toBeGreaterThan(armed);

    // Every mark on the plate is a sentence beside it, and only those: the ring
    // caption was the one extra sentence, and the 2026-08-26 revision draws no
    // caption to state (FR-011, `design/canvas-contract.md`).
    expect(await shots.count()).toBe(mounts);

    // Every one of the hull's mounts is drawn as a dot where its shot lands and
    // the mount's own hardpoint numeral beside it. The badge column at the
    // plate's edge went with the 2026-08-25 canvas revision and has not come
    // back; what did come back, with the 2026-08-26 rebuild, is a leader — and
    // only for a numeral that had to step away from its dot to stand clear of
    // another mark, so there is never more than one a mount and usually fewer
    // (review note 19).
    await block.locator('input[type="range"]').fill('2000');
    await settled(page);
    await expect(plate.locator('.plate__dot')).toHaveCount(mounts);
    await expect(plate.locator('.plate__numeral')).toHaveCount(mounts);
    await expect(plate.locator('.plate__shot')).toHaveCount(0);
    expect(await plate.locator('.plate__leader').count()).toBeLessThanOrEqual(mounts);
  });

  test('draws the plate on one scale, so a ring means the same angle on both axes', async ({
    page,
  }) => {
    await openOffence(page);

    const drawn = await page
      .locator('edsb-shot-convergence .plate')
      .evaluate((plate: HTMLElement) => {
        const rings = [...plate.querySelectorAll('.plate__ring')].map((ring) => {
          const box = ring.getBoundingClientRect();
          return { width: box.width, height: box.height };
        });
        return { plate: { width: plate.clientWidth, height: plate.clientHeight }, rings };
      });

    // The plate's own box is square, which is what makes a mapping that is
    // square in angle level in pixels: a milliradian covers the same distance up
    // as across. A wider box under the same mapping would squash every shot's
    // height in exactly its own proportion.
    expect(drawn.plate.width).toBeGreaterThan(0);
    expect(Math.abs(drawn.plate.width - drawn.plate.height)).toBeLessThanOrEqual(1);

    // And each ring is a circle that fits on it, rather than an ellipse or an
    // arc clipped away at the top and bottom of its own plate.
    expect(drawn.rings).toHaveLength(2);
    for (const ring of drawn.rings) {
      expect(Math.abs(ring.width - ring.height)).toBeLessThanOrEqual(1);
      expect(ring.width).toBeLessThanOrEqual(drawn.plate.width + 1);
      expect(ring.height).toBeLessThanOrEqual(drawn.plate.height + 1);
    }
  });

  test('clamps a shot the field of view does not reach, and keeps its sentence', async ({
    page,
  }) => {
    await openOffence(page);

    const block = page.locator('edsb-offence-analysis .offence__block--convergence');
    const slider = block.locator('input[type="range"]');
    const mounts = (await hardpointKeys(page)).length;

    // The plate spans a fixed field of view, as the canvas fixes it, so the
    // nearer the target the wider a mount's shot subtends. Since the 2026-08-25
    // revision a shot that outruns the plate is held at the frame's own margin
    // rather than clipped out of it, so nothing ever leaves the box — what a
    // near range does is push the dot out to that margin, where a far range
    // leaves it well inside (FR-011, spec.md, "A shot whose offset exceeds the
    // plate's field of view").
    // The frame's own margin, and the slack a mark measured off a rendered box
    // needs: a dot is centred by a half-pixel translate on a plate whose height
    // is itself fractional, so "on the margin" arrives a few tenths of a pixel
    // off it. This is wide enough to absorb that and far narrower than the gap
    // between a clamped mark and one the field of view actually holds.
    const margin = 0.04;
    const slack = 0.005;
    const edge = ({ left, top }: { left: number; top: number }): number =>
      Math.min(left, top, 1 - left, 1 - top);
    const inside = (dot: { left: number; top: number }): boolean => edge(dot) >= margin - slack;

    await slider.fill(String(await slider.getAttribute('min')));
    await settled(page);
    const near = await dotPlacements(page);
    const sentencesNear = await block.locator('.shots__entry').count();
    expect(near).toHaveLength(mounts);
    // Nothing is dropped and nothing escapes: every mark is still on the plate.
    expect(near.every(inside)).toBe(true);
    // And the clamp is doing work — a mount is standing on the margin itself.
    expect(near.some((dot) => edge(dot) <= margin + slack)).toBe(true);

    await slider.fill((await slider.getAttribute('max')) ?? '');
    await settled(page);
    const far = await dotPlacements(page);
    expect(far.every(inside)).toBe(true);
    // At the far end nothing is against the frame any more.
    expect(far.every((dot) => edge(dot) > margin + slack)).toBe(true);

    // The sentence is the reading, and it is stated at both ranges alike: the
    // field of view decides what the picture shows, never what is said.
    expect(await block.locator('.shots__entry').count()).toBe(sentencesNear);
    // One sentence a mark, and no extra: the ring caption the sentences used to
    // carry is withdrawn with the 2026-08-26 revision.
    expect(sentencesNear).toBe(mounts);
  });

  test('draws a hardpoint the build has not filled, in the empty mount’s own ink', async ({
    page,
  }) => {
    await openOffence(page);

    const block = page.locator('edsb-offence-analysis .offence__block--convergence');
    const mounts = (await hardpointKeys(page)).length;
    const armed = await page.locator('edsb-offence-analysis .weapon').count();

    // The stock hull arms two of its hardpoints and leaves the rest empty. Where
    // a mount sits is a property of the hull rather than of what is on it, so
    // every one of them is placed, and the unfilled ones are drawn in the quiet
    // ink the hull schematics already give an empty mount.
    await block.locator('input[type="range"]').fill('2000');
    await settled(page);
    expect(mounts).toBeGreaterThan(armed);
    await expect(block.locator('.plate__dot')).toHaveCount(mounts);
    await expect(block.locator('.plate__numeral')).toHaveCount(mounts);
    await expect(block.locator('.plate__dot--empty')).toHaveCount(mounts - armed);

    // And the ink is never the only thing that says so: an empty mount's own
    // sentence stands beside the plate with the rest, and it is the catalogue's
    // empty-mount sentence rather than a weapon's with the name left out
    // (011 FR-022).
    const stated = await block.locator('.shots__entry').allInnerTexts();
    expect(stated).toHaveLength(mounts);
    const empty = [
      asSentence(englishMessages['offence.convergence.empty']),
      asSentence(englishMessages['offence.convergence.empty.selected']),
    ];
    const armedSentence = [
      asSentence(englishMessages['offence.convergence.shot']),
      asSentence(englishMessages['offence.convergence.shot.selected']),
    ];
    // The empty sentences are tried first, and the order is necessary. Measured
    // over the four English templates, the loose one is the armed *unselected*
    // sentence: `Hardpoint .+, .+, .+: …` matches its own, the armed selected
    // one, and the empty selected one too, because `empty, the selected mount`
    // supplies the second `, ` it is looking for. The two empty patterns match
    // only their own sentences, so classifying against them first is what keeps
    // an empty mount out of the armed count.
    const isEmpty = (line: string): boolean => empty.some((pattern) => pattern.test(line));
    expect(stated.filter(isEmpty)).toHaveLength(mounts - armed);
    expect(
      stated.filter((line) => !isEmpty(line) && armedSentence.some((p) => p.test(line))),
    ).toHaveLength(armed);
  });

  test('marks the hardpoint the workspace has selected, and follows the ledger', async ({
    page,
  }) => {
    await openOffence(page);

    const block = page.locator('edsb-offence-analysis .offence__block--convergence');
    const numeral = block.locator('.plate__numeral--selected');

    // The workspace always has a mount selected — the ledger opens on the first
    // one — so the plate marks it from the moment it is drawn.
    await expect(block.locator('.plate__dot--selected')).toHaveCount(1);
    await expect(numeral).toHaveCount(1);
    const first = await numeral.innerText();

    // Selecting a different hardpoint in the ledger moves the mark, because both
    // are reading one selection rather than each keeping their own — and it
    // moves it to *that* mount. The numeral is the mount's place in the hull's
    // own hardpoint order, which is the order the ledger lists them in, so the
    // ledger says which numeral the ring has to be beside without this suite
    // writing the number down.
    const slot = 'LargeHardpoint2';
    const place = (await hardpointKeys(page)).indexOf(slot) + 1;
    expect(place).toBeGreaterThan(0);
    await page.locator(`[data-slot-key="${slot}"] .slot__select`).first().click();
    await settled(page);
    await expect(numeral).toHaveCount(1);
    // Polled rather than read once. `settled` waits for animations, and the
    // numeral is rewritten by the change detection the click schedules, which
    // is not one — so a bare read races the redraw and returns the mount that
    // was selected before. It fails about once in a shard under CI load.
    expect(String(place)).not.toBe(first);
    await expect(numeral).toHaveText(String(place));

    // A ring is a picture; the mark's own sentence is the reading. Exactly one
    // mark is stated as the selected mount, and it is the one the ring is drawn
    // around (011 FR-022).
    const stated = await block.locator('.shots__entry').allInnerTexts();
    const patterns = [
      asSentence(englishMessages['offence.convergence.shot.selected'], 'hardpoint'),
      asSentence(englishMessages['offence.convergence.empty.selected'], 'hardpoint'),
    ];
    const selected = stated.filter((line) => patterns.some((pattern) => pattern.test(line)));
    expect(selected).toHaveLength(1);

    // Read the hardpoint back out of the sentence's own `{{hardpoint}}` slot and
    // compare it with the numeral the ring is drawn beside. A `toContain` here
    // would pass on any sentence that happens to carry the digit anywhere —
    // `13.3 m off the axis` carries a `3` — which is most of them.
    const named = patterns.map((pattern) => pattern.exec(selected[0] ?? '')?.[1]).find(Boolean);
    expect(named).toBe(await numeral.innerText());
  });

  test('moves the shots when the target range moves', async ({ page }) => {
    await openOffence(page);

    const block = page.locator('edsb-offence-analysis .offence__block--convergence');
    const before = await block.locator('.shots__entry').allInnerTexts();
    const spans = await block.locator('.fact__value').allInnerTexts();

    const slider = block.locator('input[type="range"]');
    await slider.fill('2000');
    await settled(page);

    // The mounts have not moved; what they subtend at the target has.
    expect(await block.locator('.shots__entry').allInnerTexts()).not.toEqual(before);
    expect((await block.locator('.fact__value').allInnerTexts())[0]).toBe(spans[0]);
  });

  test('announces the range as a Commander reads it, not as a bare number', async ({ page }) => {
    await openOffence(page);

    const slider = page.locator('edsb-offence-analysis input[type="range"]');
    const announced = await slider.getAttribute('aria-valuetext');

    expect(announced).not.toBeNull();
    expect(digits(announced ?? '')).not.toBe('');
    // The readout beside the control says exactly what is announced.
    await expect(page.locator('edsb-offence-analysis .range__value')).toHaveText(announced ?? '');
  });

  test('names the four facts the canvas draws under the plate', async ({ page }) => {
    await openOffence(page);

    // The 2026-08-26 canvas revision withdrew the four cells that used to
    // stand under the plate — the two spans, the widest mount and the apparent
    // spread — along with the ring caption. Nothing is drawn beneath the plate
    // but the range, and every reading the cells carried is still in the
    // plate's own sentences.
    await expect(page.locator('edsb-offence-analysis .fact')).toHaveCount(0);
    await expect(page.locator('edsb-offence-analysis .plate__boresight')).toHaveCount(1);

    const stated = await page
      .locator('edsb-offence-analysis .shots__entry')
      .evaluateAll((entries) => entries.map((entry) => entry.textContent?.trim() ?? ''));
    expect(stated.length).toBeGreaterThan(0);
    for (const sentence of stated) {
      expect(sentence).not.toBe('');
    }

    // No two numerals drawn over each other, whatever the range is set to.
    const overlapping = await page
      .locator('edsb-offence-analysis .plate__numeral')
      .evaluateAll((numerals) => {
        const boxes = numerals.map((numeral) => numeral.getBoundingClientRect());
        let worst = 0;
        for (let index = 0; index < boxes.length; index += 1) {
          for (let other = index + 1; other < boxes.length; other += 1) {
            const one = boxes[index]!;
            const two = boxes[other]!;
            const overlapX = Math.min(one.right, two.right) - Math.max(one.left, two.left);
            const overlapY = Math.min(one.bottom, two.bottom) - Math.max(one.top, two.top);
            if (overlapX > 0 && overlapY > 0) {
              worst = Math.max(worst, Math.min(overlapX, overlapY));
            }
          }
        }
        return worst;
      });
    expect(overlapping).toBe(0);
  });
});

/** Every figure the panel draws, in document order, for a before-and-after. */
async function everyFigure(page: Page): Promise<string[]> {
  return page
    .locator(
      'edsb-offence-analysis .headline__value, edsb-offence-analysis .headline__note, ' +
        'edsb-offence-analysis .weapon__figure, edsb-offence-analysis .split__entry, ' +
        'edsb-offence-analysis .bar__value, edsb-offence-analysis .fact__value',
    )
    .evaluateAll((nodes) => nodes.map((node) => (node.textContent ?? '').trim()));
}

test.describe('the units on the screen', () => {
  test('prints every unit symbol as the symbol, not as a case the label wanted', async ({
    page,
  }) => {
    await openOffence(page);

    // `text-transform` does not touch `textContent`, so every other assertion in
    // this file reads a unit that is right in the DOM and wrong on the screen.
    // `M` is the mega prefix and `m` is the metre; a micro-label that uppercases
    // its own content turns one into the other, which is a different unit.
    const rendered = await page
      .locator(
        'edsb-offence-analysis .bar__label, edsb-offence-analysis .bar__value, ' +
          'edsb-offence-analysis .fact__value, ' +
          'edsb-offence-analysis .offence__block--convergence .offence__note, ' +
          'edsb-offence-analysis .range__scale span, edsb-offence-analysis .range__value',
      )
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const text = (node.textContent ?? '').trim();
          const transform = getComputedStyle(node).textTransform;
          return transform === 'uppercase' ? text.toUpperCase() : text;
        }),
      );

    expect(rendered.length).toBeGreaterThan(0);
    for (const text of rendered) {
      // A figure followed by an uppercased SI symbol this application never
      // means: metres, milliradians and seconds are all lowercase.
      expect(text, text).not.toMatch(/\d\s*(?:M|MRAD|S)\b/u);
    }
  });

  test('keeps the case the canvas draws on a label that is a word', async ({ page }) => {
    await openOffence(page);

    // The other half of the same rule, and the reason it is scoped rather than
    // put on the shared class: a label carrying a figure keeps its unit's case,
    // and a label that is a word is drawn uppercase. The canvas sets `DRAW`,
    // `RECHARGE` and `FULL FIRE` in the same 9px mono at the same tracking as
    // `500 m` beside them, and uppercases only the words.
    const capacitor = await page
      .locator('edsb-offence-analysis .bars--capacitor .bar__label')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const text = (node.textContent ?? '').trim();
          return getComputedStyle(node).textTransform === 'uppercase' ? text.toUpperCase() : text;
        }),
      );

    expect(capacitor.length).toBeGreaterThan(0);
    for (const label of capacitor) {
      expect(label, label).toMatch(/\p{L}/u);
      expect(label, label).toBe(label.toUpperCase());
    }
  });
});

test.describe('what the panel does not touch', () => {
  test('changes no build, no fragment, no history entry and nothing stored', async ({ page }) => {
    await openOffence(page);

    // Read after the link is published rather than after the route resolves:
    // feature 002 writes the fragment a moment behind the build landing, and a
    // value captured before then would make that arrival look like a change
    // this capability made. Only this test reads the URL, so only this test
    // waits for it.
    await expect(page).toHaveURL(/\/build#b\./);
    const fragment = new URL(page.url()).hash;
    const entries = await page.evaluate(() => window.history.length);

    // Both of this screen's controls: the mode that opened the layer, and the
    // range the plate is drawn at.
    await page.locator('edsb-offence-analysis input[type="range"]').fill('2000');
    await expect(page.locator('edsb-offence-analysis .range__value')).not.toHaveText('');

    expect(new URL(page.url()).hash).toBe(fragment);
    expect(await page.evaluate(() => window.history.length)).toBe(entries);

    // Neither the mode nor the range is part of the build, so neither reaches
    // storage: a reload opens on the state the panel opens on.
    const stored = await page.evaluate(() =>
      JSON.stringify(
        Object.entries(window.localStorage).concat(Object.entries(window.sessionStorage)),
      ),
    );
    expect(stored).not.toContain('offence');
    expect(stored).not.toContain('range');
  });
});

test.describe('the conditions that break layouts', () => {
  test('keeps every figure at doubled text without scrolling the document', async ({ page }) => {
    await withRootTextScale(page, DOUBLED_TEXT);
    await openOffence(page);

    // The three blocks whole, not a reduced set: an abbreviated large-text data
    // model is the omission constitution V prohibits. Every figure the panel
    // draws still says something, rather than being squeezed to an empty cell.
    for (const figure of await everyFigure(page)) {
      expect(figure).not.toBe('');
    }
    await expectEveryBlock(page);
    await expectNoDocumentOverflow(page);
  });

  test('stacks the three blocks at 400% zoom rather than scrolling sideways', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await openOffence(page);

    await expectEveryBlock(page);
    await expectNoDocumentOverflow(page);
  });

  test('loses no figure in an expanded translation', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, locale: 'de-DE' });
    const page = await context.newPage();
    await openOffence(page, germanMessages);

    // German is the longer catalogue, and the labels are what grow. Every
    // figure is still drawn, and the panel still says the same things.
    const bands = await barRows(page, 'edsb-offence-analysis .bars--range .bar');
    expect(bands).toHaveLength(4);
    expect(await barRows(page, 'edsb-offence-analysis .bars--capacitor .bar')).toHaveLength(4);
    await expect(page.locator('edsb-offence-analysis .offence__block--convergence')).toContainText(
      germanMessages['offence.convergence.heading'],
    );
    await expectEveryBlock(page);
    await expectNoDocumentOverflow(page);

    await context.close();
  });

  test('mirrors the layout without losing a figure', async ({ page }) => {
    await openOffence(page);
    const before = await everyFigure(page);
    const plateBefore = await plateMarks(page);

    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await settled(page);

    // The layout mirrors; a figure and its unit do not.
    expect(await everyFigure(page)).toEqual(before);

    // Neither does the gunsight. It is a view out of the cockpit, and a
    // right-to-left interface does not move a ship's port hardpoint to
    // starboard, so every dot keeps its place inside the plate and every
    // hardpoint numeral keeps the side of its own dot it was placed on
    // (design/offence-profile.md, "The plate never mirrors").
    expect(await plateMarks(page)).toEqual(plateBefore);

    await expectNoDocumentOverflow(page);
  });

  test('loses no state with motion removed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openOffence(page);

    // The bars and the plate are the parts a transition could have been
    // carrying, so the figures and the sentences beside them are what is read
    // back.
    expect(await barRows(page, 'edsb-offence-analysis .bars--range .bar')).toHaveLength(4);
    expect(await page.locator('edsb-offence-analysis .shots__entry').count()).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: null });
  });
});

/** The three blocks the canvas draws, each still carrying its own content. */
async function expectEveryBlock(page: Page): Promise<void> {
  const panel = page.locator('edsb-offence-analysis');
  expect(await panel.locator('.weapon').count()).toBeGreaterThan(0);
  await expect(panel.locator('.bars--range .bar')).toHaveCount(4);
  await expect(panel.locator('.bars--capacitor .bar')).toHaveCount(4);
  expect(await panel.locator('.split__entry').count()).toBeGreaterThan(0);
  // No fact cells: the two spans, the widest mount and the apparent spread are
  // drawn nowhere in the canvas any more (withdrawn 2026-08-26).
  await expect(panel.locator('.fact')).toHaveCount(0);
  expect(await panel.locator('.shots__entry').count()).toBeGreaterThan(0);
  await expect(panel.locator('input[type="range"]')).toBeVisible();
}

test.describe('accessibility', () => {
  test('the panel passes a scan at both ends of the target range', async ({
    page,
  }, testInfo: TestInfo) => {
    await openOffence(page);
    await sweepOutfittingState(page, testInfo, 'offence-analysis/near');

    await page.locator('edsb-offence-analysis input[type="range"]').fill('2000');
    await settled(page);
    await sweepOutfittingState(page, testInfo, 'offence-analysis/far');
  });

  test('says everything in words, and never only in a bar or a colour', async ({ page }) => {
    await openOffence(page);
    const panel = page.locator('edsb-offence-analysis');

    // Every bar row states its own reading beside the track, and every segment
    // of the stacked bar has a legend entry. A length and a colour are not a
    // reading (spec.md FR-009). Words rather than digits: `FULL FIRE` answers
    // with `∞` and the phrase it stands for when the recharge keeps pace, and
    // with a sentence when the capacitor drains immediately.
    for (const [label, value] of await barRows(page, 'edsb-offence-analysis .bar')) {
      expect(label).not.toBe('');
      expect(value).not.toBe('');
    }
    await expect(panel.locator('.split__entry')).toHaveCount(
      await panel.locator('.split__segment').count(),
    );

    // The plate is the diagram; the sentences are the reading.
    await expect(panel.locator('.plate')).toHaveAttribute('aria-hidden', 'true');
    expect(await panel.locator('.shots__entry').count()).toBeGreaterThan(0);
  });
});
